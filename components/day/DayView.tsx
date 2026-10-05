"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Qcm } from "@/components/day/Qcm";
import { ReadingSection } from "@/components/day/ReadingSection";
import { WritingSection } from "@/components/day/WritingSection";
import { VocabCards } from "@/components/day/VocabCards";
import { getLesson } from "@/lib/api-client";
import { getDay } from "@/lib/curriculum";
import { useProgress } from "@/lib/storage/use-progress";
import { mistakeStore } from "@/lib/storage/mistakes";
import type { LessonContent } from "@/lib/types";
import type {
  NewQcmMistake,
  NewWritingMistake,
  WritingCategory,
} from "@/lib/types/mistakes";
import { WRITING_CATEGORIES } from "@/lib/types/mistakes";
import { renderInline } from "@/lib/render";

interface DayViewProps {
  day: number;
}

export function DayView({ day }: DayViewProps) {
  const router = useRouter();
  const {
    progress,
    loaded,
    markDayComplete,
    resetDay,
    saveWriting,
    addWritingAttempt,
    toggleVocabKnown,
  } = useProgress();

  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // QCM scores (live, not persisted until day completion)
  const [qcmAnswers, setQcmAnswers] = useState<Record<number, number>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});
  const [writingScore, setWritingScore] = useState<number | null>(null);

  const curriculumDay = getDay(day);

  // Hydrate writingScore from the latest attempt (or saved DayScore) on first load,
  // so completing the day doesn't overwrite a previously saved score with null.
  useEffect(() => {
    if (!loaded) return;
    const fromFeedback = progress.writingAttempts[day]?.at(-1)?.feedback.score ?? null;
    const fromScores = progress.scores[day]?.writingScore ?? null;
    const hydrated = fromFeedback ?? fromScores;
    if (hydrated !== null) setWritingScore(hydrated);
    // Only run once after progress is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (!loaded || !curriculumDay || fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);
    getLesson(day)
      .then((lesson) => setContent(lesson))
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [day, loaded, curriculumDay]);

  const retry = () => {
    setError(null);
    fetchedRef.current = false;
    setLoading(true);
    getLesson(day)
      .then((lesson) => setContent(lesson))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  if (!curriculumDay) {
    return (
      <>
        <Link href="/" className="btn btn-ghost mb-4 inline-block">
          ← Retour
        </Link>
        <div className="error-box">Jour {day} introuvable.</div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-ink-muted text-sm text-center">
        <div className="spinner" />
        <div>Chargement de la leçon du jour {day}…</div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Link href="/" className="btn btn-ghost mb-4 inline-block">
          ← Retour
        </Link>
        <div className="error-box mb-4">
          <strong>Erreur lors du chargement du jour {day}</strong>
          <br />
          {error}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={retry}>
            ↻ Réessayer
          </button>
          <Link href="/" className="btn">
            ← Retour au parcours
          </Link>
        </div>
      </>
    );
  }

  if (!content) return null;

  const dayCompleted = progress.completedDays.includes(day);

  const handleComplete = () => {
    const qcmCorrect =
      content.questions.reduce(
        (acc, q, i) => acc + (qcmAnswers[i] === q.correct ? 1 : 0),
        0
      ) +
      content.reading.questions.reduce(
        (acc, q, i) => acc + (readingAnswers[i] === q.correct ? 1 : 0),
        0
      );
    const qcmTotal = content.questions.length + content.reading.questions.length;

    const mistakes: NewQcmMistake[] = [];
    content.questions.forEach((q, i) => {
      const ans = qcmAnswers[i];
      if (ans !== undefined && ans !== q.correct) {
        mistakes.push({
          question: q,
          selectedIndex: ans,
          theme: curriculumDay.theme,
          source: { kind: "day", day, section: "qcm" },
        });
      }
    });
    content.reading.questions.forEach((q, i) => {
      const ans = readingAnswers[i];
      if (ans !== undefined && ans !== q.correct) {
        mistakes.push({
          question: q,
          selectedIndex: ans,
          theme: curriculumDay.theme,
          source: { kind: "day", day, section: "reading" },
        });
      }
    });
    if (mistakes.length > 0) {
      mistakeStore.record(mistakes);
    }

    markDayComplete(day, { correct: qcmCorrect, total: qcmTotal }, writingScore);
    router.push("/");
  };

  return (
    <>
      <div className="flex justify-between items-center mb-5 gap-4">
        <Link href="/" className="btn btn-ghost">
          ← Parcours
        </Link>
        <div className="text-[13px] text-ink-muted font-sans">
          Jour {day} / 30
        </div>
      </div>

      <div className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-accent-light text-accent-strong mb-2 font-medium tracking-wider uppercase font-sans">
        {curriculumDay.icon}
      </div>
      <h1 className="text-[26px] font-medium leading-tight mb-6 -tracking-[0.01em]">
        {curriculumDay.theme}
      </h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3 mt-0">Théorie</h2>
        <div
          className="theory-content"
          dangerouslySetInnerHTML={{ __html: content.theory }}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3 mt-0">Exemples</h2>
        {content.examples.map((ex, i) => (
          <div key={i} className="example-box">
            {renderInline(ex.sentence)}
            {ex.note && <em>{renderInline(ex.note)}</em>}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3 mt-0">Compréhension écrite</h2>
        <ReadingSection
          reading={content.reading}
          onAnswersChange={setReadingAnswers}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3 mt-0">Exercices (QCM)</h2>
        <Qcm questions={content.questions} onAnswersChange={setQcmAnswers} />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3 mt-0">Expression écrite</h2>
        <WritingSection
          prompt={content.writingPrompt}
          initialText={progress.writings[day] || ""}
          attempts={progress.writingAttempts[day] ?? []}
          onTextChange={(text) => saveWriting(day, text)}
          onSubmit={(text, feedback) => {
            addWritingAttempt(day, { text, feedback });
            setWritingScore(feedback.score);
            // A completed day already has its score saved; keep it on the latest attempt.
            if (dayCompleted) markDayComplete(day, undefined, feedback.score);
            const writingMistakes: NewWritingMistake[] = feedback.mistakes
              .filter((m): m is typeof m & { category: WritingCategory } =>
                (WRITING_CATEGORIES as readonly string[]).includes(m.category)
              )
              .map((m) => ({
                excerpt: m.excerpt,
                issue: m.issue,
                correction: m.correction,
                category: m.category,
                theme: curriculumDay.theme,
                source: { kind: "day", day, section: "writing" },
              }));
            if (writingMistakes.length > 0) {
              mistakeStore.recordWriting(writingMistakes);
            }
          }}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3 mt-0">Vocabulaire du jour</h2>
        <VocabCards
          items={content.vocab}
          knownWords={progress.vocabKnown}
          onToggleKnown={toggleVocabKnown}
        />
      </div>

      <div
        className={`card text-center ${dayCompleted ? "bg-success-bg border-success" : ""}`}
      >
        {dayCompleted ? (
          <>
            <p className="m-0 text-[#1d5a44] font-medium">
              ✓ Jour {day} déjà complété. Vous pouvez le refaire à tout moment.
            </p>
            <button
              className="btn btn-ghost mt-3"
              onClick={() => {
                resetDay(day);
                router.refresh();
              }}
            >
              Refaire ce jour
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              Quand vous avez terminé toutes les sections, marquez le jour comme complété.
            </p>
            <button className="btn btn-success" onClick={handleComplete}>
              Marquer le jour {day} comme terminé ✓
            </button>
          </>
        )}
      </div>
    </>
  );
}
