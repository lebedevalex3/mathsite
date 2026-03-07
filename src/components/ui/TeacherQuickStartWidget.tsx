"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";
import { topicCatalogEntries } from "@/src/lib/topicMeta";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
};

const copy = {
  ru: {
    eyebrow: "Рабочая зона учителя",
    title: "Конструктор вариантов",
    subtitle: "Выберите тему и перейдите к сборке рабочего листа.",
    topicLabel: "Тема",
    button: "Собрать вариант",
    configure: "Настроить по навыкам",
    note: "Режим работы, структура и печать настраиваются на следующем шаге.",
  },
  en: {
    eyebrow: "Teacher workspace",
    title: "Variant Builder",
    subtitle: "Choose a topic and move straight to worksheet generation.",
    topicLabel: "Topic",
    button: "Assemble variant",
    configure: "Configure by skills",
    note: "Mode, structure, and print options are set on the next step.",
  },
  de: {
    eyebrow: "Arbeitsbereich Lehrkraft",
    title: "Varianten-Baukasten",
    subtitle: "Thema waehlen und direkt in die Erstellung des Arbeitsblatts wechseln.",
    topicLabel: "Thema",
    button: "Variante zusammenstellen",
    configure: "Nach Faehigkeiten konfigurieren",
    note: "Modus, Struktur und Druckoptionen werden im naechsten Schritt gesetzt.",
  },
} as const;

export function TeacherQuickStartWidget({ locale }: Props) {
  const router = useRouter();
  const t = copy[locale];

  const topics = useMemo(() => {
    return listContentTopicConfigs()
      .map((cfg) => {
        const topicId =
          topicCatalogEntries.find(
            (entry) => entry.id === cfg.topicSlug || entry.slug.endsWith(`/${cfg.topicSlug}`),
          )?.id ?? cfg.topicSlug;
        const catalog = topicCatalogEntries.find((entry) => entry.id === topicId);
        if (!catalog) return null;
        return {
          topicId: catalog.id,
          title: cfg.titles?.[locale] ?? catalog.title[locale] ?? cfg.topicSlug,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [locale]);

  const [topicId, setTopicId] = useState<string>(topics[0]?.topicId ?? "math.proportion");

  function handleSubmit() {
    const params = new URLSearchParams();
    params.set("topicId", topicId);
    router.push(`/${locale}/teacher-tools?${params.toString()}`);
  }

  return (
    <SurfaceCard className="border-[var(--border)]/70 bg-[var(--surface-tint)]/48 p-5 shadow-[0_18px_34px_-34px_rgba(11,60,138,0.22)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{t.eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-strong)]">{t.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{t.subtitle}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border)]/75 bg-[var(--card)] p-4 sm:p-5">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t.topicLabel}
            </span>
            <select
              value={topicId}
              onChange={(event) => setTopicId(event.target.value)}
              className="w-full rounded-xl border border-transparent bg-[var(--card)] px-4 py-3.5 text-sm font-medium text-[var(--text-strong)] shadow-[inset_0_0_0_1px_var(--border)]"
            >
              {topics.map((topic) => (
                <option key={topic.topicId} value={topic.topicId}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-20px_rgba(11,60,138,0.5)] transition-colors hover:bg-[var(--primary-hover)]"
            >
              {t.button}
            </button>
            <a
              href={`/${locale}/teacher-tools?topicId=${encodeURIComponent(topicId)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-strong)]"
            >
              {t.configure}
            </a>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]/75">{t.note}</p>
    </SurfaceCard>
  );
}
