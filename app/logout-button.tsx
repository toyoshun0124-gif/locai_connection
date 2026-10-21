"use client";
// ログアウトのボタン
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogoutIcon } from "./icons";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      title="ログアウト"
      aria-label="ログアウト"
      className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] text-stone-600 hover:bg-white/70 hover:text-green-800"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <LogoutIcon size={22} />
      {/* スマホの幅（640px より狭い）ではアイコンだけにする */}
      <span className="hidden sm:inline">ログアウト</span>
    </button>
  );
}
