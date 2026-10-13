"use server";
// メッセージを送る処理（サーバー側）。外から直接呼ばれても安全なように、毎回確かめる
import { refresh } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type SendState = { ok: boolean; message: string; sentAt?: number };

const sendSchema = z.object({
  orderId: z.string().min(1).max(50),
  body: z.string().trim().min(1, "メッセージを入力してください").max(200, "メッセージは200字までです"),
});

export async function sendMessage(_prev: SendState, formData: FormData): Promise<SendState> {
  const user = await getCurrentUser();
  const parsed = sendSchema.safeParse({ orderId: formData.get("orderId"), body: formData.get("body") ?? "" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { orderId, body } = parsed.data;

  // 送れるのは、その注文のお店と農家さんだけ（6章ルール4）
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, listing: { select: { producerId: true } } },
  });
  const isBuyer = order?.buyerId === user.id;
  const isProducer = order?.listing.producerId === user.id;
  if (!order || (!isBuyer && !isProducer)) return { ok: false, message: "取引が見つかりません" };

  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({ data: { orderId, senderId: user.id, body } }),
    // 自分で送ったメッセージは「読んだ」ことにする
    prisma.order.update({ where: { id: orderId }, data: isBuyer ? { buyerReadAt: now } : { producerReadAt: now } }),
  ]);
  refresh();
  return { ok: true, message: "", sentAt: now.getTime() };
}
