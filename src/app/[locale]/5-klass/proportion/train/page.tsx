import { notFound } from "next/navigation";

import { getTasksForTopic } from "@/lib/tasks/query";
import type { Task } from "@/lib/tasks/schema";
import { proportionSkills } from "@/src/lib/topics/proportion/module-data";

import TrainingRunner from "./TrainingRunner";

const TOPIC_ID = "math.proportion";
const DEFAULT_TASK_COUNT = 10;
const ALLOWED_TASK_COUNTS = [5, 10, 15, 20] as const;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ skill?: string | string[]; count?: string | string[] }>;
};

type Locale = "ru" | "en" | "de";

const copy = {
  ru: {
    loadFailedTitle: "Не удалось загрузить задания",
    loadFailedBody: "Есть ошибки в JSON банка задач.",
    trainTitle: "Тренировка по теме «Пропорции»",
    passSkillParam: "Передайте параметр",
    examples: "Примеры доступных навыков:",
    notEnoughTitle: "Пока недостаточно задач для тренировки",
    foundForSkill: "Для навыка",
    foundTasks: "найдено задач",
    needAtLeast: "нужно минимум",
    backToTopic: "Вернуться к теме",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": "Понимать отношение как частное",
    },
  },
  en: {
    loadFailedTitle: "Failed to load tasks",
    loadFailedBody: "There are errors in the JSON task bank.",
    trainTitle: "Training: Proportions",
    passSkillParam: "Provide the",
    examples: "Available skill examples:",
    notEnoughTitle: "Not enough tasks for training yet",
    foundForSkill: "For skill",
    foundTasks: "tasks found",
    needAtLeast: "minimum required",
    backToTopic: "Back to topic",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": "Understand ratio as quotient",
    },
  },
  de: {
    loadFailedTitle: "Aufgaben konnten nicht geladen werden",
    loadFailedBody: "Im JSON-Aufgabenpool wurden Fehler gefunden.",
    trainTitle: "Training: Proportionen",
    passSkillParam: "Übergeben Sie den Parameter",
    examples: "Beispiele verfügbarer Fähigkeiten:",
    notEnoughTitle: "Noch nicht genug Aufgaben für das Training",
    foundForSkill: "Für die Fähigkeit",
    foundTasks: "Aufgaben gefunden",
    needAtLeast: "mindestens erforderlich",
    backToTopic: "Zurück zum Thema",
    skillLabels: {
      "math.proportion.understand_ratio_as_quotient": "Verhältnis als Quotient verstehen",
    },
  },
} as const;

