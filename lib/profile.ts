// プロフィールの入力ルール（画面とサーバーの両方で使う）
import { z } from "zod";

// 空欄は「未登録」として扱う（スキップできるので、どの項目も必須にしない）
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max}文字までで入力してください`)
    .transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  name: z.string().trim().min(1, "ニックネーム（農園名）を入力してください").max(30, "30文字までで入力してください"),
  city: optionalText(30),
  shopKind: optionalText(30),
  items: optionalText(100),
  policy: optionalText(200),
  address: optionalText(200),
});

export type ProfileInput = z.input<typeof profileSchema>;
