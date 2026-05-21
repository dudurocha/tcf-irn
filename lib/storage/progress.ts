"use client";

import { type UserProgress, emptyProgress } from "@/lib/types";

const STORAGE_KEY = "tcf-irn-progress-v2";

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
      return { ...emptyProgress(), ...parsed };
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
