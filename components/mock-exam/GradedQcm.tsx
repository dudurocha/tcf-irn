"use client";

import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { renderInline } from "@/lib/render";

interface GradedQcmProps {
  questions: Question[];
  answers: Record<number, number>;
  questionLabel?: string;
  startIndex?: number;
}

/**
 * Read-only graded view of a QCM: shows the user's answers, the correct
 * answer, and the explanation. Used on the result page.
 */
export function GradedQcm({
  questions,
  answers,
  questionLabel = "Question",
  startIndex = 1,
}: GradedQcmProps) {
  return (
    <>
      {questions.map((q, i) => {
        const ans = answers[i];
        const unanswered = ans === undefined;
        return (
          <div key={i} className="mb-5 last:mb-0">
            <div className="text-[11px] text-ink-muted mb-1.5 uppercase tracking-wider font-sans">
              {questionLabel} {startIndex + i} / {startIndex + questions.length - 1}
              {unanswered && <span className="ml-2 text-red-700">· non répondue</span>}
            </div>
            <div className="text-[15.5px] leading-relaxed mb-3 font-medium">
              {renderInline(q.question)}
            </div>
            {q.options.map((opt, j) => {
              const isSelected = ans === j;
              const isCorrect = j === q.correct;
              const isWrong = isSelected && !isCorrect;
              return (
                <div
                  key={j}
                  className={cn(
                    "opt cursor-default",
                    isCorrect && "correct",
                    isWrong && "wrong"
                  )}
                >
                  {String.fromCharCode(65 + j)}. {renderInline(opt)}
                </div>
              );
            })}
            {q.explanation && (
              <div className="mt-3 px-3.5 py-2.5 bg-surface-2 border-l-2 border-ink-faint rounded-tr-sm rounded-br-sm text-[13.5px] text-ink-muted leading-snug">
                <strong className="block text-[11px] text-ink-muted mb-1 uppercase tracking-wider font-sans">
                  Explication
                </strong>
                {renderInline(q.explanation)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
