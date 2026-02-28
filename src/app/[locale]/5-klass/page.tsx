import Link from "next/link";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { getGrade5Topics } from "@/src/lib/nav/grade5";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Grade5TopicsPage({ params }: PageProps) {
  const { locale } = await params;
  const topics = getGrade5Topics(locale);

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
          <li className="font-medium text-slate-950">5 класс</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          Оглавление
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          5 класс — темы
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Выберите тему для чтения электронного учебника и тренировки по микро-умениям.
          Доступные темы отмечены как «Готово».
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => (
          <SurfaceCard
            key={topic.id}
            className={[
              "flex h-full flex-col p-5",
              topic.status === "soon" ? "border-dashed border-slate-300 bg-slate-50" : "",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                {topic.title}
              </h2>
              {topic.status === "ready" ? (
                <span className="rounded-full border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--success)]">
                  Готово
                </span>
              ) : (
                <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                  Скоро
                </span>
              )}
            </div>

            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{topic.description}</p>

            <div className="mt-4">
              {topic.href ? (
                <ButtonLink href={topic.href} variant="secondary">
                  Читать
                </ButtonLink>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
                  Скоро
                </span>
              )}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </main>
  );
}

