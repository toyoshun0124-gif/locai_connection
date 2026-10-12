// Prisma の設定ファイル（Prisma 7 では接続先をここに書く）
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// 秘密の値は .env.local から読み込む
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 表を作る・変える（マイグレーション）ときは、直接接続を使う
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
