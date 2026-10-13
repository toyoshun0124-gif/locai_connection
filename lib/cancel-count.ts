// 販売確定後のキャンセルの回数（6章）。理由に関係なく、すべて1回と数える
import "server-only";
import { prisma } from "@/lib/prisma";

// お店（購入者）が、販売確定のあとに取り消した回数
export async function buyerCancelCounts(buyerIds: string[]) {
  const rows = await prisma.order.groupBy({
    by: ["buyerId"],
    where: { buyerId: { in: buyerIds }, cancelledAfterConfirm: true, cancelledBy: "BUYER" },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.buyerId, r._count._all]));
}

// 農家さん（生産者）が、販売確定のあとに取り消した回数
export async function producerCancelCount(producerId: string) {
  return prisma.order.count({
    where: { listing: { producerId }, cancelledAfterConfirm: true, cancelledBy: "PRODUCER" },
  });
}
