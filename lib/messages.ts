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

// 自分が関わる取引（お店なら自分の注文、農家さんなら自分の出品に来た注文）のうち、メッセージがあるもの
// 1行ごとに：相手の名前・食材・まだ読んでいない数・最後のメッセージの時刻・回答期限（返事待ちのときだけ）
export async function conversationsFor(user: { id: string; role: string }) {
  const isBuyer = user.role === "BUYER";
  const orders = await prisma.order.findMany({
    where: { ...(isBuyer ? { buyerId: user.id } : { listing: { producerId: user.id } }), messages: { some: {} } },
    select: {
      id: true, status: true, replyDeadline: true, buyerReadAt: true, producerReadAt: true,
      buyer: { select: { name: true } },
      listing: { select: { name: true, producer: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "desc" }, select: { senderId: true, createdAt: true } },
    },
  });
  return orders
    .map((o) => {
      const readAt = isBuyer ? o.buyerReadAt : o.producerReadAt;
      // 相手から来たメッセージで、最後に読んだ時刻より新しいものの数
      const unread = o.messages.filter((m) => m.senderId !== user.id && (!readAt || m.createdAt > readAt)).length;
      const waiting = o.status === "PENDING" || o.status === "CHANGE_PROPOSED";
      return {
        orderId: o.id,
        partnerName: isBuyer ? o.listing.producer.name : o.buyer.name,
        item: o.listing.name,
        unread,
        lastAt: o.messages[0]?.createdAt ?? null,
        replyDeadline: waiting ? o.replyDeadline : null,
      };
    })
    // まだ読んでいないものがある取引を上に、そのあとは新しいメッセージの順
    .sort((a, b) => Number(b.unread > 0) - Number(a.unread > 0) || (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0));
}

// まだ読んでいないメッセージの合計（右上のアイコンに出す数）
export async function unreadTotalFor(user: { id: string; role: string }) {
  return (await conversationsFor(user)).reduce((sum, c) => sum + c.unread, 0);
}
