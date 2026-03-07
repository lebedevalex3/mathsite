import { NextResponse } from "next/server";

import { runDemoCleanupCron } from "@/src/lib/demo-work-cleanup-cron";

export const runtime = "nodejs";

async function handleRequest(request: Request) {
  const result = await runDemoCleanupCron(request);
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
