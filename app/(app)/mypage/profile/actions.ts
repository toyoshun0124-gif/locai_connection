"use server";
import { refresh } from "next/cache";
// プロフィールを保存する処理（サーバー側）。外から直接呼ばれても安全なように、毎回確かめる
import { prisma } from "@/lib/prisma";
import { getCurrentUser, refreshSessionCache } from "@/lib/session";
import { profileSchema } from "@/lib/profile";

export type SaveState = {
  ok: boolean;
  message: string;
  // 項目ごとのエラー（欄の近くに赤字で出す）
  errors?: Partial<Record<string, string>>;
};

export async function saveProfile(_prev: SaveState, formData: FormData): Promise<SaveState> {
  // 保存できるのは、ログインしている本人のプロフィールだけ（画面から送られた ID は使わない）
  const user = await getCurrentUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    city: formData.get("city") ?? "",
    shopKind: formData.get("shopKind") ?? "",
    items: formData.get("items") ?? "",
    policy: formData.get("policy") ?? "",
    address: formData.get("address") ?? "",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "入力内容を確かめてください", errors };
  }

  const { name, city, shopKind, items, policy, address } = parsed.data;
  // 役割に関係ない項目は保存しない（生産者にお店の種類、購入者に取り扱い食材は持たせない）
  const data = {
    city,
    policy,
    address,
    shopKind: user.role === "BUYER" ? shopKind : null,
    items: user.role === "PRODUCER" ? items : null,
  };

  // ニックネームとプロフィールを、まとめて保存する（片方だけ保存されるのを防ぐ）
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name } }),
    prisma.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data }),
  ]);

  // 覚えておいたログインの情報を新しくして、画面（ヘッダーの名前など）を表示し直す
  await refreshSessionCache();
  refresh();
  return { ok: true, message: "保存しました" };
}
