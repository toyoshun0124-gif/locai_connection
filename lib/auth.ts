// ログインの仕組み（Better Auth）の設定。サーバー側だけで使う
import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { buyerTypeSchema, prefectureSchema, roleSchema } from "@/lib/options";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // メールアドレスとパスワードでログインする
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    // 登録のときに追加で受け取る項目。Zod でサーバー側でも必ずチェックする
    additionalFields: {
      role: { type: "string", required: true, validator: { input: roleSchema } },
      buyerType: { type: "string", required: false, validator: { input: buyerTypeSchema } },
      prefecture: { type: "string", required: true, validator: { input: prefectureSchema } },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // 役割と区分の組み合わせをチェックする
        before: async (user) => {
          if (user.role === "BUYER" && !user.buyerType) {
            throw new APIError("BAD_REQUEST", { message: "飲食店か一般消費者かを選んでください" });
          }
          if (user.role === "PRODUCER") {
            // 生産者には購入者の区分を持たせない
            return { data: { ...user, buyerType: null } };
          }
        },
      },
      update: {
        // 登録後に役割・区分・府県を書き換えさせない（自分の出品に申し込むなどを防ぐ）
        before: async (data) => {
          if ("role" in data || "buyerType" in data || "prefecture" in data) {
            throw new APIError("FORBIDDEN", { message: "役割・区分・府県は登録後に変更できません" });
          }
        },
      },
    },
  },
  // Server Actions からログインしたときに、ログイン状態（クッキー）を保存する
  plugins: [nextCookies()],
});
