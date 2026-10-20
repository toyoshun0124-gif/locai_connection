// ロスのグラフ（棒グラフ：前回より何円／折れ線グラフ：ロス量）
// 画面の幅に合わせて伸び縮みするように、棒や点の位置は % で決める。文字の大きさは変わらない
import { savedYenText } from "@/lib/loss";
import { formatKg } from "@/lib/units";

// 目盛りのいちばん上を、きりのいい数（1・2・5 × 10の何乗）にする
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const base = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 5, 10]) if (v <= m * base) return m * base;
  return 10 * base;
}

// 日付の目盛りは、多すぎると重なるので、最大8個くらいに間引く
function showLabel(i: number, n: number): boolean {
  const step = Math.ceil(n / 8);
  return i % step === 0 || i === n - 1;
}

// 棒グラフ：記録1回ごとの「前回より何円」。減ったら上に青、増えたら下にオレンジ
// （緑とオレンジは、色の見分けがつきにくい人には区別しにくいので、青とオレンジにした）
export function SavedBarChart({ points }: { points: { label: string; yen: number }[] }) {
  // 全部 0円 でも目盛りが作れるように、いちばん上は 100円 以上にする
  const max = niceMax(Math.max(100, ...points.map((p) => Math.abs(p.yen))));
  const yen = (v: number) => `${v.toLocaleString("ja-JP")}円`;
  return (
    <div className="flex gap-2">
      {/* 縦の目盛り */}
      <div className="relative h-48 w-16 shrink-0 text-right text-xs text-stone-500">
        <span className="absolute right-0 top-0 -translate-y-1/2">↓{yen(max)}</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2">0円</span>
        <span className="absolute bottom-0 right-0 translate-y-1/2">↑{yen(max)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-48">
          {/* 目盛りの線（目立たない色）。真ん中の 0円 の線だけ少し濃くする */}
          <div className="absolute inset-x-0 top-0 border-t border-stone-200" />
          <div className="absolute inset-x-0 top-1/2 border-t border-stone-400" />
          <div className="absolute inset-x-0 bottom-0 border-t border-stone-200" />
          <div className="absolute inset-0 flex">
            {points.map((p, i) => {
              const h = (Math.abs(p.yen) / max) * 50; // 0円の線から端までが 50%
              return (
                // マウスを乗せると、その回の内容が出る（棒より広い範囲で反応する）
                <div key={i} className="group relative flex-1" title={`${p.label}：前回より ${savedYenText(p.yen)}`}>
                  <div className="absolute inset-y-0 left-1/2 w-full max-w-10 -translate-x-1/2 rounded group-hover:bg-stone-100/70" />
                  {p.yen > 0 && (
                    <div className="absolute bottom-1/2 left-1/2 w-3/5 max-w-7 -translate-x-1/2 rounded-t bg-[#0369a1]" style={{ height: `${h}%` }} />
                  )}
                  {p.yen < 0 && (
                    <div className="absolute left-1/2 top-1/2 w-3/5 max-w-7 -translate-x-1/2 rounded-b bg-[#ea580c]" style={{ height: `${h}%` }} />
                  )}
                  {p.yen === 0 && <div className="absolute left-1/2 top-1/2 h-0.5 w-3/5 max-w-7 -translate-x-1/2 -translate-y-1/2 bg-stone-400" />}
                </div>
              );
            })}
          </div>
        </div>
        {/* 横の目盛り（日付） */}
        <div className="mt-1 flex text-xs text-stone-500">
          {points.map((p, i) => (
            <span key={i} className="flex-1 text-center">{showLabel(i, points.length) ? p.label : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 折れ線グラフ：記録1回ごとのロス量（kg）
export function LossLineChart({ points }: { points: { label: string; lossG: number }[] }) {
  // 全部 使い切った でも目盛りが作れるように、いちばん上は 100g 以上にする
  const max = niceMax(Math.max(100, ...points.map((p) => p.lossG)));
  const n = points.length;
  // 横の位置：棒グラフと同じく、それぞれの回の真ん中（%）
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const y = (g: number) => 100 - (g / max) * 100;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.lossG)}`).join(" ");
  return (
    <div className="flex gap-2">
      <div className="relative h-48 w-16 shrink-0 text-right text-xs text-stone-500">
        <span className="absolute right-0 top-0 -translate-y-1/2">{formatKg(max)}</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2">{formatKg(max / 2)}</span>
        <span className="absolute bottom-0 right-0 translate-y-1/2">0kg</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-48">
          <div className="absolute inset-x-0 top-0 border-t border-stone-200" />
          <div className="absolute inset-x-0 top-1/2 border-t border-stone-200" />
          <div className="absolute inset-x-0 bottom-0 border-t border-stone-400" />
          {/* 線（伸び縮みしても太さは 2px のまま） */}
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path d={path} fill="none" stroke="#166534" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          {/* 点（円の形がつぶれないように、線とは別に置く） */}
          {points.map((p, i) => (
            <span
              key={i}
              title={`${p.label}：ロス ${formatKg(p.lossG)}`}
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#166534] ring-2 ring-white"
              style={{ left: `${x(i)}%`, top: `${y(p.lossG)}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex text-xs text-stone-500">
          {points.map((p, i) => (
            <span key={i} className="flex-1 text-center">{showLabel(i, n) ? p.label : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
