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
