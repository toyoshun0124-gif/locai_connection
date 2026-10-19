"use client";
// プロフィールの入力フォーム
import { inputBox } from "@/lib/ui";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, type SaveState } from "./actions";
import Link from "next/link";

type Values = { name: string; city: string; shopKind: string; items: string; policy: string; address: string };

export function ProfileForm({
  role,
  prefectureLabel,
  initial,
  welcome,
}: {
  role: "BUYER" | "PRODUCER";
  prefectureLabel: string;
  initial: Values;
  welcome: boolean;
}) {
  const router = useRouter();
  // 入力した内容は画面側で持っておく（エラーが出ても消えない）
  const [values, setValues] = useState(initial);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveProfile, { ok: false, message: "" });

  // 登録直後の人は、保存できたらトップへ進む
  useEffect(() => {
    if (state.ok && welcome) router.push("/");
  }, [state, welcome, router]);

  const isProducer = role === "PRODUCER";
  const input = inputBox;

  // 1つの入力欄（ラベル・説明・エラー）
  function Field(props: { name: keyof Values; label: string; hint?: string; max: number; multiline?: boolean; placeholder?: string }) {
    const common = {
      name: props.name,
      value: values[props.name],
      maxLength: props.max,
      placeholder: props.placeholder,
      className: input,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues({ ...values, [props.name]: e.target.value }),
    };
    const error = state.errors?.[props.name];
    return (
      <label className="flex flex-col gap-1">
        <span className="font-medium text-stone-800">{props.label}</span>
        {props.hint && <span className="text-xs text-stone-500">{props.hint}</span>}
        {props.multiline ? <textarea rows={3} {...common} /> : <input {...common} />}
        <span className="text-right text-xs text-stone-400">
          {values[props.name].length}/{props.max}
        </span>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </label>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {Field({ name: "name", label: isProducer ? "ニックネームか農園の名前" : "ニックネーム", hint: "本名は使わないでください", max: 30, placeholder: isProducer ? "例：さかた農園" : "例：みかみ" })}

      <div>
        <p className="font-medium text-stone-800">府県</p>
        <p className="text-stone-600">{prefectureLabel}（登録後は変更できません）</p>
      </div>

      {Field({ name: "city", label: "市町村", hint: "公開されます", max: 30, placeholder: isProducer ? "例：南丹市" : "例：大阪市福島区" })}
      {isProducer
        ? Field({ name: "items", label: "取り扱い食材", hint: "公開されます", max: 100, placeholder: "例：賀茂茄子、九条ねぎ" })
        : Field({ name: "shopKind", label: "お店の種類", hint: "公開されます", max: 30, placeholder: "例：小料理屋" })}
      {Field({ name: "policy", label: isProducer ? "こだわり・方針" : "お店の方針", hint: "公開されます", max: 200, multiline: true, placeholder: isProducer ? "例：朝採れをその日に出荷します" : "例：地産地消にこだわり、京野菜を使っています" })}
      {Field({ name: "address", label: "住所", hint: "売買が決まった相手にだけ見せます。それ以外の人には見せません", max: 200, placeholder: "受け渡しに使う住所" })}

      {state.message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="mt-2 rounded-full bg-green-800 py-3 font-medium text-white hover:bg-green-900 disabled:opacity-50">
        {pending ? "保存中…" : "保存する"}
      </button>
      {welcome && (
        <Link href="/" className="text-center text-sm text-stone-600 underline">
          あとで登録する（マイページからいつでも登録できます）
        </Link>
      )}
    </form>
  );
}
