// ログイン後の画面の上に出す帯（誰がログインしているか・ログアウト）
import { BUYER_TYPES, PREFECTURES, ROLES } from "@/lib/options";
import type { CurrentUser } from "@/lib/session";
import { noticesFor } from "@/lib/notices";
import { unreadTotalFor } from "@/lib/messages";
import { LogoutButton } from "./logout-button";
import { AppTabs } from "./app-tabs";
import { UserIcon } from "./icons";
import { MessageBadge } from "./message-badge";
import Link from "next/link";

// 画面の上に出す、期限のお知らせ（6章）
async function Notices({ user }: { user: CurrentUser }) {
  const notices = await noticesFor(user);
  if (notices.length === 0) return null;
  const fmt = (d: Date) => d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mt-3 flex flex-col gap-2">
      {notices.map((n) => (
        <Link
          key={n.kind}
          href={n.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${n.kind === "soon" ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300" : "bg-stone-100 text-stone-800 ring-1 ring-stone-300"}`}
        >
          {n.kind === "soon" ? "⏰ " : ""}
          {n.text}
          {n.earliest && `（いちばん早い期限：${fmt(n.earliest)}）`} →
        </Link>
      ))}
    </div>
  );
}

// 右上のメッセージのアイコン。最初の数はサーバーで数え、そのあとは画面を移るたびに聞き直す
async function MessageButton({ user }: { user: CurrentUser }) {
  return <MessageBadge initial={await unreadTotalFor(user)} />;
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
        {/* 右上：メッセージ・プロフィール・ログアウト（「トップ」はタブの「ホーム」と同じなので置かない） */}
        <div className="flex shrink-0 items-center gap-1">
          <MessageButton user={user} />
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
      <Notices user={user} />
      {/* タブ（パソコンは左、スマホは下） */}
      <AppTabs role={user.role as "BUYER" | "PRODUCER"} />
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
