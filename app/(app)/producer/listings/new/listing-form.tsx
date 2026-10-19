"use client";
// 出品の入力フォーム（入力した内容は、エラーが出ても消えない）
import { inputBox } from "@/lib/ui";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createListing, getMarket, type ListingFormState } from "./actions";
import type { Market, Stat } from "@/lib/market";
import { formatKg } from "@/lib/units";

export type ListingValues = {
  name: string;
  city: string;
  pricePerKg: string;
  quantity: string;
  minOrder: string;
  unit: string;
  delivery: boolean;
  pickup: boolean;
  shippingYen: string;
  replyDays: string;
  shipDates: string[];
};

export function ListingForm({
  initial,
  dateChoices,
  prefectureLabel,
}: {
  initial: ListingValues;
  dateChoices: { ymd: string; label: string }[];
  prefectureLabel: string;
}) {
  const [v, setV] = useState(initial);
  // 相場の参考（商品名を入れて少ししたら、サーバーに問い合わせる）
  const [market, setMarket] = useState<Market | null>(null);
  useEffect(() => {
    const name = v.name.trim();
    if (!name) return;
    const timer = setTimeout(() => {
      getMarket(name).then(setMarket);
    }, 600);
    return () => clearTimeout(timer);
  }, [v.name]);
  // 商品名が空なら、相場は出さない
  const shownMarket = v.name.trim() && market?.name === v.name.trim() ? market : null;
  const [state, formAction, pending] = useActionState<ListingFormState, FormData>(createListing, { message: "" });
  const err = (key: string) => state.errors?.[key];
  const set = (patch: Partial<ListingValues>) => setV({ ...v, ...patch });

  const input = inputBox;
  const label = "font-medium text-stone-800";
  const errorText = (key: string) => err(key) && <span className="text-sm text-red-600">{err(key)}</span>;

  // 出荷できる日を、押すたびに 選ぶ／外す
  function toggleDate(ymd: string) {
    set({ shipDates: v.shipDates.includes(ymd) ? v.shipDates.filter((d) => d !== ymd) : [...v.shipDates, ymd] });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* 毎回入力する3つ */}
      <section className="flex flex-col gap-4 rounded-xl bg-green-50 p-4">
        <p className="text-sm font-bold text-green-900">毎回入力するもの</p>

        <label className="flex flex-col gap-1">
          <span className={label}>量（kg）</span>
          <span className="text-xs text-stone-500">今回お店に売りたい量。0.1kg 単位</span>
          <input name="quantity" inputMode="decimal" className={input} value={v.quantity} onChange={(e) => set({ quantity: e.target.value })} placeholder="例：30" />
          {errorText("quantityG")}
        </label>

        <label className="flex flex-col gap-1">
          <span className={label}>値段（1kgあたり・円）</span>
          <input name="pricePerKg" inputMode="numeric" className={input} value={v.pricePerKg} onChange={(e) => set({ pricePerKg: e.target.value })} placeholder="例：1200" />
          {errorText("pricePerKg")}
          <PriceHint name={v.name} market={shownMarket} />
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className={label}>出荷できる日（1日以上）</legend>
          <div className="mt-1 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {dateChoices.map((d) => {
              const on = v.shipDates.includes(d.ymd);
              return (
                <button
                  key={d.ymd}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDate(d.ymd)}
                  className={`rounded-lg border px-1 py-2 text-xs ${on ? "border-green-800 bg-green-800 text-white" : "border-stone-300 bg-white text-stone-700"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          {/* 選んだ日を、フォームと一緒に送る */}
          {v.shipDates.map((d) => (
            <input key={d} type="hidden" name="shipDates" value={d} />
          ))}
          <span className="text-xs text-stone-500">{v.shipDates.length}日 選んでいます</span>
          {errorText("shipDates")}
        </fieldset>
      </section>

      {/* 前回の内容を使い回せるもの */}
      <section className="flex flex-col gap-4">
        <p className="text-sm font-bold text-stone-600">商品の情報</p>

        <label className="flex flex-col gap-1">
          <span className={label}>商品名</span>
          <input name="name" maxLength={30} className={input} value={v.name} onChange={(e) => set({ name: e.target.value })} placeholder="例：賀茂茄子" />
          {errorText("name")}
        </label>

        <label className="flex flex-col gap-1">
          <span className={label}>産地（市町村）</span>
          <span className="text-xs text-stone-500">{prefectureLabel}の後ろに付けて表示します</span>
          <input name="city" maxLength={30} className={input} value={v.city} onChange={(e) => set({ city: e.target.value })} placeholder="例：南丹市" />
          {errorText("city")}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={label}>いちばん少ない注文量（kg）</span>
            <input name="minOrder" inputMode="decimal" className={input} value={v.minOrder} onChange={(e) => set({ minOrder: e.target.value })} placeholder="例：1" />
            {errorText("minOrderG")}
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>注文の単位（kg）</span>
            <input name="unit" inputMode="decimal" className={input} value={v.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="例：0.5" />
            {errorText("unitG")}
          </label>
        </div>
        <p className="-mt-2 text-xs text-stone-500">例：1kg から 0.5kg ずつ → お店は 1kg、1.5kg、2kg… で申し込めます</p>
        <SizeHint market={shownMarket} />

        <fieldset className="flex flex-col gap-1">
          <legend className={label}>受け取り条件（1つ以上）</legend>
          <label className="inline-flex items-center gap-2 accent-green-800">
            <input type="checkbox" name="delivery" checked={v.delivery} onChange={(e) => set({ delivery: e.target.checked })} />
            わたし（農家）が届ける
          </label>
          {v.delivery && (
            <label className="ml-6 flex flex-col gap-1">
              <span className="text-sm text-stone-700">送料（1回の注文あたり・円。無料なら 0）</span>
              <input name="shippingYen" inputMode="numeric" className={input} value={v.shippingYen} onChange={(e) => set({ shippingYen: e.target.value })} placeholder="例：800" />
              {errorText("shippingYen")}
            </label>
          )}
          <label className="inline-flex items-center gap-2 accent-green-800">
            <input type="checkbox" name="pickup" checked={v.pickup} onChange={(e) => set({ pickup: e.target.checked })} />
            お店が取りに来る
          </label>
          {errorText("receive")}
          {/* 住所が無くて断られたときは、プロフィールへの道を出す */}
            {state.errors?.receive?.includes("住所") && (
              <Link href="/mypage/profile" className="text-sm text-green-800 underline">プロフィールで住所を登録する</Link>
            )}
          </fieldset>

        <label className="flex flex-col gap-1">
          <span className={label}>回答期限</span>
          <span className="text-xs text-stone-500">申し込みが来てから、何日以内に返事をするか（最長3日）</span>
          <select name="replyDays" className={input} value={v.replyDays} onChange={(e) => set({ replyDays: e.target.value })}>
            <option value="1">1日以内</option>
            <option value="2">2日以内</option>
            <option value="3">3日以内</option>
          </select>
          {errorText("replyDays")}
        </label>
      </section>

      {state.message && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}

      <button type="submit" disabled={pending} className="rounded-full bg-green-800 py-3 font-medium text-white hover:bg-green-900 disabled:opacity-50">
        {pending ? "出品しています…" : "出品する"}
      </button>
    </form>
  );
}

// 値段の相場（参考）。真ん中の値と、よくある範囲。記録が少なければ、そう伝える
function priceLine(label: string, st: Stat) {
  if (st.median === null) return <li>{label}：まだ参考になる記録がありません（{st.count}件）</li>;
  return (
    <li>
      {label}：真ん中 <span className="font-bold">{st.median.toLocaleString("ja-JP")}円/kg</span>
      <span className="text-stone-500">（多くは {st.low.toLocaleString("ja-JP")}〜{st.high.toLocaleString("ja-JP")}円、{st.count}件）</span>
    </li>
  );
}

function PriceHint({ name, market }: { name: string; market: Market | null }) {
  if (!name.trim()) return <span className="text-xs text-stone-500">商品名を入れると、このアプリでの相場の参考が出ます</span>;
  if (!market) return null;
  return (
    <div className="mt-1 rounded-lg bg-white px-3 py-2 text-xs text-stone-700 ring-1 ring-stone-200">
      <p className="font-medium">「{market.name}」の相場（このアプリの最近90日の記録）</p>
      <ul className="mt-0.5">
        {priceLine("販売確定", market.confirmedPrice)}
        {priceLine("出品", market.listedPrice)}
      </ul>
      <p className="mt-0.5 text-stone-500">参考です。値段はあなたが決めます。</p>
    </div>
  );
}

// お店が申し込んでいる量（参考）
function SizeHint({ market }: { market: Market | null }) {
  if (!market) return null;
  const st = market.orderSize;
  return (
    <p className="-mt-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-700">
      {st.median === null
        ? `「${market.name}」の申し込みの量は、まだ参考になる記録がありません（${st.count}件）`
        : `「${market.name}」は、多くのお店が ${formatKg(st.low)}〜${formatKg(st.high)} で申し込んでいます（${st.count}件）`}
    </p>
  );
}
