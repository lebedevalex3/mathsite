import Link from "next/link";

import { MarkdownMath } from "@/lib/ui/MarkdownMath";
import { ArticleProse } from "@/src/components/ui/ArticleProse";
import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const skills = [
  {
    id: "g5.proporcii.naiti_neizvestnyi_krainei",
    title: "Найти неизвестный крайний член",
    summary: "Решение пропорций вида x/b = c/d или a/b = c/x.",
  },
  {
    id: "g5.proporcii.naiti_neizvestnyi_srednii",
    title: "Найти неизвестный средний член",
    summary: "Решение пропорций, где неизвестное находится в среднем члене.",
  },
  {
    id: "g5.proporcii.reshit_zadachu_na_masshtab",
    title: "Задачи на масштаб",
    summary: "Переход между длиной на плане и длиной на местности через отношение.",
  },
  {
    id: "g5.proporcii.reshit_zadachu_na_cenu",
    title: "Задачи на цену",
    summary: "Одинаковая цена за единицу: стоимость, количество, цена.",
  },
] as const;

export default async function ProporciiTopicPage({ params }: PageProps) {
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
          <li>
            <span>5 класс</span>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">Пропорции</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Тема • 5 класс
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Пропорции
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Короткий конспект, микро-умения и тренировки по навыкам в формате
              «10 задач подряд».
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/${locale}/5-klass/proporcii`} variant="secondary">
              PDF (скоро)
            </ButtonLink>
            <ButtonLink
              href={`/${locale}/5-klass/proporcii/trainer`}
              variant="primary"
            >
              Тренировать
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="p-6">
          <ArticleProse className="max-w-none">
            <h2>Быстрый конспект</h2>
            <p>Основное свойство пропорции:</p>
            <MarkdownMath>{`$$\\frac{a}{b}=\\frac{c}{d}\\Rightarrow ad=bc$$`}</MarkdownMath>
            <p>
              Обычно решение сводится к применению свойства пропорции и выражению
              неизвестного члена.
            </p>
          </ArticleProse>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Действия в теме</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              Открой микро-умение и разберите типовой алгоритм.
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              Перейди в тренажёр по конкретному навыку.
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              Реши 10 задач подряд и сравни время/точность.
            </li>
          </ul>
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Микро-умения
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Карточки для чтения и тренировки по конкретным операциям.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {skills.map((skill) => (
            <SurfaceCard key={skill.id} className="flex h-full flex-col p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {skill.id}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                {skill.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {skill.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink
                  href={`/${locale}/5-klass/proporcii/skills/naiti-neizvestnyi`}
                  variant="secondary"
                >
                  Открыть
                </ButtonLink>
                <ButtonLink
                  href={`/${locale}/5-klass/proporcii/train?skill=${encodeURIComponent(skill.id)}`}
                  variant="ghost"
                >
                  Тренировать
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </main>
  );
}
