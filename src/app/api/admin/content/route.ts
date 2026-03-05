import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import {
  buildAdminContentPayload,
  buildAdminContentSummaries,
} from "@/src/lib/admin/content-registry";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import {
  getTeacherToolsTopicSkills,
  listTeacherToolsTopics,
  listUnconfiguredTeacherToolsTopicSlugs,
} from "@/src/lib/teacher-tools/catalog";
import { topicCatalogEntries } from "@/src/lib/topicMeta";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required.");
      return NextResponse.json(body, { status });
    }
    if (!isAdminRole(user.role)) {
      const { status, body } = forbidden("Admin role required.");
      return NextResponse.json(body, { status });
    }

    const topicConfigs = listTeacherToolsTopics();
    const unconfiguredSlugs = listUnconfiguredTeacherToolsTopicSlugs();
    const metaByTopicId = new Map(topicCatalogEntries.map((item) => [item.id, item] as const));

    const summaries = await buildAdminContentSummaries({
      topicConfigs,
      metaByTopicId,
      getTopicSkills: getTeacherToolsTopicSkills,
    });

    return NextResponse.json(
      buildAdminContentPayload({
        summaries,
        unconfiguredSlugs,
      }),
    );
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_CONTENT_LIST_ERROR",
      defaultMessage: "Failed to load content registry.",
    });
    return NextResponse.json(body, { status });
  }
}
