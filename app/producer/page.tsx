// 生産者（坂田さんなど）のログイン後の画面：出品と、届いた申し込み（4章B）
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { AppHeader, WrongRoleNotice } from "../app-header";

export default function ProducerPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Suspense fallback={<p>読み込み中…</p>}>
        <ProducerHome />
      </Suspense>
    </main>
  );
}

async function ProducerHome() {
  const user = await getCurrentUser();
  // 購入者が開いたら、中身を見せずに案内だけ出す
  if (user.role !== "PRODUCER") {
    return (
      <>
        <AppHeader user={user} />
        <WrongRoleNotice forRole="PRODUCER" />
      </>
    );
  }

  return (
    <>
      <AppHeader user={user} />

      {/* 届いた申し込み（4章B④：申し込んだ順に並べる） */}
      <section className="mt-6">
        <h1 className="text-xl font-bold">届いた申し込み</h1>
        <p className="mt-2 rounded bg-zinc-50 p-4 text-zinc-600">
          まだ申し込みはありません。（申し込みの一覧は、申し込みの機能と一緒に作ります）
        </p>
      </section>

      {/* 自分の出品（4章B②） */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">自分の出品</h2>
          <button type="button" disabled className="rounded bg-green-700 px-4 py-2 text-white opacity-50">
            出品する（準備中）
          </button>
        </div>
        <p className="mt-2 rounded bg-zinc-50 p-4 text-zinc-600">
          まだ出品はありません。（出品の画面は、次のステップで作ります）
        </p>
      </section>
    </>
  );
}
