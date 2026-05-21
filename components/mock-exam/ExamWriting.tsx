"use client";

interface ExamWritingProps {
  prompt: string;
  text: string;
  onChange: (text: string) => void;
}

/**
 * Mock-exam variant of WritingSection:
 *  - no AI grading button during the exam (graded on final submit)
 *  - parent controls the text so it can be persisted
 */
export function ExamWriting({ prompt, text, onChange }: ExamWritingProps) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <div className="example-box border-l-gold bg-gold-bg mb-4">
        <strong className="block mb-1 text-[13px]">Sujet</strong>
        {prompt}
      </div>
      <textarea
        className="w-full min-h-[240px] p-3.5 border border-border-strong rounded-sm text-[14.5px] font-serif text-ink bg-surface leading-relaxed resize-y focus:outline-none focus:border-accent"
        placeholder="Rédigez votre réponse ici (180-220 mots)…"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="text-xs text-ink-muted mt-1.5 text-right font-sans">
        {wordCount} mot{wordCount !== 1 ? "s" : ""}
        {wordCount < 180 && " · cible : 180+"}
      </div>
    </>
  );
}
