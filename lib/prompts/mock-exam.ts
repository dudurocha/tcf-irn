import { getRandomScenario } from "./scenarios";

export function buildMockExamPrompt(): string {
  const scenario = getRandomScenario();

  return `Tu es un examinateur officiel du TCF IRN (niveau B2). Le candidat est lusophone (brésilien) installé en France. Tu génères un EXAMEN BLANC complet, plus large et plus difficile qu'une leçon quotidienne.

Génère le contenu de l'examen blanc en JSON valide UNIQUEMENT (sans markdown, sans backticks) avec EXACTEMENT cette structure :

{
  "reading": {
    "passage": "Un texte authentique de 280-340 mots en français, niveau B2 solide. Style journalistique, essai, ou éditorial. Thème : société française, vie citoyenne, travail, éducation, environnement, culture, débats actuels.",
    "questions": [
      {"question": "Question de compréhension", "options": ["A","B","C","D"], "correct": 0, "explanation": "Pourquoi cette réponse est correcte"}
    ]
  },
  "questions": [
    {"question": "Question QCM mixte (grammaire, vocabulaire, ou compréhension transversale)", "options": ["A","B","C","D"], "correct": 0, "explanation": "Justification"}
  ],
  "writingPrompt": "Un sujet de rédaction B2 (180-220 mots demandés)."
}

CONTRAINTES STRUCTURELLES STRICTES :
- reading.questions : EXACTEMENT 4 questions
- questions : EXACTEMENT 20 questions
- writingPrompt : 1 sujet unique

DIFFICULTÉ ET COUVERTURE — RÈGLE CRITIQUE :
Les 20 questions QCM doivent BALAYER tout le programme TCF IRN, pas se concentrer sur un seul thème. Distribution obligatoire :
- 5-6 questions de GRAMMAIRE (conjugaisons à tous temps, accords, syntaxe, pronoms, prépositions)
- 4-5 questions de VOCABULAIRE (synonymes, antonymes, expressions idiomatiques, faux-amis, registres)
- 4-5 questions de COMPRÉHENSION TRANSVERSALE (mini-énoncés, sens d'une phrase, reformulation)
- 3-4 questions de PRAGMATIQUE / SOCIÉTÉ (actes de langage, vie en France, contexte culturel)
- 2-3 questions de COHÉRENCE TEXTUELLE (connecteurs logiques, articulateurs)

Mélange les difficultés : ~30% faciles, ~50% moyennes, ~20% difficiles. Ne range PAS les questions par thème — alterne pour simuler un vrai examen.

IMPORTANT :
- Niveau strictement B2 (ni A2/B1 mou, ni C1 abstrait)
- Texte brut uniquement, sauf <strong>...</strong> et <em>...</em> autorisés pour mettre en évidence le mot/la forme cible
- Les 4 questions de compréhension écrite testent la compréhension du TEXTE (idée principale, détail, inférence, vocabulaire en contexte)
- N'utilise PAS de guillemets typographiques (" "), uniquement des guillemets droits dans le JSON
- Les distracteurs (mauvaises réponses) doivent être plausibles, pas absurdes
- Les explanations doivent être courtes (1-2 phrases) et pédagogiques

SUJET DE RÉDACTION — RÈGLE :
Format imposé : ${scenario}.
INTERDICTIONS ABSOLUES :
- N'utilise JAMAIS le scénario "un ami vient en France", "un ami va vous rendre visite", ni aucune variation de visite d'ami
- N'utilise JAMAIS de scénario où le candidat doit accueillir/conseiller quelqu'un qui vient en France
- Évite les scénarios de carte postale ou de recommandation touristique
Le sujet doit être SPÉCIFIQUE, CONCRET, ANCRÉ DANS LA VIE RÉELLE EN FRANCE (démarche administrative, opinion publique, débat de société, situation professionnelle, événement local).`;
}
