// 出品する画面：まず「新規作成」か「前の出品を使う」かを選ぶ
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PREFECTURES } from "@/lib/options";
import { SHIP_DATE_FROM_DAYS, SHIP_DATE_TO_DAYS } from "@/lib/listing";
import { addDays, formatKg, formatYmd, gramsToKgText, todayInJapan } from "@/lib/units";
import { AppHeader, WrongRoleNotice } from "../../../app-header";
import { ListingForm, type ListingValues } from "./listing-form";

export default function NewListingPage({ searchParams }: PageProps<"/producer/listings/new">) {
  return (
    <div className="flex flex-1 flex-col bg-[#f6f1e7]">
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <Suspense fallback={<p>読み込み中…</p>}>
          <NewListing searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function NewListing({ searchParams }: { searchParams: PageProps<"/producer/listings/new">["searchParams"] }) {
  const user = await getCurrentUser();
  if (user.role !== "PRODUCER") {
    return (
      <>
        <AppHeader user={user} />
        <WrongRoleNotice forRole="PRODUCER" />
      </>
    );
  }

  const { mode, from } = await searchParams;
  const card = "mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200";

  // ① まだ選んでいないとき：新規作成／前の出品を使う を選ぶ
  if (mode !== "new" && typeof from !== "string") {
    const past = await prisma.listing.findMany({
      where: { producerId: user.id }, // 自分の出品だけ
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, quantityG: true, pricePerKg: true, createdAt: true },
    });
    return (
      <>
        <AppHeader user={user} />
        <h1 className="mt-6 text-xl font-bold text-green-900">出品する</h1>

        <Link href="/producer/listings/new?mode=new" className={`${card} block hover:ring-green-800`}>
          <p className="font-bold text-green-900">新規作成</p>
          <p className="text-sm text-stone-600">初めての野菜や、前と違う内容で出品するとき</p>
        </Link>

        <div className={card}>
          <p className="font-bold text-green-900">前の出品を使う</p>
          <p className="text-sm text-stone-600">商品名・送料・受け取り条件などが最初から入ります。量・値段・出荷できる日だけ入力します</p>
          {past.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">まだ出品がありません。最初は「新規作成」から出品してください。</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {past.map((l) => (
                <li key={l.id}>
                  <Link href={`/producer/listings/new?from=${l.id}`} className="flex justify-between rounded-lg border border-stone-200 px-3 py-2 hover:border-green-800">
                    <span>{l.name}</span>
                    <span className="text-sm text-stone-500">
                      {formatKg(l.quantityG)}・{l.pricePerKg.toLocaleString()}円/kg・{l.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  }

  // ② 入力フォーム：新規作成なら空、前の出品を使うなら中身を写す
  const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { city: true } });
  let initial: ListingValues = {
    name: "",
    city: profile?.city ?? "",
    pricePerKg: "",
    quantity: "",
    minOrder: "",
    unit: "",
    delivery: false,
    pickup: false,
    shippingYen: "",
    replyDays: "2",
    shipDates: [],
  };
  let baseName: string | null = null;
  if (typeof from === "string") {
    // 自分の出品だけを使える（他人の出品の ID を入れても見つからない）
    const base = await prisma.listing.findFirst({ where: { id: from, producerId: user.id } });
    if (!base) {
      return (
        <>
          <AppHeader user={user} />
          <p className={card}>その出品は見つかりませんでした。</p>
        </>
      );
    }
    baseName = `${base.name}（${base.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })} の出品）`;
    // 量・値段・出荷できる日は毎回入力するので写さない
    initial = {
      ...initial,
      name: base.name,
      city: profile?.city || base.city,
      minOrder: gramsToKgText(base.minOrderG),
      unit: gramsToKgText(base.unitG),
      delivery: base.delivery,
      pickup: base.pickup,
      shippingYen: base.delivery ? String(base.shippingYen) : "",
      replyDays: String(base.replyDays),
    };
  }

  // 出荷できる日の候補：明日から3週間先まで
  const today = todayInJapan();
  const dateChoices = [];
  for (let i = SHIP_DATE_FROM_DAYS; i <= SHIP_DATE_TO_DAYS; i++) {
    const ymd = addDays(today, i);
    dateChoices.push({ ymd, label: formatYmd(ymd) });
  }

  return (
    <>
      <AppHeader user={user} />
      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-green-900">{baseName ? "前の出品を使って出品" : "新規作成"}</h1>
        <Link href="/producer/listings/new" className="text-sm text-green-800 underline">選び直す</Link>
      </div>
      {baseName && <p className="text-sm text-stone-600">もとにした出品：{baseName}</p>}
      <div className={card}>
        <ListingForm initial={initial} dateChoices={dateChoices} prefectureLabel={PREFECTURES[user.prefecture as keyof typeof PREFECTURES]} />
      </div>
    </>
  );
}

