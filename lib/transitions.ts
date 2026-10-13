// 注文の状態を変える処理（6章の取引の流れ）。サーバー側だけで使う
// 6章ルール3：下の表にない動きは、すべて断る
import "server-only";
import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { itemYen } from "@/lib/price";
import { formatKg } from "@/lib/units";

export type Action = "sell" | "reduce" | "decline" | "accept" | "cancel";

// 操作ごとに「誰が」「どの状態から」「どの状態へ」動かせるか
const RULES: Record<Action, { by: "PRODUCER" | "BUYER"; from: OrderStatus[]; to: OrderStatus; needInTime: boolean }> = {
  sell: { by: "PRODUCER", from: ["PENDING"], to: "CONFIRMED", needInTime: true }, // 売ります
  reduce: { by: "PRODUCER", from: ["PENDING"], to: "CHANGE_PROPOSED", needInTime: true }, // 量を減らして返事
  decline: { by: "PRODUCER", from: ["PENDING", "CHANGE_PROPOSED"], to: "DECLINED", needInTime: false }, // 見送り
  accept: { by: "BUYER", from: ["CHANGE_PROPOSED"], to: "CONFIRMED", needInTime: true }, // 減らした量でOK
  cancel: { by: "BUYER", from: ["PENDING", "CHANGE_PROPOSED"], to: "CANCELLED", needInTime: false }, // 取消
};

export class TransitionError extends Error {}

export async function transitionOrder(params: {
  orderId: string;
  user: { id: string; role: string };
  action: Action;
  newQuantityG?: number; // reduce のときだけ
}) {
  const { orderId, user, action } = params;
  const rule = RULES[action];
  if (user.role !== rule.by) throw new TransitionError("この操作はできません");

  // 期限切れにしたときは、記録を残したうえで（トランザクションを取り消さずに）断る
  const expired = await prisma.$transaction(async (tx) => {
    // この注文を「使用中」にする（同時に2つの操作が来ても、1つずつ処理する）
    await tx.$queryRaw`SELECT id FROM "order" WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { listing: { select: { producerId: true, minOrderG: true, unitG: true } } },
    });
    // 自分に関係ない注文は「見つからない」として扱う（6章ルール4）
    const isMine = order && (rule.by === "BUYER" ? order.buyerId === user.id : order.listing.producerId === user.id);
    if (!order || !isMine) throw new TransitionError("申し込みが見つかりません");

    const now = new Date();
    const isHold = order.status === "PENDING" || order.status === "CHANGE_PROPOSED";
    // 回答期限を過ぎていたら、期限切れにして断る（期限ちょうどまでは期限内）
    if (isHold && order.replyDeadline < now) {
      await tx.order.update({ where: { id: order.id }, data: { status: "EXPIRED" } });
      return true;
    }
    if (!rule.from.includes(order.status)) throw new TransitionError("いまの状態では、この操作はできません");
    if (rule.needInTime && !isHold) throw new TransitionError("いまの状態では、この操作はできません");

    if (action === "reduce") {
      const g = params.newQuantityG;
      const { minOrderG, unitG } = order.listing;
      // 減らすだけ（増やすと、ほかのお店の分を取ってしまうおそれがある）
      if (g === undefined || g >= order.quantityG) throw new TransitionError("申し込みの量より少ない量を入力してください");
      if (g < minOrderG || g % unitG !== 0) throw new TransitionError(`${formatKg(minOrderG)}から${formatKg(unitG)}ずつの量にしてください`);
      // 仮押さえを減らした量にする（減った分は、ほかのお店が申し込めるようになる）。金額もアプリが計算し直す
      const item = itemYen(order.pricePerKg, g);
      await tx.order.update({
        where: { id: order.id },
        data: { status: rule.to, requestedG: order.quantityG, quantityG: g, itemYen: item, totalYen: item + order.shippingYen },
      });
      return false;
    }
    await tx.order.update({ where: { id: order.id }, data: { status: rule.to } });
    return false;
  });
  if (expired) throw new TransitionError("回答期限を過ぎたため、期限切れになりました");
}
