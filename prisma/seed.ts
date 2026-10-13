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

// デモ用の出品（作り物）。出荷できる日は「今日から◯日後」で決める
const listings = [
  { email: "sakata@example.com", name: "賀茂茄子", city: "南丹市", pricePerKg: 1200, quantityG: 20000, minOrderG: 1000, unitG: 500, delivery: true, pickup: true, shippingYen: 800, replyDays: 2, days: [3, 6, 10] },
  { email: "sakata@example.com", name: "万願寺唐辛子", city: "南丹市", pricePerKg: 1500, quantityG: 8000, minOrderG: 500, unitG: 500, delivery: true, pickup: false, shippingYen: 800, replyDays: 2, days: [4, 7] },
  { email: "yamato-farm@example.com", name: "大和まな", city: "桜井市", pricePerKg: 900, quantityG: 15000, minOrderG: 1000, unitG: 1000, delivery: true, pickup: true, shippingYen: 1000, replyDays: 3, days: [5] },
  { email: "yamato-farm@example.com", name: "賀茂茄子", city: "桜井市", pricePerKg: 1000, quantityG: 10000, minOrderG: 2000, unitG: 1000, delivery: false, pickup: true, shippingYen: 0, replyDays: 1, days: [2, 9] },
  // 始めたばかりの農家さん（6章ルール6：条件に合えば表示されるかの確認用）
  { email: "biwako-shinmai@example.com", name: "伏見甘長とうがらし", city: "高島市", pricePerKg: 1300, quantityG: 5000, minOrderG: 500, unitG: 500, delivery: true, pickup: true, shippingYen: 600, replyDays: 2, days: [3, 4, 5] },
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

  // デモ用の出品を入れる
  const { addDays, todayInJapan } = await import("../lib/units");
  const today = todayInJapan();
  for (const l of listings) {
    const producer = await prisma.user.findUniqueOrThrow({ where: { email: l.email } });
    const { email, days, ...data } = l;
    void email;
    // 同じ農家さん・同じ商品名の出品がすでにあれば飛ばす（何回実行しても重ならない）
    const exists = await prisma.listing.findFirst({ where: { producerId: producer.id, name: data.name } });
    if (exists) {
      console.log(`すでにあります：${producer.name}の${data.name}`);
      continue;
    }
    await prisma.listing.create({
      data: { ...data, producerId: producer.id, shipDates: days.map((d) => new Date(`${addDays(today, d)}T00:00:00Z`)) },
    });
    console.log(`出品しました：${producer.name}の${data.name}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
