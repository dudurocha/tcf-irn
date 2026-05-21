"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Qcm } from "@/components/day/Qcm";
import { ReadingSection } from "@/components/day/ReadingSection";
import { WritingSection } from "@/components/day/WritingSection";
import { VocabCards } from "@/components/day/VocabCards";
import { generateLesson } from "@/lib/api-client";
import { getDay } from "@/lib/curriculum";
import { useProgress } from "@/lib/storage/use-progress";
import type { LessonContent } from "@/lib/types";

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
    cacheLesson,
    clearCache,
    saveWriting,
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

  useEffect(() => {
    if (!loaded || !curriculumDay || fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = progress.cachedContent[day];
    if (cached) {
      setContent(cached);
      return;
    }

    setLoading(true);
    generateLesson(day)
      .then((lesson) => {
        setContent(lesson);
        cacheLesson(day, lesson);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [day, loaded, curriculumDay, progress.cachedContent, cacheLesson]);

  const regenerate = () => {
    if (!confirm("Régénérer le contenu de ce jour ? La leçon actuelle sera remplacée.")) return;
    clearCache(day);
    setContent(null);
    setError(null);
    fetchedRef.current = false;
    setLoading(true);
    generateLesson(day)
      .then((lesson) => {
        setContent(lesson);
        cacheLesson(day, lesson);
      })
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
        <div>Génération de la leçon du jour {day}…</div>
        <div className="text-xs text-ink-faint">
          Environ 10-15 secondes. La leçon sera ensuite mise en cache.
        </div>
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
        <p className="text-sm text-ink-muted mb-4">
          Les erreurs Anthropic transitoires (surcharge serveur, timeout) se résolvent généralement en quelques minutes.
          Attendez 30 secondes et réessayez.
        </p>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={regenerate}>
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
    markDayComplete(day, { correct: qcmCorrect, total: qcmTotal }, writingScore);
    router.push("/");
  };

  return (
    <>
      <div className="flex justify-between items-center mb-5 gap-4">
        <Link href="/" className="btn btn-ghost">
          ← Parcours
        </Link>
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost text-xs px-2.5 py-1"
            onClick={regenerate}
            title="Régénérer le contenu de ce jour"
          >
            ↻ Régénérer
          </button>
          <div className="text-[13px] text-ink-muted font-sans">
            Jour {day} / 30
          </div>
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
            {ex.sentence}
            {ex.note && <em>{ex.note}</em>}
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
          onTextChange={(text) => saveWriting(day, text)}
          onSubmit={(text, feedback) => {
            saveWriting(day, text);
            setWritingScore(feedback.score);
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
