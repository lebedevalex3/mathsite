import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, notFound, toApiError } from "@/src/lib/api/errors";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
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

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);

    const body = (await request.json()) as {
      workType?: unknown;
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
    };

    const updated = await updateWorkProfileForOwner({
      workId: id,
      ownerUserId: userId,
      workType: nextWorkType,
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

