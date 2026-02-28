import { notFound } from "next/navigation";

import { getTasksForTopic } from "@/lib/tasks/query";
import type { Task } from "@/lib/tasks/schema";
import { listTeacherToolsTopics } from "@/src/lib/teacher-tools/catalog";

import TrainingRunner from "./TrainingRunner";

const TOPIC_ID = "g5.uravneniya";
const REQUIRED_TASK_COUNT = 10;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ skill?: string | string[] }>;
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
  return /^g5\.uravneniya\.[a-z][a-z0-9_]*$/.test(value);
}

function groupCounts(tasks: Task[]) {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    counts.set(task.skill_id, (counts.get(task.skill_id) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default async function UravneniyaTrainPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { skill } = await searchParams;
  const skillId = Array.isArray(skill) ? skill[0] : skill;

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
    return (
      <main>
        <h1>Тренировка по теме «Уравнения»</h1>
        <p>
          Передайте параметр <code>skill</code> в query string.
        </p>
        <p>Примеры доступных навыков:</p>
        <ul>
          {allSkillCounts.map(([id, count]) => (
            <li key={id}>
              <a href={`/${locale}/5-klass/uravneniya/train?skill=${encodeURIComponent(id)}`}>
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
  const uravneniyaTopic = listTeacherToolsTopics().find((topic) => topic.topicId === TOPIC_ID);
  const skillTitle = uravneniyaTopic?.skills.find((skill) => skill.id === skillId)?.title ?? skillId;
  const skillOrder = (uravneniyaTopic?.skills ?? []).map((skill) => ({
    id: skill.id,
    title: skill.title,
  }));

  if (skillTasks.length < REQUIRED_TASK_COUNT) {
    return (
      <main>
        <h1>Пока недостаточно задач для тренировки</h1>
        <p>
          Для навыка <code>{skillId}</code> найдено {skillTasks.length} задач(и),
          нужно минимум {REQUIRED_TASK_COUNT}.
        </p>
        <p>
          <a href={`/${locale}/teacher-tools?topicId=g5.uravneniya`}>Вернуться в генератор</a>
        </p>
      </main>
    );
  }

  const selectedTasks = shuffle(skillTasks).slice(0, REQUIRED_TASK_COUNT);

  return (
    <main>
      <TrainingRunner
        locale={locale}
        skillId={skillId}
        skillTitle={skillTitle}
        skillOrder={skillOrder}
        tasks={selectedTasks}
      />
    </main>
  );
}
