import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, forbidden, notFound, toApiError, unauthorized } from "@/src/lib/api/errors";
import { writeAuditLog } from "@/src/lib/audit/log";
import { verifyCsrfRequestIfAuthenticated } from "@/src/lib/auth/csrf";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { prisma } from "@/src/lib/db/prisma";
import { checkSkillReadyGate } from "@/src/lib/admin/quality-gates";
import {
  applySkillOverrideToSnapshot,
  isSkillStatus,
  normalizeSkillKind,
  normalizeSkillStatus,
} from "@/src/lib/admin/skills-registry";
import { listTeacherToolsTopics } from "@/src/lib/teacher-tools/catalog";
import { type SkillKind, SKILL_KINDS } from "@/src/lib/skills/kind";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ skillId: string }>;
};

type PatchPayload = {
  title?: string | null;
  summary?: string | null;
  kind?: SkillKind | null;
  status?: "ready" | "soon" | null;
};

function normalizeOptionalText(value: unknown) {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parsePatchPayload(input: unknown): PatchPayload | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const title = normalizeOptionalText(source.title);
  const summary = normalizeOptionalText(source.summary);

  const kindInput = source.kind;
  let kind: SkillKind | null = null;
  if (kindInput != null) {
    if (typeof kindInput !== "string" || !(SKILL_KINDS as readonly string[]).includes(kindInput)) {
      return null;
    }
    kind = kindInput as SkillKind;
  }

  const statusInput = source.status;
  let status: "ready" | "soon" | null = null;
  if (statusInput != null) {
    if (!isSkillStatus(statusInput)) return null;
    status = statusInput;
  }

  return { title, summary, kind, status };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { skillId } = await params;
    const cookieStore = await cookies();
    const csrfError = verifyCsrfRequestIfAuthenticated(request, cookieStore);
    if (csrfError) {
      const { status, body } = csrfError;
      return NextResponse.json(body, { status });
    }
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required.");
      return NextResponse.json(body, { status });
    }
    if (!isAdminRole(user.role)) {
      const { status, body } = forbidden("Admin role required.");
      return NextResponse.json(body, { status });
    }

    const payload = parsePatchPayload(await request.json());
    if (!payload) {
      const { status, body } = badRequest("Invalid payload.");
      return NextResponse.json(body, { status });
    }

    const topic = listTeacherToolsTopics().find((item) => item.skills.some((skill) => skill.id === skillId));
    const baseSkill = topic?.skills.find((skill) => skill.id === skillId);
    if (!topic || !baseSkill) {
      const { status, body } = notFound("Skill not found.");
      return NextResponse.json(body, { status });
    }

    if (payload.status === "ready") {
      const gate = await checkSkillReadyGate({
        topicId: topic.topicId,
        skillId,
      });
      if (!gate.ok) {
        const { status, body } = badRequest(
          `Quality gate failed for ready status: ${gate.reasons.join(", ")}`,
          "QUALITY_GATE_FAILED",
        );
        return NextResponse.json(
          {
            ...body,
            details: {
              coverage: gate.coverage,
              reasons: gate.reasons,
            },
          },
          { status },
        );
      }
    }

    const before = await prisma.skillOverride.findUnique({
      where: { skillId },
    });

    const nextData = {
      skillId,
      title: payload.title,
      summary: payload.summary,
      kind: payload.kind,
      status: payload.status,
      updatedByUserId: user.id,
    };

    const shouldDelete =
      nextData.title == null &&
      nextData.summary == null &&
      nextData.kind == null &&
      nextData.status == null;

    let after: typeof before = null;
    if (shouldDelete) {
      if (before) {
        await prisma.skillOverride.delete({
          where: { skillId },
        });
      }
    } else {
      after = await prisma.skillOverride.upsert({
        where: { skillId },
        create: nextData,
        update: nextData,
      });
    }

    const merged = applySkillOverrideToSnapshot(
      {
        id: baseSkill.id,
        title: baseSkill.title,
        summary: baseSkill.summary ?? null,
        status: normalizeSkillStatus(baseSkill.status, "ready"),
        kind: normalizeSkillKind(baseSkill.kind, "compute"),
        branchId: baseSkill.branchId ?? null,
        trainerHref: baseSkill.trainerHref ?? null,
      },
      after,
    );

    await writeAuditLog({
      actorUserId: user.id,
      action: "admin.skill_override.update",
      entityType: "skill",
      entityId: skillId,
      payload: {
        topicId: topic.topicId,
        before: before
          ? {
              title: before.title,
              summary: before.summary,
              kind: before.kind,
              status: before.status,
            }
          : null,
        after: after
          ? {
              title: after.title,
              summary: after.summary,
              kind: after.kind,
              status: after.status,
            }
          : null,
      },
    });

    return NextResponse.json({
      ok: true,
      item: {
        topicId: topic.topicId,
        skillId: merged.id,
        title: merged.title,
        summary: merged.summary,
        status: merged.status,
        kind: merged.kind,
        branchId: merged.branchId,
        trainerHref: merged.trainerHref,
        hasOverride: Boolean(after),
        updatedAt: after ? after.updatedAt.toISOString() : null,
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_SKILL_UPDATE_ERROR",
      defaultMessage: "Failed to update skill.",
    });
    return NextResponse.json(body, { status });
  }
}
