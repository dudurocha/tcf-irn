"use client";

import { useCallback, useEffect, useState } from "react";
import type { MockExamAttempt } from "@/lib/types/mock-exam";
import { mockExamStore } from "@/lib/storage/mock-exam";

export function useMockExamHistory() {
  const [attempts, setAttempts] = useState<MockExamAttempt[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    mockExamStore.listAttempts().then((a) => {
      setAttempts(a);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = useCallback(
    async (id: string) => {
      await mockExamStore.deleteAttempt(id);
      reload();
    },
    [reload]
  );

  return { attempts, loaded, reload, remove };
}

export function useActiveMockExam() {
  const [active, setActive] = useState<MockExamAttempt | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    mockExamStore.getActive().then((a) => {
      setActive(a);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (next: MockExamAttempt | null) => {
    setActive(next);
    await mockExamStore.setActive(next);
  }, []);

  return { active, loaded, setActive: persist };
}
