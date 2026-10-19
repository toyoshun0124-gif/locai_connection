// 読み込み中に、真ん中に出すくるくる回る印（ヘッダーとタブはそのまま）
export function Spinner({ label = "読み込み中" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-20 text-green-800">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700 motion-reduce:animate-none" />
      <span className="text-sm text-stone-500">{label}…</span>
    </div>
  );
}
