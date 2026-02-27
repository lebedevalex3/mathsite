"use client";

import { useEffect, useMemo, useState } from "react";

import {
  WORK_EDITOR_STATUS_EVENT,
  type WorkEditorStatusEventDetail,
  type WorkEditorStatusPhase,
  type WorkEditorStatusSource,
} from "@/src/lib/teacher-tools/work-editor-status";

type Props = {
  locale: "ru" | "en" | "de";
  workId: string;
  variantsCount: number;
};

const copy = {
  ru: { saving: "Сохранение...", error: "Ошибка сохранения" },
  en: { saving: "Saving...", error: "Save error" },
  de: { saving: "Speichern...", error: "Speicherfehler" },
} as const;

export function WorkStatusBadge({ locale, workId, variantsCount }: Props) {
  const t = copy[locale];
  const [phases, setPhases] = useState<Partial<Record<WorkEditorStatusSource, WorkEditorStatusPhase>>>({});

  useEffect(() => {
    function onStatus(event: Event) {
      const detail = (event as CustomEvent<WorkEditorStatusEventDetail>).detail;
      if (!detail || detail.workId !== workId) return;
      setPhases((prev) => {
        if (!detail.phase) {
          const next = { ...prev };
          delete next[detail.source];
          return next;
        }
        return { ...prev, [detail.source]: detail.phase };
      });
    }

    window.addEventListener(WORK_EDITOR_STATUS_EVENT, onStatus as EventListener);
    return () => window.removeEventListener(WORK_EDITOR_STATUS_EVENT, onStatus as EventListener);
  }, [workId]);

  const status = useMemo(() => {
    if (variantsCount < 1) return null;
    const current = Object.values(phases);
    if (current.some((phase) => phase === "error")) {
      return "error" as const;
    }
    if (current.some((phase) => phase === "dirty" || phase === "saving")) {
      return "saving" as const;
    }
    return null;
  }, [phases, variantsCount]);

  if (!status) return null;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-amber-200 bg-amber-50 text-amber-800",
      ].join(" ")}
    >
      {status === "error" ? t.error : t.saving}
    </span>
  );
}
