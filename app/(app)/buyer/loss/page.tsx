// ロスの記録（4章A 追加機能）：使用日を迎えた販売確定の注文に、余った割合を記録する
// アプリは過去の仕入れ量とロス量を計算して見せるだけ。次に何kg申し込むかは三上さんが決める（6章ルール5）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { LOSS_LABELS, lossGrams, lossPercentText, lossYen, savedYen, savedYenText } from "@/lib/loss";
import { formatYen } from "@/lib/price";
import { dateToYmd, formatKg, formatYmd, todayInJapan } from "@/lib/units";
import { WrongRoleNotice } from "@/app/app-header";
import { LossButtons } from "./loss-buttons";
import { Spinner } from "@/app/spinner";

export default function LossPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl xl:max-w-5xl lg:px-8">
        <Suspense fallback={<Spinner />}>
          <Loss />
        </Suspense>
      </main>
    </div>
  );
}

async function Loss() {
  const user = await getCurrentUser();
  if (user.role !== "BUYER") {
    return (
      <>
        <WrongRoleNotice forRole="BUYER" />
      </>
    );
  }

  // 自分の、販売確定した注文で、使用日を迎えたもの（新しい使用日が上）
  const today = todayInJapan();
  const orders = (
    await prisma.order.findMany({
      where: { buyerId: user.id, status: "CONFIRMED" },
      orderBy: [{ useDate: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true, quantityG: true, useDate: true, lossQuarters: true, itemYen: true, pricePerKg: true,
        listing: { select: { name: true, producerId: true, producer: { select: { name: true } } } },
      },
    })
  ).filter((o) => dateToYmd(o.useDate) <= today);

  const notYet = orders.filter((o) => o.lossQuarters === null);
  const recorded = orders.filter((o) => o.lossQuarters !== null);

  // 同じ農家さんの同じ野菜を、1つのまとまりにする（農家さんによって野菜の大きさが違うため）
  const keyOf = (o: (typeof recorded)[number]) => `${o.listing.producerId}/${o.listing.name}`;

  // 食材（＋農家さん）ごとのまとめ（記録した注文だけで計算する）
  const byItem = new Map<string, { name: string; producerName: string; count: number; purchasedG: number; lossG: number }>();
  for (const o of recorded) {
    const s = byItem.get(keyOf(o)) ?? { name: o.listing.name, producerName: o.listing.producer.name, count: 0, purchasedG: 0, lossG: 0 };
    s.count += 1;
    s.purchasedG += o.quantityG;
    s.lossG += lossGrams(o.quantityG, o.lossQuarters ?? 0);
    byItem.set(keyOf(o), s);
  }

  // 1件ずつ、同じ農家さんの同じ野菜の「前回」と比べて、何円減ったかを計算する（古い順に見ていく）
  const savedById = new Map<string, number>();
  const lastLossG = new Map<string, number>();
  for (const o of [...recorded].reverse()) {
    const nowLossG = lossGrams(o.quantityG, o.lossQuarters ?? 0);
    const prevLossG = lastLossG.get(keyOf(o));
    if (prevLossG !== undefined) savedById.set(o.id, savedYen(prevLossG, nowLossG, o.pricePerKg));
    lastLossG.set(keyOf(o), nowLossG);
  }
  // 合計 ＝ 1件ずつの「前回より何円」を足したもの
  const totalSaved = [...savedById.values()].reduce((a, b) => a + b, 0);

  const card = `mt-3 ${softCard} p-4`;
  return (
    <>
      <h1 className="mt-6 text-xl text-green-900"><span aria-hidden>📊 </span>ロスの記録</h1>
      <p className="text-sm text-stone-600">営業のあとに、アプリで買った野菜がどれだけ余ったかを、ボタンで記録します。</p>

      {/* 食材ごとのまとめ */}
      <section className="mt-5">
        <h2 className="font-bold">これまでの記録（食材・農家さんごと）</h2>
        {/* ロス金額の変化（比べられる前回の記録があるときだけ） */}
        {savedById.size > 0 && (
          <p className="mt-2 text-sm text-stone-700">
            ロス金額の変化：前回と比べて合計{" "}
            <span className={`font-bold ${totalSaved > 0 ? "text-green-800" : totalSaved < 0 ? "text-red-700" : ""}`}>
              {savedYenText(totalSaved)}（{totalSaved > 0 ? "減りました" : totalSaved < 0 ? "増えました" : "変わりません"}）
            </span>
          </p>
        )}
        {byItem.size === 0 ? (
          <p className={`mt-2 ${softCard} p-4 text-sm text-stone-600`}>まだ記録がありません。</p>
        ) : (
          <div className={`mt-2 overflow-x-auto ${softCard}`}>
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">食材</th>
                  <th className="px-3 py-2 text-right font-medium">回数</th>
                  <th className="px-3 py-2 text-right font-medium">仕入れ</th>
                  <th className="px-3 py-2 text-right font-medium">ロス</th>
                  <th className="px-3 py-2 text-right font-medium">割合</th>
                </tr>
              </thead>
              <tbody>
                {[...byItem].map(([key, s]) => (
                  <tr key={key} className="border-t border-stone-100">
                    {/* 列を増やさないように、農家さんの名前は食材の下に小さく出す */}
                    <td className="px-3 py-2">{s.name}<span className="block text-xs text-stone-500">{s.producerName}</span></td>
                    <td className="px-3 py-2 text-right">{s.count}回</td>
                    <td className="px-3 py-2 text-right">{formatKg(s.purchasedG)}</td>
                    <td className="px-3 py-2 text-right">{formatKg(s.lossG)}</td>
                    <td className="px-3 py-2 text-right font-bold">{lossPercentText(s.lossG, s.purchasedG)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-stone-500">次に何kg申し込むかは、この記録を見て、あなたが決めてください。</p>
      </section>

      {/* まだ記録していない注文 */}
      <section className="mt-6">
        <h2 className="font-bold">まだ記録していない（{notYet.length}件）</h2>
        {notYet.length === 0 && <p className="mt-2 text-sm text-stone-500">記録が必要な注文はありません。使用日の当日から記録できます。</p>}
        {notYet.map((o) => (
          <div key={o.id} className={card}>
            <p className="font-medium">{o.listing.name}<span className="ml-2 text-sm font-normal text-stone-500">{o.listing.producer.name}・{formatKg(o.quantityG)}・使用 {formatYmd(dateToYmd(o.useDate))}</span></p>
            <LossButtons orderId={o.id} current={null} />
          </div>
        ))}
      </section>

      {/* 記録した注文（押し直せば直せる） */}
      {recorded.length > 0 && (
        <section className="mt-6">
          <h2 className="font-bold">記録した注文（押し直すと直せます）</h2>
          {recorded.map((o) => (
            <div key={o.id} className={card}>
              <p className="font-medium">
                {o.listing.name}
                <span className="ml-2 text-sm font-normal text-stone-500">{o.listing.producer.name}・{formatKg(o.quantityG)}・使用 {formatYmd(dateToYmd(o.useDate))}</span>
              </p>
              <p className="text-sm text-stone-700">
                {LOSS_LABELS[o.lossQuarters ?? 0]} → ロス <span className="font-bold">{formatKg(lossGrams(o.quantityG, o.lossQuarters ?? 0))}</span>
                （{formatYen(lossYen(o.itemYen, o.lossQuarters ?? 0))}）
                {savedById.has(o.id) && <>・前回より <span className="font-bold">{savedYenText(savedById.get(o.id) ?? 0)}</span></>}
              </p>
              <LossButtons orderId={o.id} current={o.lossQuarters} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}
