import { prisma } from "@/src/lib/db/prisma";

type Args = {
  apply: boolean;
  olderThanHours: number;
};

function parseArgs(argv: string[]): Args {
  let olderThanHours = 24 * 7;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") continue;
    if (arg === "--older-than-hours") {
      const value = Number(argv[i + 1]);
      if (Number.isFinite(value) && value > 0) {
        olderThanHours = value;
        i += 1;
      }
    }
  }
  return {
    apply: argv.includes("--apply"),
    olderThanHours,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cutoff = new Date(Date.now() - args.olderThanHours * 60 * 60 * 1000);

  const db = prisma as unknown as {
    work: {
      findMany(args: unknown): Promise<Array<{ id: string }>>;
      deleteMany(args: unknown): Promise<{ count: number }>;
    };
    workVariant: {
      findMany(args: unknown): Promise<Array<{ variantId: string }>>;
      findFirst(args: unknown): Promise<{ id: string } | null>;
    };
    variant: {
      deleteMany(args: unknown): Promise<{ count: number }>;
    };
  };

  const expiredWorks = await db.work.findMany({
    where: {
      isDemo: true,
      OR: [{ expiresAt: { lt: new Date() } }, { createdAt: { lt: cutoff } }],
    },
    select: { id: true },
  });

  if (expiredWorks.length === 0) {
    console.log("No expired demo works found.");
    return;
  }

  const workIds = expiredWorks.map((w) => w.id);
  const links = await db.workVariant.findMany({
    where: { workId: { in: workIds } },
    select: { variantId: true },
  });
  const candidateVariantIds = [...new Set(links.map((l) => l.variantId))];

  console.log(`Found expired demo works: ${workIds.length}`);
  console.log(`Candidate variants linked to expired works: ${candidateVariantIds.length}`);
  console.log(`Mode: ${args.apply ? "apply" : "dry-run"}`);

  if (!args.apply) {
    console.log("Re-run with --apply to delete expired demo works and orphaned variants.");
    return;
  }

  await db.work.deleteMany({
    where: { id: { in: workIds } },
  });

  const orphanVariantIds: string[] = [];
  for (const variantId of candidateVariantIds) {
    const stillLinked = await db.workVariant.findFirst({
      where: { variantId },
      select: { id: true },
    });
    if (!stillLinked) orphanVariantIds.push(variantId);
  }

  const deletedVariants =
    orphanVariantIds.length > 0
      ? await db.variant.deleteMany({
          where: { id: { in: orphanVariantIds } },
        })
      : { count: 0 };

  console.log(`Deleted works: ${workIds.length}`);
  console.log(`Deleted orphan variants: ${deletedVariants.count}`);
}

main()
  .catch((error) => {
    console.error("Failed to cleanup demo works.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

