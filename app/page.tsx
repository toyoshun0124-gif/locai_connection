// トップページ：ログインした人を、役割に合った画面へ振り分ける
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default function Home() {
  return (
    <Suspense fallback={<p className="p-4">読み込み中…</p>}>
      <RedirectByRole />
    </Suspense>
  );
}

async function RedirectByRole() {
  const user = await getCurrentUser();
  redirect(user.role === "PRODUCER" ? "/producer" : "/buyer");
  return null;
}
