"use client";
// 出品の入力フォーム（入力した内容は、エラーが出ても消えない）
import { useActionState, useState } from "react";
import Link from "next/link";
import { createListing, type ListingFormState } from "./actions";

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
  const [state, formAction, pending] = useActionState<ListingFormState, FormData>(createListing, { message: "" });
  const err = (key: string) => state.errors?.[key];
  const set = (patch: Partial<ListingValues>) => setV({ ...v, ...patch });

  const input =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-green-800 focus:outline-none focus:ring-2 focus:ring-green-800/20";
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
