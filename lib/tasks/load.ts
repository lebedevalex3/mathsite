import { promises as fs } from "node:fs";
import path from "node:path";

import { taskBankSchema, type TaskBank } from "./schema";

export type TaskLoadError = {
  filePath: string;
  message: string;
};

export type LoadedTaskBank = {
  filePath: string;
  bank: TaskBank;
};

async function walkJsonFiles(dirPath: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) return walkJsonFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".json")) return [fullPath];
      return [];
    }),
  );

  return nested.flat().sort();
}

export async function loadTaskBanks(rootDir: string): Promise<{
  files: string[];
  banks: LoadedTaskBank[];
  errors: TaskLoadError[];
}> {
  const files = await walkJsonFiles(rootDir);
  const banks: LoadedTaskBank[] = [];
  const errors: TaskLoadError[] = [];

  for (const filePath of files) {
    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf8");
    } catch (error) {
      errors.push({
        filePath,
        message:
          error instanceof Error ? error.message : "Failed to read file",
      });
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch (error) {
      errors.push({
        filePath,
        message:
          error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON",
      });
      continue;
    }

    const result = taskBankSchema.safeParse(parsed);
    if (!result.success) {
      const issueText = result.error.issues
        .map((issue: { path: (string | number)[]; message: string }) => {
          const issuePath = issue.path.length > 0 ? issue.path.join(".") : "(root)";
          return `${issuePath}: ${issue.message}`;
        })
        .join("; ");
      errors.push({ filePath, message: `Schema validation failed: ${issueText}` });
      continue;
    }

    banks.push({ filePath, bank: result.data });
  }

  return { files, banks, errors };
}
