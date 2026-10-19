// 購入者（三上さんなど）のログイン後の画面：食材名で探して、一覧から選ぶ（4章A②④）
import { Suspense } from "react";
import Link from "next/link";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PREFECTURES } from "@/lib/options";
import { formatYen, totalWithShippingYen } from "@/lib/price";
import { canOrder, expireOverdueOrdersOnce, remainingGramsMap } from "@/lib/stock";
import { isOrderableShipDate } from "@/lib/order";
import { dateToYmd, formatKg, formatYmd, gramsToKgText, kgTextToGrams, todayInJapan } from "@/lib/units";
import { WrongRoleNotice } from "@/app/app-header";
import { StepCards, type Step } from "@/app/step-cards";
import { inputBox, liftOnHover, softCard } from "@/lib/ui";
import { BUDGETS, RECEIVE_FILTERS, matchesReceiveAndBudget, shipDatesForUseDate, type BudgetKey } from "@/lib/search";
import { Spinner } from "@/app/spinner";

// 並び替え（名前順は、名前で有利・不利が決まるので使わない。AI にも決めさせない）
const SORTS = {
  new: "新しい順",
  cheap: "値段が安い順",
  early: "出荷が早い順",
} as const;

// 探す条件のチェック：食材名は必須（1〜50文字）。量・使用日・予算・受け取り条件・並び替えは任意
const searchSchema = z.object({
  q: z.string().trim().min(1).max(50),
  kg: z.string().trim().max(10).optional(),
  useDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional(),
  budget: z.enum(["", ...(Object.keys(BUDGETS) as BudgetKey[])]).optional(),
  receive: z.enum(["", "DELIVERY", "PICKUP"]).optional(),
  sort: z.enum(["new", "cheap", "early"]).optional(),
});

// 絞り込みの条件（一覧と、詳細へのリンクで使う）
type Filters = { wantG: number | null; useDate: string | null; budget: BudgetKey | null; receive: "DELIVERY" | "PICKUP" | null };

// 絞り込みの条件を、アドレスの「?」のあとに付ける形にする（空のものは付けない）
function filterParams(keyword: string, sort: string, f: Filters) {
  return new URLSearchParams({
    q: keyword,
    sort,
    ...(f.wantG !== null ? { kg: gramsToKgText(f.wantG) } : {}),
    ...(f.useDate ? { useDate: f.useDate } : {}),
    ...(f.budget ? { budget: f.budget } : {}),
    ...(f.receive ? { receive: f.receive } : {}),
  });
}

// 使い方の3つのステップ（絵文字・色・説明）
const STEPS: Step[] = [
  { icon: "🥬", title: "① 探す", text: "食材名で探して、量・使用日・予算などで絞り込み", color: "bg-green-100" },
  { icon: "🤝", title: "② 申し込む", text: "必要な量だけ申し込み。農家さんが「売る・量を減らす・見送る」で返事", color: "bg-amber-100" },
  { icon: "🤖", title: "③ AIがフォロー", text: "買えなかったときは、AIが関西の代わりの野菜と理由を提案", color: "bg-sky-100" },
];

