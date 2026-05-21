"use client";

import type { MockExamAttempt } from "@/lib/types/mock-exam";

const HISTORY_KEY = "tcf-irn-mock-exams-v1";
const ACTIVE_KEY = "tcf-irn-mock-exam-active-v1";

/**
 * Storage interface for mock exams — backed by localStorage today.
 * Same pattern as ProgressStore: swap in a remote backend later
 * without touching consumers.
 */
export interface MockExamStore {
  listAttempts(): Promise<MockExamAttempt[]>;
  getAttempt(id: string): Promise<MockExamAttempt | null>;
  saveAttempt(attempt: MockExamAttempt): Promise<void>;
  deleteAttempt(id: string): Promise<void>;
  getActive(): Promise<MockExamAttempt | null>;
  setActive(attempt: MockExamAttempt | null): Promise<void>;
  clearAll(): Promise<void>;
}

class LocalMockExamStore implements MockExamStore {
  async listAttempts(): Promise<MockExamAttempt[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as MockExamAttempt[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Failed to load mock exams:", err);
      return [];
    }
  }

  async getAttempt(id: string): Promise<MockExamAttempt | null> {
    const all = await this.listAttempts();
    return all.find((a) => a.id === id) ?? null;
  }

  async saveAttempt(attempt: MockExamAttempt): Promise<void> {
    if (typeof window === "undefined") return;
    const all = await this.listAttempts();
    const idx = all.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) all[idx] = attempt;
    else all.unshift(attempt);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  }

  async deleteAttempt(id: string): Promise<void> {
    if (typeof window === "undefined") return;
    const all = await this.listAttempts();
    const next = all.filter((a) => a.id !== id);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  async getActive(): Promise<MockExamAttempt | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(ACTIVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as MockExamAttempt;
    } catch {
      return null;
    }
  }

  async setActive(attempt: MockExamAttempt | null): Promise<void> {
    if (typeof window === "undefined") return;
    if (!attempt) window.localStorage.removeItem(ACTIVE_KEY);
    else window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(attempt));
  }

  async clearAll(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem(ACTIVE_KEY);
  }
}

export const mockExamStore: MockExamStore = new LocalMockExamStore();

export function newAttemptId(): string {
  return `me_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
