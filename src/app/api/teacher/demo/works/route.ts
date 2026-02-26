import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { toApiError } from "@/src/lib/api/errors";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { listRecentWorksForOwner } from "@/src/lib/variants/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);

    const works = await listRecentWorksForOwner(userId, { limit: 10, demoOnly: true });

    return NextResponse.json({
      ok: true,
      works: works.map((work) => ({
        id: work.id,
        topicId: work.topicId,
        title: work.title,
        workType: work.workType,
        printProfileJson: work.printProfileJson,
        isDemo: work.isDemo,
        createdAt: work.createdAt.toISOString(),
        variantsCount: work.variantsCount,
      })),
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "WORKS_LIST_ERROR",
      defaultMessage: "Failed to load works.",
    });
    return NextResponse.json(body, { status });
  }
}

