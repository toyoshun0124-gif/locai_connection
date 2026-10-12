// Prisma の設定ファイル（Prisma 7 では接続先をここに書く）
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// 秘密の値は .env.local から読み込む
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // サンプルデータを入れるコマンド（server-only の部品を読めるようにする設定付き）
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    // 表を作る・変える（マイグレーション）ときは、直接接続を使う
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
