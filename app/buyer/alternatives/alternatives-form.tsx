"use client";
// 代わりの野菜を提案してもらうフォームと、その結果
import { useActionState, useState } from "react";
import Link from "next/link";
import { formatKg, formatYmd } from "@/lib/units";
import { suggest, type SuggestState } from "./actions";

type Initial = { item: string; dishName: string; kg: string; useDate: string };

export function AlternativesForm({ initial }: { initial: Initial }) {
  const [v, setV] = useState(initial);
  const [state, action, pending] = useActionState<SuggestState, FormData>(suggest, { status: "idle" });
  const input =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-green-800 focus:outline-none focus:ring-2 focus:ring-green-800/20";

  return (
    <>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-medium text-stone-800">買えなかった野菜</span>
          <input name="item" maxLength={30} className={input} value={v.item} onChange={(e) => setV({ ...v, item: e.target.value })} placeholder="例：万願寺唐辛子" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-stone-800">料理名（任意・農家さんには見せません）</span>
          <input name="dishName" maxLength={50} className={input} value={v.dishName} onChange={(e) => setV({ ...v, dishName: e.target.value })} placeholder="例：万願寺唐辛子の焼き浸し" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-stone-700">ほしい量（kg・任意）</span>
            <input name="kg" inputMode="decimal" className={input} value={v.kg} onChange={(e) => setV({ ...v, kg: e.target.value })} placeholder="例：2" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-stone-700">使用日（任意）</span>
            <input name="useDate" type="date" className={input} value={v.useDate} onChange={(e) => setV({ ...v, useDate: e.target.value })} />
          </label>
        </div>
        <button type="submit" disabled={pending || v.item.trim() === ""} className="rounded-full bg-green-800 py-3 font-medium text-white hover:bg-green-900 disabled:opacity-50">
          {pending ? "AI が考えています…" : "AI に代わりの野菜を提案してもらう"}
        </button>
        <p className="text-xs text-stone-500">AI は提案するだけです。どれを買うか（買わないか）は、あなたが決めます。</p>
      </form>

      {/* 結果 */}
      {state.status === "error" && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}
      {state.status === "notDish" && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">料理の名前を入力してください。</p>}
      {state.status === "failed" && (
        <div className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
          <p>代わりの野菜の提案を作れませんでした。</p>
          <Link href={`/buyer?q=${encodeURIComponent(v.item)}`} className="text-green-800 underline">「{v.item}」の出品の一覧を見る</Link>
        </div>
      )}
      {state.status === "ok" && (
        <ul className="mt-5 flex flex-col gap-3">
          {state.suggestions.map((s) => (
            <li key={s.name} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <p className="text-lg font-bold text-green-900">{s.name}</p>
              {/* AI の説明は、文字として表示する */}
              <p className="text-sm text-stone-700">理由：{s.reason}</p>
              <p className="mt-0.5 text-xs text-stone-400">AI による提案</p>
              {s.listings.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-medium text-stone-800">アプリで買える出品</p>
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {s.listings.map((l) => (
                      <li key={l.id}>
                        <Link
                          href={`/listings/${l.id}?${new URLSearchParams({ q: l.name, ...(v.kg ? { kg: v.kg } : {}) })}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 hover:border-green-800"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{l.name}</span>
                            <span className="block text-xs text-stone-500">{l.area}・{l.producerName}・残り{formatKg(l.remainingG)}・出荷 {formatYmd(l.firstShip)}〜</span>
                          </span>
                          <span className="shrink-0 font-bold text-red-700">{l.pricePerKg.toLocaleString("ja-JP")}<span className="text-xs">円/kg</span></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  いまアプリでは買えません。<span className="font-bold">市場で探す候補</span>にしてください。
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
