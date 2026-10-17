// 全部の画面の背景：京野菜・葉っぱ・ドットが、ゆっくり浮かんでゆれるアニメーション
// イラストは、このファイルの中で図形を組み合わせて描いたオリジナル（外の画像は使わない）
// 動きは CSS のアニメーションだけで動かす（軽い）。「動きを減らす」設定の人には止まった絵を出す
import type { ReactNode } from "react";

// 野菜・葉っぱ・ドットのイラスト（100×100 の中に描く）
const SHAPES: Record<string, ReactNode> = {
  賀茂茄子: (
    <>
      <circle cx="50" cy="58" r="30" fill="#5b2a6e" />
      <ellipse cx="40" cy="48" rx="8" ry="5" fill="#8e5aa3" />
      <path d="M30 34 Q50 22 70 34 L62 40 L50 32 L38 40 Z" fill="#3f7a3a" />
      <rect x="47" y="16" width="6" height="14" rx="3" fill="#3f7a3a" />
    </>
  ),
  万願寺唐辛子: (
    <>
      <path d="M30 22 Q24 60 52 84 Q62 90 64 80 Q46 56 44 24 Z" fill="#3e8f3a" />
      <path d="M36 30 Q34 56 50 74" stroke="#6cbf5a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M28 20 Q36 12 46 20 L44 26 L30 26 Z" fill="#2f6b2b" />
      <rect x="35" y="8" width="5" height="12" rx="2.5" fill="#2f6b2b" />
    </>
  ),
  九条ねぎ: (
    <>
      <rect x="44" y="58" width="12" height="32" rx="6" fill="#f3f1e4" stroke="#d9d4bd" strokeWidth="1.5" />
      <path d="M46 62 Q30 36 24 10" stroke="#4f9b3f" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M50 60 Q52 32 48 6" stroke="#5aab48" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M54 62 Q70 38 78 14" stroke="#4f9b3f" strokeWidth="7" fill="none" strokeLinecap="round" />
    </>
  ),
  聖護院かぶ: (
    <>
      <path d="M44 34 Q30 10 20 14 Q28 24 40 36 Z" fill="#4f9b3f" />
      <path d="M50 32 Q50 6 56 4 Q60 18 54 34 Z" fill="#5aab48" />
      <path d="M56 34 Q72 12 82 16 Q72 28 60 38 Z" fill="#4f9b3f" />
      <ellipse cx="50" cy="60" rx="30" ry="25" fill="#fbfaf3" stroke="#d9d4bd" strokeWidth="2" />
    </>
  ),
  京にんじん: (
    <>
      <path d="M40 30 Q50 26 60 30 Q58 60 50 94 Q42 60 40 30 Z" fill="#d6402b" />
      <path d="M44 44 L50 46 M46 58 L52 60 M47 72 L51 73" stroke="#a82e1f" strokeWidth="2" strokeLinecap="round" />
      <path d="M46 30 Q38 14 30 8 M50 28 Q50 12 52 4 M54 30 Q62 14 70 10" stroke="#4f9b3f" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  葉っぱ: (
    <>
      <path d="M50 8 Q86 30 70 70 Q58 92 50 94 Q42 92 30 70 Q14 30 50 8 Z" fill="#6cbf5a" />
      <path d="M50 14 L50 92 M50 40 L64 30 M50 56 L66 46 M50 40 L36 30 M50 56 L34 46" stroke="#3f8f35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  ドット: <circle cx="50" cy="50" r="40" fill="#9fd48f" />,
  白いドット: <circle cx="50" cy="50" r="40" fill="#ffffff" />,
};

// 浮かべるものの一覧：何を・どこに（画面の左から何%・上から何%）・大きさ（px）・1往復の秒数・始まりをずらす秒数
// 毎回同じ並びにする（表示のたびに変わると、画面がちらつくため）
const ITEMS: { shape: keyof typeof SHAPES; x: number; y: number; size: number; dur: number; delay: number }[] = [
  { shape: "賀茂茄子", x: 6, y: 10, size: 64, dur: 22, delay: -3 },
  { shape: "葉っぱ", x: 24, y: 4, size: 40, dur: 18, delay: -9 },
  { shape: "ドット", x: 40, y: 16, size: 14, dur: 15, delay: -2 },
  { shape: "万願寺唐辛子", x: 58, y: 8, size: 60, dur: 24, delay: -12 },
  { shape: "白いドット", x: 74, y: 20, size: 22, dur: 17, delay: -6 },
  { shape: "九条ねぎ", x: 88, y: 6, size: 66, dur: 26, delay: -15 },
  { shape: "ドット", x: 12, y: 34, size: 18, dur: 16, delay: -11 },
  { shape: "聖護院かぶ", x: 30, y: 42, size: 62, dur: 25, delay: -5 },
  { shape: "葉っぱ", x: 66, y: 38, size: 46, dur: 19, delay: -14 },
  { shape: "京にんじん", x: 84, y: 46, size: 64, dur: 23, delay: -8 },
  { shape: "白いドット", x: 50, y: 56, size: 26, dur: 18, delay: -1 },
  { shape: "万願寺唐辛子", x: 4, y: 62, size: 54, dur: 21, delay: -16 },
  { shape: "ドット", x: 22, y: 74, size: 12, dur: 14, delay: -7 },
  { shape: "賀茂茄子", x: 40, y: 80, size: 58, dur: 24, delay: -10 },
  { shape: "葉っぱ", x: 60, y: 72, size: 42, dur: 20, delay: -4 },
  { shape: "九条ねぎ", x: 78, y: 82, size: 60, dur: 26, delay: -18 },
  { shape: "ドット", x: 92, y: 66, size: 16, dur: 15, delay: -13 },
  { shape: "京にんじん", x: 14, y: 90, size: 56, dur: 22, delay: -6 },
];

// アニメーションの動き（この部品の中だけで使う）
const KEYFRAMES = `
@keyframes veg-float {
  0%   { transform: translate(0, 0) rotate(-6deg); }
  25%  { transform: translate(14px, -26px) rotate(4deg); }
  50%  { transform: translate(-8px, -44px) rotate(8deg); }
  75%  { transform: translate(-16px, -18px) rotate(-2deg); }
  100% { transform: translate(0, 0) rotate(-6deg); }
}
@keyframes veg-glow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(4%, 3%) scale(1.08); }
}
.veg-float { animation: veg-float var(--dur) ease-in-out var(--delay) infinite; will-change: transform; }
.veg-glow  { animation: veg-glow 30s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .veg-float, .veg-glow { animation: none; }
}
`;

export function VeggieBackground() {
  return (
    // 画面いっぱいに固定して、いちばん後ろに置く。クリックなどの邪魔をしない
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style>{KEYFRAMES}</style>

      {/* うすい緑と白のぼかし（ゆっくり動く） */}
      <div
        className="veg-glow absolute -inset-[10%]"
        style={{
          background:
            "radial-gradient(40% 35% at 15% 20%, rgba(159, 212, 143, 0.35), transparent 70%)," +
            "radial-gradient(35% 30% at 85% 30%, rgba(255, 255, 255, 0.7), transparent 70%)," +
            "radial-gradient(45% 40% at 70% 85%, rgba(108, 191, 90, 0.22), transparent 70%)," +
            "radial-gradient(35% 35% at 25% 80%, rgba(255, 255, 255, 0.6), transparent 70%)",
        }}
      />

      {/* 浮かんでゆれる野菜・葉っぱ・ドット（文字が読みにくくならないように、うすくする） */}
      {ITEMS.map((it, i) => (
        <svg
          key={i}
          viewBox="0 0 100 100"
          className="veg-float absolute"
          style={
            {
              left: `${it.x}%`,
              top: `${it.y}%`,
              width: it.size,
              height: it.size,
              opacity: it.shape.includes("ドット") ? 0.45 : 0.2,
              "--dur": `${it.dur}s`,
              "--delay": `${it.delay}s`,
            } as React.CSSProperties
          }
        >
          {SHAPES[it.shape]}
        </svg>
      ))}
    </div>
  );
}
