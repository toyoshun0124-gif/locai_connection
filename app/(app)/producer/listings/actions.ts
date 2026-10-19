"use server";
// 出品の量を減らす・出品を終わりにする（4章B⑤：売れ残りを市場に出すとき）
// 外から直接呼ばれても安全なように、毎回確かめる
import { refresh } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { expireOverdueOrders, remainingGramsOf } from "@/lib/stock";
import { formatKg, kgTextToGrams } from "@/lib/units";

export type ListingControlState = { ok: boolean; message: string };

const idSchema = z.string().min(1).max(50);

// 断る理由を、トランザクションの外へ伝えるためのエラー
class Rejected extends Error {}

// 出品の量を減らす。減らせるのは、残り（申し込める量）まで。販売確定と仮押さえ（返事待ち）の分は減らせない
export async function reduceListing(_prev: ListingControlState, formData: FormData): Promise<ListingControlState> {
  const user = await getCurrentUser();
  if (user.role !== "PRODUCER") return { ok: false, message: "この操作はできません" };
  const id = idSchema.safeParse(formData.get("listingId"));
  const g = kgTextToGrams(String(formData.get("reduceKg") ?? ""));
  if (!id.success) return { ok: false, message: "出品が見つかりません" };
  if (g === null || g <= 0) return { ok: false, message: "減らす量は 0.1kg 単位の数字で入力してください（例：5）" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      // この出品を「使用中」にする（減らしている最中に申し込まれても、売りすぎないように）
      await tx.$queryRaw`SELECT id FROM "listing" WHERE id = ${id.data} FOR UPDATE`;
      // 自分の出品だけ（6章ルール4）
      const listing = await tx.listing.findFirst({ where: { id: id.data, producerId: user.id } });
      if (!listing) throw new Rejected("出品が見つかりません");
      const now = new Date();
      await expireOverdueOrders(tx, now);
      const remainingG = await remainingGramsOf(tx, listing, now);
      if (g > remainingG) throw new Rejected(`減らせるのは、残り（申し込める量）の${formatKg(Math.max(remainingG, 0))}までです`);
      await tx.listing.update({ where: { id: listing.id }, data: { quantityG: listing.quantityG - g } });
      return `${formatKg(g)}減らしました`;
    });
    refresh();
    return { ok: true, message: result };
  } catch (e) {
    if (e instanceof Rejected) return { ok: false, message: e.message };
    throw e;
  }
}

// 出品を終わりにする。新しい申し込みは来なくなる。返事待ち・販売確定の申し込みは、そのまま残る
export async function closeListing(_prev: ListingControlState, formData: FormData): Promise<ListingControlState> {
  const user = await getCurrentUser();
  if (user.role !== "PRODUCER") return { ok: false, message: "この操作はできません" };
  const id = idSchema.safeParse(formData.get("listingId"));
  if (!id.success) return { ok: false, message: "出品が見つかりません" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "listing" WHERE id = ${id.data} FOR UPDATE`;
      const listing = await tx.listing.findFirst({ where: { id: id.data, producerId: user.id } });
      if (!listing) throw new Rejected("出品が見つかりません");
      if (listing.status !== "OPEN") throw new Rejected("この出品は、もう終わっています");
      await tx.listing.update({ where: { id: listing.id }, data: { status: "CLOSED" } });
    });
    refresh();
    return { ok: true, message: "出品を終わりにしました" };
  } catch (e) {
    if (e instanceof Rejected) return { ok: false, message: e.message };
    throw e;
  }
}
