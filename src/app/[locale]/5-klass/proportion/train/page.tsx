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

export default async function ProportionTrainPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { skill, count } = await searchParams;
  const skillId = Array.isArray(skill) ? skill[0] : skill;
  const countFromQuery = parseTaskCount(count);

  const { tasks, errors } = await getTasksForTopic(TOPIC_ID);

  if (errors.length > 0) {
    return (
      <main>
        <h1>Не удалось загрузить задания</h1>
        <p>Есть ошибки в JSON банка задач.</p>
        <pre>{errors.join("\n")}</pre>
      </main>
    );
  }

  const allSkillCounts = groupCounts(tasks);

  if (!skillId || !isSkillId(skillId)) {
    const fallbackCount = Number.isFinite(countFromQuery) ? countFromQuery : DEFAULT_TASK_COUNT;
    return (
      <main>
        <h1>Тренировка по теме «Пропорции»</h1>
        <p>
          Передайте параметр <code>skill</code> в query string.
        </p>
        <p>Примеры доступных навыков:</p>
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
  const skillTitle = selectedSkill?.title ?? skillId;
  const skillOrder = proportionSkills.map((skill) => ({
    id: skill.id,
    title: skill.title,
  }));

  if (skillTasks.length < taskCount) {
    return (
      <main>
        <h1>Пока недостаточно задач для тренировки</h1>
        <p>
          Для навыка <code>{skillId}</code> найдено {skillTasks.length} задач(и),
          нужно минимум {taskCount}.
        </p>
        <p>
          <a href={`/${locale}/topics/proportion`}>Вернуться к теме</a>
        </p>
      </main>
    );
  }

  const selectedTasks = shuffle(skillTasks).slice(0, taskCount);

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
