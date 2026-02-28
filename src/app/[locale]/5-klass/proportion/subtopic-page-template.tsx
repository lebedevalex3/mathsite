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
  type ProportionSubtopic,
} from "@/src/lib/topics/proportion/module-data";

type TemplateProps = {
  locale: string;
  slug: ProportionSubtopic["slug"];
  intro: string;
  children?: ReactNode;
};

type Locale = "ru" | "en" | "de";

const copy = {
  ru: {
    home: "Главная",
    domain: "Арифметика",
    topic: "Пропорции",
    subtopicKicker: "Подтема • Пропорции",
    fallback: {
      idea: "Определение / идея",
      algorithm: "Алгоритм",
      algorithmSteps: [
        "Определи, какие величины связаны и как именно.",
        "Запиши отношение или пропорцию в одном порядке величин.",
        "Примени нужное правило и найди неизвестное.",
        "Проверь ответ по смыслу задачи.",
      ],
      examples: "Примеры",
      examplesBody: "Добавьте 2-3 разобранных примера для этой подтемы (MVP-заглушка).",
      mistakes: "Типичные ошибки",
      mistakesItems: [
        "Перепутан порядок величин в отношениях.",
        "Составлена пропорция из несоответствующих единиц измерения.",
        "Нет проверки полученного ответа.",
      ],
      practice: "Практика",
      practiceBody:
        "Ниже размещён каталог навыков этой подтемы: можно найти нужный навык, открыть объяснение или перейти в тренажёр.",
    },
    skillsTitle: "Навыки этой подтемы",
    skillsBody:
      "Компактный список навыков с поиском, фильтром по наличию тренажёра и кнопкой «Показать все».",
    skillsEmpty: "По текущим условиям навыки не найдены. Снимите фильтр или измените запрос.",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Понимать отношение как частное",
        summary: "про a:b и a/b",
      },
    },
  },
  en: {
    home: "Home",
    domain: "Arithmetic",
    topic: "Proportions",
    subtopicKicker: "Subtopic • Proportions",
    fallback: {
      idea: "Definition / Idea",
      algorithm: "Algorithm",
      algorithmSteps: [
        "Identify which quantities are related and how.",
        "Write the ratio or proportion in a consistent order.",
        "Apply the needed rule and find the unknown.",
        "Check the result against the problem context.",
      ],
      examples: "Examples",
      examplesBody: "Add 2-3 worked examples for this subtopic (MVP placeholder).",
      mistakes: "Common mistakes",
      mistakesItems: [
        "Mixing up the order of quantities in ratios.",
        "Building a proportion from mismatched measurement units.",
        "Skipping result verification.",
      ],
      practice: "Practice",
      practiceBody:
        "Below is a skill catalog for this subtopic: find the needed skill, open explanation, or go to trainer.",
    },
    skillsTitle: "Skills in this subtopic",
    skillsBody: "Compact skill list with search, trainer availability filter, and a Show all button.",
    skillsEmpty: "No skills match current filters. Clear filters or adjust your query.",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Understand ratio as quotient",
        summary: "about a:b and a/b",
      },
    },
  },
  de: {
    home: "Startseite",
    domain: "Arithmetik",
    topic: "Proportionen",
    subtopicKicker: "Unterthema • Proportionen",
    fallback: {
      idea: "Definition / Idee",
      algorithm: "Algorithmus",
      algorithmSteps: [
        "Bestimmen Sie, welche Größen zusammenhängen und wie.",
        "Schreiben Sie Verhältnis oder Proportion in einheitlicher Reihenfolge.",
        "Wenden Sie die passende Regel an und finden Sie die Unbekannte.",
        "Prüfen Sie das Ergebnis im Sachkontext.",
      ],
      examples: "Beispiele",
      examplesBody: "Fügen Sie 2-3 gelöste Beispiele für dieses Unterthema hinzu (MVP-Platzhalter).",
      mistakes: "Typische Fehler",
      mistakesItems: [
        "Reihenfolge der Größen in Verhältnissen verwechselt.",
        "Proportion aus nicht passenden Maßeinheiten gebildet.",
        "Keine Prüfung des Ergebnisses.",
      ],
      practice: "Übung",
      practiceBody:
        "Unten finden Sie den Fähigkeitskatalog dieses Unterthemas: passende Fähigkeit finden, Erklärung öffnen oder zum Trainer wechseln.",
    },
    skillsTitle: "Fähigkeiten in diesem Unterthema",
    skillsBody:
      "Kompakte Fähigkeitsliste mit Suche, Trainer-Filter und Schaltfläche „Alle anzeigen“.",
    skillsEmpty: "Keine Fähigkeiten für die aktuellen Filter gefunden. Filter zurücksetzen oder Anfrage ändern.",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Verhältnis als Quotient verstehen",
        summary: "zu a:b und a/b",
      },
    },
  },
} as const;

