"use client";

import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { renderInline } from "@/lib/render";

interface ExamQcmProps {
  questions: Question[];
  answers: Record<number, number>;
  onChange: (answers: Record<number, number>) => void;
  questionLabel?: string;
  startIndex?: number; // for numbering display (e.g. start QCM at 5 if reading has 4)
}

/**
 * Mock-exam variant of Qcm:
 *  - never reveals correct/wrong during the exam
 *  - answers are controlled by the parent (so they can be persisted)
 *  - no per-question "Vérifier" button
 */
export function ExamQcm({
  questions,
  answers,
  onChange,
  questionLabel = "Question",
  startIndex = 1,
}: ExamQcmProps) {
  const select = (qi: number, oi: number) => {
    onChange({ ...answers, [qi]: oi });
  };

  return (
    <>
      {questions.map((q, i) => {
        const ans = answers[i];
        return (
          <div key={i} className="mb-5 last:mb-0">
            <div className="text-[11px] text-ink-muted mb-1.5 uppercase tracking-wider font-sans">
              {questionLabel} {startIndex + i} / {startIndex + questions.length - 1}
            </div>
            <div className="text-[15.5px] leading-relaxed mb-3 font-medium">
              {renderInline(q.question)}
            </div>
            {q.options.map((opt, j) => {
              const isSelected = ans === j;
              return (
                <button
                  key={j}
                  className={cn("opt", isSelected && "selected")}
                  onClick={() => select(i, j)}
                >
                  {String.fromCharCode(65 + j)}. {renderInline(opt)}
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
