// 見た目の部品（全部の画面で同じ見た目にするため、ここ1か所で決める）

// やわらかい影の、丸いカード
export const softCard = "rounded-3xl bg-white shadow-[0_6px_24px_-10px_rgba(31,77,35,0.25)] ring-1 ring-stone-200/70";

// 押せるカード：パソコンでマウスを乗せると、ふわっと少し浮く（動きを減らす設定の人には動かさない）
export const liftOnHover =
  "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_rgba(31,77,35,0.35)] hover:ring-green-700/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

// 入力欄：大きめで丸い
export const inputBox =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-800 focus:border-green-800 focus:outline-none focus:ring-2 focus:ring-green-800/20";
