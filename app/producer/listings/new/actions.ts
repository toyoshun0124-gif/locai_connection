"use server";
// 出品を保存する処理（サーバー側）。外から直接呼ばれても安全なように、毎回確かめる
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { listingSchema } from "@/lib/listing";

export type ListingFormState = {
  message: string;
  errors?: Partial<Record<string, string>>;
};

export async function createListing(_prev: ListingFormState, formData: FormData): Promise<ListingFormState> {
  const user = await getCurrentUser();
  // 出品できるのは生産者だけ
  if (user.role !== "PRODUCER") return { message: "出品できるのは農家さん（生産者）だけです" };

  const text = (key: string) => String(formData.get(key) ?? "");
  const parsed = listingSchema.safeParse({
    name: text("name"),
    city: text("city"),
    pricePerKg: text("pricePerKg"),
    quantityG: text("quantity"),
    minOrderG: text("minOrder"),
    unitG: text("unit"),
    delivery: formData.get("delivery") === "on",
    pickup: formData.get("pickup") === "on",
    shippingYen: text("shippingYen"),
    replyDays: text("replyDays"),
    shipDates: formData.getAll("shipDates").map(String),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { message: "入力内容を確かめてください", errors };
  }

  const v = parsed.data;
  await prisma.listing.create({
    data: {
      producerId: user.id, // 出品者は、画面から送られた値ではなくログインしている本人
      name: v.name,
      city: v.city,
      pricePerKg: v.pricePerKg,
      quantityG: v.quantityG,
      minOrderG: v.minOrderG,
      unitG: v.unitG,
      delivery: v.delivery,
      pickup: v.pickup,
      shippingYen: v.shippingYen,
      replyDays: v.replyDays,
      shipDates: v.shipDates.map((d) => new Date(`${d}T00:00:00Z`)),
    },
  });
  redirect("/producer?listed=1");
}
