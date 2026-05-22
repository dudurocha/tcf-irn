import type { Question } from "@/lib/types";

export type MistakeSource =
  | { kind: "day"; day: number; section: "qcm" | "reading" | "writing" }
  | { kind: "exam"; attemptId: string; section: "qcm" | "reading" | "writing" }
  | { kind: "drill"; drillId: string; section: "qcm" };

export const WRITING_CATEGORIES = [
  "grammaire",
  "vocabulaire",
  "structure",
  "cohérence",
  "orthographe",
] as const;
export type WritingCategory = (typeof WRITING_CATEGORIES)[number];

/**
 * A QCM the user got wrong at least once. Deduped by `id` (hash of the
 * question text) so re-encountering the same question increments
 * `wrongCount` rather than creating a duplicate entry.
 */
export interface QcmMistake {
  kind: "qcm";
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Theme label for grouping (curriculum theme, or "Examen blanc"). */
  theme: string;
  /** Where this mistake was first encountered. Subsequent encounters update lastWrongAt only. */
  source: MistakeSource;
  /** Indexes selected when wrong, most recent first (capped to last 5). */
  recentWrongChoices: number[];
  wrongCount: number;
  firstWrongAt: number;
  lastWrongAt: number;
  /** Set to true when user answers correctly in /mistakes/review. */
  mastered: boolean;
  masteredAt?: number;
}

/**
 * A writing error extracted from the grading feedback. Deduped by
 * hash(excerpt + issue) so the same recurring mistake is counted once.
 */
export interface WritingMistake {
  kind: "writing";
  id: string;
  excerpt: string;
  issue: string;
  correction: string;
  category: WritingCategory;
  theme: string;
  source: MistakeSource;
  occurrences: number;
  firstSeenAt: number;
  lastSeenAt: number;
  mastered: boolean;
  masteredAt?: number;
}

export type Mistake = QcmMistake | WritingMistake;

export interface NewQcmMistake {
  question: Question;
  selectedIndex: number;
  theme: string;
  source: MistakeSource;
}

export interface NewWritingMistake {
  excerpt: string;
  issue: string;
  correction: string;
  category: WritingCategory;
  theme: string;
  source: MistakeSource;
}

/**
 * Stable id from a string. Simple djb2 hash — collisions for distinct
 * inputs are astronomically unlikely at this corpus size.
 */
export function mistakeIdFor(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
