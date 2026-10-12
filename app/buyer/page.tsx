// 購入者（三上さんなど）のログイン後の画面：食材名で探す（4章A②）
import { Suspense } from "react";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { AppHeader, WrongRoleNotice } from "../app-header";

// 食材名のチェック：前後の空白を除いて1〜50文字
const keywordSchema = z.string().trim().min(1).max(50);

export default function BuyerPage({ searchParams }: PageProps<"/buyer">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Suspense fallback={<p>読み込み中…</p>}>
        <BuyerHome searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function BuyerHome({ searchParams }: { searchParams: PageProps<"/buyer">["searchParams"] }) {
  const user = await getCurrentUser();
  // 生産者が開いたら、中身を見せずに案内だけ出す
  if (user.role !== "BUYER") {
    return (
      <>
        <AppHeader user={user} />
        <WrongRoleNotice forRole="BUYER" />
      </>
    );
  }

  const { q } = await searchParams;
  const raw = typeof q === "string" ? q : undefined;
  const keyword = raw === undefined ? undefined : keywordSchema.safeParse(raw);

  return (
    <>
      <AppHeader user={user} />

      {/* 食材を探す（食材名だけ必須） */}
      <section className="mt-6">
        <h1 className="text-xl font-bold">野菜を探す</h1>
        <p className="text-sm text-green-700">関西の農家さんの出品から探せます</p>
        <form action="/buyer" method="get" className="mt-3 flex gap-2">
          <input
            name="q"
            defaultValue={raw ?? ""}
            maxLength={50}
            required
            placeholder="食材名（例：万願寺唐辛子）"
            className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2"
          />
          <button type="submit" className="shrink-0 rounded bg-green-700 px-4 py-2 text-white">
            探す
          </button>
        </form>
        {keyword && !keyword.success && (
          <p className="mt-1 text-sm text-red-600">食材名を入力してください（50文字まで）</p>
        )}
        {keyword?.success && (
          <p className="mt-4 rounded bg-zinc-50 p-4 text-zinc-600">
            「{keyword.data}」の出品は、まだありません。（出品の一覧は、次のステップで作ります）
          </p>
        )}
      </section>

      {/* 自分の注文（4章A⑤） */}
      <section className="mt-8">
        <h2 className="text-lg font-bold">自分の注文</h2>
        <p className="mt-2 rounded bg-zinc-50 p-4 text-zinc-600">
          まだ申し込みはありません。（注文の一覧は、申し込みの機能と一緒に作ります）
        </p>
      </section>
    </>
  );
}
