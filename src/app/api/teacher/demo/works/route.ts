import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isTeacherRole } from "@/src/lib/auth/access";
import { forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { listRecentWorksForOwner } from "@/src/lib/variants/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required to view work history.");
      return NextResponse.json(body, { status });
    }
    if (!isTeacherRole(user.role)) {
      const { status, body } = forbidden("Teacher role required to view work history.");
      return NextResponse.json(body, { status });
    }

    const works = await listRecentWorksForOwner(user.id, { limit: 10, demoOnly: true });

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
