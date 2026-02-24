"use client";

import { useEffect, useState } from "react";

import { MarkdownMath } from "@/lib/ui/MarkdownMath";
import type { Task } from "@/lib/tasks/schema";

const STORAGE_KEY = "attempts:g5.proporcii";
const TOPIC_ID = "g5.proporcii";

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
  tasks: TrainingTask[];
};

function formatSeconds(ms: number) {
  return (ms / 1000).toFixed(1);
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
  tasks,
}: TrainingRunnerProps) {
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
  const [results, setResults] = useState<
    Array<{ taskId: string; isCorrect: boolean; taskElapsedMs: number }>
  >([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);

  const currentTask = tasks[currentIndex];
  const totalElapsedMs = now - startedAt;
  const currentTaskElapsedMs = checked ? lastTaskElapsedMs ?? 0 : now - taskStartedAt;
  const correctCount = results.filter((item) => item.isCorrect).length;
  const finished = currentIndex >= tasks.length;

  if (finished) {
    return (
      <section>
        <h1>Тренировка завершена</h1>
        <p>
          Навык: <code>{skillId}</code>
        </p>
        <p>
          Результат: {correctCount} / {tasks.length}
        </p>
        <p>Общее время: {formatSeconds(totalElapsedMs)} c</p>
        <p>
          <a href={`/${locale}/5-klass/proporcii/train?skill=${encodeURIComponent(skillId)}`}>
            Пройти ещё 10 задач
          </a>
        </p>
        <p>
          <a href={`/${locale}/5-klass/proporcii`}>Вернуться к теме</a>
        </p>
      </section>
    );
  }

  function handleCheck() {
    if (!currentTask || checked) return;

    const parsedAnswer = parseNumberInput(inputValue);
    const expected = currentTask.answer.value;
    const taskElapsedMs = Date.now() - taskStartedAt;
    const totalMs = Date.now() - startedAt;
    const ok = parsedAnswer !== null && parsedAnswer === expected;

    setChecked(true);
    setIsCorrect(ok);
    setLastTaskElapsedMs(taskElapsedMs);
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
    setCurrentIndex((prev) => prev + 1);
    setInputValue("");
    setChecked(false);
    setIsCorrect(null);
    setLastTaskElapsedMs(null);
    setTaskStartedAt(Date.now());
  }

  return (
    <section>
      <h1>Тренировка: 10 задач подряд</h1>
      <p>
        Навык: <code>{skillId}</code>
      </p>
      <p>
        Задача {currentIndex + 1} / {tasks.length} | Верно: {correctCount} | Общее
        время: {formatSeconds(totalElapsedMs)} c
      </p>

      <article>
        <h2>Условие</h2>
        <MarkdownMath>{currentTask.statement_md}</MarkdownMath>
      </article>

      <div>
        <label htmlFor="number-answer">Ответ (число)</label>
        <div>
          <input
            id="number-answer"
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (checked) {
                  handleNext();
                } else {
                  handleCheck();
                }
              }
            }}
          />
          {!checked ? (
            <button type="button" onClick={handleCheck}>
              Check
            </button>
          ) : (
            <button type="button" onClick={handleNext}>
              Дальше
            </button>
          )}
        </div>
      </div>

      <p>Время на текущую задачу: {formatSeconds(currentTaskElapsedMs)} c</p>

      {checked ? (
        <div>
          <p>{isCorrect ? "Верно" : "Неверно"}</p>
          <p>
            Правильный ответ: <strong>{currentTask.answer.value}</strong>
          </p>
          {lastTaskElapsedMs !== null ? (
            <p>Время на задачу: {formatSeconds(lastTaskElapsedMs)} c</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
