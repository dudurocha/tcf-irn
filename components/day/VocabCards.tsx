"use client";

import { useState } from "react";
import type { VocabItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { renderInline } from "@/lib/render";

interface VocabCardsProps {
  items: VocabItem[];
  knownWords: string[];
  onToggleKnown: (word: string) => void;
}

export function VocabCards({ items, knownWords, onToggleKnown }: VocabCardsProps) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const handleClick = (i: number, word: string) => {
    if (knownWords.includes(word)) {
      onToggleKnown(word);
    } else if (flipped[i]) {
      onToggleKnown(word);
      setFlipped({ ...flipped, [i]: false });
    } else {
      setFlipped({ ...flipped, [i]: true });
    }
  };

  return (
    <>
      <p className="text-[13px] text-ink-muted mb-4">
        Cliquez sur une carte pour voir la traduction. Cliquez à nouveau pour la marquer comme connue.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
        {items.map((v, i) => {
          const known = knownWords.includes(v.word);
          const isFlipped = flipped[i];
          return (
            <button
              key={i}
              onClick={() => handleClick(i, v.word)}
              className={cn(
                "bg-surface border border-border-strong rounded-DEFAULT px-4 py-3.5 cursor-pointer transition-all duration-150 min-h-[110px] relative text-left",
                "hover:border-accent",
                isFlipped && !known && "bg-accent-light border-accent",
                known && "bg-success-bg border-success"
              )}
            >
              {known && (
                <div className="absolute top-1.5 right-2 text-[11px] text-success">
                  ✓ connu
                </div>
              )}
              <div className="text-[15px] font-semibold text-ink mb-1">
                {v.word}
              </div>
              {isFlipped || known ? (
                <div className="mt-2 text-[13.5px] text-ink-muted leading-snug">
                  <div>{renderInline(v.translation)}</div>
                  {v.example && (
                    <em className="text-accent-strong italic block mt-1">
                      {renderInline(v.example)}
                    </em>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-ink-faint italic font-sans">
                  cliquer pour voir
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
