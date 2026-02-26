import type { PrintLayoutMode } from "@/src/lib/variants/print-layout";

export type WorkType = "lesson" | "quiz" | "homework" | "test";

export type PrintRecommendationReasonCode =
  | "LONG_VARIANT"
  | "HEAVY_VARIANT"
  | "TEST_DEFAULT"
  | "HOMEWORK_DEFAULT"
  | "LIGHT_VARIANTS";

export type PrintRecommendationInput = {
  workType: WorkType;
  variantTaskCounts: number[];
};

export type PrintRecommendation = {
  recommendedLayout: PrintLayoutMode;
  canUseTwoUp: boolean;
  reasonCodes: PrintRecommendationReasonCode[];
};

export function recommendPrintLayout({
  workType,
  variantTaskCounts,
}: PrintRecommendationInput): PrintRecommendation {
  const counts = variantTaskCounts.filter((v) => Number.isFinite(v) && v > 0);
  const maxTasks = counts.length > 0 ? Math.max(...counts) : 0;
  const avgTasks =
    counts.length > 0 ? counts.reduce((sum, count) => sum + count, 0) / counts.length : 0;

  const reasonCodes: PrintRecommendationReasonCode[] = [];

  if (workType === "test") reasonCodes.push("TEST_DEFAULT");
  if (workType === "homework") reasonCodes.push("HOMEWORK_DEFAULT");
  if (maxTasks >= 16) reasonCodes.push("LONG_VARIANT");
  if (avgTasks >= 12 || maxTasks >= 14) reasonCodes.push("HEAVY_VARIANT");

  const forceSingle =
    workType === "test" ||
    workType === "homework" ||
    maxTasks >= 16 ||
    avgTasks >= 12;

  if (forceSingle) {
    return {
      recommendedLayout: "single",
      canUseTwoUp: true,
      reasonCodes,
    };
  }

  if (maxTasks <= 10 && avgTasks <= 10) {
    reasonCodes.push("LIGHT_VARIANTS");
  }

  return {
    recommendedLayout: "two",
    canUseTwoUp: true,
    reasonCodes,
  };
}

