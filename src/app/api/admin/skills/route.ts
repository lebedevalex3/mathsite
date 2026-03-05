import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { prisma } from "@/src/lib/db/prisma";
import {
  buildAdminSkillRegistry,
  filterAdminSkillRegistry,
  isSkillStatus,
} from "@/src/lib/admin/skills-registry";
import { SKILL_KINDS } from "@/src/lib/skills/kind";

export const runtime = "nodejs";

function toBooleanFlag(raw: string | null) {
  if (!raw) return false;
  return raw === "1" || raw.toLowerCase() === "true";
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const topicId = searchParams.get("topicId") ?? undefined;
    const statusFilterRaw = searchParams.get("status");
    const withoutTasksOnly = toBooleanFlag(searchParams.get("withoutTasksOnly"));

    if (
      statusFilterRaw &&
      statusFilterRaw !== "all" &&
      !isSkillStatus(statusFilterRaw)
    ) {
      const { status, body } = badRequest("Invalid status filter.");
      return NextResponse.json(body, { status });
    }

    const overrides = await prisma.skillOverride.findMany();
    const overridesBySkillId = new Map(
      overrides.map((item) => [item.skillId, item] as const),
    );
    const items = await buildAdminSkillRegistry({
      overridesBySkillId,
    });
    const filtered = filterAdminSkillRegistry(items, {
      q,
      topicId,
      status: (statusFilterRaw as "all" | "ready" | "soon" | null) ?? "all",
      withoutTasksOnly,
    });

    const topics = [...new Set(items.map((item) => item.topicId))].sort();
    const summary = {
      skillsTotal: filtered.length,
      topicsTotal: new Set(filtered.map((item) => item.topicId)).size,
      withoutTasksTotal: filtered.filter((item) => item.tasksTotal === 0).length,
      withOverrideTotal: filtered.filter((item) => item.hasOverride).length,
    };

    return NextResponse.json({
      ok: true,
      items: filtered,
      topics,
      filters: {
        q: q ?? "",
        topicId: topicId ?? "all",
        status: statusFilterRaw ?? "all",
        withoutTasksOnly,
      },
      summary,
      dictionaries: {
        kinds: SKILL_KINDS,
        statuses: ["ready", "soon"] as const,
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_SKILLS_LIST_ERROR",
      defaultMessage: "Failed to load skills registry.",
    });
    return NextResponse.json(body, { status });
  }
}
