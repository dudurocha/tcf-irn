"use client";

import Link from "next/link";
import { CURRICULUM, TOTAL_DAYS } from "@/lib/curriculum";
import type { UserProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CalendarProps {
  progress: UserProgress;
}

export function Calendar({ progress }: CalendarProps) {
  const completed = progress.completedDays.length;
  const todayDay = Math.min(completed + 1, TOTAL_DAYS);

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(82px,1fr))] gap-2 mb-8">
      {CURRICULUM.map((lesson) => {
        const done = progress.completedDays.includes(lesson.day);
        const isCurrent = lesson.day === todayDay && !done;
        return (
          <Link
            key={lesson.day}
            href={`/day/${lesson.day}`}
            className={cn(
              "aspect-square rounded-sm flex flex-col items-center justify-center",
              "transition-all duration-150 hover:-translate-y-px hover:border-accent relative p-1 text-center font-sans border",
              done && "bg-success-bg border-success",
              isCurrent && "bg-accent-light border-[1.5px] border-accent",
              !done && !isCurrent && "bg-surface-2 text-ink-faint border-border"
            )}
          >
            <div
              className={cn(
                "text-lg font-medium leading-none",
                done && "text-success",
                isCurrent && "text-accent-strong"
              )}
            >
              {lesson.day}
            </div>
            <div className="text-[9.5px] text-ink-muted mt-1 tracking-wide">
              {lesson.icon}
            </div>
            {done && (
              <div className="absolute top-0.5 right-1 text-[10px] text-success">
                ✓
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
