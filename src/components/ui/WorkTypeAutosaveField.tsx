"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { publishWorkEditorStatus } from "@/src/lib/teacher-tools/work-editor-status";

type WorkType = "lesson" | "quiz" | "homework" | "test";
type PrintLayout = "single" | "two" | "two_cut" | "two_dup";
type PrintOrientation = "portrait" | "landscape";

type Props = {
  locale: "ru" | "en" | "de";
  workId: string;
  initialWorkType: WorkType;
  initialCustomTitle: string;
  initialWorkDate: string;
  layout: PrintLayout;
  orientation: PrintOrientation;
  forceTwoUp: boolean;
  label: string;
  customTitleLabel: string;
  customTitlePlaceholder: string;
  dateLabel: string;
  options: Record<WorkType, string>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const copy = {
  ru: {
    saving: "Сохраняю...",
    saved: "Сохранено",
    error: "Ошибка сохранения",
    retry: "Повторить",
  },
  en: {
    saving: "Saving...",
    saved: "Saved",
    error: "Save error",
    retry: "Retry",
  },
  de: {
    saving: "Speichere...",
    saved: "Gespeichert",
    error: "Speicherfehler",
    retry: "Erneut",
  },
} as const;

type Snapshot = { workType: WorkType; customTitle: string; workDate: string };

function normalizeCustomTitle(value: string) {
  return value.trim().slice(0, 80);
}

function normalizeWorkDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function equalsSnapshot(a: Snapshot, b: Snapshot) {
  return a.workType === b.workType && a.customTitle === b.customTitle && a.workDate === b.workDate;
}

export function WorkTypeAutosaveField({
  locale,
  workId,
  initialWorkType,
  initialCustomTitle,
  initialWorkDate,
  layout,
  orientation,
  forceTwoUp,
  label,
  customTitleLabel,
  customTitlePlaceholder,
  dateLabel,
  options,
}: Props) {
  const t = copy[locale];
  const router = useRouter();
  const [workType, setWorkType] = useState<WorkType>(initialWorkType);
  const [customTitle, setCustomTitle] = useState(initialCustomTitle);
  const [workDate, setWorkDate] = useState(initialWorkDate);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [retryTick, setRetryTick] = useState(0);
  const lastSavedRef = useRef<Snapshot>({
    workType: initialWorkType,
    customTitle: normalizeCustomTitle(initialCustomTitle),
    workDate: normalizeWorkDate(initialWorkDate),
  });
  const mountedRef = useRef(false);

  const currentSnapshot: Snapshot = useMemo(
    () => ({
      workType,
      customTitle: normalizeCustomTitle(customTitle),
      workDate: normalizeWorkDate(workDate),
    }),
    [customTitle, workDate, workType],
  );

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (equalsSnapshot(currentSnapshot, lastSavedRef.current)) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/teacher/demo/works/${workId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            workType: currentSnapshot.workType,
            titleTemplate: {
              customTitle: currentSnapshot.customTitle || null,
              date: currentSnapshot.workDate || null,
            },
            printProfile: {
              layout,
              orientation,
              forceTwoUp,
            },
          }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
        if (!res.ok || !data?.ok) {
          setSaveState("error");
          return;
        }
        lastSavedRef.current = currentSnapshot;
        setSaveState("saved");
        router.refresh();
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
        setSaveState("error");
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [currentSnapshot, retryTick, workId, layout, orientation, forceTwoUp, router]);

  useEffect(() => {
    const dirty = !equalsSnapshot(currentSnapshot, lastSavedRef.current);
    const phase =
      saveState === "error"
        ? "error"
        : saveState === "saving"
          ? "saving"
          : dirty
            ? "dirty"
            : "ready";
    publishWorkEditorStatus({ workId, source: "workType", phase });
  }, [workId, currentSnapshot, saveState]);

  useEffect(() => {
    return () => {
      publishWorkEditorStatus({ workId, source: "workType" });
    };
  }, [workId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 grid gap-2">
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value as WorkType)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        >
          {(Object.keys(options) as WorkType[]).map((type) => (
            <option key={type} value={type}>
              {options[type]}
            </option>
          ))}
        </select>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{customTitleLabel}</span>
          <input
            type="text"
            maxLength={80}
            value={customTitle}
            onChange={(event) => setCustomTitle(event.target.value)}
            placeholder={customTitlePlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dateLabel}</span>
          <input
            type="date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        {saveState === "saving" ? <span>{t.saving}</span> : null}
        {saveState === "saved" ? <span>{t.saved}</span> : null}
        {saveState === "error" ? (
          <>
            <span className="text-rose-700">{t.error}</span>
            <button
              type="button"
              onClick={() => setRetryTick((v) => v + 1)}
              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-slate-700 hover:bg-slate-100"
            >
              {t.retry}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
