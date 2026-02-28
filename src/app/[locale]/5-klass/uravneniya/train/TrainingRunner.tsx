"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MarkdownMath } from "@/lib/ui/MarkdownMath";
import type { Task } from "@/lib/tasks/schema";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { ButtonLink } from "@/src/components/ui/ButtonLink";

const STORAGE_KEY = "attempts:g5.uravneniya";
const TOPIC_ID = "g5.uravneniya";

type TrainingTask = Pick<Task, "id" | "skill_id" | "statement_md" | "answer">;

type AttemptRecord = {
  session_id: string;
  task_id: string;
  skill_id: string;
  answer_raw: string;
  answer_value: number | null;
  expected_value: number;
  is_correct: boolean;
  task_elapsed_ms: number;
  total_elapsed_ms: number;
  checked_at: string;
};

type TrainingRunnerProps = {
  locale: string;
  skillId: string;
  skillTitle: string;
  skillOrder: Array<{ id: string; title: string }>;
  tasks: TrainingTask[];
};

function formatSecondsFromMs(ms: number) {
  return Math.max(0, Math.round(ms / 1000));
}

function formatTimerSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function useTaskTimer(enabled: boolean) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = () => {
    if (!enabled || startedAtRef.current !== null) return;

    startedAtRef.current = Date.now();
    setIsRunning(true);
    setSecondsElapsed(0);

    intervalRef.current = window.setInterval(() => {
      if (startedAtRef.current === null) return;
      const nextSeconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setSecondsElapsed(nextSeconds);
    }, 1000);
  };

  const stop = () => {
    if (startedAtRef.current !== null) {
      setSecondsElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }
    clearTimer();
    setIsRunning(false);
  };

  const reset = () => {
    clearTimer();
    startedAtRef.current = null;
    setSecondsElapsed(0);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return { secondsElapsed, isRunning, start, stop, reset };
}

