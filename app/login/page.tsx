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

  // 入力欄の見た目（畑・自然のあたたかさ：生成り色と深い緑）
  const input =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-green-800 focus:outline-none focus:ring-2 focus:ring-green-800/20";

  return (
    // 背景は生成り色（うすいベージュ）
    <div className="flex flex-1 flex-col bg-[#f6f1e7]">
      <main className="mx-auto w-full max-w-md px-4 py-10">
        {/* アプリの名前と、関西限定であること */}
        <div className="text-center">
          <p className="text-4xl" aria-hidden>🥬</p>
          <h1 className="mt-2 text-2xl font-bold text-green-900">LocAI 野菜仕入れ</h1>
          <p className="mt-1 text-sm text-stone-600">関西の農家さんとお店を、必要な量でつなぐ</p>
          <p className="mt-2 inline-block rounded-full bg-green-900/10 px-3 py-0.5 text-xs text-green-900">
            関西（2府4県）限定
          </p>
        </div>

        {/* 白いカードの中に入力欄をまとめる */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          {/* ログインと新規登録の切り替え */}
          <div className="flex gap-1 rounded-full bg-stone-100 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 rounded-full py-2 text-sm font-medium ${mode === m ? "bg-green-800 text-white shadow-sm" : "text-stone-600"}`}
              >
                {m === "login" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <fieldset>
                  <legend className="mb-1 font-medium text-stone-800">使い方</legend>
                  {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((r) => (
                    <label key={r} className="mr-4 inline-flex items-center gap-1 text-stone-700 accent-green-800">
                      <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
                      {ROLES[r]}
                    </label>
                  ))}
                </fieldset>

                {role === "BUYER" && (
                  <fieldset>
                    <legend className="mb-1 font-medium text-stone-800">区分</legend>
                    {(Object.keys(BUYER_TYPES) as (keyof typeof BUYER_TYPES)[]).map((t) => (
                      <label key={t} className="mr-4 inline-flex items-center gap-1 text-stone-700 accent-green-800">
                        <input type="radio" name="buyerType" checked={buyerType === t} onChange={() => setBuyerType(t)} />
                        {BUYER_TYPES[t]}
                      </label>
                    ))}
                  </fieldset>
                )}

                <label className="flex flex-col gap-1">
                  <span className="font-medium text-stone-800">ニックネーム（本名は使わないでください）</span>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required placeholder={role === "BUYER" ? "例：みかみ" : "例：さかた農園"} />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-medium text-stone-800">府県</span>
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
              <span className="font-medium text-stone-800">メールアドレス</span>
              <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium text-stone-800">パスワード{mode === "signup" && "（8文字以上）"}</span>
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
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={sending} className="mt-2 rounded-full bg-green-800 py-3 font-medium text-white hover:bg-green-900 disabled:opacity-50">
              {sending ? "送信中…" : mode === "login" ? "ログイン" : "登録する"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-stone-500">
          ニックネームで使えます。住所はお店と農家さんの売買が決まるまで見せません。
        </p>
      </main>
    </div>
  );
}
