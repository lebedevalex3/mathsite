import path from "node:path";

import { loadTaskBanks, type LoadedTaskBank, type TaskLoadError } from "./tasks/load";

export type LoadedTaskBanksResult = {
  files: string[];
  banks: LoadedTaskBank[];
  errors: TaskLoadError[];
};

const cache = new Map<string, Promise<LoadedTaskBanksResult>>();

function shouldBypassCache() {
  return process.env.TASKBANK_NO_CACHE === "1";
}

function taskBankRootDir() {
  return path.join(process.cwd(), "data", "tasks");
}

/**
 * Loads and validates task banks from disk once per process by default.
 * Set TASKBANK_NO_CACHE=1 to force re-reading files on every call (useful in local debugging).
 */
export async function loadTaskBank(): Promise<LoadedTaskBanksResult> {
  const rootDir = taskBankRootDir();

  if (shouldBypassCache()) {
    return loadTaskBanks(rootDir);
  }

  let promise = cache.get(rootDir);
  if (!promise) {
    promise = loadTaskBanks(rootDir);
    cache.set(rootDir, promise);
  }

  return promise;
}

export function clearTaskBankCache() {
  cache.clear();
}

