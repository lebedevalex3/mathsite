"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  locale: "ru" | "en" | "de";
  workId: string;
  workType: "lesson" | "quiz" | "homework" | "test";
  layout: "single" | "two" | "two_cut" | "two_dup";
  orientation: "portrait" | "landscape";
  forceTwoUp: boolean;
};

const copy = {
  ru: {
    save: "Сохранить оформление",
    saving: "Сохраняем...",
    saved: "Сохранено",
    error: "Не удалось сохранить",
  },
  en: {
    save: "Save formatting",
    saving: "Saving...",
    saved: "Saved",
    error: "Failed to save",
  },
  de: {
    save: "Layout speichern",
    saving: "Speichern...",
    saved: "Gespeichert",
    error: "Speichern fehlgeschlagen",
  },
} as const;

export function SaveWorkProfileButton(props: Props) {
  const { locale, workId, workType, layout, orientation, forceTwoUp } = props;
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusText, setStatusText] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setStatusText(null);
          startTransition(async () => {
            try {
              const res = await fetch(`/api/teacher/demo/works/${workId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  locale,
                  workType,
                  printProfile: {
                    layout,
                    orientation,
                    forceTwoUp,
                  },
                }),
              });
              const data = (await res.json().catch(() => null)) as
                | { ok?: boolean; message?: string }
                | null;
              if (!res.ok || !data?.ok) {
                setStatusText(data?.message || t.error);
                return;
              }
              setStatusText(t.saved);
              router.refresh();
            } catch {
              setStatusText(t.error);
            }
          });
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t.saving : t.save}
      </button>
      {statusText ? <span className="text-xs text-slate-600">{statusText}</span> : null}
    </div>
  );
}
