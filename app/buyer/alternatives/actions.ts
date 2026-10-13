"use server";
// 代わりの野菜の提案（AI）＋ その野菜の出品探し（アプリの決まり）
import { z } from "zod";
import { suggestAlternatives } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PREFECTURES } from "@/lib/options";
import { isOrderableShipDate } from "@/lib/order";
import { canOrder, remainingGramsMap } from "@/lib/stock";
import { dateToYmd, kgTextToGrams, todayInJapan } from "@/lib/units";

export type FoundListing = {
  id: string; name: string; area: string; producerName: string;
  pricePerKg: number; remainingG: number; minOrderG: number; unitG: number; firstShip: string;
};
export type SuggestState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "failed" } // AI の答えが使えなかった
  | { status: "notDish" } // 料理名が料理の名前ではなかった
  | { status: "ok"; suggestions: { name: string; reason: string; listings: FoundListing[] }[] };

const inputSchema = z.object({
  item: z.string().trim().min(1, "買えなかった野菜を入力してください").max(30, "野菜の名前は30文字までです"),
  dishName: z.string().trim().max(50, "料理名は50文字までです"),
  kg: z.string().trim().max(10),
  useDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
});

export async function suggest(_prev: SuggestState, formData: FormData): Promise<SuggestState> {
  const user = await getCurrentUser();
  if (user.role !== "BUYER") return { status: "error", message: "この機能はお店（購入者）用です" };

  const parsed = inputSchema.safeParse({
    item: formData.get("item") ?? "",
    dishName: formData.get("dishName") ?? "",
    kg: formData.get("kg") ?? "",
    useDate: formData.get("useDate") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const v = parsed.data;
  const wantG = v.kg ? kgTextToGrams(v.kg) : null;
  if (v.kg && wantG === null) return { status: "error", message: "量は 0.1kg 単位の数字で入力してください（例：1.5）" };

  // ① AI に提案してもらう（渡すのは、食材・料理名・量・使用日だけ）
  const answer = await suggestAlternatives({ item: v.item, dishName: v.dishName || null, kg: v.kg || null, useDate: v.useDate || null });
  if (!answer) return { status: "failed" };
  if (!answer.isDish && v.dishName) return { status: "notDish" };
  if (answer.suggestions.length === 0) return { status: "failed" };

  // ② 提案された野菜の出品を、アプリの決まりで探す（申し込める出品だけ・新しい順・3件まで）
  const today = todayInJapan();
  const suggestions = [];
  for (const s of answer.suggestions) {
    const rows = await prisma.listing.findMany({
      where: { status: "OPEN", name: { contains: s.name, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true, name: true, city: true, pricePerKg: true, quantityG: true, minOrderG: true, unitG: true, shipDates: true,
        producer: { select: { name: true, prefecture: true } },
      },
    });
    const remaining = await remainingGramsMap(rows);
    const listings: FoundListing[] = rows
      .map((l) => ({ l, dates: l.shipDates.map(dateToYmd).filter((d) => isOrderableShipDate(d, today)), remainingG: remaining.get(l.id) ?? 0 }))
      .filter(({ l, dates, remainingG }) => dates.length > 0 && remainingG >= l.minOrderG && (wantG === null || canOrder(l, remainingG, wantG)))
      .slice(0, 3)
      .map(({ l, dates, remainingG }) => ({
        id: l.id, name: l.name, area: `${PREFECTURES[l.producer.prefecture]}${l.city}`, producerName: l.producer.name,
        pricePerKg: l.pricePerKg, remainingG, minOrderG: l.minOrderG, unitG: l.unitG, firstShip: dates[0],
      }));
    suggestions.push({ name: s.name, reason: s.reason, listings });
  }
  return { status: "ok", suggestions };
}
