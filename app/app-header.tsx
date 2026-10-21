// ログイン後の画面の上に出す帯（誰がログインしているか・ログアウト）
import { BUYER_TYPES, PREFECTURES, ROLES } from "@/lib/options";
import type { CurrentUser } from "@/lib/session";
import { noticeCountFor } from "@/lib/notices";
import { unreadTotalFor } from "@/lib/messages";
import { LogoutButton } from "./logout-button";
import { AppTabs } from "./app-tabs";
import { UserIcon } from "./icons";
import { NoticeBell } from "./notice-bell";
import Link from "next/link";

// 右上のお知らせ（ベル）と下のタブ。最初の数はサーバーで数え、そのあとは画面を移るたびに聞き直す
async function Bell({ user }: { user: CurrentUser }) {
  return <NoticeBell initial={await noticeCountFor(user)} />;
}
async function Tabs({ user }: { user: CurrentUser }) {
  return <AppTabs role={user.role as "BUYER" | "PRODUCER"} initialUnread={await unreadTotalFor(user)} />;
}

export function AppHeader({ user }: { user: CurrentUser }) {
  const roleLabel =
    user.role === "BUYER"
      ? BUYER_TYPES[user.buyerType as keyof typeof BUYER_TYPES]
      : ROLES.PRODUCER;
  return (
    <>
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{user.name} さん</p>
          <p className="text-xs text-zinc-500">
            {roleLabel}・{PREFECTURES[user.prefecture as keyof typeof PREFECTURES]}
          </p>
        </div>
        {/* 右上：お知らせ・プロフィール・ログアウト（メッセージは主要な機能なので、下のタブに置く） */}
        <div className="flex shrink-0 items-center gap-1">
          <Bell user={user} />
          <Link
            href="/mypage/profile"
            title="プロフィール"
            aria-label="プロフィール"
            className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] text-stone-600 hover:bg-white/70 hover:text-green-800"
          >
            <UserIcon size={22} />
            <span>プロフィール</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      {/* タブ（パソコンは左、スマホは下） */}
      <Tabs user={user} />
    </>
  );
}

// 役割が違う人が開いたときの案内（5章「別人」）
export function WrongRoleNotice({ forRole }: { forRole: "BUYER" | "PRODUCER" }) {
  const isBuyerPage = forRole === "BUYER";
  return (
    <div className="mt-6 rounded border border-amber-300 bg-amber-50 p-4">
      <p>{isBuyerPage ? "この画面はお店（購入者）用です。" : "この画面は農家さん（生産者）用です。"}</p>
      <Link href={isBuyerPage ? "/producer" : "/buyer"} className="mt-2 inline-block text-green-700 underline">
        {isBuyerPage ? "生産者用の画面に戻る" : "購入者用の画面に戻る"}
      </Link>
    </div>
  );
}
