// 代わりの野菜を探す画面（AI の提案。4章A③）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { dateToYmd, gramsToKgText } from "@/lib/units";
import { WrongRoleNotice } from "@/app/app-header";
import { AlternativesForm } from "./alternatives-form";
import { Spinner } from "@/app/spinner";

export default function AlternativesPage({ searchParams }: PageProps<"/buyer/alternatives">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl px-4 pb-6 lg:max-w-4xl xl:max-w-5xl lg:px-8">
        <Suspense fallback={<Spinner />}>
          <Alternatives searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Alternatives({ searchParams }: { searchParams: PageProps<"/buyer/alternatives">["searchParams"] }) {
  const user = await getCurrentUser();
  if (user.role !== "BUYER") {
    return (
      <>
        <WrongRoleNotice forRole="BUYER" />
      </>
    );
  }
  const params = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 50) : "");
  let initial = { item: str(params.item), dishName: "", kg: str(params.kg), useDate: "" };

  // 注文から来たときは、その注文の内容を最初から入れておく（自分の注文だけ）
  if (typeof params.order === "string") {
    const o = await prisma.order.findFirst({
      where: { id: params.order, buyerId: user.id },
      select: { quantityG: true, requestedG: true, useDate: true, dishName: true, listing: { select: { name: true } } },
    });
    if (o) {
      initial = {
        item: o.listing.name,
        dishName: o.dishName ?? "",
        // 一部しか売れないときは、足りない分の量にする
        kg: gramsToKgText(o.requestedG !== null ? o.requestedG - o.quantityG : o.quantityG),
        useDate: dateToYmd(o.useDate),
      };
    }
  }

  return (
    <>
      <h1 className="mt-6 text-xl text-green-900"><span aria-hidden>🤖 </span>代わりの野菜を探す</h1>
      <p className="text-sm text-stone-600">関西の野菜で、予定していた料理に使えるものを、AI が提案します。</p>
      <div className={`mt-4 ${softCard} p-5`}>
        <AlternativesForm initial={initial} />
      </div>
    </>
  );
}
