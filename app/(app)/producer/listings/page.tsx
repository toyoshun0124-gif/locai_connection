// 生産者（坂田さんなど）の「出品」タブ：自分の出品の一覧（量を減らす・出品を終わりにする。4章B②⑤）
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { dateToYmd, formatKg, formatYmd, gramsToKgText } from "@/lib/units";
import { expireOverdueOrdersOnce, remainingGramsMap } from "@/lib/stock";
import { softCard } from "@/lib/ui";
import { WrongRoleNotice } from "@/app/app-header";
import { SproutIcon } from "@/app/icons";
import { ListingControls } from "../listing-controls";
import { Spinner } from "@/app/spinner";

export default function ProducerListingsPage({ searchParams }: PageProps<"/producer/listings">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl">
        <Suspense fallback={<Spinner />}>
          <ProducerListings searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function ProducerListings({ searchParams }: { searchParams: PageProps<"/producer/listings">["searchParams"] }) {
  const user = await getCurrentUser();
  if (user.role !== "PRODUCER") {
    return (
      <>
        <WrongRoleNotice forRole="PRODUCER" />
      </>
    );
  }
  const { listed } = await searchParams;

  // 自分の出品だけを、新しい順に出す
  await expireOverdueOrdersOnce();
  const listings = await prisma.listing.findMany({ where: { producerId: user.id }, orderBy: { createdAt: "desc" } });
  const remaining = await remainingGramsMap(listings);
  // 返事待ちの数（出品を終わりにするときの案内に使う）
  const orders = await prisma.order.findMany({
    where: { listing: { producerId: user.id }, status: { in: ["PENDING", "CHANGE_PROPOSED"] } },
    select: { listingId: true, status: true },
  });

  return (
    <>
      {listed === "1" && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-green-800">出品しました</p>}
      {/* 自分の出品（4章B②） */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl text-green-900"><SproutIcon size={24} />自分の出品</h1>
          <Link href="/producer/listings/new" className="rounded-full bg-green-800 px-4 py-2 text-white hover:bg-green-900">
            出品する
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className={`mt-2 ${softCard} p-4 text-stone-600`}>まだ出品はありません。「出品する」から始めましょう。</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {listings.map((l) => (
              <li key={l.id} className={`${softCard} p-4 sm:p-5`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold">{l.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${l.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-500"}`}>
                    {l.status === "OPEN" ? "公開中" : "終了"}
                  </span>
                </div>
                <p className="text-sm text-stone-700">
                  出品 {formatKg(l.quantityG)}・<span className="font-bold">残り {formatKg(Math.max(remaining.get(l.id) ?? 0, 0))}</span>（申し込める量）
                </p>
                <p className="text-sm text-stone-700">
                  {l.pricePerKg.toLocaleString()}円/kg・{formatKg(l.minOrderG)}から{formatKg(l.unitG)}ずつ
                </p>
                <p className="text-sm text-stone-500">出荷できる日：{l.shipDates.map((d) => formatYmd(dateToYmd(d))).join("、")}</p>
                <p className="text-sm text-stone-500">
                  {[l.delivery && `届ける（送料 ${l.shippingYen.toLocaleString()}円）`, l.pickup && "取りに来てもらう"].filter(Boolean).join("／")}
                  ・回答期限 {l.replyDays}日以内
                </p>
                {/* 売れ残りを市場に出すとき：量を減らす／出品を終わりにする（4章B⑤） */}
                {l.status === "OPEN" && (
                  <ListingControls
                    listingId={l.id}
                    remainingKg={gramsToKgText(Math.max(remaining.get(l.id) ?? 0, 0))}
                    holdCount={orders.filter((o) => o.listingId === l.id && (o.status === "PENDING" || o.status === "CHANGE_PROPOSED")).length}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
