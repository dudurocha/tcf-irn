import type { LessonContent, WritingFeedback } from "@/lib/types";
import type { MockExam } from "@/lib/types/mock-exam";

interface ApiError {
  error: string;
  message?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => null)) as ApiError | null;
    const detail = errBody?.message || errBody?.error || `HTTP ${response.status}`;
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export async function generateLesson(day: number): Promise<LessonContent> {
  return postJson<LessonContent>("/api/generate-lesson", { day });
}

export async function generateMockExam(): Promise<MockExam> {
  return postJson<MockExam>("/api/generate-mock-exam", {});
}

export async function gradeWriting(
  writingPrompt: string,
  text: string
): Promise<WritingFeedback> {
  return postJson<WritingFeedback>("/api/grade-writing", {
    writingPrompt,
    text,
  });
}
