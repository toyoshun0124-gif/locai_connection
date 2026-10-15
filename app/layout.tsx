import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { VeggieBackground } from "./veggie-background";

// 英数字：Inter（数字や値段がすっきり読みやすい）
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// 日本語：Noto Sans JP（読みやすいゴシック体）。本文はふつう（400）、少し強め（500）、見出しは太字（700）
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
  // 日本語のフォントはファイルが大きいので、先読みはしない（表示に必要な分だけ読み込まれる）
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "LocAI 野菜仕入れ",
  description: "関西の農家さんとお店を、必要な量でつなぐ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* いちばん後ろに、京野菜のイラスト（全部の画面に出る） */}
        <VeggieBackground />
        {/* 各画面の中身は、イラストの上に出す */}
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
