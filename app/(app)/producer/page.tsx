// 生産者（坂田さんなど）のホーム：使い方 ＋ 出品する（坂田さんの主な動きは「出品する」なので、ホームに置く）
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { WrongRoleNotice } from "@/app/app-header";
import { PlusIcon } from "@/app/icons";
import { StepCards, type Step } from "@/app/step-cards";
import { ListingChooser } from "./listing-chooser";
import { Spinner } from "@/app/spinner";

// 坂田さんの使い方の3つのステップ（形と動きは三上さんと同じ）
const STEPS: Step[] = [
  { icon: "🥬", title: "① 出品する", text: "値段・量・出荷できる日を決めて出品。前の出品を使えば、すぐ出せる", color: "bg-green-100" },
  { icon: "📩", title: "② 申し込みに返事をする", text: "お店から届いた申し込みに「売る・量を減らす・見送る」で返事", color: "bg-amber-100" },
  { icon: "🚚", title: "③ 届ける", text: "販売確定したら、お店に届ける（または取りに来てもらう）", color: "bg-sky-100" },
];

export default function ProducerHomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 pb-6 lg:max-w-4xl lg:px-8 xl:max-w-5xl">
        <Suspense fallback={<Spinner />}>
          <ProducerHome />
        </Suspense>
      </main>
    </div>
  );
}

async function ProducerHome() {
  const user = await getCurrentUser();
  // 購入者が開いたら、中身を見せずに案内だけ出す
  if (user.role !== "PRODUCER") {
    return (
      <>
        <WrongRoleNotice forRole="PRODUCER" />
      </>
    );
  }
  return (
    <>
      <StepCards steps={STEPS} />
      <section className="mt-6">
        <h1 className="flex items-center gap-2 text-xl text-green-900">
          <PlusIcon size={24} />
          出品する
        </h1>
        <ListingChooser producerId={user.id} />
      </section>
    </>
  );
}
