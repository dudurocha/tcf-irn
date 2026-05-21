"use client";

import type { Reading } from "@/lib/types";
import { Qcm } from "./Qcm";

interface ReadingSectionProps {
  reading: Reading;
  onAnswersChange?: (answers: Record<number, number>) => void;
}

export function ReadingSection({ reading, onAnswersChange }: ReadingSectionProps) {
  return (
    <>
      <div className="passage-box">
        {reading.passage.split(/\n\n+/).map((para, i) => (
          <p key={i}>
            {para.split("\n").map((line, j, arr) => (
              <span key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>
      <p className="text-[13px] text-ink-muted mb-4">
        Lisez le texte ci-dessus puis répondez aux questions.
      </p>
      <Qcm
        questions={reading.questions}
        questionLabel="Compréhension"
        onAnswersChange={onAnswersChange}
      />
    </>
  );
}
