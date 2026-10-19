// ログインしている人を、サーバー側で確かめるための道具
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// ログインしている人を返す。ログインしていなければログイン画面へ移動させる
// 1回の表示の中では、何回呼んでも確認は1回だけ（cache）
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user;
});

// ニックネームなどを変えたあとに、覚えておいたログインの情報を新しくする
export async function refreshSessionCache() {
  await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
