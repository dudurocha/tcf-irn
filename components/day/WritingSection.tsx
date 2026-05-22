"use client";

import { useState } from "react";
import { gradeWriting } from "@/lib/api-client";
import type { WritingFeedback } from "@/lib/types";

interface WritingSectionProps {
  prompt: string;
  initialText?: string;
  initialFeedback?: WritingFeedback | null;
  onSubmit?: (text: string, feedback: WritingFeedback) => void;
  onTextChange?: (text: string) => void;
}

export function WritingSection({
  prompt,
  initialText = "",
  initialFeedback = null,
  onSubmit,
  onTextChange,
}: WritingSectionProps) {
  const [text, setText] = useState(initialText);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = !loading && !feedback && wordCount >= 30;

  const handleChange = (value: string) => {
    setText(value);
    onTextChange?.(value);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gradeWriting(prompt, text);
      setFeedback(result);
      onSubmit?.(text, result);
    } catch (err) {
      setError(
        `Erreur d'évaluation : ${err instanceof Error ? err.message : String(err)}. Votre texte est conservé.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="example-box border-l-gold bg-gold-bg mb-4">
        <strong className="block mb-1 text-[13px]">Sujet</strong>
        {prompt}
      </div>
      <textarea
        className="w-full min-h-[200px] p-3.5 border border-border-strong rounded-sm text-[14.5px] font-serif text-ink bg-surface leading-relaxed resize-y focus:outline-none focus:border-accent disabled:bg-surface-2"
        placeholder="Rédigez votre réponse ici (180-220 mots)…"
        value={text}
        disabled={!!feedback}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="text-xs text-ink-muted mt-1.5 text-right font-sans">
        {wordCount} mot{wordCount !== 1 ? "s" : ""}
        {wordCount < 180 && !feedback && " · cible : 180+"}
      </div>
      {error && <div className="error-box mt-3">{error}</div>}
      {feedback && (
        <div className="feedback-box" dangerouslySetInnerHTML={{ __html: renderFeedbackHtml(feedback) }} />
      )}
      {!feedback && (
        <button
          className="btn btn-primary mt-2"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {loading ? "Évaluation en cours…" : "Soumettre et évaluer →"}
        </button>
      )}
    </>
  );
}

function renderFeedbackHtml(feedback: WritingFeedback): string {
  const header =
    feedback.score !== null
      ? `<strong>Évaluation — ${feedback.score}/25</strong>`
      : "<strong>Évaluation</strong>";
  return header + feedback.feedback;
}
