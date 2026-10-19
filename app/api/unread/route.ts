// まだ読んでいないメッセージの数を返す（右上のメッセージのアイコンに出す数。画面を移るたびに聞き直す）
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { unreadTotalFor } from "@/lib/messages";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  // ログインしていない人には、数を教えない
  if (!session) return Response.json({ count: 0 }, { status: 401 });
  const count = await unreadTotalFor(session.user);
  return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
