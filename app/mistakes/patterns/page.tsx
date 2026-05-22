"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMistakes } from "@/lib/storage/use-mistakes";
import type {
  Mistake,
  QcmMistake,
  WritingMistake,
} from "@/lib/types/mistakes";
import { WRITING_CATEGORIES } from "@/lib/types/mistakes";
import { renderInline } from "@/lib/render";

interface Bucket {
  label: string;
  count: number;
  /** What kind of bucket this represents — drives the drill selector */
  kind: "writing-category" | "qcm-theme";
  key: string;
}

function aggregateWritingByCategory(mistakes: Mistake[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const m of mistakes) {
    if (m.kind !== "writing") continue;
    counts.set(m.category, (counts.get(m.category) ?? 0) + m.occurrences);
  }
  return WRITING_CATEGORIES.map((cat) => ({
    label: cat,
    count: counts.get(cat) ?? 0,
    kind: "writing-category" as const,
    key: cat,
  }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);
}

function aggregateQcmByTheme(mistakes: Mistake[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const m of mistakes) {
    if (m.kind !== "qcm") continue;
    counts.set(m.theme, (counts.get(m.theme) ?? 0) + m.wrongCount);
  }
  return Array.from(counts.entries())
    .map(([theme, count]) => ({
      label: theme,
      count,
      kind: "qcm-theme" as const,
      key: theme,
    }))
    .sort((a, b) => b.count - a.count);
}

function topRepeated(mistakes: Mistake[], limit: number): Mistake[] {
  return [...mistakes]
    .filter((m) => !m.mastered)
    .sort((a, b) => {
      const ta = a.kind === "qcm" ? a.wrongCount : a.occurrences;
      const tb = b.kind === "qcm" ? b.wrongCount : b.occurrences;
      return tb - ta;
    })
    .slice(0, limit);
}

function activityByWeek(
  mistakes: Mistake[]
): { weekStart: number; count: number }[] {
  const buckets = new Map<number, number>();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  for (const m of mistakes) {
    const ts = m.kind === "qcm" ? m.firstWrongAt : m.firstSeenAt;
    const weekStart = Math.floor(ts / WEEK_MS) * WEEK_MS;
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => a.weekStart - b.weekStart);
}

export default function PatternsPage() {
  const { mistakes, loaded } = useMistakes();

  const writingBuckets = useMemo(
    () => aggregateWritingByCategory(mistakes),
    [mistakes]
  );
  const qcmBuckets = useMemo(() => aggregateQcmByTheme(mistakes), [mistakes]);
  const repeated = useMemo(() => topRepeated(mistakes, 5), [mistakes]);
  const weeks = useMemo(() => activityByWeek(mistakes), [mistakes]);

  const hero = writingBuckets[0] || qcmBuckets[0] || null;
  const totalActive = mistakes.filter((m) => !m.mastered).length;

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm">
        <div className="spinner" />
        <span>Chargement des tendances…</span>
      </div>
    );
  }

  if (mistakes.length === 0) {
    return (
      <>
        <div className="flex justify-between items-center mb-6 gap-4">
          <Link
            href="/mistakes"
            className="text-[13px] text-ink-muted hover:text-ink font-sans"
          >
            ← Mes erreurs
          </Link>
        </div>
        <h1 className="text-[26px] font-medium mb-2">Aucune tendance</h1>
        <p className="text-[15px] text-ink-muted">
          Faites quelques leçons ou un examen blanc et les tendances apparaîtront ici.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <Link
          href="/mistakes"
          className="text-[13px] text-ink-muted hover:text-ink font-sans"
        >
          ← Mes erreurs
        </Link>
        <div className="text-[13px] text-ink-muted tracking-wider uppercase font-medium font-sans">
          Tendances
        </div>
      </div>

      <h1 className="text-[26px] font-medium leading-tight mb-2 -tracking-[0.01em]">
        Vos points faibles
      </h1>
      <p className="text-[15px] text-ink-muted mb-6">
        Synthèse de {mistakes.length} erreur{mistakes.length > 1 ? "s" : ""} enregistrée{mistakes.length > 1 ? "s" : ""} ·{" "}
        {totalActive} active{totalActive > 1 ? "s" : ""}.
      </p>

      {hero && (
        <div className="example-box border-l-gold bg-gold-bg mb-6">
          <div className="text-[11px] text-ink-muted uppercase tracking-wider font-medium font-sans mb-1">
            Votre priorité
          </div>
          <div className="text-[18px] font-medium mb-1">
            {hero.kind === "writing-category" ? `Rédaction · ${hero.label}` : hero.label}
          </div>
          <div className="text-[13px] text-ink-muted mb-3">
            {hero.count} occurrence{hero.count > 1 ? "s" : ""} accumulée{hero.count > 1 ? "s" : ""}.
          </div>
          <Link
            href="/mistakes/drill"
            className="btn btn-primary inline-block"
          >
            Lancer un drill ciblé →
          </Link>
        </div>
      )}

      {writingBuckets.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3 mt-2">
            Erreurs de rédaction par catégorie
          </h2>
          <BarList buckets={writingBuckets} />
        </>
      )}

      {qcmBuckets.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3 mt-6">QCM par thème</h2>
          <BarList buckets={qcmBuckets.slice(0, 8)} />
        </>
      )}

      {repeated.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3 mt-6">
            Erreurs récurrentes
          </h2>
          <div className="flex flex-col gap-2">
            {repeated.map((m) => (
              <RepeatedItem key={m.id} mistake={m} />
            ))}
          </div>
        </>
      )}

      {weeks.length > 1 && (
        <>
          <h2 className="text-lg font-semibold mb-3 mt-6">Activité par semaine</h2>
          <WeeklyActivity weeks={weeks} />
        </>
      )}
    </>
  );
}

