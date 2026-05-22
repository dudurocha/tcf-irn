"use client";

import { useCallback, useEffect, useState } from "react";
import { mistakeStore } from "@/lib/storage/mistakes";
import type { Mistake } from "@/lib/types/mistakes";

export function useMistakes() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const list = await mistakeStore.list();
    setMistakes(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const markMastered = useCallback(
    async (id: string) => {
      await mistakeStore.markMastered(id);
      await reload();
    },
    [reload]
  );

  const markWrongAgain = useCallback(
    async (id: string, selectedIndex: number) => {
      await mistakeStore.markWrongAgain(id, selectedIndex);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await mistakeStore.remove(id);
      await reload();
    },
    [reload]
  );

  return { mistakes, loaded, reload, markMastered, markWrongAgain, remove };
}
