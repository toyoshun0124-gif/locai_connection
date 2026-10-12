"use client";
// ログイン・新規登録の画面
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BUYER_TYPES, PREFECTURES, ROLES } from "@/lib/options";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  // 入力した内容（エラーが出ても消さずに残す：5章「空っぽ」）
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<keyof typeof ROLES>("BUYER");
  const [buyerType, setBuyerType] = useState<keyof typeof BUYER_TYPES>("RESTAURANT");
  const [prefecture, setPrefecture] = useState<keyof typeof PREFECTURES | "">("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !prefecture) {
      setError("府県を選んでください");
      return;
    }
    setSending(true); // 2回押しを防ぐ
    const result =
      mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            email,
            password,
            name,
            role,
            // 生産者のときは区分を送らない
            buyerType: role === "BUYER" ? buyerType : undefined,
            prefecture: prefecture as keyof typeof PREFECTURES,
          });
    setSending(false);
    if (result.error) {
      setError(
        mode === "login"
          ? "メールアドレスかパスワードが違います"
          : (result.error.message ?? "登録できませんでした"),
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  const input = "w-full rounded border border-zinc-300 px-3 py-2";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">LocAI 野菜仕入れ</h1>
      <p className="mt-1 text-sm text-green-700">関西（2府4県）限定のサービスです</p>

      {/* ログインと新規登録の切り替え */}
      <div className="mt-6 flex gap-2">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`flex-1 rounded py-2 ${mode === m ? "bg-green-700 text-white" : "bg-zinc-100"}`}
          >
            {m === "login" ? "ログイン" : "新規登録"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <>
            <fieldset>
              <legend className="mb-1 font-medium">使い方</legend>
              {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((r) => (
                <label key={r} className="mr-4 inline-flex items-center gap-1">
                  <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
                  {ROLES[r]}
                </label>
              ))}
            </fieldset>

            {role === "BUYER" && (
              <fieldset>
                <legend className="mb-1 font-medium">区分</legend>
                {(Object.keys(BUYER_TYPES) as (keyof typeof BUYER_TYPES)[]).map((t) => (
                  <label key={t} className="mr-4 inline-flex items-center gap-1">
                    <input type="radio" name="buyerType" checked={buyerType === t} onChange={() => setBuyerType(t)} />
                    {BUYER_TYPES[t]}
                  </label>
                ))}
              </fieldset>
            )}

            <label className="flex flex-col gap-1">
              <span className="font-medium">ニックネーム（本名は使わないでください）</span>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required placeholder={role === "BUYER" ? "例：みかみ" : "例：さかた農園"} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium">府県</span>
              <select className={input} value={prefecture} onChange={(e) => setPrefecture(e.target.value as keyof typeof PREFECTURES)} required>
                <option value="">選んでください</option>
                {(Object.keys(PREFECTURES) as (keyof typeof PREFECTURES)[]).map((p) => (
                  <option key={p} value={p}>{PREFECTURES[p]}</option>
                ))}
              </select>
            </label>
          </>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-medium">メールアドレス</span>
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">パスワード{mode === "signup" && "（8文字以上）"}</span>
          <input
            className={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {/* エラーはテキストとして表示する */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={sending} className="rounded bg-green-700 py-2 font-medium text-white disabled:opacity-50">
          {sending ? "送信中…" : mode === "login" ? "ログイン" : "登録する"}
        </button>
      </form>
    </main>
  );
}
