// 出品する画面：まず「新規作成」か「前の出品を使う」かを選ぶ
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PREFECTURES } from "@/lib/options";
import { SHIP_DATE_FROM_DAYS, SHIP_DATE_TO_DAYS } from "@/lib/listing";
import { addDays, formatYmd, gramsToKgText, todayInJapan } from "@/lib/units";
import { AppHeader, WrongRoleNotice } from "../../../app-header";
import { ListingForm, type ListingValues } from "./listing-form";
import { BackLink } from "../../../back-link";

export default function NewListingPage({ searchParams }: PageProps<"/producer/listings/new">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl px-4 py-6 lg:max-w-3xl lg:px-8">
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
  const card = `mt-4 ${softCard} p-5`;

  // 新規作成／前の出品を使う を選ぶ画面は、ホームに置いている（何も選ばずに来たらホームへ）
  if (mode !== "new" && typeof from !== "string") redirect("/producer");

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
      {/* 戻るボタン：三上さんの「一覧に戻る」と同じ形。行き先が分かる名前にする */}
      <BackLink href="/producer">ホームに戻る</BackLink>
      <h1 className="mt-4 text-xl text-green-900"><span aria-hidden>🥬 </span>{baseName ? "前の出品を使って出品" : "新規作成"}</h1>
      {baseName && <p className="text-sm text-stone-600">もとにした出品：{baseName}</p>}
      <div className={card}>
        <ListingForm initial={initial} dateChoices={dateChoices} prefectureLabel={PREFECTURES[user.prefecture as keyof typeof PREFECTURES]} />
      </div>
    </>
  );
}

