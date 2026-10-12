// 登録のときに選べる値と、画面に出す日本語の名前（画面とサーバーの両方で使う）
import { z } from "zod";

export const PREFECTURES = {
  OSAKA: "大阪府",
  KYOTO: "京都府",
  HYOGO: "兵庫県",
  NARA: "奈良県",
  SHIGA: "滋賀県",
  WAKAYAMA: "和歌山県",
} as const;

export const ROLES = {
  BUYER: "購入者（お店・一般の方）",
  PRODUCER: "生産者（農家さん）",
} as const;

export const BUYER_TYPES = {
  RESTAURANT: "飲食店",
  CONSUMER: "一般消費者",
} as const;

// 入力チェックのルール（ここに無い値は受け付けない）
export const roleSchema = z.enum(["BUYER", "PRODUCER"]);
export const buyerTypeSchema = z.enum(["RESTAURANT", "CONSUMER"]);
export const prefectureSchema = z.enum(["OSAKA", "KYOTO", "HYOGO", "NARA", "SHIGA", "WAKAYAMA"]);
