"use client";
// タブ：パソコンでは画面の左、スマホでは画面の下に出す
// 今どのタブを見ているかは、画面のアドレスから決める
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainIcon, HomeIcon, InboxIcon, OrdersIcon, PlusIcon, SproutIcon, TrashIcon } from "./icons";

const ICONS = { home: HomeIcon, orders: OrdersIcon, loss: TrashIcon, ai: BrainIcon, inbox: InboxIcon, listings: SproutIcon, plus: PlusIcon };

type Tab = { href: string; icon: keyof typeof ICONS; short: string; full: string; match: (path: string) => boolean };

// 役割ごとのタブ
const TABS: Record<"BUYER" | "PRODUCER", Tab[]> = {
  BUYER: [
    // 出品の詳細を開いているときも「ホーム」（探した結果から開くため）
    { href: "/buyer", icon: "home", short: "ホーム", full: "ホーム（野菜を探す）", match: (p) => p === "/buyer" || p.startsWith("/listings") || p.startsWith("/producers") },
    { href: "/buyer/orders", icon: "orders", short: "注文", full: "自分の注文", match: (p) => p.startsWith("/buyer/orders") },
    { href: "/buyer/loss", icon: "loss", short: "ロス", full: "ロスの記録", match: (p) => p.startsWith("/buyer/loss") },
    { href: "/buyer/alternatives", icon: "ai", short: "AI", full: "代わりの野菜を探す（AIの提案）", match: (p) => p.startsWith("/buyer/alternatives") },
  ],
  PRODUCER: [
    { href: "/producer", icon: "home", short: "ホーム", full: "ホーム（届いた申し込み）", match: (p) => p === "/producer" },
    { href: "/producer/listings", icon: "listings", short: "出品", full: "自分の出品", match: (p) => p === "/producer/listings" },
    { href: "/producer/listings/new", icon: "plus", short: "出品する", full: "新しく出品する", match: (p) => p.startsWith("/producer/listings/new") },
  ],
};

export function AppTabs({ role }: { role: "BUYER" | "PRODUCER" }) {
  const path = usePathname();
  const tabs = TABS[role];
  return (
    <nav
      data-app-nav
      aria-label="メニュー"
      className={
        // スマホ：画面の下に固定。パソコン：画面の左に固定（細い縦の帯）
        "fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur " +
        "lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-20 lg:border-r lg:border-t-0 lg:pb-0 lg:pt-6"
      }
    >
      <ul className="mx-auto flex max-w-md justify-around lg:max-w-none lg:flex-col lg:items-center lg:justify-start lg:gap-2">
        {tabs.map((t) => {
          const active = t.match(path);
          const Icon = ICONS[t.icon];
          return (
            <li key={t.href} className="group relative flex-1 lg:flex-none">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                aria-label={t.full}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[11px] transition-colors lg:w-16 lg:rounded-2xl lg:py-3 ${
                  active ? "font-bold text-green-800 lg:bg-green-50" : "text-stone-500 hover:text-green-800 lg:hover:bg-stone-50"
                }`}
              >
                <Icon size={24} />
                <span>{t.short}</span>
              </Link>
              {/* パソコンでマウスを乗せたら、機能の名前を全部出す */}
              <span className="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-stone-800 px-2.5 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 lg:block">
                {t.full}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
