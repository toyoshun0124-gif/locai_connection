"use server";
// 申し込みを保存する処理（サーバー側）。外から直接呼ばれても安全なように、毎回確かめる
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isOrderableShipDate, orderSchema } from "@/lib/order";
import { itemYen } from "@/lib/price";
import { canOrder, expireOverdueOrders, heldGramsOf, HOLD_STATUSES, remainingGramsOf } from "@/lib/stock";
import { dateToYmd, formatKg, todayInJapan } from "@/lib/units";

export type OrderFormState = {
  message: string;
  // 残りが足りないときの案内（代わりの探し方を出す）
  soldOut?: boolean;
  errors?: Partial<Record<string, string>>;
};

// 申し込めない理由を伝えるためのエラー（トランザクションを取り消して、画面に理由を返す）
class OrderRejected extends Error {
  constructor(public state: OrderFormState) {
    super(state.message);
  }
}

export async function createOrder(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
  const user = await getCurrentUser();
  // 申し込めるのは購入者だけ（農家さんが自分の出品を仮押さえするのを防ぐ）
  if (user.role !== "BUYER") return { message: "申し込めるのはお店（購入者）だけです" };

  const text = (key: string) => String(formData.get(key) ?? "");
  const parsed = orderSchema.safeParse({
    listingId: text("listingId"),
    idempotencyKey: text("idempotencyKey"),
    shipDate: text("shipDate"),
    useDate: text("useDate"),
    quantity: text("quantity"),
    receive: text("receive"),
    wantAiHelp: formData.get("wantAiHelp") === "on",
    dishName: text("dishName"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { message: "入力内容を確かめてください", errors };
  }
  const v = parsed.data;

  // 届けてもらうときは、届け先（お店の住所）が必要（販売確定したら農家さんに見せる）
  if (v.receive === "DELIVERY") {
    const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { address: true } });
    if (!profile?.address) {
      return { message: "入力内容を確かめてください", errors: { receive: "届けてもらうには、先にプロフィールに住所を登録してください" } };
    }
  }

  let orderId: string;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      // ① この出品を「使用中」にする（ほかの申し込みは、この処理が終わるまで待つ）＝同時に申し込まれても売りすぎない
      await tx.$queryRaw`SELECT id FROM "listing" WHERE id = ${v.listingId} FOR UPDATE`;

      // ② 同じボタンを何回押しても、申し込みは1件だけ
      const same = await tx.order.findUnique({
        where: { buyerId_idempotencyKey: { buyerId: user.id, idempotencyKey: v.idempotencyKey } },
        select: { id: true },
      });
      if (same) return same.id;

      const listing = await tx.listing.findFirst({ where: { id: v.listingId, status: "OPEN" } });
      if (!listing) throw new OrderRejected({ message: "この出品は終了したため、申し込めません" });

      // 中身がまったく同じ返事待ちの申し込みがあれば、新しく作らない（5章「中断」）
      const shipDate = new Date(`${v.shipDate}T00:00:00Z`);
      const useDate = new Date(`${v.useDate}T00:00:00Z`);
      const duplicate = await tx.order.findFirst({
        where: {
          buyerId: user.id, listingId: listing.id, status: { in: [...HOLD_STATUSES] },
          shipDate, useDate, quantityG: v.quantity, receive: v.receive,
        },
        select: { id: true },
      });
      if (duplicate) return duplicate.id;

      // ③ 出荷日・受け取り条件が、この出品で選べるものか
      const shipDates = listing.shipDates.map(dateToYmd);
      if (!shipDates.includes(v.shipDate) || !isOrderableShipDate(v.shipDate, todayInJapan())) {
        throw new OrderRejected({ message: "入力内容を確かめてください", errors: { shipDate: "この出荷日は選べません（出荷日の4日前まで申し込めます）" } });
      }
      if ((v.receive === "DELIVERY" && !listing.delivery) || (v.receive === "PICKUP" && !listing.pickup)) {
        throw new OrderRejected({ message: "入力内容を確かめてください", errors: { receive: "この受け取り条件は選べません" } });
      }

      // ④ 残りの量を確かめる（期限切れの仮押さえは先に戻しておく）
      const now = new Date();
      await expireOverdueOrders(tx, now);
      const remainingG = await remainingGramsOf(tx, listing, now);
      if (v.quantity < listing.minOrderG || v.quantity % listing.unitG !== 0) {
        throw new OrderRejected({
          message: "入力内容を確かめてください",
          errors: { quantity: `${formatKg(listing.minOrderG)}から${formatKg(listing.unitG)}ずつ申し込めます` },
        });
      }
      if (!canOrder(listing, remainingG, v.quantity)) {
        const heldG = await heldGramsOf(tx, listing.id, now);
        // 仮押さえが戻れば買えるかもしれないとき（5章「残り1kgに2店が同時に」）
        if (v.quantity <= remainingG + heldG) {
          throw new OrderRejected({
            soldOut: true,
            message: "この野菜は、ほかのお店が申し込み中のため、今は申し込めません。農家さんの返事によっては、また申し込めるようになります。",
          });
        }
        throw new OrderRejected({
          soldOut: remainingG < listing.minOrderG,
          message: "入力内容を確かめてください",
          errors: { quantity: `申し込める量は、残り${formatKg(Math.max(remainingG, 0))}までです` },
        });
      }

      // ⑤ 金額はアプリが計算する（画面から送られた金額は使わない）
      const item = itemYen(listing.pricePerKg, v.quantity);
      const shipping = v.receive === "DELIVERY" ? listing.shippingYen : 0;

      // ⑥ 保存する（ここで仮押さえになる）。回答期限は、申し込んだ時刻から◯日後
      const order = await tx.order.create({
        data: {
          listingId: listing.id,
          buyerId: user.id,
          quantityG: v.quantity,
          shipDate,
          useDate,
          receive: v.receive,
          wantAiHelp: v.wantAiHelp,
          dishName: v.dishName,
          pricePerKg: listing.pricePerKg,
          itemYen: item,
          shippingYen: shipping,
          totalYen: item + shipping,
          replyDeadline: new Date(now.getTime() + listing.replyDays * 24 * 60 * 60 * 1000),
          idempotencyKey: v.idempotencyKey,
        },
        select: { id: true },
      });
      return order.id;
    });
  } catch (e) {
    if (e instanceof OrderRejected) return e.state;
    throw e;
  }

  redirect(`/buyer/orders?ordered=${orderId}`);
}
