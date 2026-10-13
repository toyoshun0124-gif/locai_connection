"use server";
// ロスを記録する（直す）処理。外から直接呼ばれても安全なように、毎回確かめる
import { refresh } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { dateToYmd, todayInJapan } from "@/lib/units";

export type LossState = { message: string };

const schema = z.object({
  orderId: z.string().min(1).max(50),
  quarters: z.enum(["0", "1", "2", "3"]).transform(Number),
});

export async function recordLoss(_prev: LossState, formData: FormData): Promise<LossState> {
  const user = await getCurrentUser();
  if (user.role !== "BUYER") return { message: "この機能はお店（購入者）用です" };
  const parsed = schema.safeParse({ orderId: formData.get("orderId"), quarters: formData.get("quarters") });
  if (!parsed.success) return { message: "記録できませんでした" };
  const { orderId, quarters } = parsed.data;

  // 記録できるのは、自分の注文で、販売確定していて、使用日を迎えたものだけ
  const order = await prisma.order.findFirst({ where: { id: orderId, buyerId: user.id }, select: { status: true, useDate: true } });
  if (!order || order.status !== "CONFIRMED") return { message: "この注文には記録できません" };
  if (todayInJapan() < dateToYmd(order.useDate)) return { message: "使用日の当日から記録できます" };

  await prisma.order.update({ where: { id: orderId }, data: { lossQuarters: quarters, lossRecordedAt: new Date() } });
  refresh();
  return { message: "" };
}