function toLocale(value: string): Locale {
  if (value === "en" || value === "de") return value;
  return "ru";
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isSkillId(value: string): boolean {
  return /^math\.proportion\.[a-z][a-z0-9_]*$/.test(value);
}

function groupCounts(tasks: Task[]) {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    counts.set(task.skill_id, (counts.get(task.skill_id) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function parseTaskCount(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value ? Number(value) : NaN;
  if (ALLOWED_TASK_COUNTS.includes(parsed as (typeof ALLOWED_TASK_COUNTS)[number])) return parsed;
  return Number.NaN;
}

function pickClosestAvailableDifficulty(
  preferredDifficulty: number,
  buckets: Map<number, Task[]>,
  levels: number[],
) {
  const available = levels.filter((level) => (buckets.get(level)?.length ?? 0) > 0);
  if (available.length === 0) return null;
  const sorted = [...available].sort((a, b) => {
    const byDistance = Math.abs(a - preferredDifficulty) - Math.abs(b - preferredDifficulty);
    if (byDistance !== 0) return byDistance;
    return a - b;
  });
  return sorted[0] ?? null;
}

function selectTasksWithDifficultyLadder(skillTasks: Task[], taskCount: number) {
  const buckets = new Map<number, Task[]>();
  for (const task of skillTasks) {
    const key = task.difficulty;
    const next = buckets.get(key) ?? [];
    next.push(task);
    buckets.set(key, next);
  }

  const levels = [...buckets.keys()].sort((a, b) => a - b);
  for (const level of levels) {
    buckets.set(level, shuffle(buckets.get(level) ?? []));
  }

  if (levels.length <= 1) {
    return shuffle(skillTasks).slice(0, taskCount);
  }

  const selected: Task[] = [];

  for (let index = 0; index < taskCount; index += 1) {
    const ladderIndex = Math.floor((index * levels.length) / taskCount);
    const preferredDifficulty = levels[Math.min(ladderIndex, levels.length - 1)] ?? levels[0];
    const difficultyToUse = pickClosestAvailableDifficulty(preferredDifficulty, buckets, levels);
    if (difficultyToUse === null) break;

    const pool = buckets.get(difficultyToUse);
    const picked = pool?.shift();
    if (picked) {
      selected.push(picked);
    }
  }

  if (selected.length >= taskCount) return selected;

  for (const level of levels) {
    const pool = buckets.get(level) ?? [];
    while (pool.length > 0 && selected.length < taskCount) {
      const picked = pool.shift();
      if (picked) selected.push(picked);
    }
    if (selected.length >= taskCount) break;
  }

  return selected.slice(0, taskCount);
}

export default async function ProportionTrainPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const typedLocale = toLocale(locale);
  const t = copy[typedLocale];
  const { skill, count } = await searchParams;
  const skillId = Array.isArray(skill) ? skill[0] : skill;
  const countFromQuery = parseTaskCount(count);

  const { tasks, errors } = await getTasksForTopic(TOPIC_ID);

  if (errors.length > 0) {
    return (
      <main>
        <h1>{t.loadFailedTitle}</h1>
        <p>{t.loadFailedBody}</p>
        <pre>{errors.join("\n")}</pre>
      </main>
    );
  }

  const allSkillCounts = groupCounts(tasks);

  if (!skillId || !isSkillId(skillId)) {
    const fallbackCount = Number.isFinite(countFromQuery) ? countFromQuery : DEFAULT_TASK_COUNT;
    return (
      <main>
        <h1>{t.trainTitle}</h1>
        <p>
          {t.passSkillParam} <code>skill</code> in query string.
        </p>
        <p>{t.examples}</p>
        <ul>
          {allSkillCounts.map(([id, count]) => (
            <li key={id}>
              <a href={`/${locale}/topics/proportion/train?skill=${encodeURIComponent(id)}&count=${fallbackCount}`}>
                {id}
              </a>{" "}
              ({count})
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const skillTasks = tasks.filter((task) => task.skill_id === skillId);
  if (skillTasks.length === 0) {
    notFound();
  }
  const selectedSkill = proportionSkills.find((skill) => skill.id === skillId);
  const taskCount = Number.isFinite(countFromQuery)
    ? countFromQuery
    : selectedSkill?.defaultTrainingCount ?? DEFAULT_TASK_COUNT;
  const skillTitle = t.skillLabels[skillId as keyof typeof t.skillLabels] ?? selectedSkill?.title ?? skillId;
  const skillOrder = proportionSkills.map((skill) => ({
    id: skill.id,
    title: t.skillLabels[skill.id as keyof typeof t.skillLabels] ?? skill.title,
  }));

  if (skillTasks.length < taskCount) {
    return (
      <main>
        <h1>{t.notEnoughTitle}</h1>
        <p>
          {t.foundForSkill} <code>{skillId}</code>: {skillTasks.length} {t.foundTasks}, {t.needAtLeast} {taskCount}.
        </p>
        <p>
          <a href={`/${locale}/topics/proportion`}>{t.backToTopic}</a>
        </p>
      </main>
    );
  }

  const selectedTasks = selectTasksWithDifficultyLadder(skillTasks, taskCount);

  return (
    <main>
      <TrainingRunner
        locale={locale}
        skillId={skillId}
        skillTitle={skillTitle}
        skillOrder={skillOrder}
        trainingCount={taskCount}
        tasks={selectedTasks}
      />
    </main>
  );
}
