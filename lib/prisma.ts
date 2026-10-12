// アプリからデータベースを使うための入り口（サーバー側だけで使う）
import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

function createPrisma() {
  // 実行時は、Neon のプーリング経由の接続を使う
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// 開発中にファイルを保存するたび接続が増えないよう、1つを使い回す
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
