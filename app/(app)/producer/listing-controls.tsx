"use client";
// 自分の出品の「量を減らす（市場に出す）」「出品を終わりにする」のボタン
import { useActionState, useState } from "react";
import { closeListing, reduceListing, type ListingControlState } from "./listings/actions";

const btn = "rounded-full px-3 py-1.5 text-sm disabled:opacity-50";

export function ListingControls({ listingId, remainingKg, holdCount }: { listingId: string; remainingKg: string; holdCount: number }) {
  const [reduceState, reduceAction, reducing] = useActionState<ListingControlState, FormData>(reduceListing, { ok: false, message: "" });
  const [closeState, closeAction, closing] = useActionState<ListingControlState, FormData>(closeListing, { ok: false, message: "" });
  const [open, setOpen] = useState(false);
  const [kg, setKg] = useState("");

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
      {!open ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${btn} border border-green-800 text-green-900`} onClick={() => setOpen(true)}>
            量を減らす（市場に出す）
          </button>
          <form action={closeAction}>
            <input type="hidden" name="listingId" value={listingId} />
            <button
              disabled={closing}
              className={`${btn} border border-stone-300 text-stone-700`}
              onClick={(e) => {
                const note = holdCount > 0 ? `\n返事待ちの申し込み（${holdCount}件）は残ります。これまでどおり返事をしてください。` : "";
                if (!window.confirm(`この出品を終わりにします。新しい申し込みは来なくなります。元に戻せません。${note}\nよろしいですか？`)) e.preventDefault();
              }}
            >
              出品を終わりにする
            </button>
          </form>
        </div>
      ) : (
        <form action={reduceAction} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-3">
          <input type="hidden" name="listingId" value={listingId} />
          <label className="flex flex-col gap-1 text-sm">
            <span>減らす量（kg）：残り {remainingKg}kg まで</span>
            <input name="reduceKg" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2" placeholder="例：5" />
          </label>
          <p className="text-xs text-stone-500">販売確定と返事待ちの分は減らせません。減らした分は、お店から申し込めなくなります。</p>
          <div className="flex gap-2">
            <button type="button" className={`${btn} border border-stone-300`} onClick={() => setOpen(false)}>やめる</button>
            <button disabled={reducing || kg.trim() === ""} className={`${btn} bg-green-800 text-white`}>
              {reducing ? "減らしています…" : "この量を減らす"}
            </button>
          </div>
        </form>
      )}
      {reduceState.message && <p className={`text-sm ${reduceState.ok ? "text-green-800" : "text-red-600"}`}>{reduceState.message}</p>}
      {closeState.message && <p className={`text-sm ${closeState.ok ? "text-green-800" : "text-red-600"}`}>{closeState.message}</p>}
    </div>
  );
}
