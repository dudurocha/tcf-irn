import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaude } from "@/lib/anthropic";
import { buildGradingPrompt, parseWritingFeedback } from "@/lib/prompts/grading";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  writingPrompt: z.string().min(10).max(2000),
  text: z.string().min(20).max(5000),
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

  try {
    const prompt = buildGradingPrompt(
      parsed.data.writingPrompt,
      parsed.data.text
    );
    const raw = await callClaude({ prompt, maxTokens: 900 });
    const result = parseWritingFeedback(raw);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[grade-writing]", message);
    return NextResponse.json(
      { error: "Failed to grade writing", message },
      { status: 502 }
    );
  }
}
