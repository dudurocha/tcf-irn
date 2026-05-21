"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { renderInline } from "@/lib/render";

interface QcmProps {
  questions: Question[];
  questionLabel?: string;
  onAnswersChange?: (answers: Record<number, number>) => void;
}

// The model sometimes prefixes options with their own letter ("A. Le ...").
// The UI always renders its own letter, so strip the leading prefix.
function stripLetterPrefix(opt: string): string {
  return opt.replace(/^\s*[A-Da-d][.):\-]\s+/, "");
}

export function Qcm({ questions, questionLabel = "Question", onAnswersChange }: QcmProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const select = (qi: number, oi: number) => {
    if (answers[qi] !== undefined) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    onAnswersChange?.(next);
  };

  return (
    <>
      {questions.map((q, i) => {
        const ans = answers[i];
        const answered = ans !== undefined;
        return (
          <div key={i} className="mb-5 last:mb-0">
            <div className="text-[11px] text-ink-muted mb-1.5 uppercase tracking-wider font-sans">
              {questionLabel} {i + 1} / {questions.length}
            </div>
            <div className="text-[15.5px] leading-relaxed mb-3 font-medium">
              {renderInline(q.question)}
            </div>
            {q.options.map((opt, j) => {
              const isSelected = ans === j;
              const isCorrect = answered && j === q.correct;
              const isWrong = answered && isSelected && j !== q.correct;
              return (
                <button
                  key={j}
                  className={cn(
                    "opt",
                    !answered && isSelected && "selected",
                    isCorrect && "correct",
                    isWrong && "wrong"
                  )}
                  disabled={answered}
                  onClick={() => select(i, j)}
                >
                  {String.fromCharCode(65 + j)}. {renderInline(stripLetterPrefix(opt))}
                </button>
              );
            })}
            {answered && q.explanation && (
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
