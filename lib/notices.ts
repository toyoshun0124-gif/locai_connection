// 期限のお知らせ（6章）。アプリを開いたときに、画面の上に出す。サーバー側だけで使う
import "server-only";
import { prisma } from "@/lib/prisma";
import { expireOverdueOrdersOnce } from "@/lib/stock";

// 期限の何時間前から知らせるか
const SOON_HOURS = 24;
// 期限切れを、何日間知らせるか
const EXPIRED_SHOW_DAYS = 3;

export type Notice = { kind: "soon" | "expired"; text: string; href: string; count: number; earliest?: Date };

export async function noticesFor(user: { id: string; role: string }): Promise<Notice[]> {
  // 先に、期限を過ぎた返事待ちを「期限切れ」にしておく
  await expireOverdueOrdersOnce();
  const now = new Date();
  const soon = new Date(now.getTime() + SOON_HOURS * 60 * 60 * 1000);
  const expiredSince = new Date(now.getTime() - EXPIRED_SHOW_DAYS * 24 * 60 * 60 * 1000);
  const notices: Notice[] = [];

  if (user.role === "PRODUCER") {
    // 2つを同時に聞く：坂田さんの返事が必要で期限まで24時間を切った申し込み（期限ちょうどまでは期限内）／お店の返事がないまま期限切れになった申し込み
    const [waiting, expired] = await Promise.all([
      prisma.order.findMany({
        where: { listing: { producerId: user.id }, status: "PENDING", replyDeadline: { gte: now, lte: soon } },
        orderBy: { replyDeadline: "asc" },
        select: { replyDeadline: true },
      }),
      prisma.order.count({
        where: { listing: { producerId: user.id }, status: "EXPIRED", requestedG: { not: null }, replyDeadline: { gte: expiredSince } },
      }),
    ]);
    if (waiting.length > 0) {
      notices.push({ kind: "soon", text: `返事の期限が近い申し込みが${waiting.length}件あります`, href: "/producer/orders", count: waiting.length, earliest: waiting[0].replyDeadline });
    }
    if (expired > 0) notices.push({ kind: "expired", text: `お店の返事がないまま期限が来た申し込みが${expired}件あります`, href: "/producer/orders", count: expired });
  } else {
    // 2つを同時に聞く：三上さんの返事が必要（農家さんが量を減らした）で期限まで24時間を切った申し込み／農家さんの返事がないまま期限切れになった申し込み
    const [waiting, expired] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: user.id, status: "CHANGE_PROPOSED", replyDeadline: { gte: now, lte: soon } },
        orderBy: { replyDeadline: "asc" },
        select: { replyDeadline: true },
      }),
      prisma.order.count({
        where: { buyerId: user.id, status: "EXPIRED", requestedG: null, replyDeadline: { gte: expiredSince } },
      }),
    ]);
    if (waiting.length > 0) {
      notices.push({ kind: "soon", text: `あなたの返事が必要な申し込みが${waiting.length}件あります`, href: "/buyer/orders", count: waiting.length, earliest: waiting[0].replyDeadline });
    }
    if (expired > 0) notices.push({ kind: "expired", text: `返事がないまま期限が来た申し込みが${expired}件あります。代わりの野菜を探しますか？`, href: "/buyer/orders", count: expired });
  }
  return notices;
}
