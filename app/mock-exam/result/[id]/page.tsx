"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { use } from "react";
import { GradedQcm } from "@/components/mock-exam/GradedQcm";
import { renderInline } from "@/lib/render";
import { mockExamStore } from "@/lib/storage/mock-exam";
import type { MockExamAttempt } from "@/lib/types/mock-exam";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function band(pct: number): { label: string; tone: string } {
  if (pct >= 75) return { label: "Niveau B2 confirmé", tone: "bg-green-100 text-green-900 border-green-300" };
  if (pct >= 60) return { label: "Niveau B2 atteint", tone: "bg-emerald-50 text-emerald-900 border-emerald-300" };
  if (pct >= 45) return { label: "Proche B2", tone: "bg-amber-50 text-amber-900 border-amber-300" };
  return { label: "À renforcer", tone: "bg-red-50 text-red-900 border-red-300" };
}

export default function MockExamResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [attempt, setAttempt] = useState<MockExamAttempt | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    mockExamStore.getAttempt(id).then((a) => {
      setAttempt(a);
      setLoaded(true);
    });
  }, [id]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm">
        <div className="spinner" />
      </div>
    );
  }

  if (!attempt || !attempt.scores) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-muted mb-4">Tentative introuvable.</p>
        <Link href="/mock-exam" className="btn">
          Retour
        </Link>
      </div>
    );
  }

  const { scores } = attempt;
  const b = band(scores.overall);

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <Link
          href="/mock-exam"
          className="text-[13px] text-ink-muted hover:text-ink font-sans"
        >
          ← Historique
        </Link>
        <div className="text-[13px] text-ink-muted tracking-wider uppercase font-medium font-sans">
          Résultat
        </div>
      </div>

      <h1 className="text-[26px] font-medium leading-tight mb-2 -tracking-[0.01em]">
        Examen blanc — {Math.round(scores.overall)}%
      </h1>
      <p className="text-[14px] text-ink-muted mb-4">
        {formatDate(attempt.startedAt)}
        {attempt.status === "expired" && " · soumission automatique (temps écoulé)"}
      </p>

      <div className={`px-4 py-3 rounded-sm border mb-6 ${b.tone}`}>
        <strong className="block text-[14px]">{b.label}</strong>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="border border-border rounded-sm p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted font-sans">
            Compréhension
          </div>
          <div className="text-[20px] font-semibold tabular-nums">
            {scores.reading.correct}/{scores.reading.total}
          </div>
        </div>
        <div className="border border-border rounded-sm p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted font-sans">
            QCM
          </div>
          <div className="text-[20px] font-semibold tabular-nums">
            {scores.qcm.correct}/{scores.qcm.total}
          </div>
        </div>
        <div className="border border-border rounded-sm p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted font-sans">
            Rédaction
          </div>
          <div className="text-[20px] font-semibold tabular-nums">
            {scores.writing !== null ? `${scores.writing}/25` : "—"}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3 mt-6">Compréhension écrite</h2>
      <div className="passage-box">
        {attempt.exam.reading.passage.split(/\n\n+/).map((para, i) => (
          <p key={i}>{renderInline(para)}</p>
        ))}
      </div>
      <GradedQcm
        questions={attempt.exam.reading.questions}
        answers={attempt.readingAnswers}
        questionLabel="Compréhension"
      />

      <h2 className="text-lg font-semibold mb-3 mt-8">QCM</h2>
      <GradedQcm
        questions={attempt.exam.questions}
        answers={attempt.qcmAnswers}
        questionLabel="Question"
      />

      <h2 className="text-lg font-semibold mb-3 mt-8">Expression écrite</h2>
      <div className="example-box border-l-gold bg-gold-bg mb-4">
        <strong className="block mb-1 text-[13px]">Sujet</strong>
        {attempt.exam.writingPrompt}
      </div>
      <div className="border border-border rounded-sm p-3.5 mb-4 whitespace-pre-wrap font-serif text-[14.5px] leading-relaxed bg-surface">
        {attempt.writingText || (
          <span className="text-ink-muted italic">Aucune rédaction soumise.</span>
        )}
      </div>
      {attempt.writingFeedback && (
        <div
          className="feedback-box"
          dangerouslySetInnerHTML={{
            __html:
              (scores.writing !== null
                ? `<strong>Évaluation — ${scores.writing}/25</strong>`
                : "<strong>Évaluation</strong>") + attempt.writingFeedback,
          }}
        />
      )}

      <div className="mt-10 flex gap-2 justify-center">
        <Link href="/mock-exam" className="btn">
          Retour à l&apos;historique
        </Link>
        <Link href="/" className="btn">
          Accueil
        </Link>
      </div>
    </>
  );
}
