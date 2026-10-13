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
            className={`rounded-lg border px-2 py-2 text-sm disabled:opacity-60 ${current === q ? "border-green-800 bg-green-800 font-bold text-white" : "border-stone-300 bg-white text-stone-700"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {state.message && <p className="mt-1 text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
