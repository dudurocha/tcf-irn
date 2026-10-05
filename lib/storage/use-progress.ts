"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserProgress, WritingAttempt } from "@/lib/types";
import { emptyProgress } from "@/lib/types";
import { progressStore } from "@/lib/storage/progress";

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    progressStore.load().then((p) => {
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(
    (mutator: (prev: UserProgress) => UserProgress) => {
      setProgress((prev) => {
        const next = mutator(prev);
        progressStore.save(next);
        return next;
      });
    },
    []
  );

  const markDayComplete = useCallback(
    (day: number, qcmScore?: { correct: number; total: number }, writingScore?: number | null) => {
      update((prev) => {
        const scores = { ...prev.scores };
        scores[day] = {
          ...scores[day],
          ...(qcmScore ? { qcm: qcmScore.correct, qcmTotal: qcmScore.total } : {}),
          ...(writingScore !== undefined ? { writingScore } : {}),
        };
        const completedDays = prev.completedDays.includes(day)
          ? prev.completedDays
          : [...prev.completedDays, day].sort((a, b) => a - b);
        return { ...prev, completedDays, scores };
      });
    },
    [update]
  );

  const resetDay = useCallback(
    (day: number) => {
      update((prev) => {
        const completedDays = prev.completedDays.filter((d) => d !== day);
        const scores = { ...prev.scores };
        delete scores[day];
        const writings = { ...prev.writings };
        delete writings[day];
        const writingAttempts = { ...prev.writingAttempts };
        delete writingAttempts[day];
        return { ...prev, completedDays, scores, writings, writingAttempts };
      });
    },
    [update]
  );

  const saveWriting = useCallback(
    (day: number, text: string) => {
      update((prev) => ({
        ...prev,
        writings: { ...prev.writings, [day]: text },
      }));
    },
    [update]
  );

  const addWritingAttempt = useCallback(
    (day: number, attempt: WritingAttempt) => {
      update((prev) => ({
        ...prev,
        writings: { ...prev.writings, [day]: attempt.text },
        writingAttempts: {
          ...prev.writingAttempts,
          [day]: [...(prev.writingAttempts[day] ?? []), attempt],
        },
      }));
    },
    [update]
  );

  const toggleVocabKnown = useCallback(
    (word: string) => {
      update((prev) => {
        const known = prev.vocabKnown.includes(word)
          ? prev.vocabKnown.filter((w) => w !== word)
          : [...prev.vocabKnown, word];
        return { ...prev, vocabKnown: known };
      });
    },
    [update]
  );

  return {
    progress,
    loaded,
    markDayComplete,
    resetDay,
    saveWriting,
    addWritingAttempt,
    toggleVocabKnown,
  };
}
