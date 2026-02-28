"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { SkillProgressEntry, SkillProgressMap } from "@/src/lib/progress/types";

type SkillCatalogItem = {
  title: string;
  description: string;
  readHref: string;
  trainHref: string;
  hasTrainer: boolean;
};

type SkillCatalogListProps = {
  items: SkillCatalogItem[];
  emptyLabel?: string;
};

const DEFAULT_VISIBLE_COUNT = 6;
const PROGRESS_TOPIC_ID = "g5.proporcii";

function getSkillIdFromTrainHref(trainHref: string): string | null {
  try {
    const url = new URL(trainHref, "http://localhost");
    return url.searchParams.get("skill");
  } catch {
    return null;
  }
}

function formatProgressBadge(progress: SkillProgressEntry | undefined) {
  if (!progress || progress.status === "not_started" || progress.total === 0) {
    return "—";
  }

  const percent = Math.round(progress.accuracy * 100);
  return `${percent}% (${progress.correct}/${progress.total})`;
}

export function SkillCatalogList({
  items,
  emptyLabel = "Навыки не найдены по текущему фильтру.",
}: SkillCatalogListProps) {
  const [query, setQuery] = useState("");
  const [onlyWithTrainer, setOnlyWithTrainer] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [progressBySkill, setProgressBySkill] = useState<SkillProgressMap>({});

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        const response = await fetch(
          `/api/progress?topicId=${encodeURIComponent(PROGRESS_TOPIC_ID)}`,
          { credentials: "same-origin" },
        );
        if (!response.ok) return;

        const payload = (await response.json()) as {
          ok?: boolean;
          progress?: SkillProgressMap;
        };

        if (!cancelled && payload.ok && payload.progress) {
          setProgressBySkill(payload.progress);
        }
      } catch {
        // Ignore API failures; catalog should render without progress badges.
      }
    }

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (onlyWithTrainer && !item.hasTrainer) return false;
      if (!normalizedQuery) return true;

      const haystack = `${item.title} ${item.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, onlyWithTrainer, query]);

  const visibleItems = expanded ? filtered : filtered.slice(0, DEFAULT_VISIBLE_COUNT);
  const hasHiddenItems = filtered.length > DEFAULT_VISIBLE_COUNT;

  return (
    <div className="space-y-4">
      <SurfaceCard className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <label htmlFor="skill-search" className="mb-1 block text-sm font-medium text-slate-800">
              Поиск по навыкам
            </label>
            <input
              id="skill-search"
              type="text"
              value={query}
              onChange={(event) => {
                setExpanded(false);
                setQuery(event.target.value);
              }}
              placeholder="Поиск по навыкам..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyWithTrainer}
              onChange={(event) => {
                setExpanded(false);
                setOnlyWithTrainer(event.target.checked);
              }}
              className="h-4 w-4 rounded border-slate-300 text-[var(--primary)]"
            />
            Только с тренажёром
          </label>
        </div>
      </SurfaceCard>

      <div className="space-y-3">
        {visibleItems.length === 0 ? (
          <SurfaceCard className="p-4">
            <p className="text-sm text-slate-600">{emptyLabel}</p>
          </SurfaceCard>
        ) : (
          visibleItems.map((item) => (
            <SurfaceCard key={`${item.title}:${item.readHref}`} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                    {(() => {
                      const skillId = getSkillIdFromTrainHref(item.trainHref);
                      const progress = skillId ? progressBySkill[skillId] : undefined;
                      const badgeText = formatProgressBadge(progress);

                      return (
                        <>
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {badgeText}
                          </span>
                          {progress?.status === "mastered" ? (
                            <span className="inline-flex items-center rounded-md border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                              Освоено
                            </span>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <ButtonLink href={item.readHref} variant="secondary">
                    Читать
                  </ButtonLink>
                  {item.hasTrainer ? (
                    <ButtonLink href={item.trainHref} variant="ghost">
                      Тренировать
                    </ButtonLink>
                  ) : (
                    <span className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
                      Недостаточно задач
                    </span>
                  )}
                </div>
              </div>
            </SurfaceCard>
          ))
        )}
      </div>

      {hasHiddenItems ? (
        <div className="flex justify-start">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Показать все ({filtered.length})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Свернуть
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
