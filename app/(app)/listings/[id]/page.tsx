// 出品の詳細（三上さんが一覧からタップして見る画面。4章A④）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PREFECTURES } from "@/lib/options";
import { formatYen, itemYen } from "@/lib/price";
import { expireOverdueOrdersOnce, remainingGramsOf } from "@/lib/stock";
import { isOrderableShipDate } from "@/lib/order";
import { OrderForm } from "./order-form";
import { producerCancelCount } from "@/lib/cancel-count";
import { addDays, dateToYmd, formatKg, formatYmd, gramsToKgText, kgTextToGrams, todayInJapan } from "@/lib/units";
import { WrongRoleNotice } from "@/app/app-header";
import { BackLink } from "@/app/back-link";
import { Spinner } from "@/app/spinner";

export default function ListingDetailPage({ params, searchParams }: PageProps<"/listings/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl px-4 pb-6 lg:max-w-3xl lg:px-8">
        <Suspense fallback={<Spinner />}>
          <ListingDetail params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function ListingDetail({
  params,
  searchParams,
}: {
  params: PageProps<"/listings/[id]">["params"];
  searchParams: PageProps<"/listings/[id]">["searchParams"];
}) {
  const user = await getCurrentUser();
  // 農家さんは購入者用の画面を使わない（5章「別人」）
  if (user.role !== "BUYER") {
    return (
      <>
        <WrongRoleNotice forRole="BUYER" />
      </>
    );
  }

  const { id } = await params;
  const sp = await searchParams;
  const { kg } = sp;
  // 「一覧に戻る」で、さっきの検索結果（絞り込みも）に戻れるようにする
  const backParams = new URLSearchParams();
  for (const key of ["q", "kg", "useDate", "budget", "receive", "sort"]) {
    const v = sp[key];
    if (typeof v === "string") backParams.set(key, v);
  }
  // 絞り込みで入れた使用日・受け取り条件は、申し込みのフォームにも最初から入れる
  const initialUseDate = typeof sp.useDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.useDate) ? sp.useDate : "";
  const initialReceive = sp.receive === "DELIVERY" || sp.receive === "PICKUP" ? sp.receive : "";
  const backHref = backParams.size > 0 ? `/buyer?${backParams}` : "/buyer";
  // 公開中の出品だけ。見せてよい項目だけを取り出す（農家さんの住所・メールは読まない）
  const l = await prisma.listing.findFirst({
    where: { id, status: "OPEN" },
    select: {
      id: true, name: true, city: true, pricePerKg: true, quantityG: true, minOrderG: true, unitG: true,
      delivery: true, pickup: true, shippingYen: true, replyDays: true, shipDates: true, createdAt: true,
      producer: { select: { id: true, name: true, prefecture: true, profile: { select: { policy: true } } } },
    },
  });

  const card = `mt-4 ${softCard} p-5`;
  const tomorrow = addDays(todayInJapan(), 1);
  const futureDates = l ? l.shipDates.map(dateToYmd).filter((d) => d >= tomorrow) : [];
  if (!l || futureDates.length === 0) {
    return (
      <>
        <div className={card}>
          <p>この出品は、いまは申し込めません（終了したか、出荷できる日が過ぎました）。</p>
          <Link href="/buyer" className="mt-2 inline-block text-green-800 underline">野菜を探すに戻る</Link>
        </div>
      </>
    );
  }

  // 期限切れの仮押さえを戻してから、残りの量を計算する
  await expireOverdueOrdersOnce();
  // 残りの量と、農家さんの「販売確定後のキャンセルの回数」（6章）と、前回のロスの記録を、同時に聞く
  // 前回のロス：自分の注文で、同じ農家さんの同じ野菜の、直近1回の記録だけ（ほかのお店の記録は読まない）
  const [remainingG, cancelCount, prevLossOrder] = await Promise.all([
    remainingGramsOf(prisma, l),
    producerCancelCount(l.producer.id),
    prisma.order.findFirst({
      where: { buyerId: user.id, status: "CONFIRMED", lossQuarters: { not: null }, listing: { producerId: l.producer.id, name: l.name } },
      orderBy: [{ useDate: "desc" }, { createdAt: "desc" }],
      select: { quantityG: true, lossQuarters: true, useDate: true },
    }),
  ]);
  const prevLoss = prevLossOrder
    ? { quantityG: prevLossOrder.quantityG, quarters: prevLossOrder.lossQuarters ?? 0, useDate: dateToYmd(prevLossOrder.useDate) }
    : null;
  // 申し込める出荷日（出荷日の4日前まで）
  const today = todayInJapan();
  const orderableDates = futureDates.filter((d) => isOrderableShipDate(d, today)).map((d) => ({ ymd: d, label: formatYmd(d) }));
  // 内訳の計算に使う量：一覧で入れた量があればそれ、なければいちばん少ない注文量
  const wantG = typeof kg === "string" ? kgTextToGrams(kg) : null;
  const g = wantG ?? l.minOrderG;
  const item = itemYen(l.pricePerKg, g);

  return (
    <>
      <BackLink href={backHref}>一覧に戻る</BackLink>

      {/* 食材名・産地・値段 */}
      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-stone-900">{l.name}</h1>
            <p className="text-stone-600">{PREFECTURES[l.producer.prefecture]}{l.city}</p>
          </div>
          <p className="shrink-0 text-3xl font-bold text-red-700">
            {l.pricePerKg.toLocaleString("ja-JP")}<span className="text-base">円/kg</span>
          </p>
        </div>
        <p className="mt-2 text-stone-800">
          残り <span className="font-bold">{formatKg(remainingG)}</span>
          <span className="text-stone-500">（{formatKg(l.minOrderG)}から{formatKg(l.unitG)}ずつ申し込めます）</span>
        </p>
      </div>

      {/* いつ届くか */}
      <section className={card}>
        <h2 className="text-green-900"><span aria-hidden>📅 </span>出荷できる日</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {futureDates.map((d) => (
            <li key={d} className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-900">{formatYmd(d)}</li>
          ))}
        </ul>
      </section>

      {/* 値段の内訳（金額はアプリが計算する） */}
      <section className={card}>
        <h2 className="text-green-900"><span aria-hidden>💴 </span>値段の内訳（{formatKg(g)}{wantG === null ? "：いちばん少ない注文量" : ""}の場合）</h2>
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-y-1 text-stone-800">
          <dt>野菜の代金（{l.pricePerKg.toLocaleString("ja-JP")}円/kg × {formatKg(g)}）</dt>
          <dd className="text-right">{formatYen(item)}</dd>
          {l.delivery && (
            <>
              <dt>送料（届けてもらう場合）</dt>
              <dd className="text-right">{formatYen(l.shippingYen)}</dd>
              <dt className="border-t border-stone-200 pt-1 font-bold">合計（届けてもらう場合）</dt>
              <dd className="border-t border-stone-200 pt-1 text-right font-bold">{formatYen(item + l.shippingYen)}</dd>
            </>
          )}
          {l.pickup && (
            <>
              <dt className={l.delivery ? "" : "border-t border-stone-200 pt-1 font-bold"}>合計（取りに行く場合・送料なし）</dt>
              <dd className={`text-right ${l.delivery ? "" : "border-t border-stone-200 pt-1 font-bold"}`}>{formatYen(item)}</dd>
            </>
          )}
        </dl>
        <p className="mt-1 text-xs text-stone-500">1円未満は切り捨てです</p>
      </section>

      {/* 受け取り条件・回答期限 */}
      <section className={card}>
        <h2 className="text-green-900"><span aria-hidden>🚚 </span>受け取り条件</h2>
        <ul className="mt-1 list-inside list-disc text-stone-800">
          {l.delivery && <li>農家さんが届ける（送料 {formatYen(l.shippingYen)}）</li>}
          {l.pickup && <li>お店が取りに行く（送料なし）</li>}
        </ul>
        <h2 className="mt-3 text-green-900"><span aria-hidden>⏳ </span>農家さんの返事</h2>
        <p className="text-stone-800">申し込みから {l.replyDays}日以内 に返事が来ます</p>
      </section>

      {/* 農家さん */}
      <section className={card}>
        <h2 className="text-green-900"><span aria-hidden>🧑‍🌾 </span>農家さん</h2>
        <Link href={`/producers/${l.producer.id}`} className="mt-1 inline-block text-lg text-green-800 underline">
          {l.producer.name}
        </Link>
        <p className="mt-1 whitespace-pre-wrap text-stone-800">{l.producer.profile?.policy ?? "こだわりは、まだ登録されていません"}</p>
        <p className="mt-2 text-sm text-stone-600">販売確定後のキャンセル：{cancelCount}回</p>
      </section>

      <p className="mt-4 text-right text-xs text-stone-500">
        出品日：{l.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
      </p>

      {/* 申し込み */}
      <section className={card}>
        <h2 className="text-lg text-green-900"><span aria-hidden>🛒 </span>申し込む</h2>
        <p className="mb-3 text-xs text-stone-500">出荷日の4日前まで申し込めます</p>
        {remainingG < l.minOrderG ? (
          <p className="text-stone-600">いまは申し込める量が残っていません。農家さんの返事によっては、また申し込めるようになります。</p>
        ) : (
          <OrderForm
            listing={{ id: l.id, name: l.name, pricePerKg: l.pricePerKg, minOrderG: l.minOrderG, unitG: l.unitG, delivery: l.delivery, pickup: l.pickup, shippingYen: l.shippingYen }}
            remainingG={remainingG}
            orderableDates={orderableDates}
            initialKg={wantG !== null ? gramsToKgText(wantG) : ""}
            initialUseDate={initialUseDate}
            initialReceive={initialReceive}
            prevLoss={prevLoss}
          />
        )}
      </section>
    </>
  );
}
