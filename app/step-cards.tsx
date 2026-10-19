// 「このアプリの使い方」の3つのステップカード（三上さんと坂田さんで、同じ形・同じ動きにする）
import { liftOnHover, softCard } from "@/lib/ui";

export type Step = { icon: string; title: string; text: string; color: string };

export function StepCards({ steps }: { steps: Step[] }) {
  return (
    <section className="mt-5">
      <h2 className="text-base text-green-900">このアプリの使い方</h2>
      <ol className="mt-2 grid gap-3 sm:grid-cols-3">
        {steps.map((st) => (
          <li key={st.title} className={`${softCard} ${liftOnHover} flex items-start gap-3 p-4`}>
            <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${st.color}`}>{st.icon}</span>
            <span className="min-w-0">
              <span className="font-heading block text-green-900">{st.title}</span>
              <span className="block text-sm text-stone-600">{st.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
