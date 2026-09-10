/**
 * Deterministische Abschnittsauswahl und Reihenfolge je LUV-Art
 * (Spezifikation Abschnitt 19, 20, 23, 27).
 */
import { LuvArt, LuvSection } from "./types.js";

export const SECTION_TITLES: Record<LuvSection["key"], string> = {
  initial_situation: "Ausgangslage",
  school_competences: "Schulische Grundkompetenzen",
  digital_competences: "Digitale Kompetenzen",
  personal_competences: "Personale Kompetenzen",
  social_competences: "Sozial-kommunikative Kompetenzen",
  methodical_competences: "Methodische Kompetenzen",
  practical_competences: "Berufliche Orientierung und Praxis",
  career_orientation: "Berufliche Orientierung",
  development: "Entwicklung im Beurteilungszeitraum",
  support_needs: "Förderbedarf",
  support_goals: "Förderziele und Maßnahmen",
  measures: "Maßnahmen",
  overall_assessment: "Gesamtbeurteilung",
  perspective: "Ausblick / Perspektive"
};

/**
 * Start-LUV (Abschnitt 19): Ausgangslage, Ressourcen/Kompetenzen, berufliche Orientierung,
 * Foerderbedarf, Foerderziele/Massnahmen, kurzer Ausblick. Keine Entwicklungsbehauptungen
 * ohne vorherige Daten -> kein "development"-Abschnitt im Start-LUV.
 */
const START_ORDER: LuvSection["key"][] = [
  "initial_situation",
  "school_competences",
  "personal_competences",
  "methodical_competences",
  "social_competences",
  "digital_competences",
  "practical_competences",
  "career_orientation",
  "support_needs",
  "support_goals",
  "perspective"
];

/**
 * Verlaufs-LUV (Abschnitt 20): wie Start-LUV, zusaetzlich ein bestaetigter
 * Entwicklungsvergleich-Abschnitt.
 */
const VERLAUF_ORDER: LuvSection["key"][] = [
  "initial_situation",
  "development",
  "school_competences",
  "personal_competences",
  "methodical_competences",
  "social_competences",
  "digital_competences",
  "practical_competences",
  "career_orientation",
  "support_needs",
  "support_goals",
  "perspective"
];

/**
 * Abschluss-LUV (Abschnitt 23): Ausgangspunkt -> Entwicklung -> aktueller Stand ->
 * Zielstatus -> verbleibender Unterstuetzungsbedarf -> Perspektive (verdichtet).
 */
const ABSCHLUSS_ORDER: LuvSection["key"][] = [
  "initial_situation",
  "development",
  "school_competences",
  "personal_competences",
  "methodical_competences",
  "social_competences",
  "digital_competences",
  "practical_competences",
  "career_orientation",
  "support_needs",
  "overall_assessment",
  "perspective"
];

export function sectionOrderForLuvArt(luvArt: LuvArt): LuvSection["key"][] {
  switch (luvArt) {
    case "start":
      return START_ORDER;
    case "verlauf":
      return VERLAUF_ORDER;
    case "abschluss":
      return ABSCHLUSS_ORDER;
  }
}
