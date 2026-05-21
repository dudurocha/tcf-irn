"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getRandomMockExam } from "@/lib/api-client";
import {
  MOCK_EXAM_DEFAULT_DURATION_MIN,
  type MockExamAttempt,
} from "@/lib/types/mock-exam";
import { mockExamStore, newAttemptId } from "@/lib/storage/mock-exam";
import {
  useActiveMockExam,
  useMockExamHistory,
} from "@/lib/storage/use-mock-exam";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function band(pct: number): string {
  if (pct >= 75) return "Niveau B2 confirmé";
  if (pct >= 60) return "Niveau B2 atteint";
  if (pct >= 45) return "Proche B2";
  return "À renforcer";
}

export default function MockExamHomePage() {
  const router = useRouter();
  const { attempts, loaded: histLoaded, remove } = useMockExamHistory();
  const { active, loaded: activeLoaded } = useActiveMockExam();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startNew = async () => {
    setLoading(true);
    setError(null);
    try {
      const seenExamIds = attempts
        .map((a) => a.examId)
        .filter((id): id is string => !!id);
      const { exam, examId } = await getRandomMockExam(seenExamIds);
      const attempt: MockExamAttempt = {
        id: newAttemptId(),
        examId,
        exam,
        status: "active",
        startedAt: Date.now(),
        durationMinutes: MOCK_EXAM_DEFAULT_DURATION_MIN,
        readingAnswers: {},
        qcmAnswers: {},
        writingText: "",
      };
      await mockExamStore.setActive(attempt);
      router.push("/mock-exam/active");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const resume = () => router.push("/mock-exam/active");

  const loaded = histLoaded && activeLoaded;

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <Link
          href="/"
          className="text-[13px] text-ink-muted hover:text-ink font-sans"
        >
          ← Retour
        </Link>
        <div className="text-[13px] text-ink-muted tracking-wider uppercase font-medium font-sans">
          Examen blanc
        </div>
      </div>

      <h1 className="text-[26px] font-medium leading-tight mb-2 -tracking-[0.01em]">
        Mode examen blanc
      </h1>
      <p className="text-[15px] text-ink-muted mb-6">
        {MOCK_EXAM_DEFAULT_DURATION_MIN} minutes · compréhension écrite · QCM (20) · expression écrite.
        Aucune correction n&apos;est révélée avant la soumission.
      </p>

      {!loaded ? (
        <div className="flex flex-col items-center gap-4 py-8 text-ink-muted text-sm">
          <div className="spinner" />
        </div>
      ) : active ? (
        <div className="example-box border-l-gold bg-gold-bg mb-6">
          <strong className="block mb-1 text-[13px]">Examen en cours</strong>
          <p className="text-[14px] mb-3">
            Commencé le {formatDate(active.startedAt)}.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary" onClick={resume}>
              Reprendre →
            </button>
            <button
              className="btn"
              onClick={async () => {
                if (!confirm("Abandonner l'examen en cours ?")) return;
                await mockExamStore.setActive(null);
                location.reload();
              }}
            >
              Abandonner
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-primary w-full text-center mb-8 block"
          onClick={startNew}
          disabled={loading}
        >
          {loading ? "Génération de l'examen…" : "Démarrer un examen blanc →"}
        </button>
      )}

      {error && <div className="error-box mb-6">{error}</div>}

      <h2 className="text-lg font-semibold mb-3 mt-6">Historique</h2>
      {attempts.length === 0 ? (
        <p className="text-[14px] text-ink-muted">
          Aucune tentative pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {attempts
            .filter((a) => a.status !== "active")
            .map((a) => (
              <Link
                key={a.id}
                href={`/mock-exam/result/${a.id}`}
                className="flex justify-between items-center px-4 py-3 border border-border rounded-sm hover:bg-surface-2 transition"
              >
                <div>
                  <div className="text-[14px] font-medium">
                    {formatDate(a.startedAt)}
                  </div>
                  <div className="text-[12px] text-ink-muted">
                    {a.status === "expired" ? "Temps écoulé" : "Terminé"}
                    {a.scores && ` · ${band(a.scores.overall)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-semibold tabular-nums">
                    {a.scores ? `${Math.round(a.scores.overall)}%` : "—"}
                  </div>
                  <button
                    className="text-[11px] text-ink-muted hover:text-red-700 font-sans"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("Supprimer cette tentative ?")) remove(a.id);
                    }}
                  >
                    supprimer
                  </button>
                </div>
              </Link>
            ))}
        </div>
      )}
    </>
  );
}
