import { authorizeInternalCronRequest } from "@/src/lib/ops/internal-cron";
import { cleanupExpiredDemoWorks, type DemoCleanupResult } from "@/src/lib/demo-work-cleanup";

type RunDemoCleanupCronOptions = {
  secret?: string;
  now?: Date;
  runCleanup?: (now?: Date) => Promise<DemoCleanupResult>;
};

export async function runDemoCleanupCron(
  request: Request,
  options: RunDemoCleanupCronOptions = {},
) {
  const authError = authorizeInternalCronRequest(request, options.secret);
  if (authError) {
    return authError;
  }

  const runCleanup = options.runCleanup ?? cleanupExpiredDemoWorks;
  const result = await runCleanup(options.now);

  return {
    status: 200,
    body: {
      ok: true as const,
      deletedWorks: result.deletedWorks,
      deletedVariants: result.deletedVariants,
      skipped: result.skipped,
      ranAt: (options.now ?? new Date()).toISOString(),
    },
  };
}
