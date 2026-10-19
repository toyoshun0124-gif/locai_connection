// ログイン後の画面に共通の枠：ヘッダー（上の帯）とタブは、画面を移っても作り直さない
// 真ん中（各画面の中身）だけが入れかわり、読み込み中はスピナーを出す
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "../app-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl px-4 pt-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl">
        {/* ヘッダーの読み込み中は、同じ高さの空きを取っておく（画面がガタつかないように） */}
        <Suspense fallback={<div className="h-[61px] border-b border-zinc-200" />}>
          <SessionHeader />
        </Suspense>
      </div>
      {children}
    </div>
  );
}

async function SessionHeader() {
  const user = await getCurrentUser();
  // 名前だけは、データベースから新しいものを読む（ニックネームを変えたあと、すぐヘッダーに出るように）
  // ヘッダーは画面を移っても作り直さないので、この問い合わせは表示し直すときだけ
  const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
  return <AppHeader user={{ ...user, name: fresh?.name ?? user.name }} />;
}
