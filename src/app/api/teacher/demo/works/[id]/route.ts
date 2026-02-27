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

type TitleTemplate = { customTitle: string | null; date: string | null };

function parseTitleTemplate(value: unknown): TitleTemplate | null {
  if (!value || typeof value !== "object") return null;
  const data = value as { customTitle?: unknown; date?: unknown };
  const customTitle =
    typeof data.customTitle === "string" && data.customTitle.trim().length > 0
      ? data.customTitle.trim().slice(0, 80)
      : null;
  const date =
    typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : null;
  return { customTitle, date };
}

function mergeTitleTemplate(existing: TitleTemplate, value: unknown): TitleTemplate {
  if (value === undefined) return existing;
  if (value === null) return { customTitle: null, date: null };
  if (typeof value !== "object") return existing;
  const data = value as { customTitle?: unknown; date?: unknown };
  const hasCustomTitle = Object.prototype.hasOwnProperty.call(data, "customTitle");
  const hasDate = Object.prototype.hasOwnProperty.call(data, "date");
  return {
    customTitle: hasCustomTitle
      ? (typeof data.customTitle === "string" && data.customTitle.trim().length > 0
          ? data.customTitle.trim().slice(0, 80)
          : null)
      : existing.customTitle,
    date: hasDate
      ? (typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : null)
      : existing.date,
  };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);

    const body = (await request.json()) as {
      locale?: unknown;
      workType?: unknown;
      titleTemplate?: unknown;
      printProfile?: {
        layout?: unknown;
        orientation?: unknown;
        forceTwoUp?: unknown;
      };
    };
    const locale =
      body.locale === "ru" || body.locale === "en" || body.locale === "de"
        ? body.locale
        : "ru";

    const existing = await getWorkDetailForOwner(id, userId);
    if (!existing) {
      const { status, body } = notFound("Work not found");
      return NextResponse.json(body, { status });
    }

    const existingWorkType = parseWorkType(existing.workType) ?? "quiz";
    const parsedWorkType = body.workType === undefined ? existingWorkType : parseWorkType(body.workType);
    if (!parsedWorkType) {
      const { status, body } = badRequest("Invalid workType");
      return NextResponse.json(body, { status });
    }

    const stored = normalizePrintProfile(existing.printProfileJson);
    const existingRaw =
      existing.printProfileJson && typeof existing.printProfileJson === "object"
        ? (existing.printProfileJson as Record<string, unknown>)
        : {};
    const printProfileInput = body.printProfile;
    if (
      printProfileInput !== undefined &&
      (typeof printProfileInput !== "object" || printProfileInput === null)
    ) {
      const { status, body } = badRequest("Invalid printProfile");
      return NextResponse.json(body, { status });
    }
    const layoutRaw = printProfileInput && "layout" in printProfileInput
      ? (printProfileInput as { layout?: unknown }).layout
      : undefined;
    if (layoutRaw !== undefined && typeof layoutRaw !== "string") {
      const { status, body } = badRequest("Invalid printProfile.layout");
      return NextResponse.json(body, { status });
    }
    const nextLayout = typeof layoutRaw === "string" ? parsePrintLayout(layoutRaw) : stored.layout;
    const orientationRaw = printProfileInput && "orientation" in printProfileInput
      ? (printProfileInput as { orientation?: unknown }).orientation
      : undefined;
    if (orientationRaw !== undefined && typeof orientationRaw !== "string") {
      const { status, body } = badRequest("Invalid printProfile.orientation");
      return NextResponse.json(body, { status });
    }
    const nextOrientation = parsePrintOrientation(
      typeof orientationRaw === "string" ? orientationRaw : null,
      typeof layoutRaw === "string" ? defaultOrientationForLayout(nextLayout) : stored.orientation,
    );
    const forceTwoUp =
      printProfileInput && "forceTwoUp" in printProfileInput
        ? (printProfileInput as { forceTwoUp?: unknown }).forceTwoUp === true
        : existingRaw.forceTwoUp === true;
    const existingGeneration =
      existingRaw.generation && typeof existingRaw.generation === "object"
        ? (existingRaw.generation as Record<string, unknown>)
        : {};
    const existingTitleTemplate = parseTitleTemplate(existingGeneration.titleTemplate) ?? {
      customTitle: null,
      date: null,
    };
    const titleTemplate = mergeTitleTemplate(existingTitleTemplate, body.titleTemplate);

    const nextProfileJson = {
      ...existingRaw,
      version: 1,
      layout: nextLayout,
      orientation: nextOrientation,
      workType: parsedWorkType,
      forceTwoUp,
      // Preserve existing fit analysis; it still applies to this work's task set.
      fit: existingRaw.fit ?? (stored as unknown as { fit?: unknown }).fit,
      generation: {
        ...existingGeneration,
        titleTemplate,
      },
    };
    const nextTitle = buildWorkDisplayTitle({
      locale,
      workType: parsedWorkType,
      titleTemplate,
    });

    const updated = await updateWorkProfileForOwner({
      workId: id,
      ownerUserId: userId,
      workType: parsedWorkType,
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
