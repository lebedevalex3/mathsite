export type DifficultyBand = "A" | "B" | "C";

export function isDifficultyBand(value: unknown): value is DifficultyBand {
  return value === "A" || value === "B" || value === "C";
}

export function difficultyToBand(difficulty: number): DifficultyBand {
  if (difficulty === 1 || difficulty === 2) return "A";
  if (difficulty === 3) return "B";
  if (difficulty === 4 || difficulty === 5) return "C";
  throw new Error(`Invalid legacy difficulty value: ${difficulty}`);
}

export function bandToRepresentativeDifficulty(band: DifficultyBand): 2 | 3 | 5 {
  if (band === "A") return 2;
  if (band === "B") return 3;
  return 5;
}

export function normalizeDifficultyBand(task: {
  difficulty_band?: unknown;
  difficulty?: unknown;
}): DifficultyBand {
  if (isDifficultyBand(task.difficulty_band)) {
    return task.difficulty_band;
  }
  if (
    typeof task.difficulty === "number" &&
    Number.isInteger(task.difficulty) &&
    task.difficulty >= 1 &&
    task.difficulty <= 5
  ) {
    return difficultyToBand(task.difficulty);
  }
  throw new Error("Task must have difficulty_band or difficulty.");
}

