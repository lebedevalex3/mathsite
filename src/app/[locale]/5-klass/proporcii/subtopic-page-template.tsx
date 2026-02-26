import Link from "next/link";
import type { ReactNode } from "react";

import { getTasksForTopic } from "@/lib/tasks/query";
import { loadTopicSubtopicIndex } from "@/src/lib/content";
import { ArticleProse } from "@/src/components/ui/ArticleProse";
import { MobileSubtopicSelect } from "@/src/components/ui/MobileSubtopicSelect";
import { SkillCatalogList } from "@/src/components/ui/SkillCatalogList";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

import {
  getSkillsForSubtopic,
  getSubtopicBySlug,
  type ProporciiSubtopic,
} from "./module-data";

type TemplateProps = {
  locale: string;
  slug: ProporciiSubtopic["slug"];
  intro: string;
  children?: ReactNode;
};

export async function SubtopicPageTemplate({
  locale,
  slug,
  intro,
  children,
}: TemplateProps) {
  const subtopic = getSubtopicBySlug(slug);
  if (!subtopic) return null;
  const contentIndex = await loadTopicSubtopicIndex("proporcii", {
    locale,
    domain: "arithmetic",
  });
  const contentSubtopic = contentIndex.subtopics.find((item) => item.slug === slug);

  const skills = getSkillsForSubtopic(subtopic.id);
  const { tasks } = await getTasksForTopic("g5.proporcii");
  const taskCountsBySkill = new Map<string, number>();
  for (const task of tasks) {
    taskCountsBySkill.set(task.skill_id, (taskCountsBySkill.get(task.skill_id) ?? 0) + 1);
  }

  const catalogItems = skills.map((skill) => {
    const count = taskCountsBySkill.get(skill.id) ?? 0;
    const hasTrainer = count >= 10;

    return {
      title: skill.title,
      description: skill.summary,
      readHref: `/${locale}/5-klass/proporcii/skills/${skill.skillSlug}`,
      trainHref: `/${locale}/5-klass/proporcii/train?skill=${encodeURIComponent(skill.id)}`,
      hasTrainer,
    };
  });

  const subtopicNavItems = contentIndex.subtopics.map((item) => ({
    id: item.slug,
    title: item.title,
    href: `/${locale}/5-klass/proporcii/${item.slug}`,
  }));
  const currentSubtopicHref = `/${locale}/5-klass/proporcii/${subtopic.slug}`;
  const currentSubtopicTitle = contentSubtopic?.title ?? subtopic.title;

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
          <li>
            <Link href={`/${locale}/5-klass/proporcii`} className="hover:text-slate-950">
              Пропорции
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">{currentSubtopicTitle}</li>
        </ol>
      </nav>

      <div className="pt-1">
        <MobileSubtopicSelect
          locale={locale}
          value={currentSubtopicHref}
          items={subtopicNavItems}
        />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Подтема • Пропорции
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {currentSubtopicTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{intro}</p>
      </section>

      <SurfaceCard className="p-6">
        <ArticleProse className="max-w-none lg:[&_h2#toc]:hidden lg:[&_h2#toc+ul]:hidden">
          {children ?? (
            <>
              <h2>Определение / идея</h2>
              <p>{subtopic.description}</p>

              <h2>Алгоритм</h2>
              <ol>
                <li>Определи, какие величины связаны и как именно.</li>
                <li>Запиши отношение или пропорцию в одном порядке величин.</li>
                <li>Примени нужное правило и найди неизвестное.</li>
                <li>Проверь ответ по смыслу задачи.</li>
              </ol>

              <h2>Примеры</h2>
              <p>Добавьте 2-3 разобранных примера для этой подтемы (MVP-заглушка).</p>

              <h2>Типичные ошибки</h2>
              <ul>
                <li>Перепутан порядок величин в отношениях.</li>
                <li>Составлена пропорция из несоответствующих единиц измерения.</li>
                <li>Нет проверки полученного ответа.</li>
              </ul>

              <h2>Практика</h2>
              <p>
                Ниже размещён каталог навыков этой подтемы: можно найти нужный навык,
                открыть объяснение или перейти в тренажёр.
              </p>
            </>
          )}
        </ArticleProse>
      </SurfaceCard>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Навыки этой подтемы
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Компактный список навыков с поиском, фильтром по наличию тренажёра и кнопкой «Показать все».
          </p>
        </div>
        <SkillCatalogList
          items={catalogItems}
          emptyLabel="По текущим условиям навыки не найдены. Снимите фильтр или измените запрос."
        />
      </section>
    </main>
  );
}
