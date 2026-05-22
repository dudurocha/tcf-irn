import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaude, extractJson } from "@/lib/anthropic";
import { QuestionSchema } from "@/lib/types";
import { buildDrillPrompt } from "@/lib/prompts/drill";

export const runtime = "nodejs";
export const maxDuration = 60;

const WeakSpotSchema = z.object({
  kind: z.enum(["writing-category", "qcm-theme"]),
  label: z.string().min(1).max(120),
  count: z.number().int().min(1).max(1000),
});

const RequestSchema = z.object({
  weakSpots: z.array(WeakSpotSchema).min(1).max(8),
  questionCount: z.number().int().min(5).max(15).default(10),
});

const ResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(5).max(15),
});

const DRILL_MODEL = process.env.ANTHROPIC_DRILL_MODEL?.trim() || "claude-sonnet-4-6";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const prompt = buildDrillPrompt(parsed.data.weakSpots, parsed.data.questionCount);
    const raw = await callClaude({ prompt, maxTokens: 4000, model: DRILL_MODEL });
    const json = extractJson(raw);
    const validated = ResponseSchema.parse(json);
    return NextResponse.json({
      drillId: `drill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      questions: validated.questions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-drill]", message);
    const isValidation = err instanceof z.ZodError;
    return NextResponse.json(
      {
        error: isValidation
          ? "Model response did not match expected schema"
          : "Failed to generate drill",
        message,
      },
      { status: 502 }
    );
  }
}
