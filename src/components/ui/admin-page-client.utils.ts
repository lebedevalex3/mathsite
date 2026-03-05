export type AdminPageSectionErrors = {
  students: string | null;
  logs: string | null;
  content: string | null;
};

export function formatAdminSectionFailures(params: {
  results: PromiseSettledResult<unknown>[];
  sectionNames: readonly [string, string, string];
  formatSectionError: (label: string, reason: unknown) => string;
}): string[] {
  return params.results
    .map((result, index) => ({ result, index }))
    .filter((item): item is { result: PromiseRejectedResult; index: number } => item.result.status === "rejected")
    .map((item) => params.formatSectionError(params.sectionNames[item.index], item.result.reason));
}

export function buildAdminSectionErrors(params: {
  results: PromiseSettledResult<unknown>[];
  sectionNames: readonly [string, string, string];
  formatSectionError: (label: string, reason: unknown) => string;
}): AdminPageSectionErrors {
  const [studentsResult, logsResult, contentResult] = params.results;

  return {
    students:
      studentsResult?.status === "rejected"
        ? params.formatSectionError(params.sectionNames[0], studentsResult.reason)
        : null,
    logs:
      logsResult?.status === "rejected" ? params.formatSectionError(params.sectionNames[1], logsResult.reason) : null,
    content:
      contentResult?.status === "rejected"
        ? params.formatSectionError(params.sectionNames[2], contentResult.reason)
        : null,
  };
}
