// 注文ごとのメッセージの件数と「新しいメッセージ」の有無（一覧に出す印）。サーバー側だけで使う
import "server-only";
import { prisma } from "@/lib/prisma";

// orders：一覧に出す注文と、自分が最後に読んだ時刻
export async function messageSummary(userId: string, orders: { id: string; readAt: Date | null }[]) {
  const rows = await prisma.message.findMany({
    where: { orderId: { in: orders.map((o) => o.id) } },
    select: { orderId: true, senderId: true, createdAt: true },
  });
  const readAt = new Map(orders.map((o) => [o.id, o.readAt]));
  const summary = new Map<string, { count: number; hasNew: boolean }>();
  for (const r of rows) {
    const s = summary.get(r.orderId) ?? { count: 0, hasNew: false };
    s.count += 1;
    // 相手から来たメッセージで、最後に読んだ時刻より新しいもの
    const last = readAt.get(r.orderId);
    if (r.senderId !== userId && (!last || r.createdAt > last)) s.hasNew = true;
    summary.set(r.orderId, s);
  }
  return summary;
}
