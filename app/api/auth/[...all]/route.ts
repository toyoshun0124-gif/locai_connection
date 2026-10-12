// ログイン・登録・ログアウトの受付窓口（Better Auth に任せる）
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
