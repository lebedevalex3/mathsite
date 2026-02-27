"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
  workId: string;
  initialVariantsCount: number;
  initialShuffleOrder: boolean;
  labels: {
    title: string;
    variants: string;
    shuffle: string;
    rebuild: string;
    applyRebuild: string;
    changedHint: string;
    saving: string;
    error: string;
    yes: string;
    no: string;
  };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function WorkBuildSettingsControls({
  locale,
  workId,
  initialVariantsCount,
  initialShuffleOrder,
  labels,
}: Props) {
  const router = useRouter();
  const [variantsCount, setVariantsCount] = useState(clamp(initialVariantsCount, 1, 6));
  const [shuffleOrder, setShuffleOrder] = useState(initialShuffleOrder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    variantsCount !== clamp(initialVariantsCount, 1, 6) ||
    shuffleOrder !== initialShuffleOrder;

  async function handleRebuild() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/teacher/demo/works/${workId}/rebuild`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          variantsCount: clamp(Math.trunc(variantsCount), 1, 6),
          shuffleOrder,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; workId?: string; message?: string }
        | null;
      if (!response.ok || !payload?.ok || typeof payload.workId !== "string") {
        throw new Error(payload?.message ?? labels.error);
      }
      router.push(`/${locale}/teacher-tools/works/${payload.workId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels.title}</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="space-y-1 text-sm text-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.variants}
          </span>
          <input
            type="number"
            min={1}
            max={6}
            value={variantsCount}
            onChange={(e) => setVariantsCount(clamp(Number(e.target.value || 1), 1, 6))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 sm:w-28"
          />
        </label>
        <button
          type="button"
          onClick={() => void handleRebuild()}
          disabled={saving || !dirty}
          className={[
            "inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60",
            dirty
              ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
              : "border-slate-300 bg-white text-slate-500",
          ].join(" ")}
        >
          {saving ? labels.saving : dirty ? labels.applyRebuild : labels.rebuild}
        </button>
      </div>

      <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-900">
        <input
          type="checkbox"
          checked={shuffleOrder}
          onChange={(e) => setShuffleOrder(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {labels.shuffle}: <span className="font-medium">{shuffleOrder ? labels.yes : labels.no}</span>
      </label>
      {dirty ? <p className="mt-2 text-xs text-amber-700">{labels.changedHint}</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
