import Link from "next/link";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

import TeachersWaitlistForm from "./TeachersWaitlistForm";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TeachersPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <main className="space-y-6">
      <nav aria-label="Breadcrumbs" className="text-sm text-slate-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-slate-950">
              Главная
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">Для учителей</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Early access
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Для учителей
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Собираем список раннего доступа для школьных материалов и банка задач по
          микро-умениям.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Что будет в раннем доступе</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              Шаблоны контрольных по микро-умениям
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              Печать PDF + ключ ответов
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              Банк задач по темам 5 класса
            </li>
          </ul>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Получить ранний доступ</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Оставьте email и роль. Никакой отправки в сеть сейчас нет: это локальная
            форма MVP с подтверждением на странице.
          </p>
          <div className="mt-4">
            <TeachersWaitlistForm />
          </div>
        </SurfaceCard>
      </section>
    </main>
  );
}