function toLocale(value: string): Locale {
  if (value === "en" || value === "de") return value;
  return "ru";
}

export async function SubtopicPageTemplate({
  locale,
  slug,
  intro,
  children,
}: TemplateProps) {
  const typedLocale = toLocale(locale);
  const t = copy[typedLocale];
  const subtopic = getSubtopicBySlug(slug);
  if (!subtopic) return null;
  const contentIndex = await loadTopicSubtopicIndex("proportion", {
    locale,
    domain: "arithmetic",
  });
  const contentSubtopic = contentIndex.subtopics.find((item) => item.slug === slug);

  const skills = getSkillsForSubtopic(subtopic.id);
  const { tasks } = await getTasksForTopic("math.proportion");
  const taskCountsBySkill = new Map<string, number>();
  for (const task of tasks) {
    taskCountsBySkill.set(task.skill_id, (taskCountsBySkill.get(task.skill_id) ?? 0) + 1);
  }

  const catalogItems = skills.map((skill) => {
    const count = taskCountsBySkill.get(skill.id) ?? 0;
    const hasTrainer = count >= 10;
    const localized = t.skillLabels[skill.id as keyof typeof t.skillLabels];

    return {
      title: localized?.title ?? skill.title,
      description: localized?.summary ?? skill.summary,
      readHref: `/${locale}/topics/proportion/skills/${skill.skillSlug}`,
      trainHref: `/${locale}/topics/proportion/train?skill=${encodeURIComponent(skill.id)}`,
      hasTrainer,
    };
  });

  const subtopicNavItems = contentIndex.subtopics.map((item) => ({
    id: item.slug,
    title: item.title,
    href: `/${locale}/topics/proportion/${item.slug}`,
  }));
  const currentSubtopicHref = `/${locale}/topics/proportion/${subtopic.slug}`;
  const currentSubtopicTitle = contentSubtopic?.title ?? subtopic.title;

  return (
    <main className="space-y-6">
      <nav aria-label="Breadcrumbs" className="text-sm text-slate-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-slate-950">
              {t.home}
            </Link>
          </li>
          <li>/</li>
          <li>
            <span>{t.domain}</span>
          </li>
          <li>/</li>
          <li>
            <Link href={`/${locale}/topics/proportion`} className="hover:text-slate-950">
              {t.topic}
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
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          {t.subtopicKicker}
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
              <h2>{t.fallback.idea}</h2>
              <p>{subtopic.description}</p>

              <h2>{t.fallback.algorithm}</h2>
              <ol>
                {t.fallback.algorithmSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>

              <h2>{t.fallback.examples}</h2>
              <p>{t.fallback.examplesBody}</p>

              <h2>{t.fallback.mistakes}</h2>
              <ul>
                {t.fallback.mistakesItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h2>{t.fallback.practice}</h2>
              <p>
                {t.fallback.practiceBody}
              </p>
            </>
          )}
        </ArticleProse>
      </SurfaceCard>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {t.skillsTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t.skillsBody}
          </p>
        </div>
        <SkillCatalogList
          items={catalogItems}
          emptyLabel={t.skillsEmpty}
        />
      </section>
    </main>
  );
}
