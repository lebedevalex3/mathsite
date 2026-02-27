import { NextResponse } from "next/server";

import { getApiErrorMetrics, logApiResult, startApiSpan } from "@/src/lib/observability/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const span = startApiSpan(request, "/api/metrics/errors");
  const metrics = getApiErrorMetrics();
  logApiResult(span, 200, { code: "OK", meta: { series: metrics.length } });
  return NextResponse.json({
    ok: true,
    metrics,
  });
}
