"use client";

import Link from "next/link";
import { Calendar } from "@/components/home/Calendar";
import { Stats } from "@/components/home/Stats";
import { CURRICULUM, TOTAL_DAYS } from "@/lib/curriculum";
import { useProgress } from "@/lib/storage/use-progress";

export default function HomePage() {
  const { progress, loaded } = useProgress();

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm">
        <div className="spinner" />
        <span>Chargement du parcours…</span>
      </div>
    );
  }

  const completed = progress.completedDays.length;
  const pct = Math.round((completed / TOTAL_DAYS) * 100);
  const todayDay = Math.min(completed + 1, TOTAL_DAYS);
  const nextLesson = CURRICULUM[todayDay - 1];

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="text-[13px] text-ink-muted tracking-wider uppercase font-medium font-sans">
          TCF IRN · 30 jours
        </div>
        <div className="flex gap-4 text-[13px] text-ink-muted font-sans">
          <div>
            <strong className="text-ink font-semibold">{completed}</strong>/30 jours
          </div>
          <div>
            <strong className="text-ink font-semibold">{progress.vocabKnown.length}</strong> mots
          </div>
        </div>
      </div>

      <h1 className="text-[26px] font-medium leading-tight mb-2 -tracking-[0.01em]">
        Bonjour. Aujourd&apos;hui, jour {todayDay}.
      </h1>
      <p className="text-[15px] text-ink-muted mb-6">
        {completed >= TOTAL_DAYS ? "Programme terminé !" : nextLesson?.theme}
      </p>

      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden my-3 mb-6">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <Link
        href={`/day/${todayDay}`}
        className="btn btn-primary w-full text-center mb-3 block"
      >
        {completed >= TOTAL_DAYS
          ? "Revoir une leçon →"
          : completed > 0
            ? `Continuer — jour ${todayDay} →`
            : "Commencer le parcours →"}
      </Link>

      <Link
        href="/mock-exam"
        className="btn w-full text-center mb-8 block"
      >
        Mode examen blanc · 60 min →
      </Link>

      <h2 className="text-lg font-semibold mb-3 mt-0">Parcours complet</h2>
      <Calendar progress={progress} />

      <Stats progress={progress} />
    </>
  );
}
