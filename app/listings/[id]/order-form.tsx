"use client";
// 申し込みのフォーム：入力 → 確認（毎回） → 申し込む
import { useActionState, useState } from "react";
import Link from "next/link";
import { RECEIVE_LABELS } from "@/lib/order";
import { formatYen, itemYen } from "@/lib/price";
import { formatKg, formatYmd, kgTextToGrams } from "@/lib/units";
import { createOrder, type OrderFormState } from "./actions";

type Props = {
  listing: {
    id: string;
    name: string;
    pricePerKg: number;
    minOrderG: number;
    unitG: number;
    delivery: boolean;
    pickup: boolean;
    shippingYen: number;
  };
  remainingG: number;
  orderableDates: { ymd: string; label: string }[];
  initialKg: string;
};

export function OrderForm({ listing, remainingG, orderableDates, initialKg }: Props) {
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [shipDate, setShipDate] = useState("");
  const [useDate, setUseDate] = useState("");
  const [quantity, setQuantity] = useState(initialKg);
  // 受け取り条件が1つしかない出品は、最初からそれを選んでおく
  const [receive, setReceive] = useState<"" | "DELIVERY" | "PICKUP">(
    listing.delivery && !listing.pickup ? "DELIVERY" : !listing.delivery && listing.pickup ? "PICKUP" : "",
  );
  const [wantAiHelp, setWantAiHelp] = useState(false);
  const [dishName, setDishName] = useState("");
  // 同じ申し込みを2回保存しないための目印（確認画面に進むときに作る）
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const [state, formAction, pending] = useActionState<OrderFormState, FormData>(
    async (prev, formData) => {
      const result = await createOrder(prev, formData);
      // エラーが返ってきたら、入力画面に戻す（入力した内容は残る）
      setStep("input");
      return result;
    },
    { message: "" },
  );
  const errors = { ...state.errors, ...localErrors };

  const grams = kgTextToGrams(quantity);
  // 画面に出す金額は目安。保存する金額は、サーバーで計算し直す
  const item = grams ? itemYen(listing.pricePerKg, grams) : 0;
  const shipping = receive === "DELIVERY" ? listing.shippingYen : 0;

  // 確認画面へ進む前の簡単なチェック（本当のチェックはサーバーで行う）
  function goConfirm() {
    const e: Record<string, string> = {};
    if (!shipDate) e.shipDate = "出荷日を選んでください";
    if (!quantity.trim()) e.quantity = "量を入力してください";
    else if (grams === null) e.quantity = "量は 0.1kg 単位の数字で入力してください（例：1.5）";
    else if (grams > remainingG) e.quantity = `申し込める量は、残り${formatKg(remainingG)}までです`;
    else if (grams < listing.minOrderG || grams % listing.unitG !== 0)
      e.quantity = `${formatKg(listing.minOrderG)}から${formatKg(listing.unitG)}ずつ申し込めます`;
    if (!useDate) e.useDate = "使用日を入力してください";
    else if (shipDate && useDate < shipDate) e.useDate = "使用日は、出荷日と同じ日か、それより後にしてください";
    if (!receive) e.receive = "受け取り条件を選んでください";
    if (dishName.length > 50) e.dishName = "料理名は50文字までです";
    setLocalErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!idempotencyKey) setIdempotencyKey(crypto.randomUUID());
    setStep("confirm");
  }

  const input =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-green-800 focus:outline-none focus:ring-2 focus:ring-green-800/20 disabled:bg-stone-100";
  const label = "font-medium text-stone-800";
  const err = (key: string) => errors[key] && <span className="text-sm text-red-600">{errors[key]}</span>;

  if (orderableDates.length === 0) {
    return <p className="text-stone-600">申し込める出荷日がありません（出荷日の4日前まで申し込めます）。</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* 送る内容（入力画面でも確認画面でも、同じものを送る） */}
      <input type="hidden" name="listingId" value={listing.id} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="shipDate" value={shipDate} />
      <input type="hidden" name="useDate" value={useDate} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="receive" value={receive} />
      <input type="hidden" name="dishName" value={wantAiHelp ? dishName : ""} />
      {wantAiHelp && <input type="hidden" name="wantAiHelp" value="on" />}

      {/* 残りが足りないとき：代わりの探し方を出す */}
      {state.soldOut && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>{state.message}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href={`/buyer?q=${encodeURIComponent(listing.name)}`} className="text-green-800 underline">ほかの農家さんの出品を見る</Link>
            <span className="text-stone-500">代わりの野菜を探す（AIの提案）は準備中です</span>
          </div>
        </div>
      )}
      {!state.soldOut && state.message && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}

      {step === "input" ? (
        <>
          <fieldset className="flex flex-col gap-1">
            <legend className={label}>出荷日（1つ選ぶ）</legend>
            {orderableDates.map((d) => (
              <label key={d.ymd} className="inline-flex items-center gap-2 accent-green-800">
                <input type="radio" name="shipDateChoice" checked={shipDate === d.ymd} onChange={() => setShipDate(d.ymd)} />
                {d.label}
              </label>
            ))}
            {err("shipDate")}
          </fieldset>

          <label className="flex flex-col gap-1">
            <span className={label}>量（kg）</span>
            <span className="text-xs text-stone-500">{formatKg(listing.minOrderG)}から{formatKg(listing.unitG)}ずつ・残り{formatKg(remainingG)}</span>
            <input inputMode="decimal" className={input} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={`例：${formatKg(listing.minOrderG).replace("kg", "")}`} />
            {err("quantity")}
          </label>

          <label className="flex flex-col gap-1">
            <span className={label}>使用日（料理に使う日）</span>
            <input type="date" className={input} value={useDate} min={shipDate || undefined} onChange={(e) => setUseDate(e.target.value)} />
            {err("useDate")}
          </label>

          <fieldset className="flex flex-col gap-1">
            <legend className={label}>受け取り条件</legend>
            {listing.delivery && (
              <label className="inline-flex items-center gap-2 accent-green-800">
                <input type="radio" name="receiveChoice" checked={receive === "DELIVERY"} onChange={() => setReceive("DELIVERY")} />
                届けてもらう（送料 {formatYen(listing.shippingYen)}）
              </label>
            )}
            {listing.pickup && (
              <label className="inline-flex items-center gap-2 accent-green-800">
                <input type="radio" name="receiveChoice" checked={receive === "PICKUP"} onChange={() => setReceive("PICKUP")} />
                取りに行く（送料なし）
              </label>
            )}
            {err("receive")}
            {/* 住所が無くて断られたときは、プロフィールへの道を出す */}
            {errors?.receive?.includes("住所") && (
              <Link href="/mypage/profile" className="text-sm text-green-800 underline">プロフィールで住所を登録する</Link>
            )}
          </fieldset>

          <div className="flex flex-col gap-1 rounded-lg bg-stone-50 p-3">
            <label className="inline-flex items-center gap-2 accent-green-800">
              <input type="checkbox" checked={wantAiHelp} onChange={(e) => setWantAiHelp(e.target.checked)} />
              買えなかったときに、AIに代わりの野菜を提案してもらう
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-stone-700">料理名（任意・農家さんには見せません）</span>
              <input className={input} disabled={!wantAiHelp} maxLength={50} value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="例：賀茂茄子の田楽" />
              {wantAiHelp && <span className="text-right text-xs text-stone-400">残り{50 - dishName.length}字</span>}
              {err("dishName")}
            </label>
          </div>

          <button type="button" onClick={goConfirm} className="rounded-full bg-green-800 py-3 font-medium text-white hover:bg-green-900">
            確認する
          </button>
        </>
      ) : (
        <>
          {/* 確認画面（毎回出す。量と金額を強調する） */}
          <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-sm text-stone-600">この内容で申し込みます</p>
            <p className="mt-1 text-lg font-bold">{listing.name}</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{grams !== null && formatKg(grams)}</p>
            <p className="mt-1 text-3xl font-bold text-red-700">{formatYen(item + shipping)}</p>
            <p className="text-sm text-stone-600">
              （野菜 {formatYen(item)}{receive === "DELIVERY" && ` ＋ 送料 ${formatYen(shipping)}`}）
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-stone-800">
              <dt className="text-stone-500">出荷日</dt><dd>{formatYmd(shipDate)}</dd>
              <dt className="text-stone-500">使用日</dt><dd>{formatYmd(useDate)}</dd>
              <dt className="text-stone-500">受け取り</dt><dd>{receive && RECEIVE_LABELS[receive]}</dd>
              {wantAiHelp && (<><dt className="text-stone-500">AIの提案</dt><dd>希望する{dishName && `（料理名：${dishName}）`}</dd></>)}
            </dl>
            <p className="mt-3 text-xs text-stone-500">農家さんが「売ります」と返事をしたら、販売確定になります。まだ売買は決まっていません。</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("input")} disabled={pending} className="flex-1 rounded-full border border-stone-300 bg-white py-3">
              直す
            </button>
            <button type="submit" disabled={pending} className="flex-[2] rounded-full bg-green-800 py-3 font-medium text-white hover:bg-green-900 disabled:opacity-50">
              {pending ? "申し込み中…" : "申し込む"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
