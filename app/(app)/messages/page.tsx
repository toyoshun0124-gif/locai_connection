// メッセージの一覧：誰から・どの食材の取引か・まだ読んでいない数・回答期限（返事待ちのときだけ）
// 押すと、その取引の画面（メッセージのやり取り）へ移る
import { Suspense } from "react";
import Link from "next/link";
import { conversationsFor } from "@/lib/messages";
import { getCurrentUser } from "@/lib/session";
import { liftOnHover, softCard } from "@/lib/ui";
import { ChatIcon } from "@/app/icons";
import { Spinner } from "@/app/spinner";

export default function MessagesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl">
        <Suspense fallback={<Spinner />}>
          <Messages />
        </Suspense>
      </main>
    </div>
  );
}

async function Messages() {
  const user = await getCurrentUser();
  // 自分が関わる取引だけ（他人の取引は読まない）
  const list = await conversationsFor(user);
  const fmt = (d: Date) =>
    d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <h1 className="mt-6 flex items-center gap-2 text-xl text-green-900">
        <ChatIcon size={24} />
        メッセージ
      </h1>

      {list.length === 0 ? (
        <p className={`mt-3 ${softCard} p-4 text-stone-600`}>まだメッセージはありません。</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {list.map((c) => (
            <li key={c.orderId}>
              <Link href={`/orders/${c.orderId}`} className={`${softCard} ${liftOnHover} flex items-center gap-3 p-4`}>
                <span className="min-w-0 flex-1">
                  <span className="font-heading block truncate text-lg">{c.partnerName} さん</span>
                  <span className="block text-sm text-stone-600">{c.item}の取引</span>
                  {c.replyDeadline ? (
                    <span className="mt-0.5 block text-sm font-medium text-sky-900">回答期限：{fmt(c.replyDeadline)}</span>
                  ) : (
                    <span className="mt-0.5 block text-xs text-stone-400">回答期限：—</span>
                  )}
                </span>
                {/* まだ読んでいない数（読んだら消える） */}
                {c.unread > 0 && (
                  <span aria-label={`まだ読んでいない ${c.unread}件`} className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-red-600 px-2 text-sm font-bold text-white">
                    {c.unread}
                  </span>
                )}
                <span aria-hidden className="shrink-0 text-lg text-green-800">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
