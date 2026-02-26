import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { notFound, toApiError } from "@/src/lib/api/errors";
import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { renderPdfFromPrintPath } from "@/src/lib/variants/pdf";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const user = await requireTeacherFromCookies(cookieStore);
    const detail = await getVariantDetailForOwner(id, user.id);
    if (!detail) {
      const { status, body } = notFound("Variant not found");
      return NextResponse.json(body, { status });
    }

    const requestUrl = new URL(request.url);
    const locale = requestUrl.searchParams.get("locale") || "ru";
    const forwardParams = new URLSearchParams();
    for (const [key, value] of requestUrl.searchParams.entries()) {
      if (key === "locale") continue;
      forwardParams.append(key, value);
    }
    const response = await renderPdfFromPrintPath(
      request,
      `/${locale}/teacher/variants/${id}/answers/print${forwardParams.toString() ? `?${forwardParams.toString()}` : ""}`,
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
