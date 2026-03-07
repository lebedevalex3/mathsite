"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import {
  getTopicDomains,
  type AppLocale,
  type TopicCatalogEntry,
  type TopicDomain,
  topicCatalogEntries,
} from "@/src/lib/topicMeta";

type HomeTopicCatalogProps = {
  locale: AppLocale;
};
type GradeFilter = number | "all";
type DomainFilter = TopicDomain | "all";

const copy = {
  ru: {
    title: "Темы",
    subtitle: "Каталог тем и навыков для подготовки урока и практики.",
    searchPlaceholder: "Найти тему или навык...",
    noResults: "По выбранным фильтрам пока ничего не найдено.",
    resetFilters: "Сбросить фильтры",
    read: "Читать",
    train: "Тренировать",
    classLabel: "Класс",
    allGrades: "Все классы",
    allSections: "Все разделы",
    domains: {
      arithmetic: "Арифметика",
      algebra: "Алгебра",
      geometry: "Геометрия",
      data: "Данные",
    },
  },
  en: {
    title: "Topics",
    subtitle: "Catalog of topics and skills for lesson prep and practice.",
    searchPlaceholder: "Find a topic or skill...",
    noResults: "No topics found for the current filters.",
    resetFilters: "Reset filters",
    read: "Read",
    train: "Train",
    classLabel: "Grade",
    allGrades: "All grades",
    allSections: "All sections",
    domains: {
      arithmetic: "Arithmetic",
      algebra: "Algebra",
      geometry: "Geometry",
      data: "Data",
    },
  },
  de: {
    title: "Themen",
    subtitle: "Katalog der Themen und Faehigkeiten fuer Unterricht und Uebung.",
    searchPlaceholder: "Thema oder Faehigkeit suchen...",
    noResults: "Keine Themen fuer die aktuellen Filter gefunden.",
    resetFilters: "Filter zuruecksetzen",
    read: "Lesen",
    train: "Trainieren",
    classLabel: "Klasse",
    allGrades: "Alle Klassen",
    allSections: "Alle Bereiche",
    domains: {
      arithmetic: "Arithmetik",
      algebra: "Algebra",
      geometry: "Geometrie",
      data: "Daten",
    },
  },
} as const;

const domainOrder: TopicDomain[] = ["arithmetic", "algebra", "geometry", "data"];

function parseDomainParam(value: string | null): DomainFilter | null {
  if (value === "all") return "all";
  if (value === "arithmetic" || value === "algebra" || value === "geometry" || value === "data") {
    return value;
  }
  return null;
}

function buildTopicHref(locale: AppLocale, entry: TopicCatalogEntry) {
  return `/${locale}/${entry.slug}`;
}

function buildTrainerHref(locale: AppLocale, entry: TopicCatalogEntry) {
  if (entry.id === "math.proportion") {
    return `/${locale}/topics/proportion/trainer`;
  }
  return buildTopicHref(locale, entry);
}

export function HomeTopicCatalog({ locale }: HomeTopicCatalogProps) {
  const t = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryDomain = parseDomainParam(searchParams.get("domain"));
  const domain = queryDomain ?? "all";
  const gradeOptions = useMemo(
    () =>
      [...new Set(topicCatalogEntries.flatMap((entry) => entry.levels))]
        .sort((left, right) => left - right),
    [],
  );
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<GradeFilter>("all");

  function handleDomainChange(nextDomain: DomainFilter) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("domain", nextDomain);

    router.replace(`${pathname}?${nextParams.toString()}#topics-catalog`, { scroll: false });
  }

  function resetFilters() {
    setGrade("all");
    setQuery("");
    handleDomainChange("all");
  }

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return topicCatalogEntries.filter((entry) => {
      if (domain !== "all" && !getTopicDomains(entry).includes(domain)) return false;
      if (grade !== "all" && !entry.levels.includes(grade)) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        entry.title[locale],
        entry.description[locale],
        ...entry.searchTerms[locale],
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [domain, grade, locale, query]);

  return (
    <section id="topics-catalog" className="space-y-5 scroll-mt-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-strong)]">{t.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{t.subtitle}</p>
      </div>

      <SurfaceCard className="border-[var(--border)]/65 bg-[var(--surface)]/45 p-4 shadow-none sm:p-5">
        <div className="space-y-5">
          <div>
            <label htmlFor="home-topic-search" className="sr-only">
              {t.searchPlaceholder}
            </label>
            <input
              id="home-topic-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-transparent bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none shadow-[inset_0_0_0_1px_var(--border)] placeholder:text-[var(--text-muted)] focus:shadow-[inset_0_0_0_1px_var(--primary)]"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            {(["all", ...domainOrder] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleDomainChange(item)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  domain === item
                    ? "bg-[var(--primary)] text-white shadow-[0_12px_26px_-20px_rgba(11,60,138,0.5)]"
                    : "border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--surface-soft)]",
                ].join(" ")}
              >
                {item === "all" ? t.allSections : t.domains[item]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t.classLabel}
            </span>
            <select
              value={grade === "all" ? "all" : String(grade)}
              onChange={(event) => {
                setGrade(event.target.value === "all" ? "all" : Number(event.target.value));
              }}
              className="min-w-40 rounded-xl border border-transparent bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-strong)] shadow-[inset_0_0_0_1px_var(--border)]"
            >
              <option value="all">{t.allGrades}</option>
              {gradeOptions.map((item) => (
                <option key={item} value={item}>
                  {locale === "ru" ? `${item} класс` : locale === "de" ? `${item}. Klasse` : `Grade ${item}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <SurfaceCard className="border-[var(--border)]/65 bg-[var(--surface)]/45 p-5 shadow-none">
          <p className="text-sm text-[var(--text-muted)]">{t.noResults}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-soft)]"
          >
            {t.resetFilters}
          </button>
        </SurfaceCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((topic) => (
            <SurfaceCard
              key={topic.id}
              className="flex h-full flex-col rounded-lg border border-[var(--border)]/80 bg-[var(--card)] p-5 shadow-[0_10px_24px_-26px_rgba(11,60,138,0.24)] transition-shadow hover:shadow-[0_16px_30px_-26px_rgba(11,60,138,0.28)]"
            >
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">{topic.title[locale]}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-muted)]/90">
                {topic.description[locale]}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {topic.canRead ? (
                  <ButtonLink href={buildTopicHref(locale, topic)} variant="secondary" className="min-h-11 rounded-xl border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-soft)]">
                    {t.read}
                  </ButtonLink>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--border)]/70 bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-muted)]/60">
                    {t.read}
                  </span>
                )}
                {topic.canTrain ? (
                  <Link
                    href={buildTrainerHref(locale, topic)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-22px_rgba(11,60,138,0.5)] transition-colors hover:bg-[var(--primary-hover)]"
                  >
                    {t.train}
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--border)]/70 bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-muted)]/60">
                    {t.train}
                  </span>
                )}
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </section>
  );
}
