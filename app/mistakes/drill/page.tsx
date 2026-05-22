"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { generateDrill } from "@/lib/api-client";
import { mistakeStore } from "@/lib/storage/mistakes";
import { useMistakes } from "@/lib/storage/use-mistakes";
import type { Question } from "@/lib/types";
import type {
  Mistake,
  NewQcmMistake,
} from "@/lib/types/mistakes";
import { WRITING_CATEGORIES } from "@/lib/types/mistakes";
import type { DrillWeakSpot } from "@/lib/prompts/drill";
import { renderInline } from "@/lib/render";
import { cn } from "@/lib/utils";

type Phase = "setup" | "loading" | "quiz" | "summary";

interface WeakSpotOption extends DrillWeakSpot {
  id: string;
}

function aggregateWeakSpots(mistakes: Mistake[]): WeakSpotOption[] {
  const writingCounts = new Map<string, number>();
  const qcmCounts = new Map<string, number>();
  for (const m of mistakes) {
    if (m.kind === "writing") {
      writingCounts.set(
        m.category,
        (writingCounts.get(m.category) ?? 0) + m.occurrences
      );
    } else if (m.kind === "qcm") {
      qcmCounts.set(m.theme, (qcmCounts.get(m.theme) ?? 0) + m.wrongCount);
    }
  }

  const writing: WeakSpotOption[] = WRITING_CATEGORIES.filter((cat) =>
    writingCounts.has(cat)
  ).map((cat) => ({
    id: `w:${cat}`,
    kind: "writing-category",
    label: cat,
    count: writingCounts.get(cat) ?? 0,
  }));

  const qcm: WeakSpotOption[] = Array.from(qcmCounts.entries()).map(
    ([theme, count]) => ({
      id: `q:${theme}`,
      kind: "qcm-theme",
      label: theme,
      count,
    })
  );

  return [...writing, ...qcm].sort((a, b) => b.count - a.count);
}

function letter(i: number): string {
  return String.fromCharCode(65 + i);
}

