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
    subtitle: "Ищите темы по доменам и классам.",
    searchPlaceholder: "Найти тему или навык…",
    noResults: "По выбранным фильтрам пока ничего не найдено.",
    resetFilters: "Сбросить фильтры",
    read: "Читать",
    train: "Тренировать",
    classLabel: "Класс",
    allGrades: "Все классы",
    sectionLabel: "Раздел",
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
    subtitle: "Browse topics by domain and grade.",
    searchPlaceholder: "Find a topic or skill…",
    noResults: "No topics found for the current filters.",
    resetFilters: "Reset filters",
    read: "Read",
    train: "Train",
    classLabel: "Grade",
    allGrades: "All grades",
    sectionLabel: "Section",
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
    subtitle: "Themen nach Bereich und Klasse filtern.",
    searchPlaceholder: "Thema oder Fähigkeit suchen…",
    noResults: "Keine Themen für die aktuellen Filter gefunden.",
    resetFilters: "Filter zurücksetzen",
    read: "Lesen",
    train: "Trainieren",
    classLabel: "Klasse",
    allGrades: "Alle Klassen",
    sectionLabel: "Bereich",
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
    <section id="topics-catalog" className="space-y-4 scroll-mt-24">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">{t.title}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t.subtitle}</p>
      </div>

      <SurfaceCard className="p-4">
        <div className="space-y-4">
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
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", ...domainOrder] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleDomainChange(item)}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  domain === item
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]",
                ].join(" ")}
              >
                {item === "all" ? t.allSections : t.domains[item]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t.classLabel}
            </span>
            <select
              value={grade === "all" ? "all" : String(grade)}
              onChange={(event) => {
                setGrade(event.target.value === "all" ? "all" : Number(event.target.value));
              }}
              className="min-w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-strong)]"
            >
              <option value="all">{t.allGrades}</option>
              {gradeOptions.map((item) => (
                <option key={item} value={item}>
                  {locale === "ru" ? `${item} класс` : locale === "de" ? `${item}. Klasse` : `Grade ${item}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
              {t.sectionLabel}: {domain === "all" ? t.allSections : t.domains[domain]}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
              {t.classLabel}:{" "}
              {grade === "all"
                ? t.allGrades
                : locale === "ru"
                  ? `${grade} класс`
                  : locale === "de"
                    ? `${grade}. Klasse`
                    : `Grade ${grade}`}
            </span>
          </div>
        </div>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <SurfaceCard className="p-5">
          <p className="text-sm text-[var(--text-muted)]">{t.noResults}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-soft)]"
          >
            {t.resetFilters}
          </button>
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((topic) => (
            <SurfaceCard key={topic.id} className="flex h-full flex-col p-5">
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">{topic.title[locale]}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">
                {topic.description[locale]}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {topic.canRead ? (
                  <ButtonLink href={buildTopicHref(locale, topic)} variant="secondary">
                    {t.read}
                  </ButtonLink>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)]/60">
                    {t.read}
                  </span>
                )}
                {topic.canTrain ? (
                  <Link
                    href={buildTrainerHref(locale, topic)}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-soft)] hover:text-[var(--primary-hover)]"
                  >
                    {t.train}
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)]/60">
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
