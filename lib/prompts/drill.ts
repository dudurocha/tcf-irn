export interface DrillWeakSpot {
  /** "writing-category" or "qcm-theme" for the prompt */
  kind: "writing-category" | "qcm-theme";
  label: string;
  count: number;
}

export function buildDrillPrompt(weakSpots: DrillWeakSpot[], questionCount: number): string {
  const bullets = weakSpots
    .map((w) => {
      const sourceLabel =
        w.kind === "writing-category"
          ? `catégorie d'erreur en rédaction : ${w.label}`
          : `thème de QCM : ${w.label}`;
      return `- ${sourceLabel} (${w.count} occurrence${w.count > 1 ? "s" : ""} accumulée${w.count > 1 ? "s" : ""})`;
    })
    .join("\n");

  return `Tu es un examinateur du TCF IRN (niveau B2). Le candidat est lusophone (brésilien) installé en France et veut s'entraîner sur ses points faibles identifiés ci-dessous.

POINTS FAIBLES DU CANDIDAT :
${bullets}

Génère un ENSEMBLE D'ENTRAÎNEMENT CIBLÉ : ${questionCount} questions QCM, niveau B2, qui visent DIRECTEMENT ces faiblesses. Si plusieurs points faibles sont listés, répartis les questions équitablement entre eux. Les catégories de rédaction (cohérence, structure, etc.) doivent être testées via des QCM portant sur ces mêmes points (reformulation, choix d'un connecteur, identification d'une faute, etc.) — pas par une rédaction.

Réponds en JSON valide UNIQUEMENT (sans markdown, sans backticks) :

{
  "questions": [
    {"question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..."}
  ]
}

CONTRAINTES :
- EXACTEMENT ${questionCount} questions
- Chaque question a EXACTEMENT 4 options
- "correct" est un entier 0-3
- Les options ne doivent PAS commencer par une lettre/numéro ("A.", "B)", "1 -", etc.) — l'interface ajoute la lettre
- Texte brut uniquement, sauf <strong>...</strong> et <em>...</em> autorisés pour mettre en évidence le mot/la forme cible
- Distracteurs plausibles, pas absurdes
- Explications courtes (1-2 phrases) et pédagogiques
- N'utilise PAS de guillemets typographiques (" "), uniquement des guillemets droits dans le JSON
- Difficulté variable (~30% facile, ~50% moyen, ~20% difficile) pour rester dans le niveau B2`;
}
