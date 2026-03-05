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
