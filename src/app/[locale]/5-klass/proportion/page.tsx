import Link from "next/link";

import { TopicLeaderboardPanel } from "@/src/components/topic/TopicLeaderboardPanel";
import { TopicSkillMap } from "@/src/components/topic/TopicSkillMap";
import { TopicMotivationPanel } from "@/src/components/topic/TopicMotivationPanel";
import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { topicMastery } from "@/src/lib/topicMastery";

import {
  proportionSkills,
  proportionSubtopics,
} from "@/src/lib/topics/proportion/module-data";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type Locale = "ru" | "en" | "de";

const copy = {
  ru: {
    home: "Главная",
    domain: "Арифметика",
    topic: "Пропорции",
    sectionLabel: "Тема",
    heroBody:
      "Тема представлена как карта навыков: двигайся по шагам, тренируй конкретные умения и закрывай слабые места.",
    train: "Тренировать",
    theory: "Короткая теория",
    subtopics: "Подтемы",
    subtopicsHint: "Если нужен краткий разбор идеи перед тренировкой, открой нужную подтему.",
    openSubtopic: "Открыть подтему",
    levelTitleById: {
      base: "База",
      calculation: "Вычисление",
      application: "Применение",
    },
    levelHintById: {
      base: "Понимание и проверка записи пропорции.",
      calculation: "Находим неизвестный член и собираем пропорцию.",
      application: "Решаем типовые задачи на пропорции.",
    },
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Понимать отношение как частное",
        summary: "про a:b и a/b",
      },
    },
    subtopicsBySlug: {
      rule: {
        title: "Основное правило пропорции",
        description: "Свойство ad = bc, проверка пропорции и поиск неизвестного члена.",
      },
      direct: {
        title: "Прямая пропорциональность",
        description: "Как связаны величины, растущие или уменьшающиеся вместе.",
      },
      inverse: {
        title: "Обратная пропорциональность",
        description: "Зависимости вида «больше одной величины — меньше другой».",
      },
      problems: {
        title: "Задачи на пропорции",
        description: "Текстовые задачи на масштаб, цену, производительность и модели.",
      },
    },
  },
  en: {
    home: "Home",
    domain: "Arithmetic",
    topic: "Proportions",
    sectionLabel: "Topic",
    heroBody:
      "The topic is presented as a skill map: move step by step, train specific skills, and close weak spots.",
    train: "Train",
    theory: "Quick theory",
    subtopics: "Subtopics",
    subtopicsHint: "If you need a short concept refresher before training, open a subtopic.",
    openSubtopic: "Open subtopic",
    levelTitleById: {
      base: "Core",
      calculation: "Computation",
      application: "Application",
    },
    levelHintById: {
      base: "Understanding and checking proportion notation.",
      calculation: "Finding unknown terms and building proportions.",
      application: "Solving common proportion word problems.",
    },
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Understand ratio as quotient",
        summary: "about a:b and a/b",
      },
    },
    subtopicsBySlug: {
      rule: {
        title: "Core proportion rule",
        description: "Property ad = bc, checking proportions, and finding unknown terms.",
      },
      direct: {
        title: "Direct proportion",
        description: "How quantities change together when both increase or decrease.",
      },
      inverse: {
        title: "Inverse proportion",
        description: "Dependencies where one quantity increases while another decreases.",
      },
      problems: {
        title: "Proportion problems",
        description: "Word problems about scale, price, productivity, and simple models.",
      },
    },
  },
  de: {
    home: "Startseite",
    domain: "Arithmetik",
    topic: "Proportionen",
    sectionLabel: "Thema",
    heroBody:
      "Das Thema wird als Kompetenzkarte dargestellt: schrittweise lernen, gezielt trainieren und Lücken schließen.",
    train: "Trainieren",
    theory: "Kurze Theorie",
    subtopics: "Unterthemen",
    subtopicsHint:
      "Wenn Sie vor dem Training eine kurze Wiederholung brauchen, öffnen Sie ein Unterthema.",
    openSubtopic: "Unterthema öffnen",
    levelTitleById: {
      base: "Basis",
      calculation: "Berechnung",
      application: "Anwendung",
    },
    levelHintById: {
      base: "Verständnis und Prüfung der Proportionsschreibweise.",
      calculation: "Unbekannte Glieder finden und Proportionen aufstellen.",
      application: "Typische Sachaufgaben zu Proportionen lösen.",
    },
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": {
        title: "Verhältnis als Quotient verstehen",
        summary: "zu a:b und a/b",
      },
    },
    subtopicsBySlug: {
      rule: {
        title: "Grundregel der Proportion",
        description: "Eigenschaft ad = bc, Proportion prüfen und unbekanntes Glied finden.",
      },
      direct: {
        title: "Direkte Proportionalität",
        description: "Wie sich Größen gemeinsam nach oben oder unten verändern.",
      },
      inverse: {
        title: "Umgekehrte Proportionalität",
        description: "Abhängigkeiten: mehr von einer Größe bedeutet weniger von der anderen.",
      },
      problems: {
        title: "Aufgaben zu Proportionen",
        description: "Sachaufgaben zu Maßstab, Preis, Produktivität und Modellen.",
      },
    },
  },
} as const;

