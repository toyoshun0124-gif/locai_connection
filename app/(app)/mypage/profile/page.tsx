// マイページ：自分のプロフィールの登録・修正（スキップもできる）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PREFECTURES } from "@/lib/options";
import { ProfileForm } from "./profile-form";
import { Spinner } from "@/app/spinner";

export default function ProfilePage({ searchParams }: PageProps<"/mypage/profile">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl">
        <Suspense fallback={<Spinner />}>
          <ProfileContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function ProfileContent({ searchParams }: { searchParams: PageProps<"/mypage/profile">["searchParams"] }) {
  const user = await getCurrentUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  // 新規登録の直後かどうか（「あとで登録する」を出すため）
  const welcome = (await searchParams).welcome === "1";

  return (
    <>
      <h1 className="mt-6 text-xl text-green-900"><span aria-hidden>👤 </span>プロフィール</h1>
      {welcome && (
        <p className="mt-1 text-sm text-stone-600">
          登録すると、{user.role === "PRODUCER" ? "お店に「この農家さんから買いたい」" : "農家さんに「このお店に売りたい」"}と思ってもらいやすくなります。
        </p>
      )}
      <div className={`mt-4 ${softCard} p-5`}>
        <ProfileForm
          role={user.role as "BUYER" | "PRODUCER"}
          prefectureLabel={PREFECTURES[user.prefecture as keyof typeof PREFECTURES]}
          welcome={welcome}
          initial={{
            name: user.name,
            city: profile?.city ?? "",
            shopKind: profile?.shopKind ?? "",
            items: profile?.items ?? "",
            policy: profile?.policy ?? "",
            address: profile?.address ?? "",
          }}
        />
      </div>
    </>
  );
}
