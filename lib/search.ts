// 探すときの絞り込みの決まり（4章A②）。画面とサーバーの両方で使う
import { addDays } from "@/lib/units";
import { USE_DATE_MAX_DAYS_AFTER_SHIP } from "@/lib/order";
import { totalWithShippingYen } from "@/lib/price";

// 予算（送料込み）の範囲。下の値以上・上の値より下（ちょうど上の値は、次の範囲に入る）
export const BUDGETS = {
  u5k: { label: "〜5,000円", min: 0, max: 5_000 },
  "5k-10k": { label: "5,000〜10,000円", min: 5_000, max: 10_000 },
  "10k-20k": { label: "10,000〜20,000円", min: 10_000, max: 20_000 },
  "20k-50k": { label: "20,000〜50,000円", min: 20_000, max: 50_000 },
  o50k: { label: "50,000円〜", min: 50_000, max: Number.MAX_SAFE_INTEGER },
} as const;
export type BudgetKey = keyof typeof BUDGETS;

export const RECEIVE_FILTERS = { DELIVERY: "届けてもらう", PICKUP: "取りに行く" } as const;

// 使用日に間に合う出荷日だけを残す（出荷日 ≦ 使用日 ≦ 出荷日＋14日）
export function shipDatesForUseDate(shipDates: string[], useDate: string | null): string[] {
  if (!useDate) return shipDates;
  return shipDates.filter((d) => d <= useDate && useDate <= addDays(d, USE_DATE_MAX_DAYS_AFTER_SHIP));
}

// 受け取り条件と予算の両方に合うか。受け取り条件を選んでいなければ、出品で選べる受け取り方のどれかが予算に入ればよい
export function matchesReceiveAndBudget(
  l: { delivery: boolean; pickup: boolean; pricePerKg: number; shippingYen: number },
  grams: number,
  receive: "DELIVERY" | "PICKUP" | null,
  budget: BudgetKey | null,
): boolean {
  const methods = [
    l.delivery && (receive === null || receive === "DELIVERY") ? totalWithShippingYen(l.pricePerKg, grams, l.shippingYen) : null,
    l.pickup && (receive === null || receive === "PICKUP") ? totalWithShippingYen(l.pricePerKg, grams, 0) : null,
  ].filter((t): t is number => t !== null);
  if (methods.length === 0) return false; // 選んだ受け取り方ができない出品
  if (budget === null) return true;
  const { min, max } = BUDGETS[budget];
  return methods.some((t) => t >= min && t < max);
}
