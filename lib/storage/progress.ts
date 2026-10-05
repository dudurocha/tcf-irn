"use client";

import {
  type UserProgress,
  type WritingAttempt,
  type WritingFeedback,
  emptyProgress,
} from "@/lib/types";

const STORAGE_KEY = "tcf-irn-progress-v2";

type StoredProgress = UserProgress & {
  writingFeedbacks?: Record<number, WritingFeedback>;
};

// Before rewrites existed, only the latest feedback per day was stored, in
// `writingFeedbacks`, and the graded text was the saved draft. Turn each one
// into a single attempt.
function migrate(stored: StoredProgress): UserProgress {
  const { writingFeedbacks, ...progress } = stored;
  if (!writingFeedbacks) return progress;
  const writingAttempts: Record<number, WritingAttempt[]> = {
    ...progress.writingAttempts,
  };
  for (const [key, feedback] of Object.entries(writingFeedbacks)) {
    const day = Number(key);
    if (writingAttempts[day]?.length) continue;
    writingAttempts[day] = [{ text: progress.writings[day] ?? "", feedback }];
  }
  return { ...progress, writingAttempts };
}

/**
 * Storage interface — currently backed by localStorage.
 * Designed so we can swap in a remote backend (Supabase, Postgres, etc.)
 * without changing the consumers.
 */
export interface ProgressStore {
  load(): Promise<UserProgress>;
  save(progress: UserProgress): Promise<void>;
  clear(): Promise<void>;
}

class LocalStorageStore implements ProgressStore {
  async load(): Promise<UserProgress> {
    if (typeof window === "undefined") return emptyProgress();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyProgress();
      const parsed = JSON.parse(raw);
      return migrate({ ...emptyProgress(), ...parsed });
    } catch (err) {
      console.warn("Failed to load progress:", err);
      return emptyProgress();
    }
  }

  async save(progress: UserProgress): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.warn("Failed to save progress:", err);
    }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const progressStore: ProgressStore = new LocalStorageStore();
