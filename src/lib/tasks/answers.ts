import type { TaskAnswer } from "@/lib/tasks/schema";

export function formatTaskAnswer(answer: TaskAnswer): string {
  if (answer.type === "number") return String(answer.value);
  if (answer.type === "fraction") return `${answer.numerator}/${answer.denominator}`;
  return `${answer.left}:${answer.right}`;
}

