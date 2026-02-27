"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";
import { topicCatalogEntries } from "@/src/lib/topicMeta";

type Locale = "ru" | "en" | "de";

type PresetId = "training10" | "control20" | "control30";

type Props = {
  locale: Locale;
};

const copy = {
  ru: {
    title: "Конструктор вариантов",
    subtitle: "Быстрый старт для учителя: выберите тему и режим, затем соберите вариант.",
    topicLabel: "Тема",
    presetLabel: "Режим",
    button: "Собрать вариант",
    configure: "Настроить по навыкам",
    note: "Можно попробовать без регистрации. Вход нужен, чтобы сохранять варианты.",
    presets: {
      training10: "Тренировочный (10)",
      control20: "Контрольный (20)",
      control30: "Контрольный (30)",
    },
  },
  en: {
    title: "Variant Builder",
    subtitle: "Quick start for teachers: choose a topic and mode, then assemble a variant.",
    topicLabel: "Topic",
    presetLabel: "Mode",
    button: "Assemble variant",
    configure: "Configure by skills",
    note: "You can try it without registration. Sign-in is only needed to save variants.",
    presets: {
      training10: "Training (10)",
      control20: "Control (20)",
      control30: "Control (30)",
    },
  },
  de: {
    title: "Varianten-Baukasten",
    subtitle:
      "Schnellstart für Lehrkräfte: Thema und Modus wählen, dann eine Variante zusammenstellen.",
    topicLabel: "Thema",
    presetLabel: "Modus",
    button: "Variante zusammenstellen",
    configure: "Nach Fähigkeiten konfigurieren",
    note: "Ohne Registrierung testbar. Anmeldung ist nur zum Speichern von Varianten nötig.",
    presets: {
      training10: "Training (10)",
      control20: "Kontrolle (20)",
      control30: "Kontrolle (30)",
    },
  },
} as const;

const presetOrder: PresetId[] = ["training10", "control20", "control30"];

export function TeacherQuickStartWidget({ locale }: Props) {
  const router = useRouter();
  const t = copy[locale];

  const topics = useMemo(() => {
    return listContentTopicConfigs()
      .map((cfg) => {
        const topicId = cfg.topicSlug.includes(".") ? cfg.topicSlug : `g5.${cfg.topicSlug}`;
        const catalog = topicCatalogEntries.find((entry) => entry.id === topicId);
        if (!catalog) return null;
        return {
          topicId: catalog.id,
          title: cfg.titles?.[locale] ?? catalog.title[locale] ?? cfg.topicSlug,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [locale]);

  const [topicId, setTopicId] = useState<string>(topics[0]?.topicId ?? "g5.proporcii");
  const [preset, setPreset] = useState<PresetId>("control20");

  function handleSubmit() {
    const params = new URLSearchParams();
    params.set("topicId", topicId);
    params.set("mode", preset);
    router.push(`/${locale}/teacher-tools?${params.toString()}`);
  }

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            {t.button}
          </button>
          <a
            href={`/${locale}/teacher-tools?topicId=${encodeURIComponent(topicId)}&mode=${encodeURIComponent(preset)}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
          >
            {t.configure}
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.topicLabel}
          </span>
          <select
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {topics.map((topic) => (
              <option key={topic.topicId} value={topic.topicId}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.presetLabel}
          </span>
          <div className="flex flex-wrap gap-2">
            {presetOrder.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreset(id)}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  preset === id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.presets[id]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">{t.note}</p>
    </SurfaceCard>
  );
}
