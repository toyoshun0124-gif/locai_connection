"use client";
// 件数の数字（赤い丸に白い数字）と、件数を画面を移るたびに聞き直す仕組み
// ヘッダーとタブは画面を移っても作り直さないので、数だけは画面を移るたびにサーバーに聞き直す
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useLiveCount(url: string, initial: number): number {
  const path = usePathname();
  const [count, setCount] = useState(initial);
  useEffect(() => {
    let alive = true;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setCount(d.count))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url, path]);
  return count;
}

// 0件のときは何も出さない
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 left-1/2 ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
