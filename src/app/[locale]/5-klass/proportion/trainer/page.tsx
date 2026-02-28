import path from "node:path";

import Link from "next/link";

import { parseTaxonomyMarkdownDetails } from "@/lib/tasks/taxonomy";
import { proportionSkills } from "@/src/lib/topics/proportion/module-data";
import { ProportionTrainerSkillGrid } from "@/src/components/topic/ProportionTrainerSkillGrid";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type Locale = "ru" | "en" | "de";

const copy = {
  ru: {
    home: "Главная",
    topic: "Пропорции",
    trainer: "Тренажёр",
    heroKicker: "Тренажёр • Короткая серия задач",
    heroTitle: "Выберите навык для тренировки",
    heroBody:
      "Выберите навык по теме «Пропорции» и решите короткую серию задач. После серии вы получите краткий итог и рекомендацию, что тренировать дальше.",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Понимать отношение как частное",
        summary: "про a:b и a/b",
      },
    },
  },
  en: {
    home: "Home",
    topic: "Proportions",
    trainer: "Trainer",
    heroKicker: "Trainer • Short task series",
    heroTitle: "Choose a skill to train",
    heroBody:
      "Pick a skill in the Proportions topic and solve a short task series. After the series, you will get a brief summary and recommendation for what to train next.",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Understand ratio as quotient",
        summary: "about a:b and a/b",
      },
    },
  },
  de: {
    home: "Startseite",
    topic: "Proportionen",
    trainer: "Trainer",
    heroKicker: "Trainer • Kurze Aufgabenserie",
    heroTitle: "Wählen Sie eine Fähigkeit zum Trainieren",
    heroBody:
      "Wählen Sie eine Fähigkeit im Thema Proportionen und lösen Sie eine kurze Aufgabenserie. Danach erhalten Sie eine kurze Auswertung und eine Empfehlung für den nächsten Schritt.",
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

export default async function ProportionTrainerEntryPage({ params }: PageProps) {
  const { locale } = await params;
  const typedLocale = toLocale(locale);
  const t = copy[typedLocale];
  const taxonomyPath = path.join(process.cwd(), "docs", "TAXONOMY.md");
  const taxonomy = await parseTaxonomyMarkdownDetails(taxonomyPath);
  const skillMetaById = new Map(proportionSkills.map((skill) => [skill.id, skill] as const));

  const skills = taxonomy.skills
    .filter((entry) => entry.skillId.startsWith(`${taxonomy.topicId}.`))
    .map((entry) => {
      const meta = skillMetaById.get(entry.skillId);
      const localized = t.skillLabels[entry.skillId as keyof typeof t.skillLabels];
      return {
        skillId: entry.skillId,
        title: localized?.title ?? meta?.title ?? entry.description,
        description: localized?.summary ?? meta?.summary ?? entry.description,
        trainingCount: meta?.defaultTrainingCount ?? 10,
      };
    });

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
            <Link href={`/${locale}/topics/proportion`} className="hover:text-slate-950">
              {t.topic}
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">{t.trainer}</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          {t.heroKicker}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {t.heroTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {t.heroBody}
        </p>
      </section>

      <ProportionTrainerSkillGrid locale={locale} skills={skills} />
    </main>
  );
}
