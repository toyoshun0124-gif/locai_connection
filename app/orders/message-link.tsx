// 一覧から取引の画面へ移るリンク（新しいメッセージがあれば目立たせる）
import Link from "next/link";

export function MessageLink({ orderId, count, hasNew }: { orderId: string; count: number; hasNew: boolean }) {
  return (
    <Link
      href={`/orders/${orderId}`}
      className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${hasNew ? "bg-red-600 font-bold text-white" : "bg-white text-green-800 ring-1 ring-green-800/30"}`}
    >
      {hasNew ? "新しいメッセージあり" : "メッセージ"}（{count}件）→
    </Link>
  );
}
