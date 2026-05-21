"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QcmProps {
  questions: Question[];
  questionLabel?: string;
  onAnswersChange?: (answers: Record<number, number>) => void;
}

export function Qcm({ questions, questionLabel = "Question", onAnswersChange }: QcmProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState(false);

  const select = (qi: number, oi: number) => {
    if (graded) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    onAnswersChange?.(next);
    if (Object.keys(next).length === questions.length) {
      setGraded(true);
    }
  };

  return (
    <>
      {questions.map((q, i) => {
        const ans = answers[i];
        return (
          <div key={i} className="mb-5 last:mb-0">
            <div className="text-[11px] text-ink-muted mb-1.5 uppercase tracking-wider font-sans">
              {questionLabel} {i + 1} / {questions.length}
            </div>
            <div className="text-[15.5px] leading-relaxed mb-3 font-medium">
              {q.question}
            </div>
            {q.options.map((opt, j) => {
              const isSelected = ans === j;
              const isCorrect = graded && j === q.correct;
              const isWrong = graded && isSelected && j !== q.correct;
              return (
                <button
                  key={j}
                  className={cn(
                    "opt",
                    !graded && isSelected && "selected",
                    isCorrect && "correct",
                    isWrong && "wrong"
                  )}
                  disabled={graded}
                  onClick={() => select(i, j)}
                >
                  {String.fromCharCode(65 + j)}. {opt}
                </button>
              );
            })}
            {graded && q.explanation && (
              <div className="mt-3 px-3.5 py-2.5 bg-surface-2 border-l-2 border-ink-faint rounded-tr-sm rounded-br-sm text-[13.5px] text-ink-muted leading-snug">
                <strong className="block text-[11px] text-ink-muted mb-1 uppercase tracking-wider font-sans">
                  Explication
                </strong>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