export default function BuyerPage({ searchParams }: PageProps<"/buyer">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl xl:max-w-5xl lg:px-8">
        <Suspense fallback={<Spinner />}>
          <BuyerHome searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function BuyerHome({ searchParams }: { searchParams: PageProps<"/buyer">["searchParams"] }) {
  const user = await getCurrentUser();
  // 生産者が開いたら、中身を見せずに案内だけ出す
  if (user.role !== "BUYER") {
    return (
      <>
        <WrongRoleNotice forRole="BUYER" />
      </>
    );
  }

  const params = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const raw = { q: str(params.q), kg: str(params.kg), useDate: str(params.useDate), budget: str(params.budget), receive: str(params.receive), sort: str(params.sort) };
  const searched = raw.q !== undefined;
  const parsed = searched ? searchSchema.safeParse(raw) : null;

  // 量は任意。入っていれば g にする（形が違えばエラーを出す）
  const wantG = parsed?.success && parsed.data.kg ? kgTextToGrams(parsed.data.kg) : null;
  const kgError = parsed?.success && parsed.data.kg && wantG === null;
  const filters: Filters = {
    wantG,
    useDate: parsed?.success && parsed.data.useDate ? parsed.data.useDate : null,
    budget: parsed?.success && parsed.data.budget ? parsed.data.budget : null,
    receive: parsed?.success && parsed.data.receive ? parsed.data.receive : null,
  };

  const input = inputBox;

  return (
    <>

      {/* このアプリの使い方：まず探す → 申し込む → 買えなかったら AI が代わりを提案、という順番を見せる */}
      <StepCards steps={STEPS} />

      {/* 食材を探す（食材名だけ必須。量・並び替えは任意の絞り込み） */}
      <section className="mt-6">
        <h1 className="text-xl font-bold text-green-900">野菜を探す</h1>
        <p className="text-sm text-stone-600">関西の農家さんの出品から探せます</p>
        <form action="/buyer" method="get" className={`mt-3 flex flex-col gap-2 p-4 sm:p-5 ${softCard}`}>
          <div className="flex gap-2">
            <input name="q" defaultValue={raw.q ?? ""} maxLength={50} required placeholder="食材名（例：賀茂茄子）" className={`${input} min-w-0 flex-1 rounded-full px-5 py-3 text-base`} />
            <button type="submit" className="shrink-0 rounded-full bg-green-800 px-7 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-green-900">探す</button>
          </div>
          {parsed && !parsed.success && <p className="text-sm text-red-600">食材名を入力してください（50文字まで）</p>}
          <details open={Boolean(raw.kg || raw.useDate || raw.budget || raw.receive || raw.sort)}>
            <summary className="cursor-pointer text-sm text-green-800">絞り込み・並び替え（任意）</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-stone-700">ほしい量（kg）</span>
                <input name="kg" inputMode="decimal" defaultValue={raw.kg ?? ""} placeholder="例：3" className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-stone-700">使用日</span>
                <input name="useDate" type="date" defaultValue={raw.useDate ?? ""} className={input} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-stone-700">予算（送料込み）</span>
                <select name="budget" defaultValue={raw.budget ?? ""} className={input}>
                  <option value="">指定しない</option>
                  {(Object.keys(BUDGETS) as BudgetKey[]).map((k) => (
                    <option key={k} value={k}>{BUDGETS[k].label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-stone-700">受け取り条件</span>
                <select name="receive" defaultValue={raw.receive ?? ""} className={input}>
                  <option value="">指定しない</option>
                  <option value="DELIVERY">{RECEIVE_FILTERS.DELIVERY}</option>
                  <option value="PICKUP">{RECEIVE_FILTERS.PICKUP}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-stone-700">並び替え</span>
                <select name="sort" defaultValue={raw.sort ?? "new"} className={input}>
                  {Object.entries(SORTS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            {kgError && <p className="mt-1 text-sm text-red-600">量は 0.1kg 単位の数字で入力してください（例：1.5）</p>}
            <p className="mt-1 text-xs text-stone-500">予算は「野菜の代金＋送料」で、ほしい量（入れていなければ、いちばん少ない注文量）で計算します。</p>
          </details>
        </form>
      </section>

      {parsed?.success && !kgError && (
        <Results keyword={parsed.data.q} filters={filters} sort={parsed.data.sort ?? "new"} />
      )}

    </>
  );
}

// 探した結果の一覧（食材名・量・産地・値段・出荷できる日）
async function Results({ keyword, filters, sort }: { keyword: string; filters: Filters; sort: keyof typeof SORTS }) {
  const { wantG } = filters;
  // 申し込めるのは、出荷日の4日前までの日がある、公開中の出品
  const today = todayInJapan();
  await expireOverdueOrdersOnce();
  const rows = await prisma.listing.findMany({
    where: { status: "OPEN", name: { contains: keyword, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    // 一覧に必要な項目だけ取り出す（農家さんの住所などは読まない）
    select: {
      id: true, name: true, city: true, pricePerKg: true, quantityG: true, minOrderG: true, unitG: true,
      delivery: true, pickup: true, shippingYen: true, shipDates: true, createdAt: true,
      producer: { select: { prefecture: true } },
    },
  });

  const remaining = await remainingGramsMap(rows);
  const items = rows
    .map((l) => {
      // 申し込める出荷日のうち、使用日を入れていれば、それに間に合う日だけ
      const futureDates = shipDatesForUseDate(l.shipDates.map(dateToYmd).filter((d) => isOrderableShipDate(d, today)), filters.useDate);
      return { ...l, futureDates, remainingG: remaining.get(l.id) ?? 0 };
    })
    // 申し込める出荷日が残っていて、残りの量がある出品だけ
    .filter((l) => l.futureDates.length > 0 && l.remainingG >= l.minOrderG)
    // 量を入れたときは、その量で申し込める出品だけ（6章ルール6：条件に合えば、新しい農家さんも表示する）
    .filter((l) => wantG === null || canOrder(l, l.remainingG, wantG))
    // 受け取り条件と予算（送料込み）に合う出品だけ
    .filter((l) => matchesReceiveAndBudget(l, wantG ?? l.minOrderG, filters.receive, filters.budget));

  // 並び替え（アプリの決まりで決める）
  if (sort === "cheap") items.sort((a, b) => a.pricePerKg - b.pricePerKg || b.createdAt.getTime() - a.createdAt.getTime());
  if (sort === "early") items.sort((a, b) => a.futureDates[0].localeCompare(b.futureDates[0]) || b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <section className="mt-6">
      <p className="text-sm text-stone-600">
        「{keyword}」{wantG !== null && `を ${formatKg(wantG)}`}：{items.length}件
      </p>
      {items.length === 0 ? (
        <div className="mt-2 rounded-xl bg-white p-4 text-stone-600">
          <p>条件に合う出品が見つかりませんでした。{(wantG !== null || filters.useDate || filters.budget || filters.receive) && "絞り込みの条件を変えると見つかるかもしれません。"}</p>
          <Link
            href={`/buyer/alternatives?${new URLSearchParams({ item: keyword, ...(wantG !== null ? { kg: gramsToKgText(wantG) } : {}) })}`}
            className="mt-2 inline-block rounded-full bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900"
          >
            代わりの野菜を探す（AIの提案）
          </Link>
        </div>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {items.map((l) => {
            // 送料込みの金額：量を入れていればその量、なければいちばん少ない注文量で計算する
            const g = wantG ?? l.minOrderG;
            return (
              <li key={l.id}>
                <Link
                  href={`/listings/${l.id}?${filterParams(keyword, sort, filters)}`}
                  className={`${softCard} ${liftOnHover} flex items-start justify-between gap-3 p-4 sm:p-5`}
                >
                  <div className="min-w-0">
                    {/* 1. 食材名 */}
                    <p className="truncate text-lg font-bold text-stone-900">{l.name}</p>
                    {/* 3. 産地 */}
                    <p className="text-sm text-stone-600">{PREFECTURES[l.producer.prefecture]}{l.city}</p>
                    {/* 2. 量（いま申し込める残りの量） */}
                    <p className="mt-1 text-sm text-stone-800">
                      残り <span className="font-bold">{formatKg(l.remainingG)}</span>
                      <span className="text-stone-500">（{formatKg(l.minOrderG)}から{formatKg(l.unitG)}ずつ）</span>
                    </p>
                    {/* 5. 出荷できる日（いちばん早い日だけ。ほかの日は詳細画面で見せる） */}
                    <p className="text-sm text-stone-800">
                      出荷：{formatYmd(l.futureDates[0])}{l.futureDates.length > 1 && "〜"}
                    </p>
                  </div>
                  {/* 4. 値段（1kgあたりを大きく、送料込みはその下に） */}
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-bold text-red-700">
                      {l.pricePerKg.toLocaleString("ja-JP")}<span className="text-sm">円/kg</span>
                    </p>
                    {l.delivery && filters.receive !== "PICKUP" && (
                      <p className="text-xs text-stone-600">
                        {formatKg(g)}{wantG === null ? "から" : "で"}・送料込み {formatYen(totalWithShippingYen(l.pricePerKg, g, l.shippingYen))}{wantG === null && "〜"}
                      </p>
                    )}
                    {/* 取りに行く場合の合計（送料なし）も出す。文字の大きさ・色は送料込みと同じ */}
                    {l.pickup && filters.receive !== "DELIVERY" && (
                      <p className="text-xs text-stone-600">
                        {formatKg(g)}{wantG === null ? "から" : "で"}・取りに行く場合 {formatYen(totalWithShippingYen(l.pricePerKg, g, 0))}{wantG === null && "〜"}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
