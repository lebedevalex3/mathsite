import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

export const runtime = "nodejs";

type AttemptPayload = {
  topicId: string;
  skillId: string;
  taskId: string;
  isCorrect: boolean;
  userAnswer: string;
  durationMs: number;
};

function isValidAttemptPayload(value: unknown): value is AttemptPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.topicId === "string" &&
    payload.topicId.trim().length > 0 &&
    typeof payload.skillId === "string" &&
    payload.skillId.trim().length > 0 &&
    typeof payload.taskId === "string" &&
    payload.taskId.trim().length > 0 &&
    typeof payload.isCorrect === "boolean" &&
    typeof payload.userAnswer === "string" &&
    typeof payload.durationMs === "number" &&
    Number.isFinite(payload.durationMs) &&
    payload.durationMs >= 0
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidAttemptPayload(body)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid attempt fields" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const { userId } = await getOrCreateVisitorUser(cookieStore);

  await prisma.attempt.create({
    data: {
      userId,
      topicId: body.topicId,
      skillId: body.skillId,
      taskId: body.taskId,
      isCorrect: body.isCorrect,
      userAnswer: body.userAnswer,
      durationMs: Math.round(body.durationMs),
    },
  });

  return NextResponse.json({ ok: true });
}
