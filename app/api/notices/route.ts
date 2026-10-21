// お知らせの件数を返す（右上のベルに出す数。画面を移るたびに聞き直す）
// 件数は、お知らせに出ている申し込みの数を足したもの
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { noticeCountFor } from "@/lib/notices";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  // ログインしていない人には、数を教えない
  if (!session) return Response.json({ count: 0 }, { status: 401 });
  const count = await noticeCountFor(session.user);
  return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
