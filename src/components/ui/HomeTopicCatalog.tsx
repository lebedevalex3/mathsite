"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import {
  type AppLocale,
  type TopicCatalogEntry,
  type TopicDomain,
  type TopicStatus,
  topicCatalogEntries,
} from "@/src/lib/topicMeta";

type HomeTopicCatalogProps = {
  locale: AppLocale;
};

const copy = {
  ru: {
    title: "Темы",
    subtitle: "Ищите темы по доменам, уровню и статусу готовности.",
    searchPlaceholder: "Найти тему или навык…",
    noResults: "По выбранным фильтрам пока ничего не найдено.",
    read: "Читать",
    train: "Тренировать",
    ready: "Готово",
    soon: "Скоро",
    levelLabel: "Level",
    statusLabel: "Статус",
    domains: {
      arithmetic: "Арифметика",
      algebra: "Алгебра",
      geometry: "Геометрия",
      data: "Данные",
    },
  },
  en: {
    title: "Topics",
    subtitle: "Browse topics by domain, level, and readiness status.",
    searchPlaceholder: "Find a topic or skill…",
    noResults: "No topics found for the current filters.",
    read: "Read",
    train: "Train",
    ready: "Ready",
    soon: "Soon",
    levelLabel: "Level",
    statusLabel: "Status",
    domains: {
      arithmetic: "Arithmetic",
      algebra: "Algebra",
      geometry: "Geometry",
      data: "Data",
    },
  },
  de: {
    title: "Themen",
    subtitle: "Themen nach Bereich, Level und Status filtern.",
    searchPlaceholder: "Thema oder Fähigkeit suchen…",
    noResults: "Keine Themen für die aktuellen Filter gefunden.",
    read: "Lesen",
    train: "Trainieren",
    ready: "Fertig",
    soon: "Bald",
    levelLabel: "Level",
    statusLabel: "Status",
    domains: {
      arithmetic: "Arithmetik",
      algebra: "Algebra",
      geometry: "Geometrie",
      data: "Daten",
    },
  },
} as const;

const domainOrder: TopicDomain[] = ["arithmetic", "algebra", "geometry", "data"];
const levels = [5, 6];

function statusBadge(status: TopicStatus, locale: AppLocale) {
  const t = copy[locale];
  if (status === "ready") {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        {t.ready}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
      {t.soon}
    </span>
  );
}

function buildTopicHref(locale: AppLocale, entry: TopicCatalogEntry) {
  return `/${locale}/${entry.slug}`;
}

function buildTrainerHref(locale: AppLocale, entry: TopicCatalogEntry) {
  if (entry.id === "g5.proporcii") {
    return `/${locale}/5-klass/proporcii/trainer`;
  }
  return buildTopicHref(locale, entry);
}

export function HomeTopicCatalog({ locale }: HomeTopicCatalogProps) {
  const t = copy[locale];
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<TopicDomain>("arithmetic");
  const [level, setLevel] = useState<number>(5);
  const [status, setStatus] = useState<TopicStatus>("ready");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return topicCatalogEntries.filter((entry) => {
      if (entry.domain !== domain) return false;
      if (!entry.levels.includes(level)) return false;
      if (entry.status !== status) return false;

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
  }, [domain, level, locale, query, status]);

  return (
    <section id="topics-catalog" className="space-y-4 scroll-mt-24">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {domainOrder.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDomain(item)}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  domain === item
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.domains[item]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.levelLabel}
              </span>
              {levels.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLevel(item)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    level === item
                      ? "border-blue-700 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  Level {item}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.statusLabel}
              </span>
              {(["ready", "soon"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    status === item
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {item === "ready" ? t.ready : t.soon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <SurfaceCard className="p-5">
          <p className="text-sm text-slate-600">{t.noResults}</p>
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((topic) => (
            <SurfaceCard
              key={topic.id}
              className={[
                "flex h-full flex-col p-5",
                topic.status === "soon" ? "border-dashed border-slate-300 bg-slate-50" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-950">{topic.title[locale]}</h3>
                {statusBadge(topic.status, locale)}
              </div>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {topic.description[locale]}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {topic.canRead ? (
                  <ButtonLink href={buildTopicHref(locale, topic)} variant="secondary">
                    {t.read}
                  </ButtonLink>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
                    {t.read}
                  </span>
                )}
                {topic.canTrain ? (
                  <Link
                    href={buildTrainerHref(locale, topic)}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-slate-100 hover:text-blue-900"
                  >
                    {t.train}
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
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

