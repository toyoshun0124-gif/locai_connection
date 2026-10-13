// 相場の参考（4章B③）。アプリの中の記録から、アプリの決まった計算で出す。AI には作らせない（6章ルール5）
import "server-only";
import { prisma } from "@/lib/prisma";

// 記録が何件以上あれば見せるか
export const MIN_RECORDS = 5;
// 何日前までの記録を使うか
const DAYS = 90;

export type Stat = { count: number; median: number; low: number; high: number } | { count: number; median: null };

// 並べたときに、下から p% の位置にある値（小数を使わない計算）
function percentile(sorted: number[], p: number): number {
  const index = Math.max(0, Math.ceil((sorted.length * p) / 100) - 1);
  return sorted[index];
}

// 真ん中の値と、よくある範囲（真ん中の半分：下から25%〜75%）。記録が少なければ median は null
function stat(values: number[]): Stat {
  if (values.length < MIN_RECORDS) return { count: values.length, median: null };
  const sorted = [...values].sort((a, b) => a - b);
  return { count: sorted.length, median: percentile(sorted, 50), low: percentile(sorted, 25), high: percentile(sorted, 75) };
}

export async function marketFor(rawName: string) {
  const name = rawName.trim();
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const sameName = { name: { equals: name, mode: "insensitive" as const } };

  // 販売確定した値段（1件の注文を1つの記録として数える）
  const confirmed = await prisma.order.findMany({
    where: { status: "CONFIRMED", createdAt: { gte: since }, listing: sameName },
    select: { pricePerKg: true },
  });
  // 出品された値段
  const listed = await prisma.listing.findMany({
    where: { ...sameName, createdAt: { gte: since } },
    select: { pricePerKg: true },
  });
  // お店が申し込んだ量（農家さんが減らす前の量）
  const requested = await prisma.order.findMany({
    where: { createdAt: { gte: since }, listing: sameName },
    select: { quantityG: true, requestedG: true },
  });

  return {
    name,
    confirmedPrice: stat(confirmed.map((o) => o.pricePerKg)),
    listedPrice: stat(listed.map((l) => l.pricePerKg)),
    orderSize: stat(requested.map((o) => o.requestedG ?? o.quantityG)),
  };
}
export type Market = Awaited<ReturnType<typeof marketFor>>;
