"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MarkdownMath } from "@/lib/ui/MarkdownMath";
import type { Task } from "@/lib/tasks/schema";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { ButtonLink } from "@/src/components/ui/ButtonLink";

const STORAGE_KEY = "attempts:math.proportion";
const TOPIC_ID = "math.proportion";

type TrainingTask = Pick<Task, "id" | "skill_id" | "statement_md" | "answer">;

type AttemptRecord = {
  session_id: string;
  task_id: string;
  skill_id: string;
  answer_raw: string;
  answer_value: number | null;
  expected_value: number | null;
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
  trainingCount: number;
  tasks: TrainingTask[];
};

type Locale = "ru" | "en" | "de";

const copy = {
  ru: {
    doneKicker: "Тренировка • завершено",
    doneTitle: (count: number) => `Серия из ${count} задач выполнена`,
    result: "Результат",
    accuracy: "Точность",
    mistakes: "Ошибок",
    nextStep: "Следующий шаг",
    nextStepRetry: "Повторите этот навык, чтобы закрепить базу.",
    nextStepAdvance: (title: string) => `Перейдите к навыку: ${title}.`,
    nextStepDone: "Отлично! Можно вернуться к карте темы.",
    seriesTime: "Время серии",
    average: "В среднем",
    sec: "сек",
    secPerTask: "сек/задача",
    retrySkill: "Повторить этот навык",
    backToTopic: "Вернуться к теме",
    nextSkill: "Перейти к следующему навыку",
    debugInfo: "Служебная информация",
    skill: "Навык",
    trainingKicker: (count: number) => `Тренировка: ${count} задач подряд`,
    taskProgress: (index: number, total: number) => `Задача ${index} / ${total}`,
    toSkillPicker: "К выбору навыков",
    correct: "Верно",
    timer: "Таймер",
    on: "Вкл",
    off: "Выкл",
    taskOf: (index: number, total: number) => `Задача ${index} из ${total}`,
    numberHint: "Введите ответ числом и проверьте результат.",
    fractionHint: "Введите дробь: числитель и знаменатель.",
    ratioHint: "Введите отношение: левую и правую часть.",
    condition: "Условие",
    numberAnswer: "Ответ (число)",
    sampleNumber: "Например, 12",
    checkAnswer: "Проверить ответ",
    fractionAnswer: "Ответ (дробь)",
    ratioAnswer: "Ответ (отношение)",
    numerator: "Числитель",
    denominator: "Знаменатель",
    leftPart: "Левая часть",
    rightPart: "Правая часть",
    pressEnter: "Нажмите Enter, чтобы проверить ответ",
    currentTask: "Текущая задача",
    wrong: "Неверно",
    expected: "Правильный ответ",
    time: "Время",
    nextTask: "К следующей задаче",
    checkTime: "Служебное время проверки",
  },
  en: {
    doneKicker: "Training • completed",
    doneTitle: (count: number) => `${count}-task series completed`,
    result: "Result",
    accuracy: "Accuracy",
    mistakes: "Mistakes",
    nextStep: "Next step",
    nextStepRetry: "Repeat this skill to reinforce the basics.",
    nextStepAdvance: (title: string) => `Move to the next skill: ${title}.`,
    nextStepDone: "Great job! You can return to the topic map.",
    seriesTime: "Series time",
    average: "Average",
    sec: "sec",
    secPerTask: "sec/task",
    retrySkill: "Retry this skill",
    backToTopic: "Back to topic",
    nextSkill: "Go to next skill",
    debugInfo: "Debug info",
    skill: "Skill",
    trainingKicker: (count: number) => `Training: ${count} tasks in a row`,
    taskProgress: (index: number, total: number) => `Task ${index} / ${total}`,
    toSkillPicker: "Back to skill picker",
    correct: "Correct",
    timer: "Timer",
    on: "On",
    off: "Off",
    taskOf: (index: number, total: number) => `Task ${index} of ${total}`,
    numberHint: "Enter a numeric answer and check the result.",
    fractionHint: "Enter a fraction: numerator and denominator.",
    ratioHint: "Enter a ratio: left and right part.",
    condition: "Task",
    numberAnswer: "Answer (number)",
    sampleNumber: "For example, 12",
    checkAnswer: "Check answer",
    fractionAnswer: "Answer (fraction)",
    ratioAnswer: "Answer (ratio)",
    numerator: "Numerator",
    denominator: "Denominator",
    leftPart: "Left part",
    rightPart: "Right part",
    pressEnter: "Press Enter to check the answer",
    currentTask: "Current task",
    wrong: "Incorrect",
    expected: "Correct answer",
    time: "Time",
    nextTask: "Next task",
    checkTime: "Debug check time",
  },
  de: {
    doneKicker: "Training • abgeschlossen",
    doneTitle: (count: number) => `Serie mit ${count} Aufgaben abgeschlossen`,
    result: "Ergebnis",
    accuracy: "Genauigkeit",
    mistakes: "Fehler",
    nextStep: "Nächster Schritt",
    nextStepRetry: "Wiederholen Sie diese Fähigkeit, um die Grundlagen zu festigen.",
    nextStepAdvance: (title: string) => `Zur nächsten Fähigkeit wechseln: ${title}.`,
    nextStepDone: "Sehr gut! Sie können zur Themenkarte zurückkehren.",
    seriesTime: "Serienzeit",
    average: "Durchschnitt",
    sec: "Sek",
    secPerTask: "Sek/Aufgabe",
    retrySkill: "Diese Fähigkeit wiederholen",
    backToTopic: "Zurück zum Thema",
    nextSkill: "Zur nächsten Fähigkeit",
    debugInfo: "Technische Informationen",
    skill: "Fähigkeit",
    trainingKicker: (count: number) => `Training: ${count} Aufgaben am Stück`,
    taskProgress: (index: number, total: number) => `Aufgabe ${index} / ${total}`,
    toSkillPicker: "Zur Fähigkeitsauswahl",
    correct: "Richtig",
    timer: "Timer",
    on: "Ein",
    off: "Aus",
    taskOf: (index: number, total: number) => `Aufgabe ${index} von ${total}`,
    numberHint: "Geben Sie die Antwort als Zahl ein und prüfen Sie das Ergebnis.",
    fractionHint: "Bruch eingeben: Zähler und Nenner.",
    ratioHint: "Verhältnis eingeben: linker und rechter Teil.",
    condition: "Aufgabe",
    numberAnswer: "Antwort (Zahl)",
    sampleNumber: "Zum Beispiel 12",
    checkAnswer: "Antwort prüfen",
    fractionAnswer: "Antwort (Bruch)",
    ratioAnswer: "Antwort (Verhältnis)",
    numerator: "Zähler",
    denominator: "Nenner",
    leftPart: "Linker Teil",
    rightPart: "Rechter Teil",
    pressEnter: "Drücken Sie Enter, um die Antwort zu prüfen",
    currentTask: "Aktuelle Aufgabe",
    wrong: "Falsch",
    expected: "Richtige Antwort",
    time: "Zeit",
    nextTask: "Nächste Aufgabe",
    checkTime: "Technische Prüfzeit",
  },
} as const;

