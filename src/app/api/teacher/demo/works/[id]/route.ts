import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, notFound, toApiError } from "@/src/lib/api/errors";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { buildWorkDisplayTitle } from "@/src/lib/teacher-tools/demo";
import {
  defaultOrientationForLayout,
  normalizePrintProfile,
  parsePrintOrientation,
} from "@/src/lib/variants/print-profile";
import { parsePrintLayout } from "@/src/lib/variants/print-layout";
import {
  getWorkDetailForOwner,
  updateWorkProfileForOwner,
} from "@/src/lib/variants/repository";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

function parseWorkType(value: unknown): "lesson" | "quiz" | "homework" | "test" | null {
  return value === "lesson" || value === "quiz" || value === "homework" || value === "test"
    ? value
    : null;
}

function parseTitleTemplate(value: unknown): { customTitle: string | null; date: string | null } {
  if (!value || typeof value !== "object") return { customTitle: null, date: null };
  const data = value as { customTitle?: unknown; date?: unknown };
  const customTitle =
    typeof data.customTitle === "string" && data.customTitle.trim().length > 0
      ? data.customTitle.trim().slice(0, 80)
      : null;
  const date =
    typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : null;
  return { customTitle, date };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);

    const body = (await request.json()) as {
      workType?: unknown;
      titleTemplate?: unknown;
      printProfile?: {
        layout?: unknown;
        orientation?: unknown;
        forceTwoUp?: unknown;
      };
    };

    const existing = await getWorkDetailForOwner(id, userId);
    if (!existing) {
      const { status, body } = notFound("Work not found");
      return NextResponse.json(body, { status });
    }

    const nextWorkType = parseWorkType(body.workType);
    if (!nextWorkType) {
      const { status, body } = badRequest("Invalid workType");
      return NextResponse.json(body, { status });
    }

    const layoutRaw = body.printProfile?.layout;
    if (typeof layoutRaw !== "string") {
      const { status, body } = badRequest("Invalid printProfile.layout");
      return NextResponse.json(body, { status });
    }
    const nextLayout = parsePrintLayout(layoutRaw);
    const nextOrientation = parsePrintOrientation(
      typeof body.printProfile?.orientation === "string" ? body.printProfile.orientation : null,
      defaultOrientationForLayout(nextLayout),
    );
    const forceTwoUp = body.printProfile?.forceTwoUp === true;
    const titleTemplate = parseTitleTemplate(body.titleTemplate);

    const stored = normalizePrintProfile(existing.printProfileJson);
    const existingRaw =
      existing.printProfileJson && typeof existing.printProfileJson === "object"
        ? (existing.printProfileJson as Record<string, unknown>)
        : {};

    const nextProfileJson = {
      ...existingRaw,
      version: 1,
      layout: nextLayout,
      orientation: nextOrientation,
      workType: nextWorkType,
      forceTwoUp,
      // Preserve existing fit analysis; it still applies to this work's task set.
      fit: existingRaw.fit ?? (stored as unknown as { fit?: unknown }).fit,
      generation: {
        ...(existingRaw.generation && typeof existingRaw.generation === "object"
          ? (existingRaw.generation as Record<string, unknown>)
          : {}),
        titleTemplate,
      },
    };
    const nextTitle = buildWorkDisplayTitle({
      workType: nextWorkType,
      titleTemplate,
    });

    const updated = await updateWorkProfileForOwner({
      workId: id,
      ownerUserId: userId,
      workType: nextWorkType,
      title: nextTitle,
      printProfileJson: nextProfileJson,
    });

    if (!updated) {
      const { status, body } = notFound("Work not found");
      return NextResponse.json(body, { status });
    }

    return NextResponse.json({
      ok: true,
      work: {
        id: updated.id,
        workType: updated.workType,
        printProfileJson: updated.printProfileJson,
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "WORK_UPDATE_ERROR",
      defaultMessage: "Failed to update work profile.",
    });
    return NextResponse.json(body, { status });
  }
}
