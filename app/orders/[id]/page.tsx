// 取引の画面：注文の内容・メッセージ・サポートの案内（その注文のお店と農家さんだけが見られる）
import { softCard } from "@/lib/ui";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { RECEIVE_LABELS, STATUS_LABELS } from "@/lib/order";
import { formatYen } from "@/lib/price";
import { dateToYmd, formatKg, formatYmd } from "@/lib/units";
import { AppHeader } from "../../app-header";
import { MessageForm } from "./message-form";
import { BackLink } from "../../back-link";

// デモ用の作り物のサポート窓口（実在しない）
const SUPPORT_EMAIL = "support@example.com";

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl px-4 py-6 lg:max-w-3xl lg:px-8">
        <Suspense fallback={<p>読み込み中…</p>}>
          <OrderDetail params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/orders/[id]">["params"] }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true, buyerId: true, status: true, quantityG: true, totalYen: true, itemYen: true, shippingYen: true,
      shipDate: true, useDate: true, receive: true,
      buyer: { select: { name: true } },
      listing: { select: { name: true, producerId: true, producer: { select: { name: true } } } },
    },
  });
  const isBuyer = order?.buyerId === user.id;
  const isProducer = order?.listing.producerId === user.id;
  // その注文のお店と農家さん以外には、あることも知らせない（6章ルール4）
  if (!order || (!isBuyer && !isProducer)) {
    return (
      <>
        <AppHeader user={user} />
        <p className={`mt-6 ${softCard} p-4`}>取引が見つかりません。</p>
      </>
    );
  }

  // この画面を開いたら、メッセージを「読んだ」ことにする
  await prisma.order.update({ where: { id }, data: isBuyer ? { buyerReadAt: new Date() } : { producerReadAt: new Date() } });
  const messages = await prisma.message.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  const partnerName = isBuyer ? order.listing.producer.name : order.buyer.name;
  const fmtDateTime = (d: Date) =>
    d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const card = `mt-4 ${softCard} p-5`;

  return (
    <>
      <AppHeader user={user} />
      <BackLink href={isBuyer ? "/buyer/orders" : "/producer/orders"}>{isBuyer ? "自分の注文" : "注文"}に戻る</BackLink>

      {/* 注文の内容 */}
      <section className={card}>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-lg font-bold">{order.listing.name}<span className="ml-2 text-sm font-normal text-stone-500">{partnerName}さんとの取引</span></h1>
          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs">{STATUS_LABELS[order.status]}</span>
        </div>
        <p className="mt-1 text-stone-800">
          {formatKg(order.quantityG)}・<span className="font-bold">{formatYen(order.totalYen)}</span>
          <span className="text-sm text-stone-500">（野菜 {formatYen(order.itemYen)}{order.shippingYen > 0 && ` ＋ 送料 ${formatYen(order.shippingYen)}`}）</span>
        </p>
        <p className="text-sm text-stone-600">
          出荷 {formatYmd(dateToYmd(order.shipDate))}・使用 {formatYmd(dateToYmd(order.useDate))}・{RECEIVE_LABELS[order.receive]}
        </p>
        <p className="mt-2 text-xs text-stone-500">
          売る・量を減らす・取り消すなどは、{isBuyer ? "「自分の注文」" : "「届いた申し込み」"}のボタンで行います。
        </p>
      </section>

      {/* メッセージ */}
      <section className={card}>
        <h2 className="text-green-900"><span aria-hidden>💬 </span>メッセージ</h2>
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          量・金額・日にちは、メッセージに書いても変わりません。電話番号などの連絡先は書かないでください。
        </p>
        {messages.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">まだメッセージはありません。</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <span className="text-xs text-stone-500">{mine ? "あなた" : partnerName}・{fmtDateTime(m.createdAt)}</span>
                  {/* 本文は文字として表示する（改行はそのまま） */}
                  <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 ${mine ? "bg-green-800 text-white" : "bg-stone-100 text-stone-900"}`}>
                    {m.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4">
          <MessageForm orderId={order.id} />
        </div>
      </section>

      {/* サポートの案内（いつも画面のいちばん下に置く） */}
      <section className={`mt-6 ${softCard} p-4 text-sm text-stone-700`}>
        <h2><span aria-hidden>🛟 </span>サポートに連絡</h2>
        <p className="mt-1">取引で困ったことがあれば、運営に連絡してください。</p>
        <p className="mt-1">
          メール：<a href={`mailto:${SUPPORT_EMAIL}`} className="text-green-800 underline">{SUPPORT_EMAIL}</a>
          <span className="ml-1 text-xs text-stone-500">（デモ用の作り物の連絡先です）</span>
        </p>
      </section>
    </>
  );
}
