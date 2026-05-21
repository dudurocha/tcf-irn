import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaude, extractJson } from "@/lib/anthropic";
import { LessonContentSchema } from "@/lib/types";
import { getDay, TOTAL_DAYS } from "@/lib/curriculum";
import { buildLessonPrompt } from "@/lib/prompts/lesson";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  day: z.number().int().min(1).max(TOTAL_DAYS),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const curriculumDay = getDay(parsed.data.day);
  if (!curriculumDay) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  try {
    const prompt = buildLessonPrompt(curriculumDay);
    const raw = await callClaude({ prompt, maxTokens: 6500 });
    const json = extractJson(raw);
    const lesson = LessonContentSchema.parse(json);
    return NextResponse.json(lesson);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-lesson]", message);

    // Surface a generic but useful error to the client
    const isValidation = err instanceof z.ZodError;
    return NextResponse.json(
      {
        error: isValidation
          ? "Model response did not match expected schema"
          : "Failed to generate lesson",
        message,
      },
      { status: 502 }
    );
  }
}
