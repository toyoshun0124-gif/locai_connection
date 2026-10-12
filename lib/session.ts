// ログインしている人を、サーバー側で確かめるための道具
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// ログインしている人を返す。ログインしていなければログイン画面へ移動させる
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user;
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
