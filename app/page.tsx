// トップページ：ログインしている人と役割を表示する（ログイン画面の動作確認用）
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BUYER_TYPES, PREFECTURES, ROLES } from "@/lib/options";
import { LogoutButton } from "./logout-button";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      {/* ログイン状態は開くたびに変わるので、読み込み中の表示を出してから中身を入れる */}
      <Suspense fallback={<p>読み込み中…</p>}>
        <UserInfo />
      </Suspense>
    </main>
  );
}

async function UserInfo() {
  // ログイン状態はサーバー側で確かめる
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const user = session.user;
  return (
    <>
      <h1 className="text-2xl font-bold">こんにちは、{user.name} さん</h1>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-zinc-500">役割</dt>
        <dd>{ROLES[user.role as keyof typeof ROLES]}</dd>
        {user.buyerType && (
          <>
            <dt className="text-zinc-500">区分</dt>
            <dd>{BUYER_TYPES[user.buyerType as keyof typeof BUYER_TYPES]}</dd>
          </>
        )}
        <dt className="text-zinc-500">府県</dt>
        <dd>{PREFECTURES[user.prefecture as keyof typeof PREFECTURES]}</dd>
      </dl>
      <LogoutButton />
    </>
  );
}
