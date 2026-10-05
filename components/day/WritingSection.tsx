"use client";

import { useRef, useState } from "react";
import { gradeWriting } from "@/lib/api-client";
import type { WritingAttempt, WritingFeedback } from "@/lib/types";
import { countWords } from "@/lib/utils";

interface WritingSectionProps {
  prompt: string;
  initialText?: string;
  attempts?: WritingAttempt[]; // graded attempts, oldest first
  onSubmit?: (text: string, feedback: WritingFeedback) => void;
  onTextChange?: (text: string) => void;
}

export function WritingSection({
  prompt,
  initialText = "",
  attempts = [],
  onSubmit,
  onTextChange,
}: WritingSectionProps) {
  const latest = attempts.at(-1);
  const [text, setText] = useState(initialText || latest?.text || "");
  // A saved draft that differs from the last graded text means a rewrite was in progress.
  const [rewriting, setRewriting] = useState(
    !!latest && !!initialText && initialText !== latest.text
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const locked = !!latest && !rewriting;
  const wordCount = countWords(text);
  const unchanged = !!latest && text.trim() === latest.text.trim();
  const canSubmit = !loading && wordCount >= 30 && !unchanged;

  const handleChange = (value: string) => {
    setText(value);
    onTextChange?.(value);
  };

  const startRewrite = () => {
    setRewriting(true);
    // The textarea is still disabled until React commits; focus on the next frame.
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const cancelRewrite = () => {
    if (latest) handleChange(latest.text);
    setRewriting(false);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gradeWriting(prompt, text);
      onSubmit?.(text, result);
      setRewriting(false);
    } catch (err) {
      setError(
        `Erreur d'évaluation : ${err instanceof Error ? err.message : String(err)}. Votre texte est conservé.`
      );
    } finally {
      setLoading(false);
    }
  };

  const latestLabel =
    attempts.length > 1 || rewriting
      ? `Évaluation · tentative ${attempts.length}`
      : "Évaluation";

  return (
    <>
      <div className="example-box border-l-gold bg-gold-bg mb-4">
        <strong className="block mb-1 text-[13px]">Sujet</strong>
        {prompt}
      </div>
      <textarea
        ref={textareaRef}
        className="w-full min-h-[200px] p-3.5 border border-border-strong rounded-sm text-[14.5px] font-serif text-ink bg-surface leading-relaxed resize-y focus:outline-none focus:border-accent disabled:bg-surface-2"
        placeholder="Rédigez votre réponse ici (180-220 mots)…"
        value={text}
        disabled={locked || loading}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="text-xs text-ink-muted mt-1.5 text-right font-sans">
        {wordCount} mot{wordCount !== 1 ? "s" : ""}
        {wordCount < 180 && !locked && " · cible : 180+"}
      </div>
      {error && <div className="error-box mt-3">{error}</div>}
      {!locked && (
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading
              ? "Évaluation en cours…"
              : latest
                ? "Soumettre la nouvelle version →"
                : "Soumettre et évaluer →"}
          </button>
          {rewriting && (
            <button className="btn btn-ghost" disabled={loading} onClick={cancelRewrite}>
              Annuler
            </button>
          )}
        </div>
      )}
      {latest && (
        <div
          className="feedback-box"
          dangerouslySetInnerHTML={{ __html: renderFeedbackHtml(latest.feedback, latestLabel) }}
        />
      )}
      {locked && (
        <button className="btn mt-3" onClick={startRewrite}>
          ✎ Réécrire
        </button>
      )}
      {attempts.length > 1 && <AttemptHistory attempts={attempts} />}
    </>
  );
}

function AttemptHistory({ attempts }: { attempts: WritingAttempt[] }) {
  const earlier = attempts.slice(0, -1);
  return (
    <div className="mt-5 pt-4 border-t border-border font-sans">
      <div className="text-[11px] text-ink-muted uppercase tracking-wider mb-1">
        Progression
      </div>
      <div className="text-sm text-ink mb-3">
        {attempts.map((a) => formatScore(a.feedback.score)).join(" → ")}
      </div>
      {earlier.map((attempt, i) => (
        <details key={i} className="mb-2">
          <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">
            Tentative {i + 1} — {formatScore(attempt.feedback.score)} ·{" "}
            {countWords(attempt.text)} mots
          </summary>
          <div className="mt-2 p-3.5 bg-surface-2 rounded-sm font-serif text-[14.5px] text-ink leading-relaxed whitespace-pre-wrap">
            {attempt.text}
          </div>
          <div
            className="feedback-box"
            dangerouslySetInnerHTML={{
              __html: renderFeedbackHtml(attempt.feedback, "Évaluation"),
            }}
          />
        </details>
      ))}
    </div>
  );
}

function formatScore(score: number | null): string {
  return score !== null ? `${score}/25` : "–";
}

function renderFeedbackHtml(feedback: WritingFeedback, label: string): string {
  const score = feedback.score !== null ? ` — ${feedback.score}/25` : "";
  return `<strong>${label}${score}</strong>` + feedback.feedback;
}