function BarList({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="flex flex-col gap-2 mb-2">
      {buckets.map((b) => {
        const pct = Math.round((b.count / max) * 100);
        return (
          <div key={b.kind + ":" + b.key} className="flex items-center gap-3">
            <div className="text-[13px] flex-1 min-w-0 truncate">{b.label}</div>
            <div className="flex-[3] relative h-5 bg-surface-2 rounded-sm overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-accent/70 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[13px] font-semibold tabular-nums w-8 text-right">
              {b.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RepeatedItem({ mistake }: { mistake: Mistake }) {
  if (mistake.kind === "qcm") {
    return <RepeatedQcmItem mistake={mistake} />;
  }
  return <RepeatedWritingItem mistake={mistake} />;
}

function RepeatedQcmItem({ mistake }: { mistake: QcmMistake }) {
  return (
    <div className="px-3 py-2 border border-border rounded-sm bg-surface flex gap-3 items-start">
      <div className="text-[11px] text-red-700 font-semibold tabular-nums shrink-0 mt-0.5">
        × {mistake.wrongCount}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider font-sans mb-0.5">
          QCM · {mistake.theme}
        </div>
        <div className="text-[13.5px] leading-snug truncate">
          {renderInline(mistake.question)}
        </div>
      </div>
    </div>
  );
}

function RepeatedWritingItem({ mistake }: { mistake: WritingMistake }) {
  return (
    <div className="px-3 py-2 border border-border rounded-sm bg-surface flex gap-3 items-start">
      <div className="text-[11px] text-red-700 font-semibold tabular-nums shrink-0 mt-0.5">
        × {mistake.occurrences}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider font-sans mb-0.5">
          Rédaction · {mistake.category}
        </div>
        <div className="text-[13.5px] leading-snug italic truncate">
          « {mistake.excerpt} »
        </div>
      </div>
    </div>
  );
}

function WeeklyActivity({ weeks }: { weeks: { weekStart: number; count: number }[] }) {
  const max = Math.max(...weeks.map((w) => w.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 mb-2">
      {weeks.map((w) => {
        const pct = Math.round((w.count / max) * 100);
        const d = new Date(w.weekStart);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        return (
          <div
            key={w.weekStart}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
            title={`${w.count} erreur${w.count > 1 ? "s" : ""} · semaine du ${label}`}
          >
            <div
              className="w-full bg-accent/60 rounded-t-sm"
              style={{ height: `${pct}%`, minHeight: w.count > 0 ? "2px" : "0" }}
            />
            <div className="text-[10px] text-ink-faint font-sans tabular-nums">
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