export default function DrillPage() {
  const { mistakes, loaded } = useMistakes();
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drillId, setDrillId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cursor, setCursor] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [pendingMistakes, setPendingMistakes] = useState<NewQcmMistake[]>([]);

  const weakSpots = useMemo(() => aggregateWeakSpots(mistakes), [mistakes]);

  // Pre-select the top 3 weak spots when data loads.
  useEffect(() => {
    if (loaded && selectedIds === null) {
      setSelectedIds(new Set(weakSpots.slice(0, 3).map((w) => w.id)));
    }
  }, [loaded, weakSpots, selectedIds]);

  const selected = useMemo(
    () => weakSpots.filter((w) => selectedIds?.has(w.id)),
    [weakSpots, selectedIds]
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startDrill = async () => {
    if (selected.length === 0) return;
    setPhase("loading");
    setError(null);
    try {
      const payload = selected.map(({ kind, label, count }) => ({
        kind,
        label,
        count,
      }));
      const result = await generateDrill(payload, 10);
      setDrillId(result.drillId);
      setQuestions(result.questions);
      setCursor(0);
      setSelectedOption(null);
      setScore({ correct: 0, wrong: 0 });
      setPendingMistakes([]);
      setPhase("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("setup");
    }
  };

  if (!loaded || selectedIds === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm">
        <div className="spinner" />
      </div>
    );
  }

  if (weakSpots.length === 0) {
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
        <h1 className="text-[22px] font-medium mb-2">Pas encore de drill</h1>
        <p className="text-[15px] text-ink-muted mb-6">
          Le drill cible vos points faibles. Faites quelques jours ou un examen
          blanc pour qu&apos;il y ait matière à travailler.
        </p>
        <Link href="/" className="btn btn-primary w-full text-center block">
          Retour au parcours →
        </Link>
      </>
    );
  }

  if (phase === "setup") {
    return (
      <SetupPhase
        weakSpots={weakSpots}
        selectedIds={selectedIds}
        onToggle={toggle}
        onStart={startDrill}
        error={error}
      />
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm text-center">
        <div className="spinner" />
        <div>Génération du drill…</div>
        <div className="text-xs text-ink-faint">
          Claude rédige {10} questions visant vos {selected.length} point
          {selected.length > 1 ? "s" : ""} faible{selected.length > 1 ? "s" : ""}. ~15 secondes.
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    return (
      <SummaryPhase
        correct={score.correct}
        wrong={score.wrong}
        onRestart={() => {
          setPhase("setup");
          setError(null);
        }}
      />
    );
  }

  // phase === "quiz"
  const q = questions[cursor];
  const answered = selectedOption !== null;

  const onSelect = (i: number) => {
    if (answered) return;
    setSelectedOption(i);
    if (i === q.correct) {
      setScore((s) => ({ ...s, correct: s.correct + 1 }));
    } else {
      setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
      setPendingMistakes((prev) => [
        ...prev,
        {
          question: q,
          selectedIndex: i,
          theme: `Drill · ${selected.map((s) => s.label).join(", ").slice(0, 80)}`,
          source: { kind: "drill", drillId, section: "qcm" },
        },
      ]);
    }
  };

  const next = async () => {
    setSelectedOption(null);
    if (cursor + 1 === questions.length) {
      if (pendingMistakes.length > 0) {
        await mistakeStore.record(pendingMistakes);
      }
      setPhase("summary");
    } else {
      setCursor((c) => c + 1);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <Link
          href="/mistakes"
          className="text-[13px] text-ink-muted hover:text-ink font-sans"
        >
          ← Mes erreurs
        </Link>
        <div className="text-[13px] text-ink-muted font-sans tabular-nums">
          {cursor + 1} / {questions.length}
        </div>
      </div>

      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((cursor + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="text-[11px] text-ink-muted mb-2 italic font-sans">
        Drill ciblé
      </div>

      <div className="text-[16px] leading-relaxed mb-4 font-medium">
        {renderInline(q.question)}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {q.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = answered && i === q.correct;
          const isWrong = answered && isSelected && i !== q.correct;
          return (
            <button
              key={i}
              className={cn(
                "opt",
                !answered && isSelected && "selected",
                isCorrect && "correct",
                isWrong && "wrong"
              )}
              disabled={answered}
              onClick={() => onSelect(i)}
            >
              {letter(i)}. {renderInline(opt)}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          {q.explanation && (
            <div className="px-3.5 py-2.5 bg-surface-2 border-l-2 border-ink-faint rounded-tr-sm rounded-br-sm text-[13.5px] text-ink-muted leading-snug mb-4">
              <strong className="block text-[11px] text-ink-muted mb-1 uppercase tracking-wider font-sans">
                Explication
              </strong>
              {renderInline(q.explanation)}
            </div>
          )}
          <div
            className={cn(
              "text-[13px] mb-3 font-medium",
              selectedOption === q.correct
                ? "text-[#1d5a44]"
                : "text-red-700"
            )}
          >
            {selectedOption === q.correct
              ? "✓ Correct."
              : "✗ Faux — ajoutée à vos erreurs."}
          </div>
          <button className="btn btn-primary w-full" onClick={next}>
            {cursor + 1 === questions.length
              ? "Voir le résumé →"
              : "Question suivante →"}
          </button>
        </>
      )}
    </>
  );
}

function SetupPhase({
  weakSpots,
  selectedIds,
  onToggle,
  onStart,
  error,
}: {
  weakSpots: WeakSpotOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onStart: () => void;
  error: string | null;
}) {
  const selectedCount = Array.from(selectedIds).filter((id) =>
    weakSpots.some((w) => w.id === id)
  ).length;

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
          Drill ciblé
        </div>
      </div>

      <h1 className="text-[26px] font-medium leading-tight mb-2 -tracking-[0.01em]">
        Choisissez vos cibles
      </h1>
      <p className="text-[15px] text-ink-muted mb-6">
        Claude générera 10 questions visant les points sélectionnés. Vos erreurs
        s&apos;ajouteront à votre liste pour la prochaine session de révision.
      </p>

      <div className="flex flex-col gap-1.5 mb-6">
        {weakSpots.map((w) => {
          const checked = selectedIds.has(w.id);
          return (
            <button
              key={w.id}
              onClick={() => onToggle(w.id)}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2.5 border rounded-sm text-left transition",
                checked
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:bg-surface-2"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0",
                    checked
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface"
                  )}
                >
                  {checked && <span className="text-[10px] leading-none">✓</span>}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium truncate">
                    {w.label}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {w.kind === "writing-category" ? "Rédaction" : "QCM"} ·{" "}
                    {w.count} occurrence{w.count > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && <div className="error-box mb-4">{error}</div>}

      <button
        className="btn btn-primary w-full"
        disabled={selectedCount === 0}
        onClick={onStart}
      >
        {selectedCount === 0
          ? "Sélectionnez au moins un point faible"
          : `Générer le drill (${selectedCount} cible${selectedCount > 1 ? "s" : ""}) →`}
      </button>
    </>
  );
}

function SummaryPhase({
  correct,
  wrong,
  onRestart,
}: {
  correct: number;
  wrong: number;
  onRestart: () => void;
}) {
  const total = correct + wrong;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
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

      <h1 className="text-[26px] font-medium mb-2">Drill terminé</h1>
      <p className="text-[15px] text-ink-muted mb-6">
        {pct}% de bonnes réponses sur {total} question{total > 1 ? "s" : ""}.
        {wrong > 0 && ` Les ${wrong} erreur${wrong > 1 ? "s" : ""} sont ajoutées à votre liste.`}
      </p>

      <div className="flex gap-3 mb-6 text-[13px] font-sans">
        <div className="flex-1 px-3 py-3 border border-success bg-success-bg rounded-sm text-center">
          <div className="text-[22px] font-semibold tabular-nums text-[#1d5a44]">
            {correct}
          </div>
          <div className="text-[11px] text-[#1d5a44] uppercase tracking-wider mt-0.5">
            Justes
          </div>
        </div>
        <div className="flex-1 px-3 py-3 border border-red-300 bg-red-50 rounded-sm text-center">
          <div className="text-[22px] font-semibold tabular-nums text-red-700">
            {wrong}
          </div>
          <div className="text-[11px] text-red-700 uppercase tracking-wider mt-0.5">
            Fausses
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary flex-1" onClick={onRestart}>
          Nouveau drill →
        </button>
        <Link href="/mistakes" className="btn flex-1 text-center">
          Mes erreurs
        </Link>
      </div>
    </>
  );
}
