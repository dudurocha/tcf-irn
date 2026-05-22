"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMistakes } from "@/lib/storage/use-mistakes";
import type {
  Mistake,
  MistakeSource,
  QcmMistake,
  WritingMistake,
} from "@/lib/types/mistakes";
import { renderInline } from "@/lib/render";
import { cn } from "@/lib/utils";

type Filter = "active" | "mastered" | "all";
type KindFilter = "all" | "qcm" | "writing";

function sourceLabel(source: MistakeSource): string {
  const section =
    source.section === "reading"
      ? "Compréhension"
      : source.section === "writing"
        ? "Rédaction"
        : "QCM";
  if (source.kind === "day") return `Jour ${source.day} · ${section}`;
  if (source.kind === "drill") return `Drill ciblé · ${section}`;
  return `Examen blanc · ${section}`;
}

function lastSeen(m: Mistake): number {
  return m.kind === "qcm" ? m.lastWrongAt : m.lastSeenAt;
}

function timesSeen(m: Mistake): number {
  return m.kind === "qcm" ? m.wrongCount : m.occurrences;
}

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function letter(i: number): string {
  return String.fromCharCode(65 + i);
}

export default function MistakesPage() {
  const { mistakes, loaded, markMastered, remove } = useMistakes();
  const [filter, setFilter] = useState<Filter>("active");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const stats = useMemo(() => {
    const active = mistakes.filter((m) => !m.mastered).length;
    const mastered = mistakes.length - active;
    const qcm = mistakes.filter((m) => m.kind === "qcm").length;
    const writing = mistakes.filter((m) => m.kind === "writing").length;
    const activeQcm = mistakes.filter((m) => m.kind === "qcm" && !m.mastered).length;
    return { total: mistakes.length, active, mastered, qcm, writing, activeQcm };
  }, [mistakes]);

  const visible = useMemo(() => {
    const byStatus =
      filter === "all"
        ? mistakes
        : filter === "active"
          ? mistakes.filter((m) => !m.mastered)
          : mistakes.filter((m) => m.mastered);
    const byKind =
      kindFilter === "all"
        ? byStatus
        : byStatus.filter((m) => m.kind === kindFilter);
    return [...byKind].sort((a, b) => {
      const ta = timesSeen(a);
      const tb = timesSeen(b);
      if (ta !== tb) return tb - ta;
      return lastSeen(b) - lastSeen(a);
    });
  }, [mistakes, filter, kindFilter]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm">
        <div className="spinner" />
        <span>Chargement des erreurs…</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <Link
          href="/"
          className="text-[13px] text-ink-muted hover:text-ink font-sans"
        >
          ← Retour
        </Link>
        <div className="text-[13px] text-ink-muted tracking-wider uppercase font-medium font-sans">
          Mes erreurs
        </div>
      </div>

      <h1 className="text-[26px] font-medium leading-tight mb-2 -tracking-[0.01em]">
        Vos erreurs à revoir
      </h1>
      <p className="text-[15px] text-ink-muted mb-6">
        QCM ratés et erreurs détectées dans vos rédactions. Marquez une erreur
        comme maîtrisée quand vous êtes sûr·e d&apos;avoir compris.
      </p>

      <div className="flex gap-3 mb-6 text-[13px] font-sans">
        <div className="flex-1 px-3 py-2 border border-border rounded-sm text-center">
          <div className="text-[20px] font-semibold tabular-nums">
            {stats.active}
          </div>
          <div className="text-[11px] text-ink-muted uppercase tracking-wider mt-0.5">
            À revoir
          </div>
        </div>
        <div className="flex-1 px-3 py-2 border border-border rounded-sm text-center">
          <div className="text-[20px] font-semibold tabular-nums">
            {stats.mastered}
          </div>
          <div className="text-[11px] text-ink-muted uppercase tracking-wider mt-0.5">
            Maîtrisées
          </div>
        </div>
        <div className="flex-1 px-3 py-2 border border-border rounded-sm text-center">
          <div className="text-[20px] font-semibold tabular-nums">
            {stats.qcm} <span className="text-[12px] text-ink-faint">/</span>{" "}
            {stats.writing}
          </div>
          <div className="text-[11px] text-ink-muted uppercase tracking-wider mt-0.5">
            QCM / Écrit
          </div>
        </div>
      </div>

      {stats.activeQcm > 0 && (
        <Link
          href="/mistakes/review"
          className="btn btn-primary w-full text-center mb-3 block"
        >
          Lancer une session de révision QCM ({stats.activeQcm}) →
        </Link>
      )}

      {stats.total > 0 && (
        <div className="flex gap-2 mb-6">
          <Link
            href="/mistakes/patterns"
            className="btn flex-1 text-center text-[13px]"
          >
            Tendances →
          </Link>
          <Link
            href="/mistakes/drill"
            className="btn flex-1 text-center text-[13px]"
          >
            Drill ciblé →
          </Link>
        </div>
      )}

      <div className="flex gap-1 mb-3 text-[13px] font-sans">
        {(["active", "mastered", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 px-2 py-1.5 rounded-sm border transition",
              filter === f
                ? "border-accent bg-accent/10 text-ink font-medium"
                : "border-border text-ink-muted hover:bg-surface-2"
            )}
          >
            {f === "active"
              ? `À revoir (${stats.active})`
              : f === "mastered"
                ? `Maîtrisées (${stats.mastered})`
                : `Toutes (${stats.total})`}
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-4 text-[12px] font-sans">
        {(["all", "qcm", "writing"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={cn(
              "flex-1 px-2 py-1 rounded-sm border transition",
              kindFilter === k
                ? "border-ink-faint bg-surface-2 text-ink"
                : "border-border text-ink-muted hover:bg-surface-2"
            )}
          >
            {k === "all" ? "Tous types" : k === "qcm" ? "QCM" : "Rédaction"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="example-box text-center text-ink-muted">
          {stats.total === 0
            ? "Aucune erreur enregistrée. Terminez un jour ou un examen blanc pour voir vos points faibles ici."
            : filter === "active"
              ? "Bravo — aucune erreur active dans ce filtre."
              : "Aucune erreur dans ce filtre."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((m) =>
            m.kind === "qcm" ? (
              <QcmMistakeCard
                key={m.id}
                mistake={m}
                onMarkMastered={() => markMastered(m.id)}
                onRemove={() => {
                  if (confirm("Supprimer cette erreur de la liste ?"))
                    remove(m.id);
                }}
              />
            ) : (
              <WritingMistakeCard
                key={m.id}
                mistake={m}
                onMarkMastered={() => markMastered(m.id)}
                onRemove={() => {
                  if (confirm("Supprimer cette erreur de la liste ?"))
                    remove(m.id);
                }}
              />
            )
          )}
        </div>
      )}
    </>
  );
}

function CardChrome({
  mastered,
  source,
  count,
  countNoun,
  theme,
  lastTs,
  children,
  onMarkMastered,
  onRemove,
}: {
  mastered: boolean;
  source: MistakeSource;
  count: number;
  countNoun: string;
  theme: string;
  lastTs: number;
  children: React.ReactNode;
  onMarkMastered: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "border rounded-sm p-4",
        mastered
          ? "border-success bg-success-bg"
          : "border-border bg-surface"
      )}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider font-sans">
          {sourceLabel(source)}
          {count > 1 && (
            <span className="ml-2 text-[11px] text-red-700 font-semibold">
              × {count} {countNoun}
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-faint font-sans">
          {timeAgo(lastTs)}
        </div>
      </div>

      <div className="text-[11px] text-ink-muted mb-2 italic">{theme}</div>

      {children}

      <div className="flex justify-between items-center gap-2 mt-3">
        {mastered ? (
          <span className="text-[12px] text-[#1d5a44] font-medium">
            ✓ Marquée comme maîtrisée
          </span>
        ) : (
          <button
            className="btn btn-ghost text-xs px-2.5 py-1"
            onClick={onMarkMastered}
          >
            ✓ Marquer comme maîtrisée
          </button>
        )}
        <button
          className="text-[11px] text-ink-muted hover:text-red-700 font-sans"
          onClick={onRemove}
        >
          supprimer
        </button>
      </div>
    </div>
  );
}

function QcmMistakeCard({
  mistake,
  onMarkMastered,
  onRemove,
}: {
  mistake: QcmMistake;
  onMarkMastered: () => void;
  onRemove: () => void;
}) {
  const latestWrongIdx = mistake.recentWrongChoices[0];
  return (
    <CardChrome
      mastered={mistake.mastered}
      source={mistake.source}
      count={mistake.wrongCount}
      countNoun=""
      theme={mistake.theme}
      lastTs={mistake.lastWrongAt}
      onMarkMastered={onMarkMastered}
      onRemove={onRemove}
    >
      <div className="text-[15px] leading-relaxed mb-3 font-medium">
        {renderInline(mistake.question)}
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        {mistake.options.map((opt, i) => {
          const isCorrect = i === mistake.correctIndex;
          const wasWrong = i === latestWrongIdx;
          return (
            <div
              key={i}
              className={cn(
                "px-3 py-2 rounded-sm text-[14px] border",
                isCorrect && "border-success bg-success-bg text-ink",
                wasWrong &&
                  !isCorrect &&
                  "border-red-300 bg-red-50 line-through text-ink-muted",
                !isCorrect && !wasWrong && "border-border text-ink-muted"
              )}
            >
              <strong className="font-sans mr-1">{letter(i)}.</strong>
              {renderInline(opt)}
            </div>
          );
        })}
      </div>

      {mistake.explanation && (
        <div className="px-3 py-2 bg-surface-2 border-l-2 border-ink-faint rounded-tr-sm rounded-br-sm text-[13.5px] text-ink-muted leading-snug">
          <strong className="block text-[11px] text-ink-muted mb-1 uppercase tracking-wider font-sans">
            Explication
          </strong>
          {renderInline(mistake.explanation)}
        </div>
      )}
    </CardChrome>
  );
}

function WritingMistakeCard({
  mistake,
  onMarkMastered,
  onRemove,
}: {
  mistake: WritingMistake;
  onMarkMastered: () => void;
  onRemove: () => void;
}) {
  return (
    <CardChrome
      mastered={mistake.mastered}
      source={mistake.source}
      count={mistake.occurrences}
      countNoun="fois"
      theme={mistake.theme}
      lastTs={mistake.lastSeenAt}
      onMarkMastered={onMarkMastered}
      onRemove={onRemove}
    >
      <div className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent-light text-accent-strong mb-2 font-medium tracking-wider uppercase font-sans">
        {mistake.category}
      </div>

      <blockquote className="border-l-2 border-red-300 pl-3 py-1 mb-2 italic text-[14.5px] text-ink-muted">
        « {mistake.excerpt} »
      </blockquote>

      <div className="text-[13.5px] text-ink-muted leading-snug mb-2">
        <strong className="text-ink">Problème :</strong> {mistake.issue}
      </div>

      <div className="px-3 py-2 bg-success-bg border-l-2 border-success rounded-tr-sm rounded-br-sm text-[13.5px] leading-snug">
        <strong className="block text-[11px] text-[#1d5a44] mb-1 uppercase tracking-wider font-sans">
          Correction
        </strong>
        {mistake.correction}
      </div>
    </CardChrome>
  );
}
