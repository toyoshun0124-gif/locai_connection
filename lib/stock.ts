// 残りの量（いま申し込める量）の計算。サーバー側だけで使う
// 6章ルール1：残り ＝ 出品した量 − 販売確定の量 − 仮押さえ中の量
import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

// 仮押さえになる状態（返事待ちの2つ）
export const HOLD_STATUSES = ["PENDING", "CHANGE_PROPOSED"] as const;

// 量を使っている注文の条件：販売確定、期限内の返事待ち（期限ちょうどまでは期限内）、
// 農家さんが販売確定のあとに取り消したもの（6章：高く買うお店に売り直すのを防ぐため、量は戻さない）
function usingStockWhere(now: Date): Prisma.OrderWhereInput {
  return {
    OR: [
      { status: "CONFIRMED" },
      { status: { in: [...HOLD_STATUSES] }, replyDeadline: { gte: now } },
      { status: "CANCELLED", cancelledBy: "PRODUCER", cancelledAfterConfirm: true },
    ],
  };
}

// 回答期限を過ぎた返事待ちを「期限切れ」にする（時間の経過による遷移。仮押さえの量が戻る）
export async function expireOverdueOrders(db: Db = prisma, now = new Date()) {
  await db.order.updateMany({
    where: { status: { in: [...HOLD_STATUSES] }, replyDeadline: { lt: now } },
    data: { status: "EXPIRED" },
  });
}

// 画面を表示するときの期限切れのチェック。1回の表示の中では、何回呼んでも1回だけ行う（cache）
export const expireOverdueOrdersOnce = cache(async () => {
  await expireOverdueOrders();
});

// 1つの出品の残りの量（g）
export async function remainingGramsOf(db: Db, listing: { id: string; quantityG: number }, now = new Date()) {
  const used = await db.order.aggregate({
    where: { listingId: listing.id, ...usingStockWhere(now) },
    _sum: { quantityG: true },
  });
  return listing.quantityG - (used._sum.quantityG ?? 0);
}

// 仮押さえ中（返事待ち）の量（g）。「ほかのお店が申し込み中」の案内に使う
export async function heldGramsOf(db: Db, listingId: string, now = new Date()) {
  const held = await db.order.aggregate({
    where: { listingId, status: { in: [...HOLD_STATUSES] }, replyDeadline: { gte: now } },
    _sum: { quantityG: true },
  });
  return held._sum.quantityG ?? 0;
}

// たくさんの出品の残りの量を、まとめて計算する（一覧用）
export async function remainingGramsMap(listings: { id: string; quantityG: number }[], now = new Date()) {
  const used = await prisma.order.groupBy({
    by: ["listingId"],
    where: { listingId: { in: listings.map((l) => l.id) }, ...usingStockWhere(now) },
    _sum: { quantityG: true },
  });
  const usedMap = new Map(used.map((u) => [u.listingId, u._sum.quantityG ?? 0]));
  return new Map(listings.map((l) => [l.id, l.quantityG - (usedMap.get(l.id) ?? 0)]));
}

// その量で申し込めるか（いちばん少ない注文量以上・単位で割り切れる・残り以内）
export function canOrder(listing: { minOrderG: number; unitG: number }, remainingG: number, grams: number): boolean {
  return grams >= listing.minOrderG && grams % listing.unitG === 0 && grams <= remainingG;
}