function ProgressBar({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function parseNumberInput(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized.length === 0) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function readStoredAttempts(): AttemptRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

function writeStoredAttempt(attempt: AttemptRecord) {
  try {
    const existing = readStoredAttempts();
    const next = [...existing, attempt].slice(-500);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage write failures; training UI should still work.
  }
}

async function persistAttempt(
  attempt: AttemptRecord,
  payload: {
    topicId: string;
    skillId: string;
    taskId: string;
    isCorrect: boolean;
    userAnswer: string;
    durationMs: number;
  },
) {
  try {
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      writeStoredAttempt(attempt);
    }
  } catch {
    writeStoredAttempt(attempt);
  }
}

export default function TrainingRunner({
  locale,
  skillId,
  skillTitle,
  skillOrder,
  tasks,
}: TrainingRunnerProps) {
  const showDebug = process.env.NODE_ENV !== "production";
  const [sessionId] = useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [startedAt] = useState(() => Date.now());
  const [taskStartedAt, setTaskStartedAt] = useState(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [lastTaskElapsedMs, setLastTaskElapsedMs] = useState<number | null>(null);
  const [lastVisibleTaskSeconds, setLastVisibleTaskSeconds] = useState<number | null>(null);
  const [results, setResults] = useState<
    Array<{ taskId: string; isCorrect: boolean; taskElapsedMs: number }>
  >([]);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const taskTimer = useTaskTimer(timerEnabled);

  const currentTask = tasks[currentIndex];
  const correctCount = results.filter((item) => item.isCorrect).length;
  const finished = currentIndex >= tasks.length;
  const progressValue = Math.min(currentIndex + (checked ? 1 : 0), tasks.length);
  const wrongCount = tasks.length - correctCount;
  const accuracyPercent = Math.round((correctCount / tasks.length) * 100);

  const averageTaskSeconds = useMemo(() => {
    if (results.length === 0) return null;
    const total = results.reduce((acc, item) => acc + item.taskElapsedMs, 0);
    return Math.round(total / results.length / 1000);
  }, [results]);

  const recommendedNextSkill = useMemo(() => {
    if (accuracyPercent < 70) {
      return { id: skillId, title: skillTitle };
    }
    const currentIndexInOrder = skillOrder.findIndex((item) => item.id === skillId);
    if (currentIndexInOrder >= 0 && currentIndexInOrder + 1 < skillOrder.length) {
      return skillOrder[currentIndexInOrder + 1] ?? null;
    }
    return null;
  }, [accuracyPercent, skillId, skillOrder, skillTitle]);

  useEffect(() => {
    if (checked && nextButtonRef.current) {
      nextButtonRef.current.focus();
    }
  }, [checked]);

  function handleFirstInputAction() {
    taskTimer.start();
  }

  if (finished) {
    const totalElapsedMs = (finishedAt ?? startedAt) - startedAt;
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <SurfaceCard className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
            Тренировка • завершено
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Серия из {tasks.length} задач выполнена
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {skillTitle}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Результат
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {correctCount} / {tasks.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Точность
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {accuracyPercent}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ошибок
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {wrongCount}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Следующий шаг
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {accuracyPercent < 70
                ? "Повторите этот навык, чтобы закрепить базу."
                : recommendedNextSkill
                  ? `Перейдите к навыку: ${recommendedNextSkill.title}.`
                  : "Отлично! Можно вернуться к теме."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Время серии: {formatSecondsFromMs(totalElapsedMs)} сек
              {averageTaskSeconds !== null ? ` • В среднем: ${averageTaskSeconds} сек/задача` : ""}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink
              href={`/${locale}/5-klass/uravneniya/train?skill=${encodeURIComponent(skillId)}`}
              variant="primary"
            >
              Повторить этот навык
            </ButtonLink>
            <ButtonLink href={`/${locale}/teacher-tools?topicId=g5.uravneniya`} variant="secondary">
              Вернуться в генератор
            </ButtonLink>
            {recommendedNextSkill && recommendedNextSkill.id !== skillId ? (
              <ButtonLink
                href={`/${locale}/5-klass/uravneniya/train?skill=${encodeURIComponent(recommendedNextSkill.id)}`}
                variant="secondary"
              >
                Перейти к следующему навыку
              </ButtonLink>
            ) : null}
          </div>

          {showDebug ? (
            <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">
                Служебная информация
              </summary>
              <div className="mt-2 text-xs text-slate-600">
                <p>
                  Навык: <code>{skillId}</code>
                </p>
                <p>Session: <code>{sessionId}</code></p>
              </div>
            </details>
          ) : null}
        </SurfaceCard>
      </section>
    );
  }

  function handleCheck() {
    if (!currentTask || checked) return;
    taskTimer.stop();

    const parsedAnswer = parseNumberInput(inputValue);
    const expected = currentTask.answer.value;
    const taskElapsedMs = Date.now() - taskStartedAt;
    const totalMs = Date.now() - startedAt;
    const ok = parsedAnswer !== null && parsedAnswer === expected;

    setChecked(true);
    setIsCorrect(ok);
    setLastTaskElapsedMs(taskElapsedMs);
    setLastVisibleTaskSeconds(timerEnabled ? taskTimer.secondsElapsed : null);
    setResults((prev) => [
      ...prev,
      { taskId: currentTask.id, isCorrect: ok, taskElapsedMs },
    ]);

    const attemptRecord: AttemptRecord = {
      session_id: sessionId,
      task_id: currentTask.id,
      skill_id: currentTask.skill_id,
      answer_raw: inputValue,
      answer_value: parsedAnswer,
      expected_value: expected,
      is_correct: ok,
      task_elapsed_ms: taskElapsedMs,
      total_elapsed_ms: totalMs,
      checked_at: new Date().toISOString(),
    };

    void persistAttempt(attemptRecord, {
      topicId: TOPIC_ID,
      skillId: currentTask.skill_id,
      taskId: currentTask.id,
      isCorrect: ok,
      userAnswer: inputValue,
      durationMs: taskElapsedMs,
    });
  }

  function handleNext() {
    if (!checked) return;
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= tasks.length) {
        setFinishedAt(Date.now());
      }
      return nextIndex;
    });
    setInputValue("");
    setChecked(false);
    setIsCorrect(null);
    setLastTaskElapsedMs(null);
    setLastVisibleTaskSeconds(null);
    setTaskStartedAt(Date.now());
    taskTimer.reset();
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <SurfaceCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              Тренировка: 10 задач подряд
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              Задача {currentIndex + 1} / {tasks.length}
            </p>
            <p className="mt-1 text-xs text-slate-600">{skillTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ButtonLink
                href={`/${locale}/5-klass/uravneniya/train`}
                variant="secondary"
                className="px-2.5 py-1.5 text-xs"
              >
                К выбору навыков
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/teacher-tools?topicId=g5.uravneniya`}
                variant="secondary"
                className="px-2.5 py-1.5 text-xs"
              >
                К теме
              </ButtonLink>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600">
              Верно: <span className="font-semibold text-slate-900">{correctCount}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                const next = !timerEnabled;
                setTimerEnabled(next);
                if (!next) {
                  taskTimer.reset();
                  setLastVisibleTaskSeconds(null);
                }
              }}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                timerEnabled
                  ? "border-[var(--primary)] bg-[var(--info)] text-[var(--primary)]"
                  : "border-slate-300 bg-white text-slate-600",
              ].join(" ")}
              aria-pressed={timerEnabled}
            >
              <span>Таймер</span>
              <span>{timerEnabled ? "Вкл" : "Выкл"}</span>
            </button>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={progressValue} max={tasks.length} />
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Задача {currentIndex + 1} из {tasks.length}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Введите ответ числом и проверьте результат.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Таймер
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {!timerEnabled
                ? "Выкл"
                : taskTimer.isRunning || taskTimer.secondsElapsed > 0
                  ? formatTimerSeconds(taskTimer.secondsElapsed)
                  : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Условие</p>
          <div className="mt-3 rounded-xl border border-white bg-white p-4">
            <MarkdownMath className="prose prose-slate max-w-none text-sm sm:text-base">
              {currentTask.statement_md}
            </MarkdownMath>
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="number-answer"
            className="mb-2 block text-sm font-medium text-slate-800"
          >
            Ответ (число)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="number-answer"
              type="text"
              inputMode="decimal"
              value={inputValue}
              disabled={checked}
              onFocus={handleFirstInputAction}
              onChange={(event) => {
                handleFirstInputAction();
                setInputValue(event.target.value);
              }}
              onKeyDown={(event) => {
                handleFirstInputAction();
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!checked) handleCheck();
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="Например, 12"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleCheck}
              disabled={checked}
              className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Проверить ответ
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Нажмите Enter, чтобы проверить ответ</p>
        </div>

        {showDebug ? (
          <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              Служебная информация
            </summary>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>
                Навык: <code>{skillId}</code>
              </p>
              <p>
                Текущая задача: <code>{currentTask.id}</code>
              </p>
            </div>
          </details>
        ) : null}
      </SurfaceCard>

      {checked ? (
        <SurfaceCard className="p-5">
          <div
            className={[
              "rounded-xl border p-4",
              isCorrect
                ? "border-[var(--success)]/30 bg-[var(--success-soft)]"
                : "border-rose-200 bg-rose-50",
            ].join(" ")}
          >
            <p
              className={[
                "text-sm font-semibold",
                isCorrect ? "text-[var(--success)]" : "text-rose-800",
              ].join(" ")}
            >
              {isCorrect ? "Верно" : "Неверно"}
            </p>
            {!isCorrect ? (
              <p className="mt-2 text-sm text-slate-700">
                Правильный ответ:{" "}
                <strong className="text-slate-950">{currentTask.answer.value}</strong>
              </p>
            ) : null}
            {timerEnabled ? (
              <p className="mt-2 text-sm text-slate-700">
                Время:{" "}
                <strong className="text-slate-950">
                  {lastVisibleTaskSeconds !== null
                    ? `${lastVisibleTaskSeconds} сек`
                    : "—"}
                </strong>
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              ref={nextButtonRef}
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              К следующей задаче
            </button>
          </div>

          {showDebug && lastTaskElapsedMs !== null ? (
            <p className="mt-3 text-xs text-slate-500">
              Служебное время проверки: {formatSecondsFromMs(lastTaskElapsedMs)} сек
            </p>
          ) : null}
        </SurfaceCard>
      ) : null}
    </section>
  );
}
