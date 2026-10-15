// 発表のデモ用：三上さん（みかみ）の「ロスの記録」に、作り物の記録を入れる／消す
// 入れる：npm run demo:loss:add
// 消す　：npm run demo:loss:remove
// 出品は「過去の記録用」の農家さんの、終わった出品を使う（坂田さんたちの画面を散らかさないため）
import { config } from "dotenv";

config({ path: ".env.local" });

const KEY = "demo-loss-"; // この文字で始まる注文だけを、入れる・消すの対象にする

// 作り物の記録：食材・量（g）・使用日（何日前）・余った割合（0〜3。null はまだ記録していない）
const records = [
  { item: "賀茂茄子", grams: 3000, daysAgo: 20, quarters: 1 },
  { item: "賀茂茄子", grams: 3000, daysAgo: 16, quarters: 2 },
  { item: "賀茂茄子", grams: 2500, daysAgo: 13, quarters: 1 },
  { item: "賀茂茄子", grams: 2000, daysAgo: 9, quarters: 0 },
  { item: "万願寺唐辛子", grams: 1500, daysAgo: 12, quarters: 2 },
  { item: "万願寺唐辛子", grams: 1000, daysAgo: 6, quarters: 1 },
  // デモでボタンを押して見せる用（昨日が使用日で、まだ記録していない）
  { item: "賀茂茄子", grams: 2000, daysAgo: 1, quarters: null },
];

async function main() {
  const { prisma } = await import("../lib/prisma");
  const mode = process.argv[2];

  if (mode === "remove") {
    const d = await prisma.order.deleteMany({ where: { idempotencyKey: { startsWith: KEY } } });
    console.log(`ロスの記録（作り物）を消しました：${d.count}件`);
  } else if (mode === "add") {
    const exists = await prisma.order.count({ where: { idempotencyKey: { startsWith: KEY } } });
    if (exists > 0) {
      console.log(`すでに入っています（${exists}件）。入れ直すときは、先に npm run demo:loss:remove を実行してください`);
    } else {
      const mikami = await prisma.user.findUniqueOrThrow({ where: { email: "mikami@example.com" } });
      const day = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
      const dateOnly = (d: Date) => new Date(`${d.toISOString().slice(0, 10)}T00:00:00Z`);
      for (const [i, r] of records.entries()) {
        // 過去の記録用の農家さんの、終わった出品を使う
        const listing = await prisma.listing.findFirstOrThrow({
          where: { name: r.item, status: "CLOSED", producer: { email: { startsWith: "history-" } } },
          orderBy: { createdAt: "desc" },
        });
        const item = Math.floor((listing.pricePerKg * r.grams) / 1000);
        await prisma.order.create({
          data: {
            listingId: listing.id, buyerId: mikami.id, status: "CONFIRMED", quantityG: r.grams,
            shipDate: dateOnly(day(r.daysAgo + 1)), useDate: dateOnly(day(r.daysAgo)), receive: "DELIVERY",
            pricePerKg: listing.pricePerKg, itemYen: item, shippingYen: listing.shippingYen, totalYen: item + listing.shippingYen,
            replyDeadline: day(r.daysAgo + 3), idempotencyKey: `${KEY}${i}`, createdAt: day(r.daysAgo + 4),
            lossQuarters: r.quarters, lossRecordedAt: r.quarters === null ? null : day(r.daysAgo),
          },
        });
      }
      console.log(`ロスの記録（作り物）を入れました：${records.length}件（うち1件は、まだ記録していない状態）`);
    }
  } else {
    console.log("使い方：npm run demo:loss:add（入れる）／ npm run demo:loss:remove（消す）");
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
