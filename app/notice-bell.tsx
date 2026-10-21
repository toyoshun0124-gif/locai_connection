"use client";
// 右上のお知らせ（ベル）のボタンと、お知らせの件数（赤い丸の数字）
import Link from "next/link";
import { BellIcon } from "./icons";
import { CountBadge, useLiveCount } from "./count-badge";

export function NoticeBell({ initial }: { initial: number }) {
  const count = useLiveCount("/api/notices", initial);
  return (
    <Link
      href="/notices"
      title="お知らせ"
      aria-label={count > 0 ? `お知らせ（${count}件）` : "お知らせ"}
      className="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] text-stone-600 hover:bg-white/70 hover:text-green-800"
    >
      <BellIcon size={22} />
      {/* スマホの幅（640px より狭い）ではアイコンだけにする */}
      <span className="hidden sm:inline">お知らせ</span>
      <CountBadge count={count} />
    </Link>
  );
}
