import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { isLatexPdfEnabled } from "@/src/lib/pdf-engines/config";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";

export const runtime = "nodejs";

async function checkDb() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown DB error";
    return { ok: false as const, message };
  }
}

async function checkChromiumPdfSupport() {
  try {
    const dynamicImport = Function("m", "return import(m)") as (
      moduleName: string,
    ) => Promise<unknown>;
    await dynamicImport("puppeteer");
    return { ok: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Puppeteer unavailable";
    return { ok: false as const, message };
  }
}

export async function GET(request: Request) {
  const span = startApiSpan(request, "/api/health");
  const [db, chromiumPdf] = await Promise.all([
    checkDb(),
    checkChromiumPdfSupport(),
  ]);

  const latexPdfEnabled = isLatexPdfEnabled();
  const overallOk = db.ok;
  const status = overallOk ? 200 : 503;

  logApiResult(span, status, {
    code: overallOk ? "OK" : "DEGRADED",
    meta: {
      db: db.ok ? "ok" : "error",
      chromiumPdf: chromiumPdf.ok ? "ok" : "error",
      latexPdfEnabled,
    },
  });

  return NextResponse.json(
    {
      ok: overallOk,
      status: overallOk ? "ok" : "degraded",
      checks: {
        db,
        pdf: {
          chromium: chromiumPdf,
          latex: { ok: latexPdfEnabled },
        },
      },
    },
    { status },
  );
}
