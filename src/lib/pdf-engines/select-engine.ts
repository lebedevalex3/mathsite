import type { PdfEngineName } from "@/src/lib/pdf-engines/types";
import type { PrintLayoutMode } from "@/src/lib/variants/print-layout";
import {
  getDefaultPdfEngineEnv,
  isLatexPdfEnabled,
  shouldPreferLatexForTwoUp,
} from "@/src/lib/pdf-engines/config";

type EngineSelectionSource = "query" | "layout_policy" | "default";

export type EngineSelection = {
  engine: PdfEngineName;
  source: EngineSelectionSource;
};

function isEngine(value: string | null | undefined): value is PdfEngineName {
  return value === "chromium" || value === "latex";
}

export function selectWorkPdfEngine(params: {
  requestedEngine: string | null | undefined;
  layout: PrintLayoutMode;
  supportedLatexLayouts?: readonly PrintLayoutMode[];
}): EngineSelection {
  const { requestedEngine, layout, supportedLatexLayouts } = params;
  const latexSupportedForLayout =
    !supportedLatexLayouts || supportedLatexLayouts.includes(layout);

  if (isEngine(requestedEngine)) {
    return { engine: requestedEngine, source: "query" };
  }

  // Prefer LaTeX for two-up profiles when available (can be disabled by env).
  if (
    isLatexPdfEnabled() &&
    latexSupportedForLayout &&
    shouldPreferLatexForTwoUp() &&
    (layout === "two" || layout === "two_cut" || layout === "two_dup")
  ) {
    return { engine: "latex", source: "layout_policy" };
  }

  const envDefault = getDefaultPdfEngineEnv();
  if (envDefault) {
    if (envDefault === "latex" && (!isLatexPdfEnabled() || !latexSupportedForLayout)) {
      return { engine: "chromium", source: "default" };
    }
    return { engine: envDefault, source: "default" };
  }

  return { engine: "chromium", source: "default" };
}
