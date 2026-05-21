"use client";

import type { Reading } from "@/lib/types";
import { renderInline } from "@/lib/render";
import { ExamQcm } from "./ExamQcm";

interface ExamReadingProps {
  reading: Reading;
  answers: Record<number, number>;
  onChange: (answers: Record<number, number>) => void;
}

export function ExamReading({ reading, answers, onChange }: ExamReadingProps) {
  return (
    <>
      <div className="passage-box">
        {reading.passage.split(/\n\n+/).map((para, i) => (
          <p key={i}>
            {para.split("\n").map((line, j, arr) => (
              <span key={j}>
                {renderInline(line)}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>
      <p className="text-[13px] text-ink-muted mb-4">
        Lisez le texte ci-dessus puis répondez aux questions.
      </p>
      <ExamQcm
        questions={reading.questions}
        answers={answers}
        onChange={onChange}
        questionLabel="Compréhension"
      />
    </>
  );
}
