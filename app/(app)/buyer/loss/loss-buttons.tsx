"use client";
// ロスを記録する4つのボタン（押したものが選ばれた状態になる。あとで押し直せる）
import { useActionState } from "react";
import { LOSS_LABELS } from "@/lib/loss";
import { recordLoss, type LossState } from "./actions";

export function LossButtons({ orderId, current }: { orderId: string; current: number | null }) {
  const [state, action, pending] = useActionState<LossState, FormData>(recordLoss, { message: "" });
  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {LOSS_LABELS.map((label, q) => (
          <button
            key={label}
            name="quarters"
            value={q}
            disabled={pending}
            aria-pressed={current === q}
            // マウスを乗せたら色が変わる（押せることが分かるように）。押したあとは、終わるまで押せない
            className={`cursor-pointer rounded-xl border px-2 py-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40 disabled:cursor-wait disabled:opacity-60 ${
              current === q
                ? "border-green-800 bg-green-800 font-bold text-white hover:bg-green-900"
                : "border-stone-300 bg-white text-stone-700 hover:border-green-700 hover:bg-green-50 hover:text-green-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* 押したあと、記録が終わるまでの間に出す（固まったと思わせないように） */}
      {pending && <p className="mt-1 text-sm text-green-800">記録しています…</p>}
      {state.message && <p className="mt-1 text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
