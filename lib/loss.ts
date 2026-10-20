// ロスの記録（4章A 追加機能）。画面とサーバーの両方で使う

// ボタンの名前（余った割合）
export const LOSS_LABELS = ["使い切った", "1/4 余った", "半分余った", "3/4 余った"] as const;

// ロス量（g）＝ 仕入れ量 × 余った割合。量は100g単位なので、必ず g の整数になる
export function lossGrams(quantityG: number, quarters: number): number {
  return (quantityG * quarters) / 4;
}

// ロスの割合（%）。小数第1位まで（表示用）
export function lossPercentText(lossG: number, purchasedG: number): string {
  if (purchasedG === 0) return "-";
  return `${Math.round((lossG * 1000) / purchasedG) / 10}%`;
}

// 「〜余りました」の言い方（申し込むときに、前回の結果を事実として伝える）
export const LOSS_PAST_LABELS = ["使い切りました", "1/4 余りました", "半分余りました", "3/4 余りました"] as const;

// ロス金額（円）＝ 野菜の代金 × 余った割合。1円未満は切り捨て（代金の計算と同じ）
export function lossYen(itemYen: number, quarters: number): number {
  return Math.floor((itemYen * quarters) / 4);
}

// 前回より何円減ったか ＝（前回のロス量 − 今回のロス量）× 今回の単価
// 値段が下がっただけでは減らないように、金額ではなく「量」の差を使う。プラスなら減った、マイナスなら増えた
export function savedYen(prevLossG: number, nowLossG: number, nowPricePerKg: number): number {
  const diffG = prevLossG - nowLossG;
  const yen = Math.floor((Math.abs(diffG) * nowPricePerKg) / 1000);
  return diffG >= 0 ? yen : -yen;
}

// 「前回より ↓400円」の形にする
export function savedYenText(yen: number): string {
  if (yen === 0) return "±0円";
  return `${yen > 0 ? "↓" : "↑"}${Math.abs(yen).toLocaleString("ja-JP")}円`;
}

// 申し込むときの知らせの強さ（直近1回の記録で決める。アプリは知らせるだけで、申し込みは止めない）
// 使い切った → なし／1/4 → 注意／半分・3/4 → 前回より少なければ注意、同じか多ければ警告
export function lossNoticeLevel(prevQuarters: number, prevG: number, nowG: number | null): "none" | "caution" | "warning" {
  if (prevQuarters === 0) return "none";
  if (prevQuarters === 1) return "caution";
  // 量がまだ入っていないときは、強く出さない
  if (nowG === null || nowG < prevG) return "caution";
  return "warning";
}

// 同じ農家さんの同じ野菜を、1つのまとまりとして見るための目印（農家さんによって野菜の大きさが違うため）
export function lossGroupKey(o: { listing: { producerId: string; name: string } }): string {
  return `${o.listing.producerId}/${o.listing.name}`;
}

// 記録した注文1件ずつの「前回より何円」（新しい順に並んだ注文を受け取る）。前回がない注文は入らない
export function savedYenByOrder(
  newestFirst: { id: string; quantityG: number; lossQuarters: number | null; pricePerKg: number; listing: { producerId: string; name: string } }[],
): Map<string, number> {
  const saved = new Map<string, number>();
  const lastLossG = new Map<string, number>();
  // 古い順に見ていく
  for (const o of [...newestFirst].reverse()) {
    const nowLossG = lossGrams(o.quantityG, o.lossQuarters ?? 0);
    const prevLossG = lastLossG.get(lossGroupKey(o));
    if (prevLossG !== undefined) saved.set(o.id, savedYen(prevLossG, nowLossG, o.pricePerKg));
    lastLossG.set(lossGroupKey(o), nowLossG);
  }
  return saved;
}
