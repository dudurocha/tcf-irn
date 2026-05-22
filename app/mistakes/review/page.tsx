"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mistakeStore } from "@/lib/storage/mistakes";
import type { QcmMistake } from "@/lib/types/mistakes";
import { renderInline } from "@/lib/render";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function letter(i: number): string {
  return String.fromCharCode(65 + i);
}

export default function MistakesReviewPage() {
  const [deck, setDeck] = useState<QcmMistake[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ masteredIds: string[]; wrongIds: string[] }>({
    masteredIds: [],
    wrongIds: [],
  });

  useEffect(() => {
    mistakeStore.list().then((all) => {
      const active = all.filter(
        (m): m is QcmMistake => m.kind === "qcm" && !m.mastered
      );
      setDeck(shuffle(active));
    });
  }, []);

  if (deck === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm">
        <div className="spinner" />
        <span>Préparation de la session…</span>
      </div>
    );
  }

  if (deck.length === 0) {
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
        <h1 className="text-[22px] font-medium mb-2">Rien à revoir</h1>
        <p className="text-[15px] text-ink-muted mb-6">
          Aucun QCM à réviser. Le mode quiz ne couvre que les QCM — vos erreurs
          de rédaction restent consultables dans la liste.
        </p>
        <Link href="/" className="btn btn-primary w-full text-center block">
          Retour au parcours →
        </Link>
      </>
    );
  }

  const total = deck.length;
  const done = cursor >= total;

  if (done) {
    return <ReviewSummary masteredCount={result.masteredIds.length} wrongCount={result.wrongIds.length} total={total} />;
  }

  const current = deck[cursor];
  const answered = selected !== null;

  const onSelect = async (i: number) => {
    if (answered) return;
    setSelected(i);
    if (i === current.correctIndex) {
      await mistakeStore.markMastered(current.id);
      setResult((r) => ({ ...r, masteredIds: [...r.masteredIds, current.id] }));
    } else {
      await mistakeStore.markWrongAgain(current.id, i);
      setResult((r) => ({ ...r, wrongIds: [...r.wrongIds, current.id] }));
    }
  };

  const next = () => {
    setSelected(null);
    setCursor((c) => c + 1);
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
          {cursor + 1} / {total}
        </div>
      </div>

      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((cursor + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="text-[11px] text-ink-muted mb-2 italic font-sans">
        {current.theme}
      </div>

      <div className="text-[16px] leading-relaxed mb-4 font-medium">
        {renderInline(current.question)}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {current.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = answered && i === current.correctIndex;
          const isWrong = answered && isSelected && i !== current.correctIndex;
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
          {current.explanation && (
            <div className="px-3.5 py-2.5 bg-surface-2 border-l-2 border-ink-faint rounded-tr-sm rounded-br-sm text-[13.5px] text-ink-muted leading-snug mb-4">
              <strong className="block text-[11px] text-ink-muted mb-1 uppercase tracking-wider font-sans">
                Explication
              </strong>
              {renderInline(current.explanation)}
            </div>
          )}
          <div
            className={cn(
              "text-[13px] mb-3 font-medium",
              selected === current.correctIndex
                ? "text-[#1d5a44]"
                : "text-red-700"
            )}
          >
            {selected === current.correctIndex
              ? "✓ Correct — marquée comme maîtrisée."
              : "✗ Toujours faux — gardée dans vos erreurs."}
          </div>
          <button className="btn btn-primary w-full" onClick={next}>
            {cursor + 1 === total ? "Voir le résumé →" : "Question suivante →"}
          </button>
        </>
      )}
    </>
  );
}

function ReviewSummary({
  masteredCount,
  wrongCount,
  total,
}: {
  masteredCount: number;
  wrongCount: number;
  total: number;
}) {
  const pct = Math.round((masteredCount / total) * 100);
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

      <h1 className="text-[26px] font-medium mb-2">Session terminée</h1>
      <p className="text-[15px] text-ink-muted mb-6">
        {pct}% de bonnes réponses sur {total} question{total > 1 ? "s" : ""}.
      </p>

      <div className="flex gap-3 mb-6 text-[13px] font-sans">
        <div className="flex-1 px-3 py-3 border border-success bg-success-bg rounded-sm text-center">
          <div className="text-[22px] font-semibold tabular-nums text-[#1d5a44]">
            {masteredCount}
          </div>
          <div className="text-[11px] text-[#1d5a44] uppercase tracking-wider mt-0.5">
            Maîtrisées
          </div>
        </div>
        <div className="flex-1 px-3 py-3 border border-red-300 bg-red-50 rounded-sm text-center">
          <div className="text-[22px] font-semibold tabular-nums text-red-700">
            {wrongCount}
          </div>
          <div className="text-[11px] text-red-700 uppercase tracking-wider mt-0.5">
            Toujours fausses
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href="/mistakes/review"
          className="btn btn-primary flex-1 text-center"
          onClick={(e) => {
            // Force remount so a new shuffled deck is built
            e.preventDefault();
            window.location.href = "/mistakes/review";
          }}
        >
          Nouvelle session →
        </Link>
        <Link href="/mistakes" className="btn flex-1 text-center">
          Liste des erreurs
        </Link>
      </div>
    </>
  );
}
