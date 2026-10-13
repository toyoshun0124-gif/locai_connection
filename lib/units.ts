// 量（kg ⇔ g）と日付の変換。小数の計算はしない（文字のまま分けて整数にする）

// "1.5" → 1500（g）。小数点以下は1桁（0.1kg = 100g）まで。形が違えば null
export function kgTextToGrams(text: string): number | null {
  const m = /^(\d{1,4})(?:\.(\d))?$/.exec(text.trim());
  if (!m) return null;
  return Number(m[1]) * 1000 + Number(m[2] ?? "0") * 100;
}

// 1500 → "1.5"（入力欄に戻すとき）
export function gramsToKgText(g: number): string {
  const kg = Math.floor(g / 1000);
  const rest = (g % 1000) / 100;
  return rest === 0 ? String(kg) : `${kg}.${rest}`;
}

// 1500 → "1.5kg"（画面に出すとき）
export function formatKg(g: number): string {
  return `${gramsToKgText(g)}kg`;
}

// 日本時間の「今日」を "YYYY-MM-DD" で返す（スマホの時計ではなくサーバーの時計を使う）
export function todayInJapan(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

// "YYYY-MM-DD" に日数を足す
export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "2026-10-20" → "10/20（火）"
export function formatYmd(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  const w = "日月火水木金土"[d.getUTCDay()];
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${w}）`;
}

// データベースの日付（@db.Date）→ "YYYY-MM-DD"
export function dateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
