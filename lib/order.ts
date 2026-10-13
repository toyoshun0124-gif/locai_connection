// 申し込みの決まり（画面とサーバーの両方で使う）
import { z } from "zod";
import { addDays, kgTextToGrams } from "@/lib/units";

// 出荷日の何日前まで申し込めるか（仮説6。回答期限は最長3日なので、出荷日の前日までに返事が来る）
export const ORDER_LEAD_DAYS = 4;
// 使用日は、出荷日から何日後まで選べるか
export const USE_DATE_MAX_DAYS_AFTER_SHIP = 14;

// 今日（日本時間）から見て、申し込める出荷日か
export function isOrderableShipDate(shipYmd: string, todayYmd: string): boolean {
  return shipYmd >= addDays(todayYmd, ORDER_LEAD_DAYS);
}

export const STATUS_LABELS = {
  PENDING: "農家さんの返事待ち",
  CHANGE_PROPOSED: "あなたの返事待ち",
  CONFIRMED: "販売確定",
  DECLINED: "見送り",
  CANCELLED: "取消",
  EXPIRED: "期限切れ",
} as const;

export const RECEIVE_LABELS = {
  DELIVERY: "届けてもらう",
  PICKUP: "取りに行く",
} as const;

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// 申し込みの入力チェック（細かいつじつまは、出品の内容と合わせてサーバーで確かめる）
export const orderSchema = z
  .object({
    listingId: z.string().min(1).max(50),
    idempotencyKey: z.string().uuid(),
    shipDate: ymd.or(z.literal("")).refine((v) => v !== "", "出荷日を選んでください"),
    useDate: ymd.or(z.literal("")).refine((v) => v !== "", "使用日を入力してください"),
    quantity: z
      .string()
      .trim()
      .min(1, "量を入力してください")
      .transform((v, ctx) => {
        const g = kgTextToGrams(v);
        if (g === null || g <= 0) {
          ctx.addIssue({ code: "custom", message: "量は 0.1kg 単位の数字で入力してください（例：1.5）" });
          return z.NEVER;
        }
        return g;
      }),
    receive: z.enum(["DELIVERY", "PICKUP"], "受け取り条件を選んでください"),
    wantAiHelp: z.boolean(),
    dishName: z.string().trim().max(50, "料理名は50文字までです"),
  })
  .superRefine((v, ctx) => {
    if (v.useDate < v.shipDate) {
      ctx.addIssue({ code: "custom", path: ["useDate"], message: "使用日は、出荷日と同じ日か、それより後にしてください" });
    } else if (v.useDate > addDays(v.shipDate, USE_DATE_MAX_DAYS_AFTER_SHIP)) {
      ctx.addIssue({ code: "custom", path: ["useDate"], message: `使用日は、出荷日から${USE_DATE_MAX_DAYS_AFTER_SHIP}日以内にしてください` });
    }
  })
  // 料理名は、AI の提案にチェックしたときだけ使う
  .transform((v) => ({ ...v, dishName: v.wantAiHelp && v.dishName !== "" ? v.dishName : null }));
