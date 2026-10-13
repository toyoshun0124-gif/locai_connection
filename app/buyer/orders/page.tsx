// 三上さんの「自分の注文」の一覧（4章A⑤）
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { RECEIVE_LABELS, STATUS_LABELS } from "@/lib/order";
import { formatYen } from "@/lib/price";
import { expireOverdueOrders } from "@/lib/stock";
import { dateToYmd, formatKg, formatYmd } from "@/lib/units";
import { AppHeader, WrongRoleNotice } from "../../app-header";

// 状態ごとの色（返事が必要なものほど目立たせる）
const STATUS_STYLES = {
  CHANGE_PROPOSED: "bg-amber-100 text-amber-900",
  PENDING: "bg-sky-100 text-sky-900",
  CONFIRMED: "bg-green-100 text-green-900",
  DECLINED: "bg-stone-100 text-stone-600",
  CANCELLED: "bg-stone-100 text-stone-600",
  EXPIRED: "bg-stone-100 text-stone-600",
} as const;

// 並び順：あなたの返事が必要なもの → 返事待ち → 販売確定 → 終わったもの
const STATUS_ORDER = ["CHANGE_PROPOSED", "PENDING", "CONFIRMED", "DECLINED", "EXPIRED", "CANCELLED"] as const;

export default function BuyerOrdersPage({ searchParams }: PageProps<"/buyer/orders">) {
  return (
    <div className="flex flex-1 flex-col bg-[#f6f1e7]">
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <Suspense fallback={<p>読み込み中…</p>}>
          <BuyerOrders searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function BuyerOrders({ searchParams }: { searchParams: PageProps<"/buyer/orders">["searchParams"] }) {
  const user = await getCurrentUser();
  if (user.role !== "BUYER") {
    return (
      <>
        <AppHeader user={user} />
        <WrongRoleNotice forRole="BUYER" />
      </>
    );
  }
  const { ordered } = await searchParams;

  await expireOverdueOrders();
  // 自分の注文だけ（他人の注文は読まない）
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, status: true, quantityG: true, totalYen: true, itemYen: true, shippingYen: true,
      shipDate: true, useDate: true, receive: true, replyDeadline: true, createdAt: true,
      listing: { select: { id: true, name: true, producer: { select: { name: true } } } },
    },
  });
  orders.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const fmtDateTime = (d: Date) =>
    d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <AppHeader user={user} />
      <Link href="/buyer" className="mt-4 inline-block text-sm text-green-800 underline">← 野菜を探す</Link>
      <h1 className="mt-2 text-xl font-bold text-green-900">自分の注文</h1>

      {typeof ordered === "string" && orders.some((o) => o.id === ordered) && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-green-800">
          申し込みました。農家さんの返事を待っています。
        </p>
      )}

      {orders.length === 0 ? (
        <p className="mt-3 rounded-xl bg-white p-4 text-stone-600">まだ申し込みはありません。</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {orders.map((o) => (
            <li key={o.id} className={`rounded-xl bg-white p-4 shadow-sm ring-1 ${o.id === ordered ? "ring-2 ring-green-700" : "ring-stone-200"}`}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-bold">{o.listing.name}<span className="ml-2 text-sm font-normal text-stone-500">{o.listing.producer.name}</span></p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[o.status]}`}>{STATUS_LABELS[o.status]}</span>
              </div>
              <p className="mt-1 text-stone-800">
                {formatKg(o.quantityG)}・<span className="font-bold">{formatYen(o.totalYen)}</span>
                <span className="text-sm text-stone-500">（野菜 {formatYen(o.itemYen)}{o.shippingYen > 0 && ` ＋ 送料 ${formatYen(o.shippingYen)}`}）</span>
              </p>
              <p className="text-sm text-stone-600">
                出荷 {formatYmd(dateToYmd(o.shipDate))}・使用 {formatYmd(dateToYmd(o.useDate))}・{RECEIVE_LABELS[o.receive]}
              </p>
              {(o.status === "PENDING" || o.status === "CHANGE_PROPOSED") && (
                <p className="text-sm font-medium text-sky-900">回答期限：{fmtDateTime(o.replyDeadline)}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
