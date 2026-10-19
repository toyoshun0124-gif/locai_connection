// 「戻る」のボタン（押しやすい丸い形。全部の画面で同じ見た目にする）
import Link from "next/link";
import { BackIcon } from "./icons";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1 rounded-full bg-white py-2 pl-2.5 pr-4 text-sm font-medium text-green-800 shadow-[0_4px_14px_-8px_rgba(31,77,35,0.35)] ring-1 ring-stone-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:ring-green-700/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <BackIcon size={18} />
      {children}
    </Link>
  );
}
