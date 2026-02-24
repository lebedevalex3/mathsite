import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
      return NextResponse.json({ ok: false, error: "Variant not found" }, { status: 404 });
    }

    const locale = new URL(request.url).searchParams.get("locale") || "ru";
    const response = await renderPdfFromPrintPath(
      request,
      `/${locale}/teacher/variants/${id}/answers/print`,
    );

    if (response.status === 200) {
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="variant-${id}-answers.pdf"`,
      );
    }

    return response;
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to export answers PDF" },
      { status },
    );
  }
}
