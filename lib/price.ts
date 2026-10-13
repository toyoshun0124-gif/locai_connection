// 金額の計算（6章ルール2：金額はアプリが計算する）。この関数以外で金額を計算しない
// 金額は円、量は g の整数で扱う

// 野菜の代金：単価（円/kg）× 量（g）÷ 1000。1円未満は切り捨て
export function itemYen(pricePerKg: number, grams: number): number {
  return Math.floor((pricePerKg * grams) / 1000);
}

// 送料込みの合計（届けてもらうとき）
export function totalWithShippingYen(pricePerKg: number, grams: number, shippingYen: number): number {
  return itemYen(pricePerKg, grams) + shippingYen;
}

// 金額を「1,200円」の形にする
export function formatYen(yen: number): string {
  return `${yen.toLocaleString("ja-JP")}円`;
}
