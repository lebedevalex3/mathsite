import Link from "next/link";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

export type TeacherApiError = {
  code?: string;
  message?: string;
  details?: unknown;
};

type TeacherErrorStateProps = {
  error: TeacherApiError;
  locale: string;
  className?: string;
};

function normalizeError(error: TeacherApiError) {
  const code = error.code ?? "INTERNAL_ERROR";
  const fallbackMessage = error.message ?? "Произошла ошибка.";

  if (code === "FORBIDDEN") {
    return {
      title: "Требуется роль учителя",
      message:
        "Этот раздел доступен только пользователям с ролью teacher или admin.",
    };
  }

  if (code === "INSUFFICIENT_TASKS") {
    return {
      title: "Недостаточно задач для шаблона",
      message:
        "Не удалось собрать вариант по выбранному шаблону. Уменьшите квоты в шаблоне или расширьте банк задач.",
    };
  }

  if (code === "DB_NOT_READY" || code === "PRISMA_CLIENT_ERROR") {
    return {
      title: "Сервис временно недоступен",
      message: "Попробуйте позже. Если проблема повторяется, проверьте настройки БД и Prisma.",
    };
  }

  if (code === "INVALID_TEMPLATE") {
    return {
      title: "Ошибка шаблона варианта",
      message: "Один из шаблонов содержит некорректные данные.",
    };
  }

  return {
    title: "Не удалось выполнить запрос",
    message: fallbackMessage,
  };
}

function renderInsufficientDetails(details: unknown) {
  if (!details || typeof details !== "object") return null;
  const data = details as {
    sectionLabel?: unknown;
    requiredCount?: unknown;
    availableCount?: unknown;
    difficulty?: unknown;
    skillIds?: unknown;
  };

  const sectionLabel = typeof data.sectionLabel === "string" ? data.sectionLabel : null;
  const requiredCount =
    typeof data.requiredCount === "number" ? data.requiredCount : null;
  const availableCount =
    typeof data.availableCount === "number" ? data.availableCount : null;
  const difficulty =
    Array.isArray(data.difficulty) && data.difficulty.length === 2
      ? data.difficulty
      : null;
  const skillIds = Array.isArray(data.skillIds)
    ? data.skillIds.filter((value): value is string => typeof value === "string")
    : [];

  if (!sectionLabel && requiredCount === null && availableCount === null && !difficulty) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      {sectionLabel ? <p>Секция: {sectionLabel}</p> : null}
      {requiredCount !== null && availableCount !== null ? (
        <p>
          Нужно задач: {requiredCount}, доступно: {availableCount}
        </p>
      ) : null}
      {difficulty ? (
        <p>
          Диапазон сложности: {String(difficulty[0])}-{String(difficulty[1])}
        </p>
      ) : null}
      {skillIds.length > 0 ? (
        <p className="truncate" title={skillIds.join(", ")}>
          Навыки: {skillIds.length} шт.
        </p>
      ) : null}
    </div>
  );
}

export function TeacherErrorState({
  error,
  locale,
  className = "p-6",
}: TeacherErrorStateProps) {
  const normalized = normalizeError(error);
  const code = error.code ?? "INTERNAL_ERROR";
  const showTeacherHint = code === "FORBIDDEN";
  const showInsufficientDetails = code === "INSUFFICIENT_TASKS";

  return (
    <SurfaceCard className={className}>
      <h2 className="text-lg font-semibold text-slate-950">{normalized.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{normalized.message}</p>
      {showInsufficientDetails ? renderInsufficientDetails(error.details) : null}
      {showTeacherHint ? (
        <div className="mt-4">
          <Link
            href={`/${locale}/teacher/variants`}
            className="text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Открыть teacher / variants
          </Link>
        </div>
      ) : null}
      {error.message && code !== "INSUFFICIENT_TASKS" && code !== "FORBIDDEN" ? (
        <p className="mt-3 text-xs text-slate-500">{error.message}</p>
      ) : null}
    </SurfaceCard>
  );
}

