import { loadTaskBank, type LoadedTaskBanksResult } from "@/lib/taskbank";
import { type Task } from "./schema";

export type TopicTasksResult = {
  tasks: Task[];
  errors: string[];
};

export function filterTaskLoadErrorsByTopic(
  errors: LoadedTaskBanksResult["errors"],
  topicId: string,
) {
  return errors
    .filter((error) => error.topicId === topicId)
    .map((error) => `${error.filePath}: ${error.message}`);
}

export async function getTasksForTopic(topicId: string): Promise<TopicTasksResult> {
  const { banks, errors } = await loadTaskBank();

  const tasks = banks
    .filter(({ bank }) => bank.topic_id === topicId)
    .flatMap(({ bank }) => bank.tasks);

  return {
    tasks,
    errors: filterTaskLoadErrorsByTopic(errors, topicId),
  };
}
