import { WRITING_CATEGORIES, type WritingCategory } from "@/lib/types/mistakes";
import type { WritingFeedbackMistake } from "@/lib/types";

const MISTAKES_DELIMITER = "---MISTAKES---";

export function buildGradingPrompt(writingPrompt: string, text: string): string {
  return `Tu es un correcteur expérimenté du TCF IRN. Évalue cette production écrite sur 25 points selon les critères officiels : cohérence et cohésion, lexique (richesse, précision), grammaire (correction, complexité B2), adéquation au sujet, longueur (180-250 mots attendus).

SUJET :
${writingPrompt}

TEXTE DU CANDIDAT :
${text}

Sois rigoureux mais constructif. Un texte avec fautes graves ou clairement hors sujet doit recevoir une note basse.

Réponds STRICTEMENT dans ce format texte (PAS de JSON pour la partie humaine, PAS de backticks). Une seule ligne SCORE en premier, puis les sections, puis OBLIGATOIREMENT le bloc ${MISTAKES_DELIMITER} en fin de réponse.

SCORE: [un seul nombre entier sur 25, par exemple 18]

COMMENTAIRE GÉNÉRAL:
[3-4 phrases qui résument le niveau du texte]

POINTS FORTS:
- [point 1]
- [point 2]
- [point 3 si pertinent]

À AMÉLIORER:
- "[citation du texte]" → [correction ou suggestion]
- "[autre citation]" → [correction]
- [observation générale supplémentaire si utile]

${MISTAKES_DELIMITER}
[Une erreur par ligne, format JSONL strict. Maximum 5 erreurs — les plus importantes/récurrentes. Champs obligatoires : excerpt (≤15 mots, copie quasi-littérale du texte), issue (≤15 mots, ce qui ne va pas), correction (≤15 mots, la version corrigée), category (une des valeurs : ${WRITING_CATEGORIES.join(", ")}). Échappe les guillemets internes avec \\". Aucune ligne avant ou après le bloc, aucune virgule entre les lignes.]
{"excerpt":"...","issue":"...","correction":"...","category":"grammaire"}
{"excerpt":"...","issue":"...","correction":"...","category":"vocabulaire"}

Si le texte est trop court ou hors sujet pour identifier des erreurs précises, laisse le bloc ${MISTAKES_DELIMITER} suivi de zéro ligne JSON.`;
}

/**
 * Parses the structured plain-text feedback from the model into score, HTML
 * feedback, and a structured list of mistakes. Plain text is used for the
 * human-facing feedback (student essays often contain quotes/newlines that
 * break JSON parsing), and JSONL is used for the mistakes (one bad line
 * drops that entry rather than the whole response).
 */
export function parseWritingFeedback(raw: string): {
  score: number | null;
  feedback: string;
  mistakes: WritingFeedbackMistake[];
} {
  // Split off the mistakes block (everything after the delimiter).
  const delimRegex = new RegExp(`\\n?\\s*${MISTAKES_DELIMITER}\\s*\\n?`, "i");
  const [humanPart, mistakesPart = ""] = raw.split(delimRegex);

  // Extract score: "SCORE: 18", "SCORE: 18/25", "Score : 18,5" — all valid
  const scoreMatch = humanPart.match(/SCORE\s*:?\s*(\d+(?:[.,]\d+)?)/i);
  const score = scoreMatch ? Math.round(parseFloat(scoreMatch[1].replace(",", "."))) : null;

  // Strip the SCORE line from the body
  const body = humanPart
    .replace(/SCORE\s*:?\s*\d+(?:[.,]\d+)?(?:\s*\/\s*25)?\s*\n?/i, "")
    .trim();

  const SECTION_HEADERS =
    /^(COMMENTAIRE(?:\s+GÉNÉRAL)?|POINTS\s+FORTS?|À\s+AMÉLIORER|AMÉLIORATIONS?|CORRECTIONS?|REMARQUES?|FORCES|FAIBLESSES|SUGGESTIONS?)\s*:?\s*$/i;

  const paragraphs = body.split(/\n\s*\n/);
  const parts: string[] = [];

  for (const para of paragraphs) {
    const lines = para
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    let headerHtml = "";
    let bodyLines = lines;
    if (SECTION_HEADERS.test(lines[0])) {
      headerHtml = `<p><strong>${escapeHtml(lines[0].replace(/:$/, ""))}</strong></p>`;
      bodyLines = lines.slice(1);
    }

    if (bodyLines.length === 0) {
      parts.push(headerHtml);
      continue;
    }

    const allBullets = bodyLines.every((l) => /^\s*[-•*]\s+/.test(l));
    if (allBullets) {
      const items = bodyLines
        .map((l) => `<li>${escapeHtml(l.replace(/^\s*[-•*]\s+/, ""))}</li>`)
        .join("");
      parts.push(headerHtml + `<ul>${items}</ul>`);
    } else {
      const content = bodyLines.map(escapeHtml).join("<br>");
      parts.push(headerHtml + `<p>${content}</p>`);
    }
  }

  return {
    score,
    feedback: parts.join("") || `<p>${escapeHtml(body)}</p>`,
    mistakes: parseMistakesBlock(mistakesPart),
  };
}

function parseMistakesBlock(block: string): WritingFeedbackMistake[] {
  if (!block.trim()) return [];
  const validCategories = new Set<string>(WRITING_CATEGORIES);
  const out: WritingFeedbackMistake[] = [];
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/,\s*$/, ""); // tolerate trailing commas
    if (!trimmed || !trimmed.startsWith("{")) continue;
    try {
      const obj = JSON.parse(trimmed) as Partial<WritingFeedbackMistake>;
      if (
        typeof obj.excerpt === "string" &&
        typeof obj.issue === "string" &&
        typeof obj.correction === "string" &&
        typeof obj.category === "string" &&
        validCategories.has(obj.category)
      ) {
        out.push({
          excerpt: obj.excerpt,
          issue: obj.issue,
          correction: obj.correction,
          category: obj.category as WritingCategory,
        });
      }
    } catch {
      // Skip malformed line, keep the rest.
    }
  }
  return out.slice(0, 8); // hard cap as belt-and-suspenders
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
