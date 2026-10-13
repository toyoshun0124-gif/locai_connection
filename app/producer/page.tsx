// 生産者（坂田さんなど）のログイン後の画面：出品と、届いた申し込み（4章B）
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { dateToYmd, formatKg, formatYmd } from "@/lib/units";
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
  const listings = await prisma.listing.findMany({
    where: { producerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AppHeader user={user} />

      {listed === "1" && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-green-800">出品しました</p>}

      {/* 届いた申し込み（4章B④：申し込んだ順に並べる） */}
      <section className="mt-6">
        <h1 className="text-xl font-bold">届いた申し込み</h1>
        <p className="mt-2 rounded bg-zinc-50 p-4 text-zinc-600">
          まだ申し込みはありません。（申し込みの一覧は、申し込みの機能と一緒に作ります）
        </p>
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
