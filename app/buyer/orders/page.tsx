// 三上さんの「自分の注文」の一覧（4章A⑤）
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { RECEIVE_LABELS, STATUS_LABELS } from "@/lib/order";
import { formatYen } from "@/lib/price";
import { expireOverdueOrders } from "@/lib/stock";
import { dateToYmd, formatKg, formatYmd, todayInJapan } from "@/lib/units";
import { AppHeader, WrongRoleNotice } from "../../app-header";
import { BuyerButtons } from "../../orders/respond-buttons";
import { MessageLink } from "../../orders/message-link";
import { messageSummary } from "@/lib/messages";

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
    <div className="flex flex-1 flex-col">
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
      id: true, status: true, quantityG: true, requestedG: true, totalYen: true, itemYen: true, shippingYen: true,
      shipDate: true, useDate: true, receive: true, replyDeadline: true, createdAt: true,
      cancelledBy: true, cancelledAfterConfirm: true, buyerReadAt: true,
      listing: { select: { id: true, name: true, producerId: true, producer: { select: { name: true } } } },
    },
  });
  orders.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  // 農家さんの住所は、販売確定していて「取りに行く」注文の相手の分だけ読む（6章ルール4）
  const pickupProducerIds = [...new Set(orders.filter((o) => o.status === "CONFIRMED" && o.receive === "PICKUP").map((o) => o.listing.producerId))];
  const addresses = new Map(
    (await prisma.profile.findMany({ where: { userId: { in: pickupProducerIds } }, select: { userId: true, address: true } })).map((p) => [p.userId, p.address]),
  );
  const today = todayInJapan();
  const msgs = await messageSummary(user.id, orders.map((o) => ({ id: o.id, readAt: o.buyerReadAt })));
  // 新しいメッセージがある注文を、いちばん上に出す（返事が必要なものが目立つように）
  orders.sort((a, b) => Number(msgs.get(b.id)?.hasNew ?? false) - Number(msgs.get(a.id)?.hasNew ?? false));

  const fmtDateTime = (d: Date) =>
    d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <AppHeader user={user} />
      <Link href="/buyer" className="mt-4 inline-block text-sm text-green-800 underline">← 野菜を探す</Link>
      <div className="mt-2 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-green-900">自分の注文</h1>
        <Link href="/buyer/loss" className="text-sm text-green-800 underline">ロスの記録 →</Link>
      </div>

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
              {o.status === "CHANGE_PROPOSED" && o.requestedG !== null && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  農家さんから「{formatKg(o.quantityG)}なら売れます」と返事が来ました（申し込み {formatKg(o.requestedG)}）。この量でよければ「この量でOK」を押してください。
                </p>
              )}
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
              {o.status === "CANCELLED" && o.cancelledAfterConfirm && (
                <p className="text-sm text-stone-500">販売確定のあとに{o.cancelledBy === "BUYER" ? "あなた" : "農家さん"}が取り消しました</p>
              )}
              {/* 取りに行く場合だけ、販売確定した相手（農家さん）の住所を見せる */}
              {o.status === "CONFIRMED" && o.receive === "PICKUP" && (
                <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
                  受け取り場所：{addresses.get(o.listing.producerId) ?? "農家さんの住所が登録されていません"}
                </p>
              )}
              {(o.status === "DECLINED" || o.status === "EXPIRED" || o.status === "CHANGE_PROPOSED") && (
                <Link href={`/buyer/alternatives?order=${o.id}`} className="mr-2 mt-2 inline-flex rounded-full bg-green-800 px-3 py-1 text-sm text-white hover:bg-green-900">
                  {o.status === "CHANGE_PROPOSED" ? "足りない分の代わりを探す（AI）" : "代わりの野菜を探す（AI）"}
                </Link>
              )}
              <MessageLink orderId={o.id} count={msgs.get(o.id)?.count ?? 0} hasNew={msgs.get(o.id)?.hasNew ?? false} />
              {(o.status === "PENDING" || o.status === "CHANGE_PROPOSED") && <BuyerButtons orderId={o.id} status={o.status} />}
              {/* 販売確定のあとの取消は、出荷日の前日まで */}
              {o.status === "CONFIRMED" && today < dateToYmd(o.shipDate) && <BuyerButtons orderId={o.id} status="CONFIRMED" />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
