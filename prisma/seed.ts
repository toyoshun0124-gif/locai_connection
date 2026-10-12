// デモ用の作り物のユーザーをデータベースに入れる（実在のお店・人の情報は使わない）
// 実行：npx prisma db seed
import { config } from "dotenv";

config({ path: ".env.local" });

// デモ用の共通パスワード（作り物のアカウント専用。本物のパスワードには使わない）
const DEMO_PASSWORD = "demo-pass-1234";

const users = [
  // 購入者（お店・一般の方）
  { email: "mikami@example.com", name: "みかみ", role: "BUYER", buyerType: "RESTAURANT", prefecture: "OSAKA" },
  { email: "kyo-shokudo@example.com", name: "京の食堂", role: "BUYER", buyerType: "RESTAURANT", prefecture: "KYOTO" },
  { email: "kobe-taro@example.com", name: "こうべの家", role: "BUYER", buyerType: "CONSUMER", prefecture: "HYOGO" },
  // 生産者（農家さん）。始めたばかりの農家さんも入れる（6章ルール6の確認用）
  { email: "sakata@example.com", name: "さかた農園", role: "PRODUCER", prefecture: "KYOTO" },
  { email: "yamato-farm@example.com", name: "やまと畑", role: "PRODUCER", prefecture: "NARA" },
  { email: "biwako-shinmai@example.com", name: "びわこ新米ファーム", role: "PRODUCER", prefecture: "SHIGA" },
] as const;

async function main() {
  // ログインの仕組みを通して登録する（パスワードが正しく暗号化されるように）
  const { auth } = await import("../lib/auth");
  const { prisma } = await import("../lib/prisma");

  for (const u of users) {
    // すでに登録済みなら飛ばす（何回実行しても重ならない）
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      console.log(`すでにあります：${u.name}`);
      continue;
    }
    await auth.api.signUpEmail({ body: { ...u, password: DEMO_PASSWORD } });
    console.log(`登録しました：${u.name}（${u.email}）`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
