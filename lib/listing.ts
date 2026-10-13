// 出品の入力ルール（サーバーで必ずチェックする）
import { z } from "zod";
import { addDays, kgTextToGrams, todayInJapan } from "@/lib/units";

// 出荷できる日として選べる範囲：明日から3週間先まで
export const SHIP_DATE_FROM_DAYS = 1;
export const SHIP_DATE_TO_DAYS = 21;

// 上限（多すぎる入力を防ぐ。範囲内なら多くても断らない）
const MAX_QUANTITY_G = 1_000_000; // 1000kg
const MAX_PRICE_PER_KG = 100_000; // 円
const MAX_SHIPPING_YEN = 10_000; // 円

const kg = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}を入力してください`)
    .transform((v, ctx) => {
      const g = kgTextToGrams(v);
      if (g === null || g <= 0) {
        ctx.addIssue({ code: "custom", message: `${label}は 0.1kg 単位の数字で入力してください（例：1.5）` });
        return z.NEVER;
      }
      if (g > MAX_QUANTITY_G) {
        ctx.addIssue({ code: "custom", message: `${label}は 1000kg までです` });
        return z.NEVER;
      }
      return g;
    });

const yen = (label: string, max: number, min: number) =>
  z
    .string()
    .trim()
    .min(1, `${label}を入力してください`)
    .regex(/^\d+$/, `${label}は整数（円）で入力してください`)
    .transform(Number)
    .refine((n) => n >= min && n <= max, `${label}は ${min}〜${max.toLocaleString()} 円で入力してください`);

export const listingSchema = z
  .object({
    name: z.string().trim().min(1, "商品名を入力してください").max(30, "商品名は30文字までです"),
    city: z.string().trim().min(1, "産地（市町村）を入力してください").max(30, "産地は30文字までです"),
    pricePerKg: yen("値段", MAX_PRICE_PER_KG, 1),
    quantityG: kg("量"),
    minOrderG: kg("いちばん少ない注文量"),
    unitG: kg("注文の単位"),
    delivery: z.boolean(),
    pickup: z.boolean(),
    shippingYen: z.string().trim(),
    replyDays: z.enum(["1", "2", "3"], "回答期限を選んでください").transform(Number),
    shipDates: z.array(z.string()).min(1, "出荷できる日を1日以上選んでください"),
  })
  .superRefine((v, ctx) => {
    // 受け取り条件は1つ以上
    if (!v.delivery && !v.pickup) {
      ctx.addIssue({ code: "custom", path: ["receive"], message: "受け取り条件を1つ以上選んでください" });
    }
    // 単位・最低注文量・量のつじつま
    if (v.minOrderG < v.unitG) {
      ctx.addIssue({ code: "custom", path: ["minOrderG"], message: "いちばん少ない注文量は、注文の単位以上にしてください" });
    } else if (v.minOrderG % v.unitG !== 0) {
      ctx.addIssue({ code: "custom", path: ["minOrderG"], message: "いちばん少ない注文量は、注文の単位で割り切れる量にしてください" });
    }
    if (v.quantityG < v.minOrderG) {
      ctx.addIssue({ code: "custom", path: ["quantityG"], message: "量は、いちばん少ない注文量以上にしてください" });
    }
    // 出荷できる日は、明日〜3週間先の中から、重ならずに選ぶ
    const from = addDays(todayInJapan(), SHIP_DATE_FROM_DAYS);
    const to = addDays(todayInJapan(), SHIP_DATE_TO_DAYS);
    const ok = v.shipDates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= from && d <= to);
    if (!ok || new Set(v.shipDates).size !== v.shipDates.length) {
      ctx.addIssue({ code: "custom", path: ["shipDates"], message: "出荷できる日を選び直してください" });
    }
    // 届けるときは送料が必要
    if (v.delivery && !/^\d+$/.test(v.shippingYen)) {
      ctx.addIssue({ code: "custom", path: ["shippingYen"], message: "送料を整数（円）で入力してください（無料なら 0）" });
    } else if (v.delivery && Number(v.shippingYen) > MAX_SHIPPING_YEN) {
      ctx.addIssue({ code: "custom", path: ["shippingYen"], message: `送料は ${MAX_SHIPPING_YEN.toLocaleString()} 円までです` });
    }
  })
  .transform((v) => ({
    ...v,
    // 届けないときは送料を 0 にする
    shippingYen: v.delivery ? Number(v.shippingYen) : 0,
    shipDates: [...v.shipDates].sort(),
  }));
