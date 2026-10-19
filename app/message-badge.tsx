"use client";
// 右上のメッセージのアイコンと、まだ読んでいない数（丸の中の数字）
// ヘッダーは画面を移っても作り直さないので、数だけは画面を移るたびに聞き直す
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon } from "./icons";

export function MessageBadge({ initial }: { initial: number }) {
  const path = usePathname();
  const [unread, setUnread] = useState(initial);

  useEffect(() => {
    let alive = true;
    fetch("/api/unread", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setUnread(d.count))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [path]);

  return (
    <Link
      href="/messages"
      title="メッセージ"
      aria-label={unread > 0 ? `メッセージ（まだ読んでいない ${unread}件）` : "メッセージ"}
      className="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] text-stone-600 hover:bg-white/70 hover:text-green-800"
    >
      <ChatIcon size={22} />
      <span>メッセージ</span>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
