"use client";

import {
  type Mistake,
  type NewQcmMistake,
  type NewWritingMistake,
  type QcmMistake,
  type WritingMistake,
  mistakeIdFor,
} from "@/lib/types/mistakes";

const STORAGE_KEY = "tcf-irn-mistakes-v1";
const MAX_RECENT_CHOICES = 5;

export interface MistakeStore {
  list(): Promise<Mistake[]>;
  record(entries: NewQcmMistake[]): Promise<void>;
  recordWriting(entries: NewWritingMistake[]): Promise<void>;
  markMastered(id: string): Promise<void>;
  markWrongAgain(id: string, selectedIndex: number): Promise<void>;
  remove(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

// Pre-v2 entries didn't carry a `kind` discriminator (only QCM existed).
function migrate(raw: unknown): Mistake[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m): Mistake | null => {
      if (!m || typeof m !== "object") return null;
      const obj = m as Partial<Mistake> & Record<string, unknown>;
      if (obj.kind === "writing") return obj as WritingMistake;
      // Default everything else to qcm — covers legacy entries with no `kind`.
      return { ...(obj as QcmMistake), kind: "qcm" };
    })
    .filter((m): m is Mistake => m !== null);
}

class LocalMistakeStore implements MistakeStore {
  async list(): Promise<Mistake[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return migrate(JSON.parse(raw));
    } catch (err) {
      console.warn("Failed to load mistakes:", err);
      return [];
    }
  }

  private async writeAll(all: Mistake[]): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  async record(entries: NewQcmMistake[]): Promise<void> {
    if (entries.length === 0) return;
    const all = await this.list();
    const byId = new Map(all.map((m) => [m.id, m]));
    const now = Date.now();

    for (const entry of entries) {
      const id = mistakeIdFor(entry.question.question);
      const existing = byId.get(id);
      if (existing && existing.kind === "qcm") {
        existing.wrongCount += 1;
        existing.lastWrongAt = now;
        existing.mastered = false;
        existing.masteredAt = undefined;
        existing.recentWrongChoices = [
          entry.selectedIndex,
          ...existing.recentWrongChoices,
        ].slice(0, MAX_RECENT_CHOICES);
      } else {
        byId.set(id, {
          kind: "qcm",
          id,
          question: entry.question.question,
          options: entry.question.options,
          correctIndex: entry.question.correct,
          explanation: entry.question.explanation,
          theme: entry.theme,
          source: entry.source,
          recentWrongChoices: [entry.selectedIndex],
          wrongCount: 1,
          firstWrongAt: now,
          lastWrongAt: now,
          mastered: false,
        });
      }
    }

    await this.writeAll(Array.from(byId.values()));
  }

  async recordWriting(entries: NewWritingMistake[]): Promise<void> {
    if (entries.length === 0) return;
    const all = await this.list();
    const byId = new Map(all.map((m) => [m.id, m]));
    const now = Date.now();

    for (const entry of entries) {
      // Dedupe by excerpt + issue — same recurring pattern increments occurrences.
      const id = mistakeIdFor(`w:${entry.excerpt}|${entry.issue}`);
      const existing = byId.get(id);
      if (existing && existing.kind === "writing") {
        existing.occurrences += 1;
        existing.lastSeenAt = now;
        existing.correction = entry.correction; // refresh in case model worded it differently
        existing.mastered = false;
        existing.masteredAt = undefined;
      } else {
        byId.set(id, {
          kind: "writing",
          id,
          excerpt: entry.excerpt,
          issue: entry.issue,
          correction: entry.correction,
          category: entry.category,
          theme: entry.theme,
          source: entry.source,
          occurrences: 1,
          firstSeenAt: now,
          lastSeenAt: now,
          mastered: false,
        });
      }
    }

    await this.writeAll(Array.from(byId.values()));
  }

  async markMastered(id: string): Promise<void> {
    const all = await this.list();
    const idx = all.findIndex((m) => m.id === id);
    if (idx < 0) return;
    all[idx] = { ...all[idx], mastered: true, masteredAt: Date.now() };
    await this.writeAll(all);
  }

  async markWrongAgain(id: string, selectedIndex: number): Promise<void> {
    const all = await this.list();
    const idx = all.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const m = all[idx];
    if (m.kind !== "qcm") return;
    all[idx] = {
      ...m,
      wrongCount: m.wrongCount + 1,
      lastWrongAt: Date.now(),
      mastered: false,
      masteredAt: undefined,
      recentWrongChoices: [selectedIndex, ...m.recentWrongChoices].slice(
        0,
        MAX_RECENT_CHOICES
      ),
    };
    await this.writeAll(all);
  }

  async remove(id: string): Promise<void> {
    const all = await this.list();
    await this.writeAll(all.filter((m) => m.id !== id));
  }

  async clearAll(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const mistakeStore: MistakeStore = new LocalMistakeStore();
