// 農家さんのプロフィール（お店から見る画面）。住所・メールアドレスは見せない（6章ルール4）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PREFECTURES } from "@/lib/options";
import { producerCancelCount } from "@/lib/cancel-count";
import { Spinner } from "@/app/spinner";

export default function ProducerProfilePage({ params }: PageProps<"/producers/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-md px-4 pb-6 lg:max-w-3xl lg:px-8">
        <Suspense fallback={<Spinner />}>
          <ProducerProfile params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function ProducerProfile({ params }: { params: PageProps<"/producers/[id]">["params"] }) {
  // ログインしている人だけが見られる（していなければログイン画面へ）
  await getCurrentUser();
  const { id } = await params;

  // 公開してよい項目だけを取り出す（住所・メールアドレスはそもそも読まない）
  const producer = await prisma.user.findFirst({
    where: { id, role: "PRODUCER" },
    select: {
      name: true,
      prefecture: true,
      profile: { select: { city: true, items: true, policy: true } },
    },
  });
  if (!producer) notFound();

  const cancelCount = await producerCancelCount(id);
  const area = `${PREFECTURES[producer.prefecture]}${producer.profile?.city ?? ""}`;
  return (
    <>
      <div className={`mt-6 ${softCard} p-5`}>
        <h1 className="text-xl text-green-900"><span aria-hidden>🧑‍🌾 </span>{producer.name}</h1>
        <p className="text-sm text-stone-600">{area}</p>
        <dl className="mt-4 flex flex-col gap-3">
          <div>
            <dt className="text-sm text-stone-500">取り扱い食材</dt>
            <dd className="text-stone-800">{producer.profile?.items ?? "まだ登録されていません"}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">こだわり・方針</dt>
            {/* 改行はそのまま見せる。中身はテキストとして表示する */}
            <dd className="whitespace-pre-wrap text-stone-800">{producer.profile?.policy ?? "まだ登録されていません"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-stone-600">販売確定後のキャンセル：{cancelCount}回</p>
      </div>
    </>
  );
}
