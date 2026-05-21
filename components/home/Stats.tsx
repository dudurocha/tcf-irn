import type { UserProgress } from "@/lib/types";

interface StatsProps {
  progress: UserProgress;
}

function computeAvgQcm(progress: UserProgress): number | null {
  const scores = Object.values(progress.scores).filter(
    (s) => s.qcm !== undefined && s.qcmTotal
  );
  if (scores.length === 0) return null;
  const totalCorrect = scores.reduce((a, b) => a + (b.qcm ?? 0), 0);
  const totalQ = scores.reduce((a, b) => a + (b.qcmTotal ?? 0), 0);
  return totalQ === 0 ? null : Math.round((totalCorrect / totalQ) * 100);
}

function computeAvgWriting(progress: UserProgress): string | null {
  const scores = Object.values(progress.scores).filter(
    (s) => s.writingScore !== undefined && s.writingScore !== null
  );
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + (b.writingScore ?? 0), 0);
  return (sum / scores.length).toFixed(1);
}

export function Stats({ progress }: StatsProps) {
  const avgQcm = computeAvgQcm(progress);
  const writingAvg = computeAvgWriting(progress);
  const vocabCount = progress.vocabKnown.length;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5 mb-6">
      <div className="bg-surface border border-border rounded-sm px-4 py-3.5">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider mb-1 font-sans">
          Score QCM moyen
        </div>
        <div className="text-2xl font-medium leading-none font-sans">
          {avgQcm !== null ? `${avgQcm}%` : "—"}
        </div>
        <div className="text-xs text-ink-muted mt-1 font-sans">
          {avgQcm !== null
            ? avgQcm >= 70
              ? "Très bon niveau"
              : avgQcm >= 50
                ? "En progression"
                : "À renforcer"
            : "Aucun jour terminé"}
        </div>
      </div>
      <div className="bg-surface border border-border rounded-sm px-4 py-3.5">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider mb-1 font-sans">
          Écrit moyen
        </div>
        <div className="text-2xl font-medium leading-none font-sans">
          {writingAvg !== null ? `${writingAvg}/25` : "—"}
        </div>
        <div className="text-xs text-ink-muted mt-1 font-sans">
          {writingAvg !== null
            ? parseFloat(writingAvg) >= 14
              ? "Niveau B2 atteint"
              : parseFloat(writingAvg) >= 10
                ? "À consolider"
                : "À retravailler"
            : "Pas encore évalué"}
        </div>
      </div>
      <div className="bg-surface border border-border rounded-sm px-4 py-3.5">
        <div className="text-[11px] text-ink-muted uppercase tracking-wider mb-1 font-sans">
          Vocabulaire
        </div>
        <div className="text-2xl font-medium leading-none font-sans">
          {vocabCount}
        </div>
        <div className="text-xs text-ink-muted mt-1 font-sans">
          mots maîtrisés
        </div>
      </div>
    </div>
  );
}
