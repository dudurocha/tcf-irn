import type { LessonContent, Question, WritingFeedback } from "@/lib/types";
import type { MockExam } from "@/lib/types/mock-exam";
import type { DrillWeakSpot } from "@/lib/prompts/drill";

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

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

interface ContentManifest {
  days: number[];
  exams: number[];
}

let manifestPromise: Promise<ContentManifest> | null = null;

function loadManifest(): Promise<ContentManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch("/content/manifest.json")
      .then((r) => {
        if (!r.ok) {
          throw new Error(
            "Content manifest not found. Run `npm run generate-content` first."
          );
        }
        return r.json() as Promise<ContentManifest>;
      })
      .catch((err) => {
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
}

export async function getLesson(day: number): Promise<LessonContent> {
  const response = await fetch(`/content/days/day-${pad(day)}.json`);
  if (!response.ok) {
    throw new Error(
      `Leçon du jour ${day} introuvable. Lancez \`npm run generate-content\` pour la générer.`
    );
  }
  return (await response.json()) as LessonContent;
}

export async function getRandomMockExam(seen: string[] = []): Promise<{
  exam: MockExam;
  examId: string;
}> {
  const manifest = await loadManifest();
  if (manifest.exams.length === 0) {
    throw new Error(
      "Aucun examen blanc disponible. Lancez `npm run generate-content`."
    );
  }
  const seenSet = new Set(seen);
  const unseen = manifest.exams.filter((i) => !seenSet.has(`exam-${pad(i)}`));
  const pool = unseen.length > 0 ? unseen : manifest.exams;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const examId = `exam-${pad(pick)}`;
  const response = await fetch(`/content/mock-exams/${examId}.json`);
  if (!response.ok) {
    throw new Error(`Examen ${examId} introuvable.`);
  }
  return { exam: (await response.json()) as MockExam, examId };
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

export async function generateDrill(
  weakSpots: DrillWeakSpot[],
  questionCount = 10
): Promise<{ drillId: string; questions: Question[] }> {
  return postJson<{ drillId: string; questions: Question[] }>(
    "/api/generate-drill",
    { weakSpots, questionCount }
  );
}
