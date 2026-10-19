// ロスの記録（4章A 追加機能）：使用日を迎えた販売確定の注文に、余った割合を記録する
// アプリは過去の仕入れ量とロス量を計算して見せるだけ。次に何kg申し込むかは三上さんが決める（6章ルール5）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { LOSS_LABELS, lossGrams, lossPercentText } from "@/lib/loss";
import { dateToYmd, formatKg, formatYmd, todayInJapan } from "@/lib/units";
import { AppHeader, WrongRoleNotice } from "../../app-header";
import { LossButtons } from "./loss-buttons";

export default function LossPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 py-6 lg:max-w-4xl xl:max-w-5xl lg:px-8">
        <Suspense fallback={<p>読み込み中…</p>}>
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
        <AppHeader user={user} />
        <WrongRoleNotice forRole="BUYER" />
      </>
    );
  }

  // 自分の、販売確定した注文で、使用日を迎えたもの（新しい使用日が上）
  const today = todayInJapan();
  const orders = (
    await prisma.order.findMany({
      where: { buyerId: user.id, status: "CONFIRMED" },
      orderBy: { useDate: "desc" },
      take: 200,
      select: { id: true, quantityG: true, useDate: true, lossQuarters: true, listing: { select: { name: true, producer: { select: { name: true } } } } },
    })
  ).filter((o) => dateToYmd(o.useDate) <= today);

  const notYet = orders.filter((o) => o.lossQuarters === null);
  const recorded = orders.filter((o) => o.lossQuarters !== null);

  // 食材ごとのまとめ（記録した注文だけで計算する）
  const byItem = new Map<string, { count: number; purchasedG: number; lossG: number }>();
  for (const o of recorded) {
    const s = byItem.get(o.listing.name) ?? { count: 0, purchasedG: 0, lossG: 0 };
    s.count += 1;
    s.purchasedG += o.quantityG;
    s.lossG += lossGrams(o.quantityG, o.lossQuarters ?? 0);
    byItem.set(o.listing.name, s);
  }

  const card = `mt-3 ${softCard} p-4`;
  return (
    <>
      <AppHeader user={user} />
      <h1 className="mt-6 text-xl text-green-900"><span aria-hidden>📊 </span>ロスの記録</h1>
      <p className="text-sm text-stone-600">営業のあとに、アプリで買った野菜がどれだけ余ったかを、ボタンで記録します。</p>

      {/* 食材ごとのまとめ */}
      <section className="mt-5">
        <h2 className="font-bold">これまでの記録（食材ごと）</h2>
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
                {[...byItem].map(([name, s]) => (
                  <tr key={name} className="border-t border-stone-100">
                    <td className="px-3 py-2">{name}</td>
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
                <span className="ml-2 text-sm font-normal text-stone-500">{formatKg(o.quantityG)}・使用 {formatYmd(dateToYmd(o.useDate))}</span>
              </p>
              <p className="text-sm text-stone-700">
                {LOSS_LABELS[o.lossQuarters ?? 0]} → ロス <span className="font-bold">{formatKg(lossGrams(o.quantityG, o.lossQuarters ?? 0))}</span>
              </p>
              <LossButtons orderId={o.id} current={o.lossQuarters} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}
