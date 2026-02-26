import type { PrintLayoutMode } from "@/src/lib/variants/print-layout";

export type PrintOrientation = "portrait" | "landscape";

export type NormalizedPrintProfile = {
  layout: PrintLayoutMode;
  orientation: PrintOrientation;
};

export function parsePrintOrientation(
  value: string | null | undefined,
  fallback: PrintOrientation = "portrait",
): PrintOrientation {
  if (value === "landscape") return "landscape";
  if (value === "portrait") return "portrait";
  return fallback;
}

export function defaultOrientationForLayout(layout: PrintLayoutMode): PrintOrientation {
  return layout === "single" ? "portrait" : "landscape";
}

export function normalizePrintProfile(
  value: unknown,
  fallback: NormalizedPrintProfile = { layout: "single", orientation: "portrait" },
): NormalizedPrintProfile {
  if (!value || typeof value !== "object") return fallback;
  const raw = value as { layout?: unknown; orientation?: unknown };
  const layout: PrintLayoutMode =
    raw.layout === "two"
      ? "two"
      : raw.layout === "two_cut"
        ? "two_cut"
        : raw.layout === "two_dup"
          ? "two_dup"
          : "single";
  const orientation = parsePrintOrientation(
    typeof raw.orientation === "string" ? raw.orientation : undefined,
    defaultOrientationForLayout(layout),
  );
  return { layout, orientation };
}
