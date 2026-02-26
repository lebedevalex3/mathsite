import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { notFound, toApiError } from "@/src/lib/api/errors";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { renderPdfFromPrintPath } from "@/src/lib/variants/pdf";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);
    const detail = await getVariantDetailForOwner(id, userId);
    if (!detail) {
      const { status, body } = notFound("Variant not found");
      return NextResponse.json(body, { status });
    }
    const locale = new URL(request.url).searchParams.get("locale") || "ru";
    const requestUrl = new URL(request.url);
    const forwardParams = new URLSearchParams();
    for (const [key, value] of requestUrl.searchParams.entries()) {
      if (key === "locale") continue;
      forwardParams.append(key, value);
    }
    const response = await renderPdfFromPrintPath(
      request,
      `/${locale}/teacher-tools/variants/${id}/answers/print${forwardParams.toString() ? `?${forwardParams.toString()}` : ""}`,
    );
    if (response.status === 200) {
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="variant-${id}-answers.pdf"`,
      );
    }
    return response;
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "PDF_ERROR",
      defaultMessage: "Failed to export answers PDF.",
    });
    return NextResponse.json(body, { status });
  }
}
