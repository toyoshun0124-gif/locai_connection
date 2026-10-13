// 生産者（坂田さんなど）のログイン後の画面：出品と、届いた申し込み（4章B）
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { dateToYmd, formatKg, formatYmd, gramsToKgText, todayInJapan } from "@/lib/units";
import { buyerCancelCounts } from "@/lib/cancel-count";
import { BUYER_TYPES, PREFECTURES } from "@/lib/options";
import { RECEIVE_LABELS } from "@/lib/order";
import { formatYen } from "@/lib/price";
import { expireOverdueOrders, remainingGramsMap } from "@/lib/stock";
import { ProducerButtons, ProducerCancelButton } from "../orders/respond-buttons";
import { AppHeader, WrongRoleNotice } from "../app-header";

export default function ProducerPage({ searchParams }: PageProps<"/producer">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Suspense fallback={<p>読み込み中…</p>}>
        <ProducerHome searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ProducerHome({ searchParams }: { searchParams: PageProps<"/producer">["searchParams"] }) {
  const user = await getCurrentUser();
  // 購入者が開いたら、中身を見せずに案内だけ出す
  if (user.role !== "PRODUCER") {
    return (
      <>
        <AppHeader user={user} />
        <WrongRoleNotice forRole="PRODUCER" />
      </>
    );
  }

  const { listed } = await searchParams;
  // 自分の出品だけを、新しい順に出す
  await expireOverdueOrders();
  const listings = await prisma.listing.findMany({
    where: { producerId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const remaining = await remainingGramsMap(listings);

  // 自分の出品に届いた、返事待ち・販売確定の申し込み（申し込んだ順）
  // お店の情報は、プロフィールで公開している項目だけ（料理名・住所・メールは読まない）
  const orders = await prisma.order.findMany({
    where: { listing: { producerId: user.id }, status: { in: ["PENDING", "CHANGE_PROPOSED", "CONFIRMED"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, listingId: true, status: true, quantityG: true, requestedG: true, itemYen: true, shippingYen: true, totalYen: true,
      shipDate: true, useDate: true, receive: true, replyDeadline: true, createdAt: true,
      buyerId: true,
      buyer: { select: { name: true, buyerType: true, prefecture: true, profile: { select: { city: true, shopKind: true, policy: true } } } },
    },
  });
  const fmtDateTime = (d: Date) =>
    d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const listingsWithOrders = listings.filter((l) => orders.some((o) => o.listingId === l.id));
  // お店の「販売確定後のキャンセルの回数」
  const cancelCounts = await buyerCancelCounts([...new Set(orders.map((o) => o.buyerId))]);
  // お店の届け先は、販売確定していて「届ける」注文の相手の分だけ読む（6章ルール4）
  const deliveryBuyerIds = [...new Set(orders.filter((o) => o.status === "CONFIRMED" && o.receive === "DELIVERY").map((o) => o.buyerId))];
  const addresses = new Map(
    (await prisma.profile.findMany({ where: { userId: { in: deliveryBuyerIds } }, select: { userId: true, address: true } })).map((p) => [p.userId, p.address]),
  );
  const today = todayInJapan();

  return (
    <>
      <AppHeader user={user} />

      {listed === "1" && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-green-800">出品しました</p>}

      {/* 届いた申し込み（4章B④：申し込んだ順に並べる） */}
      <section className="mt-6">
        <h1 className="text-xl font-bold">届いた申し込み</h1>
        {listingsWithOrders.length === 0 ? (
          <p className="mt-2 rounded bg-zinc-50 p-4 text-zinc-600">まだ申し込みはありません。</p>
        ) : (
          listingsWithOrders.map((l) => {
            const mine = orders.filter((o) => o.listingId === l.id);
            const heldG = mine.filter((o) => o.status !== "CONFIRMED").reduce((sum, o) => sum + o.quantityG, 0);
            const confirmedG = mine.filter((o) => o.status === "CONFIRMED").reduce((sum, o) => sum + o.quantityG, 0);
            return (
              <div key={l.id} className="mt-3 rounded-xl border border-stone-200 bg-white p-4">
                <p className="font-bold">{l.name}<span className="ml-2 text-sm font-normal text-stone-500">出品 {formatKg(l.quantityG)}</span></p>
                <ol className="mt-2 flex flex-col gap-3">
                  {mine.map((o, i) => {
                    const p = o.buyer.profile;
                    return (
                      <li key={o.id} className="rounded-lg bg-stone-50 p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-medium">{i + 1}. {o.buyer.name}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${o.status === "CONFIRMED" ? "bg-green-100 text-green-900" : o.status === "CHANGE_PROPOSED" ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"}`}>
                            {o.status === "CONFIRMED" ? "販売確定" : o.status === "CHANGE_PROPOSED" ? "お店の返事待ち" : "あなたの返事待ち"}
                          </span>
                        </div>
                        {/* お店のプロフィール（公開している項目だけ） */}
                        <p className="text-xs text-stone-500">
                          {PREFECTURES[o.buyer.prefecture]}{p?.city ?? ""}・{p?.shopKind ?? (o.buyer.buyerType ? BUYER_TYPES[o.buyer.buyerType] : "")}・販売確定後のキャンセル：{cancelCounts.get(o.buyerId) ?? 0}回
                        </p>
                        {p?.policy && <p className="whitespace-pre-wrap text-xs text-stone-600">方針：{p.policy}</p>}
                        <p className="mt-1 text-stone-800">
                          {o.requestedG !== null && <span className="text-stone-500 line-through">{formatKg(o.requestedG)}</span>}{o.requestedG !== null && " → "}
                          <span className="font-bold">{formatKg(o.quantityG)}</span>・<span className="font-bold">{formatYen(o.totalYen)}</span>
                          <span className="text-xs text-stone-500">（野菜 {formatYen(o.itemYen)}{o.shippingYen > 0 && ` ＋ 送料 ${formatYen(o.shippingYen)}`}）</span>
                        </p>
                        <p className="text-sm text-stone-600">
                          出荷 {formatYmd(dateToYmd(o.shipDate))}・使用 {formatYmd(dateToYmd(o.useDate))}・{RECEIVE_LABELS[o.receive]}
                        </p>
                        {o.status !== "CONFIRMED" && <p className="text-sm font-medium text-sky-900">回答期限：{fmtDateTime(o.replyDeadline)}</p>}
                        {/* 届ける場合だけ、販売確定した相手（お店）の届け先を見せる */}
                        {o.status === "CONFIRMED" && o.receive === "DELIVERY" && (
                          <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
                            届け先：{addresses.get(o.buyerId) ?? "お店の住所が登録されていません"}
                          </p>
                        )}
                        {/* 販売確定のあとの取消は、出荷日の前日まで */}
                        {o.status === "CONFIRMED" && today < dateToYmd(o.shipDate) && <ProducerCancelButton orderId={o.id} />}
                        {(o.status === "PENDING" || o.status === "CHANGE_PROPOSED") && <ProducerButtons orderId={o.id} status={o.status} minKg={gramsToKgText(l.minOrderG)} />}
                      </li>
                    );
                  })}
                </ol>
                {/* 一覧の下：申し込みの合計と、全部売った場合の残り（4章B④） */}
                <p className="mt-3 border-t border-stone-200 pt-2 text-sm text-stone-700">
                  販売確定 {formatKg(confirmedG)}・返事待ち {formatKg(heldG)}・<span className="font-bold">全部売った場合の残り {formatKg(remaining.get(l.id) ?? 0)}</span>
                </p>
              </div>
            );
          })
        )}
      </section>

      {/* 自分の出品（4章B②） */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">自分の出品</h2>
          <Link href="/producer/listings/new" className="rounded-full bg-green-800 px-4 py-2 text-white hover:bg-green-900">
            出品する
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="mt-2 rounded bg-zinc-50 p-4 text-zinc-600">まだ出品はありません。「出品する」から始めましょう。</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {listings.map((l) => (
              <li key={l.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold">{l.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${l.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-500"}`}>
                    {l.status === "OPEN" ? "公開中" : "終了"}
                  </span>
                </div>
                <p className="text-sm text-stone-700">
                  {formatKg(l.quantityG)}・{l.pricePerKg.toLocaleString()}円/kg・{formatKg(l.minOrderG)}から{formatKg(l.unitG)}ずつ
                </p>
                <p className="text-sm text-stone-500">出荷できる日：{l.shipDates.map((d) => formatYmd(dateToYmd(d))).join("、")}</p>
                <p className="text-sm text-stone-500">
                  {[l.delivery && `届ける（送料 ${l.shippingYen.toLocaleString()}円）`, l.pickup && "取りに来てもらう"].filter(Boolean).join("／")}
                  ・回答期限 {l.replyDays}日以内
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
