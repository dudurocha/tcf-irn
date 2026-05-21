import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaude, extractJson } from "@/lib/anthropic";
import { MockExamSchema } from "@/lib/types/mock-exam";
import { buildMockExamPrompt } from "@/lib/prompts/mock-exam";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const prompt = buildMockExamPrompt();
    const raw = await callClaude({ prompt, maxTokens: 7500 });
    const json = extractJson(raw);
    const exam = MockExamSchema.parse(json);
    return NextResponse.json(exam);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-mock-exam]", message);

    const isValidation = err instanceof z.ZodError;
    return NextResponse.json(
      {
        error: isValidation
          ? "Model response did not match expected schema"
          : "Failed to generate mock exam",
        message,
      },
      { status: 502 }
    );
  }
}
