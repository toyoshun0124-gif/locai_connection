"use client";
// ログアウトのボタン
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-6 rounded border border-zinc-300 px-4 py-2"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      ログアウト
    </button>
  );
}
