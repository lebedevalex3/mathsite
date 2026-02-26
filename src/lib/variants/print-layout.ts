export type PrintLayoutMode = "single" | "two" | "two_cut" | "two_dup";

export function parsePrintLayout(value: string | null | undefined): PrintLayoutMode {
  if (value === "two") return "two";
  if (value === "two_cut") return "two_cut";
  if (value === "two_dup") return "two_dup";
  return "single";
}

export function parseVariantIdsParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((v) => v.trim()).filter(Boolean))];
}

export function chunkIntoPages<T>(items: T[], layout: PrintLayoutMode): T[][] {
  const size = layout === "single" || layout === "two_dup" ? 1 : 2;
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function isTwoUpLayout(layout: PrintLayoutMode): boolean {
  return layout === "two" || layout === "two_cut" || layout === "two_dup";
}
