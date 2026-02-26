import Link from "next/link";

import { MasteryLevels } from "@/src/components/topic/MasteryLevels";
import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { topicMastery } from "@/src/lib/topicMastery";

import {
  proporciiSkills,
  proporciiSubtopics,
} from "./module-data";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProporciiTopicPage({ params }: PageProps) {
  const { locale } = await params;
  const mastery = topicMastery["g5.proporcii"];
  const readConspetsHref = `/${locale}/5-klass/proporcii/rule`;
  const skillById = new Map(proporciiSkills.map((skill) => [skill.id, skill]));
  const masteryLevels = (mastery?.masteryLevels ?? [])
    .map((level) => ({
      id: level.id,
      title: level.title,
      hint: level.hint,
      skills: level.skillIds
        .map((skillId) => skillById.get(skillId))
        .filter((skill): skill is (typeof proporciiSkills)[number] => Boolean(skill))
        .map((skill) => ({
          id: skill.id,
          title: skill.title,
          summary: skill.summary,
          status: skill.id === "g5.proporcii.raspoznat_proporciyu" ? "soon" as const : "ready" as const,
          href:
            skill.id === "g5.proporcii.raspoznat_proporciyu"
              ? undefined
              : `/${locale}/5-klass/proporcii/train?skill=${encodeURIComponent(skill.id)}`,
        })),
    }))
    .filter((level) => level.skills.length > 0);

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
            <span>{locale === "ru" ? "Арифметика" : locale === "de" ? "Arithmetik" : "Arithmetic"}</span>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">Пропорции</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Тема</p>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                Level 5
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Пропорции</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Короткий конспект, микро-умения и тренировки по навыкам в формате
              «10 задач подряд».
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href={`/${locale}/5-klass/proporcii/trainer`}
              variant="primary"
            >
              Тренировать
            </ButtonLink>
            <ButtonLink href={readConspetsHref} variant="secondary">
              Читать конспекты
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Структура темы
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Выберите подтему и откройте краткий конспект с навигацией по практике.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {proporciiSubtopics.map((subtopic) => (
            <SurfaceCard key={subtopic.id} className="flex h-full flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Подтема
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Готово
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                {subtopic.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {subtopic.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink
                  href={`/${locale}/5-klass/proporcii/${subtopic.slug}`}
                  variant="secondary"
                >
                  Читать конспект
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <MasteryLevels
        title="Освоение навыков"
        subtitle="Выбери уровень и начни тренировку."
        levels={masteryLevels}
      />

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Навыки</h2>
            <p className="mt-1 text-sm text-slate-600">
              Полный каталог навыков теперь расположен внутри подтем. Ниже — несколько ключевых навыков для быстрого старта.
            </p>
          </div>
          <ButtonLink href={`/${locale}/5-klass/proporcii/rule`} variant="secondary">
            Все навыки →
          </ButtonLink>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {proporciiSkills.slice(0, 3).map((skill) => (
            <SurfaceCard key={skill.id} className="flex h-full flex-col p-5">
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                {skill.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{skill.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink
                  href={`/${locale}/5-klass/proporcii/skills/${skill.skillSlug}`}
                  variant="secondary"
                >
                  Читать
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

        <div className="flex flex-wrap gap-3">
          {proporciiSubtopics.map((subtopic) => (
            <Link
              key={subtopic.id}
              href={`/${locale}/5-klass/proporcii/${subtopic.slug}`}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            >
              Навыки: {subtopic.title}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
