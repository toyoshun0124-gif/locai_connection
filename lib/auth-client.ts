// 画面（ブラウザ）からログイン・登録・ログアウトを呼ぶための道具
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  // 役割・区分・府県を、登録のときに送れるようにする
  plugins: [inferAdditionalFields<typeof auth>()],
});