function toLocale(value: string): Locale {
  if (value === "en" || value === "de") return value;
  return "ru";
}

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

function areEquivalentFractions(aNum: number, aDen: number, bNum: number, bDen: number) {
  if (aDen === 0 || bDen === 0) return false;
  const diff = aNum * bDen - bNum * aDen;
  return Math.abs(diff) < 1e-9;
}

function formatExpectedAnswer(answer: TrainingTask["answer"]) {
  if (answer.type === "number") return String(answer.value);
  if (answer.type === "fraction") return `${answer.numerator}/${answer.denominator}`;
  return `${answer.left}:${answer.right}`;
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
  trainingCount,
  tasks,
}: TrainingRunnerProps) {
  const t = copy[toLocale(locale)];
  const showDebug = process.env.NODE_ENV !== "production";
  const [sessionId] = useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [startedAt] = useState(() => Date.now());
  const [taskStartedAt, setTaskStartedAt] = useState(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numberInputValue, setNumberInputValue] = useState("");
  const [leftInputValue, setLeftInputValue] = useState("");
  const [rightInputValue, setRightInputValue] = useState("");
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
  const currentAnswerType = currentTask?.answer.type ?? "number";
  const usesPairInput = currentAnswerType === "fraction" || currentAnswerType === "ratio";
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
            {t.doneKicker}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {t.doneTitle(tasks.length)}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {skillTitle}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.result}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {correctCount} / {tasks.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.accuracy}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {accuracyPercent}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.mistakes}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {wrongCount}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.nextStep}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {accuracyPercent < 70
                ? t.nextStepRetry
                : recommendedNextSkill
                  ? t.nextStepAdvance(recommendedNextSkill.title)
                  : t.nextStepDone}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t.seriesTime}: {formatSecondsFromMs(totalElapsedMs)} {t.sec}
              {averageTaskSeconds !== null ? ` • ${t.average}: ${averageTaskSeconds} ${t.secPerTask}` : ""}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink
              href={`/${locale}/topics/proportion/train?skill=${encodeURIComponent(skillId)}&count=${trainingCount}`}
              variant="primary"
            >
              {t.retrySkill}
            </ButtonLink>
            <ButtonLink href={`/${locale}/topics/proportion`} variant="secondary">
              {t.backToTopic}
            </ButtonLink>
            {recommendedNextSkill && recommendedNextSkill.id !== skillId ? (
              <ButtonLink
                href={`/${locale}/topics/proportion/train?skill=${encodeURIComponent(recommendedNextSkill.id)}&count=${trainingCount}`}
                variant="secondary"
              >
                {t.nextSkill}
              </ButtonLink>
            ) : null}
          </div>

          {showDebug ? (
            <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">
                {t.debugInfo}
              </summary>
              <div className="mt-2 text-xs text-slate-600">
                <p>
                  {t.skill}: <code>{skillId}</code>
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

    const parsedNumber = parseNumberInput(numberInputValue);
    const parsedLeft = parseNumberInput(leftInputValue);
    const parsedRight = parseNumberInput(rightInputValue);
    const taskElapsedMs = Date.now() - taskStartedAt;
    const totalMs = Date.now() - startedAt;
    let ok = false;
    let expectedValueForAttempt: number | null = null;
    let userAnswerRaw = numberInputValue;

    if (currentTask.answer.type === "number") {
      expectedValueForAttempt = currentTask.answer.value;
      ok = parsedNumber !== null && parsedNumber === currentTask.answer.value;
    } else if (currentTask.answer.type === "fraction") {
      userAnswerRaw = `${leftInputValue}/${rightInputValue}`;
      ok =
        parsedLeft !== null &&
        parsedRight !== null &&
        areEquivalentFractions(parsedLeft, parsedRight, currentTask.answer.numerator, currentTask.answer.denominator);
    } else if (currentTask.answer.type === "ratio") {
      userAnswerRaw = `${leftInputValue}:${rightInputValue}`;
      ok =
        parsedLeft !== null &&
        parsedRight !== null &&
        areEquivalentFractions(parsedLeft, parsedRight, currentTask.answer.left, currentTask.answer.right);
    }

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
      answer_raw: userAnswerRaw,
      answer_value: parsedNumber,
      expected_value: expectedValueForAttempt,
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
      userAnswer: userAnswerRaw,
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
    setNumberInputValue("");
    setLeftInputValue("");
    setRightInputValue("");
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
              {t.trainingKicker(trainingCount)}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {t.taskProgress(currentIndex + 1, tasks.length)}
            </p>
            <p className="mt-1 text-xs text-slate-600">{skillTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ButtonLink
                href={`/${locale}/topics/proportion/trainer`}
                variant="secondary"
                className="px-2.5 py-1.5 text-xs"
              >
                {t.toSkillPicker}
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/topics/proportion`}
                variant="secondary"
                className="px-2.5 py-1.5 text-xs"
              >
                {t.backToTopic}
              </ButtonLink>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600">
              {t.correct}: <span className="font-semibold text-slate-900">{correctCount}</span>
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
              <span>{t.timer}</span>
              <span>{timerEnabled ? t.on : t.off}</span>
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
              {t.taskOf(currentIndex + 1, tasks.length)}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {currentAnswerType === "number"
                ? t.numberHint
                : currentAnswerType === "fraction"
                  ? t.fractionHint
                  : t.ratioHint}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.timer}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {!timerEnabled
                ? t.off
                : taskTimer.isRunning || taskTimer.secondsElapsed > 0
                  ? formatTimerSeconds(taskTimer.secondsElapsed)
                  : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.condition}</p>
          <div className="mt-3 rounded-xl border border-white bg-white p-4">
            <MarkdownMath className="prose prose-slate max-w-none text-sm sm:text-base">
              {currentTask.statement_md}
            </MarkdownMath>
          </div>
        </div>

        <div className="mt-6">
          {!usesPairInput ? (
            <>
              <label
                htmlFor="number-answer"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                {t.numberAnswer}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="number-answer"
                  type="text"
                  inputMode="decimal"
                  value={numberInputValue}
                  disabled={checked}
                  onFocus={handleFirstInputAction}
                  onChange={(event) => {
                    handleFirstInputAction();
                    setNumberInputValue(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    handleFirstInputAction();
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (!checked) handleCheck();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder={t.sampleNumber}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={checked}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.checkAnswer}
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                {currentAnswerType === "fraction" ? t.fractionAnswer : t.ratioAnswer}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  value={leftInputValue}
                  disabled={checked}
                  onFocus={handleFirstInputAction}
                  onChange={(event) => {
                    handleFirstInputAction();
                    setLeftInputValue(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    handleFirstInputAction();
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (!checked) handleCheck();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500 sm:w-40"
                  placeholder={currentAnswerType === "fraction" ? t.numerator : t.leftPart}
                  autoComplete="off"
                />
                <span className="text-center text-lg font-semibold text-slate-700 sm:w-6">
                  {currentAnswerType === "fraction" ? "/" : ":"}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={rightInputValue}
                  disabled={checked}
                  onFocus={handleFirstInputAction}
                  onChange={(event) => {
                    handleFirstInputAction();
                    setRightInputValue(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    handleFirstInputAction();
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (!checked) handleCheck();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500 sm:w-40"
                  placeholder={currentAnswerType === "fraction" ? t.denominator : t.rightPart}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={checked}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.checkAnswer}
                </button>
              </div>
            </>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {t.pressEnter}
          </p>
        </div>

        {showDebug ? (
          <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              {t.debugInfo}
            </summary>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>
                {t.skill}: <code>{skillId}</code>
              </p>
              <p>
                {t.currentTask}: <code>{currentTask.id}</code>
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
              {isCorrect ? t.correct : t.wrong}
            </p>
            {!isCorrect ? (
              <p className="mt-2 text-sm text-slate-700">
                {t.expected}:{" "}
                <strong className="text-slate-950">{formatExpectedAnswer(currentTask.answer)}</strong>
              </p>
            ) : null}
            {timerEnabled ? (
              <p className="mt-2 text-sm text-slate-700">
                {t.time}:{" "}
                <strong className="text-slate-950">
                  {lastVisibleTaskSeconds !== null
                    ? `${lastVisibleTaskSeconds} ${t.sec}`
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
              {t.nextTask}
            </button>
          </div>

          {showDebug && lastTaskElapsedMs !== null ? (
            <p className="mt-3 text-xs text-slate-500">
              {t.checkTime}: {formatSecondsFromMs(lastTaskElapsedMs)} {t.sec}
            </p>
          ) : null}
        </SurfaceCard>
      ) : null}
    </section>
  );
}
