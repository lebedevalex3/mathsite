import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { notFound, toApiError } from "@/src/lib/api/errors";
import { isChromiumPdfDisabledInDev } from "@/src/lib/pdf-engines/config";
import { selectWorkPdfEngine } from "@/src/lib/pdf-engines/select-engine";
import { LatexCompileError, LatexUnavailableError } from "@/src/lib/latex/compile";
import { latexWorkPdfEngine } from "@/src/lib/latex/work-pdf-engine";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { renderPdfFromPrintPath } from "@/src/lib/variants/pdf";
import { normalizePrintProfile } from "@/src/lib/variants/print-profile";
import { loadPrintableWorkDocumentForOwner } from "@/src/lib/variants/printable-work";
import { getWorkVariantIdsForOwner } from "@/src/lib/variants/repository";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);
    const work = await getWorkVariantIdsForOwner(id, userId);
    if (!work) {
      const { status, body } = notFound("Work not found");
      return NextResponse.json(body, { status });
    }

    const requestUrl = new URL(request.url);
    const locale = requestUrl.searchParams.get("locale") || "ru";
    const isDev = process.env.NODE_ENV !== "production";
    const chromiumDisabledForDebug = isChromiumPdfDisabledInDev();
    const storedProfile = normalizePrintProfile(work.printProfileJson);
    const selectedEngine = selectWorkPdfEngine({
      requestedEngine: requestUrl.searchParams.get("engine"),
      layout: storedProfile.layout,
      supportedLatexLayouts: ["single", "two", "two_dup", "two_cut"],
    });

    if (isDev) {
      console.log({
        event: "pdf_render_request",
        engine: selectedEngine.engine,
        source: selectedEngine.source,
        kind: "answers",
        workId: id,
        layout: storedProfile.layout,
        orientation: storedProfile.orientation,
      });
    }

    if (selectedEngine.engine === "latex") {
      const doc = await loadPrintableWorkDocumentForOwner({
        workId: id,
        ownerUserId: userId,
        locale: locale === "en" || locale === "de" ? locale : "ru",
      });
      if (!doc) {
        const { status, body } = notFound("Work not found");
        return NextResponse.json(body, { status });
      }

      try {
        if (!latexWorkPdfEngine.renderAnswersPdf) {
          return NextResponse.json(
            {
              ok: false,
              code: "LATEX_UNSUPPORTED_PROFILE",
              message: "LaTeX answers PDF beta is not available in this build.",
            },
            {
              status: 501,
              headers: {
                "X-PDF-Engine": "latex",
                "X-PDF-Engine-Source": selectedEngine.source,
              },
            },
          );
        }
        const pdf = await latexWorkPdfEngine.renderAnswersPdf(doc);
        return new Response(Buffer.from(pdf), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Cache-Control": "no-store",
            "Content-Disposition": `attachment; filename="work-${id}-answers.pdf"`,
            "X-PDF-Engine": "latex",
            "X-PDF-Engine-Source": selectedEngine.source,
          },
        });
      } catch (error) {
        if (error instanceof LatexUnavailableError || error instanceof LatexCompileError) {
          return NextResponse.json(
            {
              ok: false,
              code: error.code,
              message: error.message,
              ...(isDev
                ? {
                    hints: [
                      "Set LATEX_PDF_ENABLED=1.",
                      "Install latexmk and xelatex on the server.",
                      "Use Chromium PDF or browser print-to-PDF as fallback.",
                    ],
                    ...(error instanceof LatexCompileError && error.details?.length
                      ? { details: error.details }
                      : {}),
                  }
                : {}),
            },
            {
              status: error.status,
              headers: {
                "X-PDF-Engine": "latex",
                "X-PDF-Engine-Source": selectedEngine.source,
              },
            },
          );
        }
        throw error;
      }
    }

    if (isDev && chromiumDisabledForDebug) {
      return NextResponse.json(
        {
          ok: false,
          code: "CHROMIUM_PDF_DISABLED",
          message:
            "Chromium PDF is disabled in development for debugging. Use engine=latex or enable LaTeX auto-selection for two-up layouts.",
          hints: [
            "Add &engine=latex to the PDF URL while debugging LaTeX.",
            "Set LATEX_PDF_ENABLED=1 to allow automatic LaTeX selection for two-up layouts.",
          ],
        },
        {
          status: 503,
          headers: {
            "X-PDF-Engine": "chromium",
            "X-PDF-Engine-Source": selectedEngine.source,
          },
        },
      );
    }

    const forwardParams = new URLSearchParams();
    for (const [key, value] of requestUrl.searchParams.entries()) {
      if (key === "locale") continue;
      forwardParams.append(key, value);
    }
    const printPath = `/${locale}/teacher-tools/works/${id}/answers/print${forwardParams.toString() ? `?${forwardParams.toString()}` : ""}`;
    const response = await renderPdfFromPrintPath(request, printPath);
    response.headers.set("X-PDF-Engine-Source", selectedEngine.source);
    if (response.status === 200) {
      response.headers.set("Content-Disposition", `attachment; filename="work-${id}-answers.pdf"`);
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
