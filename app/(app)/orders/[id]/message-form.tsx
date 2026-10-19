"use client";
// メッセージを書いて送るフォーム（200字まで）
import { inputBox } from "@/lib/ui";
import { useActionState, useState } from "react";
import { sendMessage, type SendState } from "./actions";

const MAX = 200;

export function MessageForm({ orderId }: { orderId: string }) {
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState<SendState, FormData>(
    async (prev, formData) => {
      const result = await sendMessage(prev, formData);
      // 送れたら、入力欄を空にする（送れなかったら、書いた内容を残す）
      if (result.ok) setBody("");
      return result;
    },
    { ok: false, message: "" },
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <textarea
        name="body"
        rows={3}
        maxLength={MAX}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="例：受け取りは10時ごろでも大丈夫ですか？"
        className={inputBox}
      />
      <div className="flex items-center justify-between gap-2">
        {/* 上限に近づいたら、残りの字数を目立たせる（5章「過剰」） */}
        <span className={`text-xs ${MAX - body.length <= 20 ? "font-bold text-red-600" : "text-stone-400"}`}>残り{MAX - body.length}字</span>
        <button type="submit" disabled={pending || body.trim() === ""} className="rounded-full bg-green-800 px-5 py-2 text-white hover:bg-green-900 disabled:opacity-50">
          {pending ? "送信中…" : "送る"}
        </button>
      </div>
      {state.message && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
