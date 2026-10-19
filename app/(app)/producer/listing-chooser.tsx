// 「出品する」の入口：新規作成／前の出品を使う（坂田さんのホームに置く）
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKg } from "@/lib/units";
import { liftOnHover, softCard } from "@/lib/ui";

export async function ListingChooser({ producerId }: { producerId: string }) {
  // 自分の出品だけ（新しい順に10件）
  const past = await prisma.listing.findMany({
    where: { producerId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, quantityG: true, pricePerKg: true, createdAt: true },
  });
  return (
    <div className="mt-3 flex flex-col gap-3">
      <Link href="/producer/listings/new?mode=new" className={`${softCard} ${liftOnHover} block p-5`}>
        <p className="font-heading text-lg text-green-900">新規作成</p>
        <p className="text-sm text-stone-600">初めての野菜や、前と違う内容で出品するとき</p>
      </Link>
      <div className={`${softCard} p-5`}>
        <p className="font-heading text-lg text-green-900">前の出品を使う</p>
        <p className="text-sm text-stone-600">商品名・送料・受け取り条件などが最初から入ります。量・値段・出荷できる日だけ入力します</p>
        {past.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">まだ出品がありません。最初は「新規作成」から出品してください。</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {past.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/producer/listings/new?from=${l.id}`}
                  className="flex flex-col gap-0.5 rounded-xl border border-stone-200 px-4 py-2.5 transition-colors hover:border-green-700 hover:bg-green-50 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2"
                >
                  <span className="font-medium">{l.name}</span>
                  <span className="text-sm text-stone-500">
                    {formatKg(l.quantityG)}・{l.pricePerKg.toLocaleString()}円/kg・{l.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
