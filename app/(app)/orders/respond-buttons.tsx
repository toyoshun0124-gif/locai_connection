"use client";
// 注文への返事のボタン（農家さん用・三上さん用）
import { useActionState, useState } from "react";
import { respondToOrder, type RespondState } from "./actions";

const btn = "rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50";

// 取り消せない操作の前に、もう一度確かめる
function confirmFirst(message: string) {
  return (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(message)) e.preventDefault();
  };
}

// 農家さん：売る／量を減らす／見送る（見送るは、三上さんの返事待ちの間もできる）
export function ProducerButtons({ orderId, status, minKg }: { orderId: string; status: "PENDING" | "CHANGE_PROPOSED"; minKg: string }) {
  const [state, action, pending] = useActionState<RespondState, FormData>(respondToOrder, { ok: false, message: "" });
  const [reducing, setReducing] = useState(false);
  const [quantity, setQuantity] = useState("");

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      {status === "PENDING" && !reducing && (
        <div className="flex flex-wrap gap-2">
          <button name="action" value="sell" disabled={pending} className={`${btn} bg-green-800 text-white`} onClick={confirmFirst("この申し込みに「売ります」と返事をします。販売確定になります。よろしいですか？")}>
            売る
          </button>
          <button type="button" disabled={pending} className={`${btn} border border-green-800 text-green-900`} onClick={() => setReducing(true)}>
            量を減らす
          </button>
          <button name="action" value="decline" disabled={pending} className={`${btn} border border-stone-300 text-stone-700`} onClick={confirmFirst("この申し込みを見送ります。元に戻せません。よろしいですか？")}>
            見送る
          </button>
        </div>
      )}
      {status === "PENDING" && reducing && (
        <div className="flex flex-col gap-2 rounded-lg bg-stone-50 p-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>売れる量（kg・{minKg}kg以上）</span>
            <input name="quantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2" placeholder="例：2" />
          </label>
          <p className="text-xs text-stone-500">お店が「この量でOK」と返事をしたら、販売確定になります。減らした分は、ほかのお店が申し込めるようになります。</p>
          <div className="flex gap-2">
            <button type="button" className={`${btn} border border-stone-300`} onClick={() => setReducing(false)}>やめる</button>
            <button name="action" value="reduce" disabled={pending} className={`${btn} bg-green-800 text-white`}>この量で返事する</button>
          </div>
        </div>
      )}
      {status === "CHANGE_PROPOSED" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-amber-900">お店の返事を待っています</span>
          <button name="action" value="decline" disabled={pending} className={`${btn} border border-stone-300 text-stone-700`} onClick={confirmFirst("この申し込みを見送ります。元に戻せません。よろしいですか？")}>
            見送る
          </button>
        </div>
      )}
      {state.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}

// 三上さん：減らした量でOK／取り消す
export function BuyerButtons({ orderId, status }: { orderId: string; status: "PENDING" | "CHANGE_PROPOSED" | "CONFIRMED" }) {
  const [state, action, pending] = useActionState<RespondState, FormData>(respondToOrder, { ok: false, message: "" });
  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex flex-wrap gap-2">
        {status === "CHANGE_PROPOSED" && (
          <button name="action" value="accept" disabled={pending} className={`${btn} bg-green-800 text-white`} onClick={confirmFirst("この量で申し込みます。販売確定になります。よろしいですか？")}>
            この量でOK
          </button>
        )}
        <button
          name="action"
          value="cancel"
          disabled={pending}
          className={`${btn} border border-stone-300 text-stone-700`}
          onClick={confirmFirst(
            status === "CONFIRMED"
              ? "販売確定した申し込みを取り消します。あなたの「販売確定後のキャンセルの回数」に1回記録され、農家さんから見えるようになります。元に戻せません。よろしいですか？"
              : "この申し込みを取り消します。元に戻せません。よろしいですか？",
          )}
        >
          {status === "CHANGE_PROPOSED" ? "やめる" : status === "CONFIRMED" ? "販売確定を取り消す" : "取り消す"}
        </button>
      </div>
      {state.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}

// 農家さん：販売確定のあとの取消（回数に記録されると伝える）
export function ProducerCancelButton({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<RespondState, FormData>(respondToOrder, { ok: false, message: "" });
  return (
    <form action={action} className="mt-2 flex flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <button
        name="action"
        value="producerCancel"
        disabled={pending}
        className={`${btn} self-start border border-stone-300 text-stone-700`}
        onClick={confirmFirst("販売確定した申し込みを取り消します。あなたの「販売確定後のキャンセルの回数」に1回記録され、お店から見えるようになります。取り消した量は、ほかのお店に売り直せません。よろしいですか？")}
      >
        販売確定を取り消す
      </button>
      {state.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
