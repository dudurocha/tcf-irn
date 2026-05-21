/**
 * Pool of writing scenarios used to force variety in daily writing prompts.
 * Each day deterministically picks one based on (day * 7) % length.
 *
 * Banned scenarios (enforced in the prompt):
 *  - "A friend coming to France"
 *  - Tourism / travel recommendations
 *  - Postcard / generic travel
 */
export const WRITING_SCENARIOS = [
  "lettre formelle à une administration française (préfecture, CAF, mairie, Pôle emploi, sécurité sociale)",
  "courrier des lecteurs réagissant à un article de presse",
  "article d'opinion sur une question de société française",
  "lettre de réclamation à une entreprise (opérateur télécom, banque, fournisseur d'énergie)",
  "lettre de motivation pour un emploi, une formation, ou un bénévolat",
  "message argumenté sur un forum citoyen ou une plateforme participative",
  "lettre ouverte adressée à un élu local sur une décision contestée",
  "compte-rendu d'une expérience personnelle marquante (déménagement, démarche, événement)",
  "argumentation pour ou contre une mesure récente (transports, écologie, éducation, télétravail)",
  "lettre à la rédaction d'un journal pour proposer un sujet d'enquête",
  "texte de réflexion personnelle sur un changement culturel observé",
  "courriel professionnel difficile (refus, négociation, demande complexe)",
  "billet d'humeur sur la vie quotidienne en France",
  "lettre à un ancien professeur, mentor ou personne qui a marqué votre parcours",
  "tribune sur l'évolution d'un métier ou d'un secteur d'activité",
  "récit argumenté d'une décision importante prise récemment",
  "lettre à votre futur·e vous, dix ans plus tard",
  "réponse argumentée à un sondage ou une consultation publique",
  "texte pour le blog d'une association engagée sur un sujet précis",
  "lettre de soutien ou de désaccord à une pétition",
] as const;

export function getScenarioForDay(day: number): string {
  return WRITING_SCENARIOS[(day * 7) % WRITING_SCENARIOS.length];
}

export function getRandomScenario(): string {
  const i = Math.floor(Math.random() * WRITING_SCENARIOS.length);
  return WRITING_SCENARIOS[i];
}
