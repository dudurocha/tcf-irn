export function buildGradingPrompt(writingPrompt: string, text: string): string {
  return `Tu es un correcteur expérimenté du TCF IRN. Évalue cette production écrite sur 25 points selon les critères officiels : cohérence et cohésion, lexique (richesse, précision), grammaire (correction, complexité B2), adéquation au sujet, longueur (180-250 mots attendus).

SUJET :
${writingPrompt}

TEXTE DU CANDIDAT :
${text}

Sois rigoureux mais constructif. Un texte avec fautes graves ou clairement hors sujet doit recevoir une note basse.

Réponds STRICTEMENT dans ce format texte (PAS de JSON, PAS de backticks). Une seule ligne SCORE en premier, puis les sections :

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
- [observation générale supplémentaire si utile]`;
}

/**
 * Parses the structured plain-text feedback from the model into score + HTML.
 * Plain text is more robust than JSON because student essays often contain
 * quotes and newlines that break JSON parsing.
 */
export function parseWritingFeedback(raw: string): { score: number | null; feedback: string } {
  // Extract score: "SCORE: 18", "SCORE: 18/25", "Score : 18,5" — all valid
  const scoreMatch = raw.match(/SCORE\s*:?\s*(\d+(?:[.,]\d+)?)/i);
  const score = scoreMatch ? Math.round(parseFloat(scoreMatch[1].replace(",", "."))) : null;

  // Strip the SCORE line from the body
  let body = raw.replace(/SCORE\s*:?\s*\d+(?:[.,]\d+)?(?:\s*\/\s*25)?\s*\n?/i, "").trim();

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
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
