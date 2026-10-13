// ログイン後の画面の上に出す帯（誰がログインしているか・ログアウト）
import { BUYER_TYPES, PREFECTURES, ROLES } from "@/lib/options";
import type { CurrentUser } from "@/lib/session";
import { LogoutButton } from "./logout-button";
import Link from "next/link";

export function AppHeader({ user }: { user: CurrentUser }) {
  const roleLabel =
    user.role === "BUYER"
      ? BUYER_TYPES[user.buyerType as keyof typeof BUYER_TYPES]
      : ROLES.PRODUCER;
  return (
    <header className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-3">
      <div className="min-w-0">
        <p className="truncate font-bold">{user.name} さん</p>
        <p className="text-xs text-zinc-500">
          {roleLabel}・{PREFECTURES[user.prefecture as keyof typeof PREFECTURES]}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/" className="text-sm text-green-800 underline">トップ</Link>
        <Link href="/mypage/profile" className="text-sm text-green-800 underline">プロフィール</Link>
        <LogoutButton />
      </div>
    </header>
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
