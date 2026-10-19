// 線で描いたアイコン（このファイルの中で描いたオリジナル。外の画像は使わない）
// 色は、まわりの文字の色（currentColor）に合わせて変わる
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

// ホーム（家）
export function HomeIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </Base>
  );
}

// 注文（クリップボード）
export function OrdersIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </Base>
  );
}

// ロス（ゴミ箱）
export function TrashIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 6.5h16" />
      <path d="M9.5 6.5V4.5h5v2" />
      <path d="M6 6.5 7 20h10l1-13.5" />
      <path d="M10 10v6.5M14 10v6.5" />
    </Base>
  );
}

// AI（考えている感じの脳）：左右の脳と、真ん中の線、しわを線で描く
export function BrainIcon(p: IconProps) {
  return (
    <Base {...p}>
      {/* 左の脳 */}
      <path d="M12 5.2C11.2 3.9 9.2 3.6 8 4.7 6.4 4.5 5 5.9 5.3 7.5 3.9 8.2 3.5 10.1 4.4 11.3 3.5 12.6 3.9 14.5 5.4 15.1 5.3 16.9 6.9 18.3 8.6 17.9 9.4 19.3 11 19.7 12 18.8" />
      {/* 右の脳 */}
      <path d="M12 5.2C12.8 3.9 14.8 3.6 16 4.7 17.6 4.5 19 5.9 18.7 7.5 20.1 8.2 20.5 10.1 19.6 11.3 20.5 12.6 20.1 14.5 18.6 15.1 18.7 16.9 17.1 18.3 15.4 17.9 14.6 19.3 13 19.7 12 18.8" />
      {/* 真ん中の線 */}
      <path d="M12 5.2v13.6" />
      {/* しわ */}
      <path d="M8.3 8.2c1.2 0 2 .8 2 1.9M15.7 8.2c-1.2 0-2 .8-2 1.9M7.6 13.2c1-.6 2.3-.4 3 .5M16.4 13.2c-1-.6-2.3-.4-3 .5" />
    </Base>
  );
}

// 届いた申し込み（受け取り箱）
export function InboxIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 13.5 6.5 5.5h11L20 13.5V19H4z" />
      <path d="M4 13.5h4.5l1 2h5l1-2H20" />
    </Base>
  );
}

// 自分の出品（芽）
export function SproutIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 20.5V11" />
      <path d="M12 11C12 7.5 9.5 5 5.5 5c0 3.8 2.6 6 6.5 6z" />
      <path d="M12 13.5c0-3 2.2-5.2 6-5.2 0 3.4-2.4 5.2-6 5.2z" />
      <path d="M7.5 20.5h9" />
    </Base>
  );
}

// 出品する（丸の中の＋）
export function PlusIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </Base>
  );
}

// メッセージ（ふきだし）
export function ChatIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-6l-4.5 3.5V16H7a2.5 2.5 0 0 1-2.5-2.5z" />
      <path d="M8.5 9h7M8.5 12h4.5" />
    </Base>
  );
}

// プロフィール（人）
export function UserIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </Base>
  );
}

// ログアウト（ドアから出る矢印）
export function LogoutIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M14 4.5H7A2 2 0 0 0 5 6.5v11a2 2 0 0 0 2 2h7" />
      <path d="M11 12h9M17 8.5l3.5 3.5-3.5 3.5" />
    </Base>
  );
}

// 戻る（左向きの矢印）
export function BackIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M14.5 6 8.5 12l6 6" />
    </Base>
  );
}
