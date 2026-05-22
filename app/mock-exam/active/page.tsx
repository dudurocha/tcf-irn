"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExamReading } from "@/components/mock-exam/ExamReading";
import { ExamQcm } from "@/components/mock-exam/ExamQcm";
import { ExamWriting } from "@/components/mock-exam/ExamWriting";
import { Timer } from "@/components/mock-exam/Timer";
import { gradeWriting } from "@/lib/api-client";
import { mockExamStore } from "@/lib/storage/mock-exam";
import { mistakeStore } from "@/lib/storage/mistakes";
import type {
  MockExamAttempt,
  MockExamScores,
} from "@/lib/types/mock-exam";
import type {
  NewQcmMistake,
  NewWritingMistake,
  WritingCategory,
} from "@/lib/types/mistakes";
import { WRITING_CATEGORIES } from "@/lib/types/mistakes";

function computeScores(attempt: MockExamAttempt, writingScore: number | null): MockExamScores {
  const r = attempt.exam.reading.questions;
  const q = attempt.exam.questions;
  const readingCorrect = r.reduce(
    (acc, qq, i) => acc + (attempt.readingAnswers[i] === qq.correct ? 1 : 0),
    0
  );
  const qcmCorrect = q.reduce(
    (acc, qq, i) => acc + (attempt.qcmAnswers[i] === qq.correct ? 1 : 0),
    0
  );
  // Overall: equal-weighted thirds. Writing converted to % from /25.
  const readingPct = (readingCorrect / r.length) * 100;
  const qcmPct = (qcmCorrect / q.length) * 100;
  const writingPct =
    writingScore !== null ? (writingScore / 25) * 100 : qcmPct; // fallback if grading failed
  const overall = Math.round((readingPct + qcmPct + writingPct) / 3);
  return {
    reading: { correct: readingCorrect, total: r.length },
    qcm: { correct: qcmCorrect, total: q.length },
    writing: writingScore,
    overall,
  };
}

