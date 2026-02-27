"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { defaultOrientationForLayout } from "@/src/lib/variants/print-profile";
import type { PrintLayoutMode } from "@/src/lib/variants/print-layout";
import { publishWorkEditorStatus } from "@/src/lib/teacher-tools/work-editor-status";

type WorkType = "lesson" | "quiz" | "homework" | "test";

type Props = {
  locale: "ru" | "en" | "de";
  workId: string;
  workType: WorkType;
  layout: PrintLayoutMode;
  forceTwoUp: boolean;
  canUseTwoCut: boolean;
  labels: {
    placement: string;
    onePerPage: string;
    twoPerPage: string;
    printMethod: string;
    oneSided: string;
    duplexCut: string;
    singleHint: string;
    twoOneSidedHint: string;
    twoDuplexHint: string;
    previewFront: string;
    previewBack: string;
    autoSwapNote: string;
    saving: string;
    saved: string;
    error: string;
    retry: string;
    cutUnavailableHint?: string;
  };
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function WorkPlacementAutosaveControls({
  workId,
  workType,
  layout,
  forceTwoUp,
  canUseTwoCut,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [retryLayout, setRetryLayout] = useState<PrintLayoutMode | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function saveLayout(nextLayout: PrintLayoutMode) {
    if (nextLayout === layout) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRetryLayout(nextLayout);
    setSaveState("saving");

    const nextOrientation = defaultOrientationForLayout(nextLayout);

    try {
      const res = await fetch(`/api/teacher/demo/works/${workId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          workType,
          printProfile: {
            layout: nextLayout,
            orientation: nextOrientation,
            forceTwoUp,
          },
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !data?.ok) {
        setSaveState("error");
        return;
      }

      setSaveState("saved");
      const next = new URLSearchParams(searchParams.toString());
      next.set("layout", nextLayout);
      next.set("orientation", nextOrientation);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      router.refresh();
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return;
      setSaveState("error");
    }
  }

  const buttonClass = (active: boolean) =>
    [
      "rounded-lg border px-3 py-2 text-sm font-medium",
      active
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
    ].join(" ");

  const isTwoPerPage = layout === "two" || layout === "two_cut" || layout === "two_dup";
  const twoPerPageMode: "landscape" | "cut" =
    layout === "two_cut" ? "cut" : "landscape";

  useEffect(() => {
    const phase =
      saveState === "error" ? "error" : saveState === "saving" ? "saving" : "ready";
    publishWorkEditorStatus({ workId, source: "placement", phase });
  }, [workId, saveState]);

  useEffect(() => {
    return () => {
      publishWorkEditorStatus({ workId, source: "placement" });
    };
  }, [workId]);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {labels.placement}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void saveLayout("single")}
          className={buttonClass(!isTwoPerPage)}
        >
          {labels.onePerPage}
        </button>
        <button
          type="button"
          onClick={() => void saveLayout(twoPerPageMode === "cut" && canUseTwoCut ? "two_cut" : "two")}
          className={buttonClass(isTwoPerPage)}
        >
          {labels.twoPerPage}
        </button>
      </div>

      {isTwoPerPage ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels.printMethod}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveLayout("two")}
              className={buttonClass(twoPerPageMode === "landscape")}
            >
              {labels.oneSided}
            </button>
            {canUseTwoCut ? (
              <button
                type="button"
                onClick={() => void saveLayout("two_cut")}
                className={buttonClass(twoPerPageMode === "cut")}
              >
                {labels.duplexCut}
              </button>
            ) : (
              <span
                aria-disabled="true"
                title={labels.cutUnavailableHint}
                className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400"
              >
                {labels.duplexCut}
              </span>
            )}
          </div>
        </>
      ) : null}

      <p className="mt-3 text-sm text-slate-700">
        {!isTwoPerPage
          ? labels.singleHint
          : twoPerPageMode === "cut"
            ? labels.twoDuplexHint
            : labels.twoOneSidedHint}
      </p>
      {isTwoPerPage && twoPerPageMode === "cut" ? (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <p>
            {labels.previewFront}: <span className="font-medium">В1 | В2</span>
          </p>
          <p>
            {labels.previewBack}: <span className="font-medium">В2 | В1</span>{" "}
            <span className="text-slate-600">({labels.autoSwapNote})</span>
          </p>
        </div>
      ) : null}
      {!canUseTwoCut && isTwoPerPage ? (
        <p className="mt-2 text-xs text-slate-600">{labels.cutUnavailableHint}</p>
      ) : null}

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        {saveState === "saving" ? <span>{labels.saving}</span> : null}
        {saveState === "saved" ? <span>{labels.saved}</span> : null}
        {saveState === "error" ? (
          <>
            <span className="text-rose-700">{labels.error}</span>
            <button
              type="button"
              onClick={() => retryLayout && void saveLayout(retryLayout)}
              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-slate-700 hover:bg-slate-100"
            >
              {labels.retry}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
