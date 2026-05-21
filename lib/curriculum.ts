import type { CurriculumDay } from "@/lib/types";

/**
 * The 30-day TCF IRN preparation curriculum.
 *
 * Structure:
 *  - Week 1 (1-7): Grammar foundations
 *  - Week 2 (8-14): Time, hypothesis, voice, connectors
 *  - Week 3 (15-21): Vocabulary
 *  - Week 4 (22-28): Writing + civic vocabulary
 *  - Final stretch (29-30): Mock exams
 */
export const CURRICULUM: CurriculumDay[] = [
  // Week 1: Grammar foundations
  { day: 1, theme: "Le subjonctif présent — formation et déclencheurs", section: "structures", icon: "Grammaire" },
  { day: 2, theme: "Subjonctif vs indicatif — choisir le bon mode", section: "structures", icon: "Grammaire" },
  { day: 3, theme: "Le conditionnel présent et passé", section: "structures", icon: "Grammaire" },
  { day: 4, theme: "L'accord du participe passé (avoir et être)", section: "structures", icon: "Grammaire" },
  { day: 5, theme: "Pronoms relatifs simples (qui, que, dont, où)", section: "structures", icon: "Grammaire" },
  { day: 6, theme: "Pronoms relatifs composés (lequel, duquel, auquel)", section: "structures", icon: "Grammaire" },
  { day: 7, theme: "Révision semaine 1 + compréhension écrite", section: "revision", icon: "Révision" },

  // Week 2: Time, hypothesis, voice, connectors
  { day: 8, theme: "Expressions de temps : depuis, pendant, pour, il y a, dès", section: "structures", icon: "Grammaire" },
  { day: 9, theme: "Le discours rapporté au passé", section: "structures", icon: "Grammaire" },
  { day: 10, theme: "La voix passive et ses alternatives", section: "structures", icon: "Grammaire" },
  { day: 11, theme: "Les hypothèses (si + concordance des temps)", section: "structures", icon: "Grammaire" },
  { day: 12, theme: "Connecteurs : cause et conséquence", section: "structures", icon: "Grammaire" },
  { day: 13, theme: "Connecteurs : opposition, concession, but", section: "structures", icon: "Grammaire" },
  { day: 14, theme: "Révision semaine 2 + compréhension écrite", section: "revision", icon: "Révision" },

  // Week 3: Vocabulary
  { day: 15, theme: "Faux amis portugais-français", section: "vocab", icon: "Vocabulaire" },
  { day: 16, theme: "Registres de langue (familier, courant, soutenu)", section: "vocab", icon: "Vocabulaire" },
  { day: 17, theme: "Expressions idiomatiques courantes", section: "vocab", icon: "Vocabulaire" },
  { day: 18, theme: "Vocabulaire administratif (préfecture, démarches)", section: "vocab", icon: "Vocabulaire" },
  { day: 19, theme: "Vocabulaire de la vie professionnelle", section: "vocab", icon: "Vocabulaire" },
  { day: 20, theme: "Vocabulaire de l'argumentation et de l'opinion", section: "vocab", icon: "Vocabulaire" },
  { day: 21, theme: "Révision semaine 3 + compréhension écrite", section: "revision", icon: "Révision" },

  // Week 4: Writing + civic vocab
  { day: 22, theme: "Structurer une lettre formelle (administration)", section: "ecrit", icon: "Écrit" },
  { day: 23, theme: "Rédiger un courrier des lecteurs / article d'opinion", section: "ecrit", icon: "Écrit" },
  { day: 24, theme: "L'argumentation : structurer pour/contre", section: "ecrit", icon: "Écrit" },
  { day: 25, theme: "Vocabulaire des institutions françaises", section: "vocab", icon: "Vocabulaire" },
  { day: 26, theme: "Valeurs républicaines et laïcité (vocab civique)", section: "vocab", icon: "Vocabulaire" },
  { day: 27, theme: "Compréhension écrite : stratégies et pièges", section: "lecture", icon: "Lecture" },
  { day: 28, theme: "Révision semaine 4 + écrit complet", section: "revision", icon: "Révision" },

  // Final stretch
  { day: 29, theme: "Examen blanc — structures + compréhension", section: "exam", icon: "Examen" },
  { day: 30, theme: "Examen blanc — écrit + révision finale", section: "exam", icon: "Examen" },
];

export const TOTAL_DAYS = CURRICULUM.length;

export const getDay = (day: number): CurriculumDay | undefined =>
  CURRICULUM.find((d) => d.day === day);
