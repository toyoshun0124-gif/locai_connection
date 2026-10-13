"use server";
// 注文への返事（農家さん：売る／量を減らす／見送る、三上さん：OK／取消）
import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { transitionOrder, TransitionError } from "@/lib/transitions";
import { kgTextToGrams } from "@/lib/units";

export type RespondState = { ok: boolean; message: string };

const respondSchema = z.object({
  orderId: z.string().min(1).max(50),
  action: z.enum(["sell", "reduce", "decline", "accept", "cancel"]),
  quantity: z.string().max(10).optional(),
});

export async function respondToOrder(_prev: RespondState, formData: FormData): Promise<RespondState> {
  const user = await getCurrentUser();
  const parsed = respondSchema.safeParse({
    orderId: formData.get("orderId"),
    action: formData.get("action"),
    quantity: formData.get("quantity") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: "操作を確かめてください" };
  const { orderId, action, quantity } = parsed.data;

  let newQuantityG: number | undefined;
  if (action === "reduce") {
    const g = quantity ? kgTextToGrams(quantity) : null;
    if (g === null) return { ok: false, message: "量は 0.1kg 単位の数字で入力してください（例：1.5）" };
    newQuantityG = g;
  }

  try {
    await transitionOrder({ orderId, user, action, newQuantityG });
  } catch (e) {
    if (e instanceof TransitionError) {
      refresh();
      return { ok: false, message: e.message };
    }
    throw e;
  }
  // 画面を最新の状態にする
  refresh();
  return { ok: true, message: "" };
}
