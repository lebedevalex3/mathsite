import path from "node:path";

import { type Task } from "./schema";
import { loadTaskBanks } from "./load";

export type TopicTasksResult = {
  tasks: Task[];
  errors: string[];
};

export async function getTasksForTopic(topicId: string): Promise<TopicTasksResult> {
  const rootDir = path.join(process.cwd(), "data", "tasks");
  const { banks, errors } = await loadTaskBanks(rootDir);

  const tasks = banks
    .filter(({ bank }) => bank.topic_id === topicId)
    .flatMap(({ bank }) => bank.tasks);

  return {
    tasks,
    errors: errors.map((error) => `${error.filePath}: ${error.message}`),
  };
}

