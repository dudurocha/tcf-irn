import type { CurriculumDay } from "@/lib/types";
import { getScenarioForDay } from "./scenarios";

export function buildLessonPrompt(curriculumDay: CurriculumDay): string {
  const { day, theme, section } = curriculumDay;
  const scenarioHint = getScenarioForDay(day);

  return `Tu es un professeur expérimenté préparant un candidat au TCF IRN (niveau B2). Le candidat est lusophone (brésilien) installé en France.

JOUR ${day} sur 30 — THÈME : "${theme}"
SECTION : ${section}

Génère le contenu complet de la leçon du jour en JSON valide UNIQUEMENT (sans markdown, sans backticks) avec EXACTEMENT cette structure :

{
  "theory": "Une explication claire et structurée en HTML simple (utilise <p>, <strong>, <em>, <ul>/<li>, <code>, <table>). 300-450 mots. Pédagogique, accessible. Mentionne les pièges classiques pour lusophones quand pertinent.",
  "examples": [
    {"sentence": "Phrase exemple en français", "note": "Explication courte du point clé"}
  ],
  "reading": {
    "passage": "Un texte authentique de 200-280 mots en français, niveau B2. Le texte doit s'intégrer NATURELLEMENT au thème du jour. Sujets : société française, vie citoyenne, travail, éducation, environnement, culture, débats actuels. Style journalistique ou informatif.",
    "questions": [
      {"question": "Question de compréhension portant sur le texte", "options": ["A","B","C","D"], "correct": 0, "explanation": "Pourquoi cette réponse est correcte"}
    ]
  },
  "questions": [
    {"question": "Question QCM sur le thème grammatical/lexical du jour", "options": ["A","B","C","D"], "correct": 0, "explanation": "Pourquoi c'est la bonne réponse"}
  ],
  "writingPrompt": "Un sujet de rédaction adapté (180-220 mots demandés au candidat). Concret et clair.",
  "vocab": [
    {"word": "mot français", "translation": "tradução em português", "example": "Phrase d'exemple en contexte."}
  ]
}

CONTRAINTES STRUCTURELLES :
- examples : 4 à 6 entrées
- reading.questions : EXACTEMENT 4 questions
- questions : EXACTEMENT 10 questions
- vocab : EXACTEMENT 8 entrées

IMPORTANT :
- Niveau strictement B2 (ni plus simple, ni C1)
- Les 10 questions QCM doivent couvrir le thème du jour de façon variée (différents aspects, niveaux de difficulté progressifs)
- Les 4 questions de compréhension écrite doivent tester la compréhension du TEXTE (idée principale, détail, inférence, vocabulaire en contexte) — PAS la grammaire du jour
- Les exemples doivent être authentiques (langue réelle, pas artificielle)
- Pour les jours "revision" ou "exam", couvre largement les thèmes des jours précédents
- Le vocabulaire doit être directement utile pour ce thème
- N'utilise PAS de guillemets typographiques (" "), uniquement des guillemets droits dans le JSON

CONJUGAISONS — RÈGLE STRICTE :
Quand tu présentes un verbe dans la partie "theory" (verbe modèle, exemple de conjugaison, verbe irrégulier important), tu DOIS montrer TOUTES les personnes : je, tu, il/elle/on, nous, vous, ils/elles. Jamais seulement quelques personnes. Utilise un <table> HTML simple. Format obligatoire :
<table><tr><td>je</td><td><strong>sois</strong></td></tr><tr><td>tu</td><td><strong>sois</strong></td></tr><tr><td>il/elle</td><td><strong>soit</strong></td></tr><tr><td>nous</td><td><strong>soyons</strong></td></tr><tr><td>vous</td><td><strong>soyez</strong></td></tr><tr><td>ils/elles</td><td><strong>soient</strong></td></tr></table>
Si plusieurs verbes sont à présenter, montre les 6 personnes pour chacun. Ne tronque jamais à 2 ou 3 personnes.

SUJET DE RÉDACTION — RÈGLE CRÉATIVITÉ STRICTE :
Pour ce jour, le format imposé est : ${scenarioHint}.
INTERDICTIONS ABSOLUES :
- N'utilise JAMAIS le scénario "un ami vient en France", "un ami va vous rendre visite", "votre ami brésilien arrive", ni AUCUNE variation de visite d'ami/famille
- N'utilise JAMAIS de scénario où le candidat doit accueillir, conseiller ou guider quelqu'un qui vient en France
- Évite les scénarios de voyage générique, de carte postale, ou de recommandation touristique
Le sujet doit être SPÉCIFIQUE, CONCRET, ANCRÉ DANS LA VIE RÉELLE EN FRANCE — pas dans un échange avec l'étranger. Le candidat habite et vit en France, donc le sujet doit refléter une situation qu'un résident français de niveau B2 pourrait réellement rencontrer (démarche, opinion publique, débat de société, situation professionnelle, événement local).`;
}
