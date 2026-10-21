// お知らせ：返事の期限が近い申し込み・期限が来た申し込み（6章）
// 前はヘッダーの下に黄色の帯で出していた。右上のベルから開く（件数はベルの赤い丸に出る）
import { Suspense } from "react";
import Link from "next/link";
import { noticesFor } from "@/lib/notices";
import { getCurrentUser } from "@/lib/session";
import { softCard } from "@/lib/ui";
import { BellIcon } from "@/app/icons";
import { Spinner } from "@/app/spinner";

export default function NoticesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl">
        <Suspense fallback={<Spinner />}>
          <Notices />
        </Suspense>
      </main>
    </div>
  );
}

async function Notices() {
  const user = await getCurrentUser();
  // 自分の申し込みのお知らせだけ（他人の申し込みは読まない）
  const notices = await noticesFor(user);
  const fmt = (d: Date) => d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <h1 className="mt-6 flex items-center gap-2 text-xl text-green-900">
        <BellIcon size={24} />
        お知らせ
      </h1>

      {notices.length === 0 ? (
        <p className={`mt-3 ${softCard} p-4 text-stone-600`}>いまお知らせはありません。</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {notices.map((n) => (
            <Link
              key={n.kind}
              href={n.href}
              className={`rounded-lg px-3 py-3 font-medium ${n.kind === "soon" ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300" : "bg-stone-100 text-stone-800 ring-1 ring-stone-300"}`}
            >
              {n.kind === "soon" ? "⏰ " : ""}
              {n.text}
              {n.earliest && `（いちばん早い期限：${fmt(n.earliest)}）`} →
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