export default function ActiveMockExamPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState<MockExamAttempt | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [section, setSection] = useState<"reading" | "qcm" | "writing">("reading");

  useEffect(() => {
    mockExamStore.getActive().then((a) => {
      if (!a) {
        router.replace("/mock-exam");
        return;
      }
      setAttempt(a);
      setLoaded(true);
    });
  }, [router]);

  // Persist on any change (debounced via natural event throttling — every state update saves)
  const persist = useCallback(
    (next: MockExamAttempt) => {
      setAttempt(next);
      mockExamStore.setActive(next);
    },
    []
  );

  const submit = useCallback(
    async (expired: boolean) => {
      if (!attempt || submitting) return;
      setSubmitting(true);

      let writingScore: number | null = null;
      let writingFeedback: string | undefined;
      const writingMistakes: NewWritingMistake[] = [];
      const trimmed = attempt.writingText.trim();

      if (trimmed.length >= 50) {
        try {
          const fb = await gradeWriting(attempt.exam.writingPrompt, trimmed);
          writingScore = fb.score;
          writingFeedback = fb.feedback;
          for (const m of fb.mistakes) {
            if (!(WRITING_CATEGORIES as readonly string[]).includes(m.category)) continue;
            writingMistakes.push({
              excerpt: m.excerpt,
              issue: m.issue,
              correction: m.correction,
              category: m.category as WritingCategory,
              theme: "Examen blanc",
              source: { kind: "exam", attemptId: attempt.id, section: "writing" },
            });
          }
        } catch (err) {
          writingFeedback = `<p>Erreur lors de la correction : ${
            err instanceof Error ? err.message : String(err)
          }</p>`;
        }
      } else {
        writingFeedback = "<p><em>Rédaction trop courte pour être évaluée.</em></p>";
      }

      const scores = computeScores(attempt, writingScore);
      const completed: MockExamAttempt = {
        ...attempt,
        status: expired ? "expired" : "completed",
        completedAt: Date.now(),
        scores,
        writingFeedback,
      };

      const mistakes: NewQcmMistake[] = [];
      attempt.exam.questions.forEach((q, i) => {
        const ans = attempt.qcmAnswers[i];
        if (ans !== undefined && ans !== q.correct) {
          mistakes.push({
            question: q,
            selectedIndex: ans,
            theme: "Examen blanc",
            source: { kind: "exam", attemptId: attempt.id, section: "qcm" },
          });
        }
      });
      attempt.exam.reading.questions.forEach((q, i) => {
        const ans = attempt.readingAnswers[i];
        if (ans !== undefined && ans !== q.correct) {
          mistakes.push({
            question: q,
            selectedIndex: ans,
            theme: "Examen blanc",
            source: { kind: "exam", attemptId: attempt.id, section: "reading" },
          });
        }
      });
      if (mistakes.length > 0) {
        await mistakeStore.record(mistakes);
      }
      if (writingMistakes.length > 0) {
        await mistakeStore.recordWriting(writingMistakes);
      }

      await mockExamStore.saveAttempt(completed);
      await mockExamStore.setActive(null);
      router.replace(`/mock-exam/result/${completed.id}`);
    },
    [attempt, submitting, router]
  );

  const onExpire = useCallback(() => {
    submit(true);
  }, [submit]);

  const sectionStats = useMemo(() => {
    if (!attempt) return null;
    return {
      reading: Object.keys(attempt.readingAnswers).length,
      readingTotal: attempt.exam.reading.questions.length,
      qcm: Object.keys(attempt.qcmAnswers).length,
      qcmTotal: attempt.exam.questions.length,
      writingWords: attempt.writingText.trim().split(/\s+/).filter(Boolean).length,
    };
  }, [attempt]);

  if (!loaded || !attempt) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm">
        <div className="spinner" />
        <span>Chargement de l&apos;examen…</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4 sticky top-0 z-10 bg-bg/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border">
        <div className="text-[12px] text-ink-muted tracking-wider uppercase font-medium font-sans">
          Examen blanc
        </div>
        <Timer
          startedAt={attempt.startedAt}
          durationMinutes={attempt.durationMinutes}
          onExpire={onExpire}
        />
      </div>

      <div className="flex gap-1 mb-6 text-[13px] font-sans">
        {(
          [
            { k: "reading", label: "Compréhension", done: sectionStats?.reading, total: sectionStats?.readingTotal },
            { k: "qcm", label: "QCM", done: sectionStats?.qcm, total: sectionStats?.qcmTotal },
            { k: "writing", label: "Rédaction", done: sectionStats?.writingWords, total: null },
          ] as const
        ).map((s) => (
          <button
            key={s.k}
            onClick={() => setSection(s.k)}
            className={`flex-1 px-2 py-2 rounded-sm border transition ${
              section === s.k
                ? "border-accent bg-accent/10 text-ink font-medium"
                : "border-border text-ink-muted hover:bg-surface-2"
            }`}
          >
            <div>{s.label}</div>
            <div className="text-[11px] text-ink-muted mt-0.5">
              {s.k === "writing"
                ? `${s.done} mot${(s.done ?? 0) !== 1 ? "s" : ""}`
                : `${s.done ?? 0} / ${s.total}`}
            </div>
          </button>
        ))}
      </div>

      {section === "reading" && (
        <ExamReading
          reading={attempt.exam.reading}
          answers={attempt.readingAnswers}
          onChange={(readingAnswers) => persist({ ...attempt, readingAnswers })}
        />
      )}
      {section === "qcm" && (
        <ExamQcm
          questions={attempt.exam.questions}
          answers={attempt.qcmAnswers}
          onChange={(qcmAnswers) => persist({ ...attempt, qcmAnswers })}
        />
      )}
      {section === "writing" && (
        <ExamWriting
          prompt={attempt.exam.writingPrompt}
          text={attempt.writingText}
          onChange={(writingText) => persist({ ...attempt, writingText })}
        />
      )}

      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-bg/95 backdrop-blur-sm border-t border-border mt-8 flex justify-between items-center gap-3">
        <span className="text-[12px] text-ink-muted">
          Soumettre clôt l&apos;examen et lance la correction.
        </span>
        <button
          className="btn btn-primary"
          disabled={submitting}
          onClick={() => {
            if (confirm("Soumettre l'examen ? Vous ne pourrez plus modifier vos réponses.")) {
              submit(false);
            }
          }}
        >
          {submitting ? "Correction en cours…" : "Soumettre l'examen →"}
        </button>
      </div>
    </>
  );
}
