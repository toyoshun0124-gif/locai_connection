// 残りの量（いま申し込める量）の計算
// 6章ルール1：残り ＝ 出品した量 − 販売確定の量 − 仮押さえ中の量
// いまは申し込みの機能がまだ無いので、出品した量がそのまま残りになる。
// 申し込みの機能を作るときに、ここで販売確定・仮押さえの量を引くようにする
export function remainingGrams(listing: { quantityG: number }): number {
  return listing.quantityG;
}

// その量で申し込めるか（いちばん少ない注文量以上・単位で割り切れる・残り以内）
export function canOrder(listing: { minOrderG: number; unitG: number }, remainingG: number, grams: number): boolean {
  return grams >= listing.minOrderG && grams % listing.unitG === 0 && grams <= remainingG;
}
