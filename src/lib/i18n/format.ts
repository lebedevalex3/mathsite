export type AppLocale = "ru" | "en" | "de";

type FormatCommonOptions = {
  fallback?: string;
};

type DateInput = Date | string | number | null | undefined;
type NumberInput = number | null | undefined;

type PercentOptions = FormatCommonOptions & {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  valueKind?: "ratio" | "percent";
};

function fallbackText(options?: FormatCommonOptions) {
  return options?.fallback ?? "—";
}

export function normalizeLocale(locale: string | undefined | null): AppLocale {
  if (!locale) return "en";
  const base = locale.toLowerCase().split("-")[0];
  if (base === "ru" || base === "en" || base === "de") return base;
  return "en";
}

function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toFiniteNumber(value: NumberInput): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export function formatDate(
  localeInput: string | undefined | null,
  value: DateInput,
  options?: Intl.DateTimeFormatOptions & FormatCommonOptions,
) {
  const date = toDate(value);
  if (!date) return fallbackText(options);

  const { fallback: _fallback, ...intlOptions } = options ?? {};
  void _fallback;
  return new Intl.DateTimeFormat(normalizeLocale(localeInput), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...intlOptions,
  }).format(date);
}

export function formatDateTime(
  localeInput: string | undefined | null,
  value: DateInput,
  options?: Intl.DateTimeFormatOptions & FormatCommonOptions,
) {
  const date = toDate(value);
  if (!date) return fallbackText(options);

  const { fallback: _fallback, ...intlOptions } = options ?? {};
  void _fallback;
  return new Intl.DateTimeFormat(normalizeLocale(localeInput), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...intlOptions,
  }).format(date);
}

export function formatNumber(
  localeInput: string | undefined | null,
  value: NumberInput,
  options?: Intl.NumberFormatOptions & FormatCommonOptions,
) {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return fallbackText(options);

  const { fallback: _fallback, ...intlOptions } = options ?? {};
  void _fallback;
  return new Intl.NumberFormat(normalizeLocale(localeInput), intlOptions).format(numeric);
}

export function formatPercent(
  localeInput: string | undefined | null,
  value: NumberInput,
  options?: PercentOptions,
) {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return fallbackText(options);

  const {
    fallback: _fallback,
    maximumFractionDigits = 0,
    minimumFractionDigits,
    valueKind = "ratio",
  } = options ?? {};
  void _fallback;

  const percentRatio = valueKind === "percent" ? numeric / 100 : numeric;

  return new Intl.NumberFormat(normalizeLocale(localeInput), {
    style: "percent",
    maximumFractionDigits,
    ...(minimumFractionDigits !== undefined ? { minimumFractionDigits } : {}),
  }).format(percentRatio);
}
