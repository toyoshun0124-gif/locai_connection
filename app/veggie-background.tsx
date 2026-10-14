"use client";
// 全部の画面の背景に、京野菜のイラストをうすく並べる。8秒ごとに、ふわっと次の野菜に切り替える
// イラストは、このファイルの中で図形を組み合わせて描いたオリジナル（外の画像は使わない）
import { useEffect, useState, type ReactNode } from "react";

// 野菜のイラスト（100×100 の中に描く）
const VEGGIES: { name: string; draw: ReactNode }[] = [
  {
    name: "賀茂茄子",
    draw: (
      <>
        <circle cx="50" cy="58" r="30" fill="#5b2a6e" />
        <ellipse cx="40" cy="48" rx="8" ry="5" fill="#8e5aa3" />
        <path d="M30 34 Q50 22 70 34 L62 40 L50 32 L38 40 Z" fill="#3f7a3a" />
        <rect x="47" y="16" width="6" height="14" rx="3" fill="#3f7a3a" />
      </>
    ),
  },
  {
    name: "万願寺唐辛子",
    draw: (
      <>
        <path d="M30 22 Q24 60 52 84 Q62 90 64 80 Q46 56 44 24 Z" fill="#3e8f3a" />
        <path d="M36 30 Q34 56 50 74" stroke="#6cbf5a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M28 20 Q36 12 46 20 L44 26 L30 26 Z" fill="#2f6b2b" />
        <rect x="35" y="8" width="5" height="12" rx="2.5" fill="#2f6b2b" />
      </>
    ),
  },
  {
    name: "九条ねぎ",
    draw: (
      <>
        <rect x="44" y="58" width="12" height="32" rx="6" fill="#f3f1e4" stroke="#d9d4bd" strokeWidth="1.5" />
        <path d="M46 62 Q30 36 24 10" stroke="#4f9b3f" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M50 60 Q52 32 48 6" stroke="#5aab48" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M54 62 Q70 38 78 14" stroke="#4f9b3f" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M46 90 L44 96 M50 90 L50 97 M54 90 L56 96" stroke="#c9c2a3" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    name: "聖護院かぶ",
    draw: (
      <>
        <path d="M44 34 Q30 10 20 14 Q28 24 40 36 Z" fill="#4f9b3f" />
        <path d="M50 32 Q50 6 56 4 Q60 18 54 34 Z" fill="#5aab48" />
        <path d="M56 34 Q72 12 82 16 Q72 28 60 38 Z" fill="#4f9b3f" />
        <ellipse cx="50" cy="60" rx="30" ry="25" fill="#fbfaf3" stroke="#d9d4bd" strokeWidth="2" />
        <path d="M50 85 Q50 92 48 97" stroke="#d9d4bd" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    name: "京にんじん",
    draw: (
      <>
        <path d="M40 30 Q50 26 60 30 Q58 60 50 94 Q42 60 40 30 Z" fill="#d6402b" />
        <path d="M44 44 L50 46 M46 58 L52 60 M47 72 L51 73" stroke="#a82e1f" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 30 Q38 14 30 8 M50 28 Q50 12 52 4 M54 30 Q62 14 70 10" stroke="#4f9b3f" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

const INTERVAL_MS = 8000; // 何ミリ秒ごとに切り替えるか（8000＝8秒）

export function VeggieBackground() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // 「動きを減らす」設定の人には、切り替えをしない
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % VEGGIES.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    // 画面いっぱいに固定して、いちばん後ろに置く。クリックなどの邪魔をしない
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {VEGGIES.map((v, i) => (
        <svg
          key={v.name}
          className="absolute inset-0 h-full w-full transition-opacity duration-[2000ms] ease-in-out"
          // 文字が読みにくくならないように、かなりうすくする
          style={{ opacity: i === current ? 0.16 : 0 }}
        >
          <defs>
            {/* 同じ野菜を、少しななめに、すき間をあけて並べる */}
            <pattern id={`veggie-${i}`} width="150" height="150" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
              <g transform="translate(10 10) scale(0.55)">{v.draw}</g>
              <g transform="translate(85 85) scale(0.45) rotate(18 50 50)">{v.draw}</g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#veggie-${i})`} />
        </svg>
      ))}
    </div>
  );
}
