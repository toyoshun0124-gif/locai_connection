// ロスの変化（グラフ）：野菜（＋農家さん）を1つ選んで、「前回より何円」の棒グラフと、ロス量の折れ線グラフを見る
// アプリは計算して見せるだけ。次に何kg申し込むかは三上さんが決める（6章ルール5）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { LOSS_LABELS, lossGrams, lossGroupKey, lossYen, savedYenByOrder, savedYenText } from "@/lib/loss";
import { formatYen } from "@/lib/price";
import { dateToYmd, formatKg, formatYmd, todayInJapan } from "@/lib/units";
import { WrongRoleNotice } from "@/app/app-header";
import { BackLink } from "@/app/back-link";
import { Spinner } from "@/app/spinner";
import { LossLineChart, SavedBarChart } from "./charts";

export default function LossTrendPage({ searchParams }: PageProps<"/buyer/loss/trend">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl xl:max-w-5xl lg:px-8">
        <Suspense fallback={<Spinner />}>
          <LossTrend searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function LossTrend({ searchParams }: { searchParams: PageProps<"/buyer/loss/trend">["searchParams"] }) {
  const user = await getCurrentUser();
  if (user.role !== "BUYER") return <WrongRoleNotice forRole="BUYER" />;

  // 自分の、販売確定してロスを記録した注文だけ（ほかのお店の記録は読まない）
  const today = todayInJapan();
  const recorded = (
    await prisma.order.findMany({
      where: { buyerId: user.id, status: "CONFIRMED", lossQuarters: { not: null } },
      orderBy: [{ useDate: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true, quantityG: true, useDate: true, lossQuarters: true, itemYen: true, pricePerKg: true,
        listing: { select: { name: true, producerId: true, producer: { select: { name: true } } } },
      },
    })
  ).filter((o) => dateToYmd(o.useDate) <= today);
  const savedById = savedYenByOrder(recorded);

  // 選べる野菜（＋農家さん）の一覧。新しく記録した順
  const groups = new Map<string, { name: string; producerName: string }>();
  for (const o of recorded) {
    if (!groups.has(lossGroupKey(o))) groups.set(lossGroupKey(o), { name: o.listing.name, producerName: o.listing.producer.name });
  }

  // 選んだ野菜。自分の記録にないものを指定されたら、いちばん上のものを見せる
  const { item } = await searchParams;
  const selected = typeof item === "string" && groups.has(item) ? item : [...groups.keys()][0];
  // グラフは左が古い、右が新しい
  const rows = recorded.filter((o) => lossGroupKey(o) === selected).reverse();
  const label = (o: (typeof rows)[number]) => {
    const [, m, d] = dateToYmd(o.useDate).split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  const savedPoints = rows.filter((o) => savedById.has(o.id)).map((o) => ({ label: label(o), yen: savedById.get(o.id) ?? 0 }));
  const lossPoints = rows.map((o) => ({ label: label(o), lossG: lossGrams(o.quantityG, o.lossQuarters ?? 0) }));
  const card = `mt-3 ${softCard} p-4`;

  return (
    <>
      <BackLink href="/buyer/loss">ロスの記録に戻る</BackLink>
      <h1 className="mt-4 text-xl text-green-900"><span aria-hidden>📈 </span>ロスの変化</h1>
      <p className="text-sm text-stone-600">野菜を選ぶと、その野菜のこれまでの変化が見られます。</p>

      {groups.size === 0 ? (
        <p className={card}>まだ記録がありません。</p>
      ) : (
        <>
          {/* 野菜（＋農家さん）を選ぶ */}
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="野菜を選ぶ">
            {[...groups].map(([key, g]) => (
              <Link
                key={key}
                href={`/buyer/loss/trend?item=${encodeURIComponent(key)}`}
                aria-current={key === selected ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  key === selected ? "border-green-800 bg-green-800 font-bold text-white" : "border-stone-300 bg-white text-stone-700 hover:border-green-700 hover:bg-green-50"
                }`}
              >
                {g.name}（{g.producerName}）
              </Link>
            ))}
          </nav>

          {/* 棒グラフ：前回より何円 */}
          <section className={card}>
            <h2 className="font-bold">前回より何円減ったか</h2>
            <p className="text-xs text-stone-500">
              <span className="mr-1 inline-block size-2.5 rounded-sm bg-[#047857]" aria-hidden />減った（上）
              <span className="ml-3 mr-1 inline-block size-2.5 rounded-sm bg-[#ea580c]" aria-hidden />増えた（下）
              ・量の差 × その回の単価で計算
            </p>
            {savedPoints.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">前回と比べるには、この野菜の記録が2回以上必要です。</p>
            ) : (
              <div className="mt-4"><SavedBarChart points={savedPoints} /></div>
            )}
          </section>

          {/* 折れ線グラフ：ロス量 */}
          <section className={card}>
            <h2 className="font-bold">ロスの量</h2>
            <p className="text-xs text-stone-500">記録した回ごとの、余った量</p>
            <div className="mt-4"><LossLineChart points={lossPoints} /></div>
          </section>

          {/* 数字の表（スマホではグラフに指を乗せても数字が出ないので、表でも見られるようにする） */}
          <section className={`mt-3 overflow-x-auto ${softCard}`}>
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">使用日</th>
                  <th className="px-3 py-2 text-right font-medium">仕入れ</th>
                  <th className="px-3 py-2 text-left font-medium">結果</th>
                  <th className="px-3 py-2 text-right font-medium">ロス</th>
                  <th className="px-3 py-2 text-right font-medium">前回より</th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((o) => (
                  <tr key={o.id} className="border-t border-stone-100">
                    <td className="whitespace-nowrap px-3 py-2">{formatYmd(dateToYmd(o.useDate))}</td>
                    <td className="px-3 py-2 text-right">{formatKg(o.quantityG)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{LOSS_LABELS[o.lossQuarters ?? 0]}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {formatKg(lossGrams(o.quantityG, o.lossQuarters ?? 0))}
                      <span className="block text-xs text-stone-500">{formatYen(lossYen(o.itemYen, o.lossQuarters ?? 0))}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-bold">{savedById.has(o.id) ? savedYenText(savedById.get(o.id) ?? 0) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <p className="mt-2 text-xs text-stone-500">次に何kg申し込むかは、この記録を見て、あなたが決めてください。</p>
        </>
      )}
    </>
  );
}