function toLocale(value: string): Locale {
  if (value === "en" || value === "de") return value;
  return "ru";
}

export default async function ProportionTopicPage({ params }: PageProps) {
  const { locale } = await params;
  const typedLocale = toLocale(locale);
  const t = copy[typedLocale];
  const mastery = topicMastery["math.proportion"];
  const readConspetsHref = `/${locale}/topics/proportion/rule`;
  const skillById = new Map(proportionSkills.map((skill) => [skill.id, skill]));
  const masteryLevels = (mastery?.masteryLevels ?? [])
    .map((level) => ({
      id: level.id,
      title: t.levelTitleById[level.id as keyof typeof t.levelTitleById] ?? level.title,
      hint: t.levelHintById[level.id as keyof typeof t.levelHintById] ?? level.hint,
      skills: level.skillIds
        .map((skillId) => skillById.get(skillId))
        .filter((skill): skill is (typeof proportionSkills)[number] => Boolean(skill))
        .map((skill) => ({
          id: skill.id,
          title: t.skillLabels[skill.id as keyof typeof t.skillLabels]?.title ?? skill.title,
          summary: t.skillLabels[skill.id as keyof typeof t.skillLabels]?.summary ?? skill.summary,
          trainHref:
            skill.id === "math.proportion.recognize_proportion"
              ? undefined
              : `/${locale}/topics/proportion/train?skill=${encodeURIComponent(skill.id)}`,
        })),
    }))
    .filter((level) => level.skills.length > 0);

  return (
    <main className="space-y-6">
      <nav aria-label="Breadcrumbs" className="text-sm text-[var(--text-muted)]">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-[var(--text-strong)]">
              {t.home}
            </Link>
          </li>
          <li>/</li>
          <li>
            <span>{t.domain}</span>
          </li>
          <li>/</li>
          <li className="font-medium text-[var(--text-strong)]">{t.topic}</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_45px_-30px_rgba(11,60,138,0.45)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-foreground)]">
                {t.sectionLabel}
              </p>
              <span className="rounded-full border border-[var(--border)] bg-[var(--info)] px-2.5 py-0.5 text-xs font-semibold text-[var(--info-foreground)]">
                Level 5
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-strong)] sm:text-4xl">
              {t.topic}
            </h1>
            <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
              {t.heroBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href={`/${locale}/topics/proportion/trainer`}
              variant="primary"
            >
              {t.train}
            </ButtonLink>
            <ButtonLink href={readConspetsHref} variant="secondary">
              {t.theory}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TopicMotivationPanel
          locale={locale as "ru" | "en" | "de"}
          topicId="math.proportion"
          progressHref={`/${locale}/progress`}
        />
        <TopicLeaderboardPanel locale={locale as "ru" | "en" | "de"} topicId="math.proportion" />
      </section>

      <TopicSkillMap locale={locale as "ru" | "en" | "de"} topicId="math.proportion" levels={masteryLevels} />

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">{t.subtopics}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t.subtopicsHint}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {proportionSubtopics.map((subtopic) => (
            <SurfaceCard key={subtopic.id} className="flex h-full flex-col p-5">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                {t.subtopicsBySlug[subtopic.slug].title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">
                {t.subtopicsBySlug[subtopic.slug].description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink
                  href={`/${locale}/topics/proportion/${subtopic.slug}`}
                  variant="secondary"
                >
                  {t.openSubtopic}
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </main>
  );
}
