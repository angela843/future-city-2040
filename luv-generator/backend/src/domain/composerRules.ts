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
  abschluss_ergebnis: "Abschlussergebnisse",
  perspective: "Ausblick / Perspektive"
};

/**
 * Start-LUV (Abschnitt 19): Ausgangslage, Ressourcen/Kompetenzen, berufliche Orientierung,
 * Foerderbedarf, Foerderziele/Massnahmen, kurzer Ausblick. Keine Entwicklungsbehauptungen
 * ohne vorherige Daten -> kein "development"-Abschnitt im Start-LUV.
 *
 * "digitale_kompetenzen" ist kein offizieller BA-Kompetenzbereich (PH-17 V1.0 Abschnitt 3,
 * Migrationsplan 0.1->0.2 Entscheidung 1) und erscheint deshalb NICHT als eigene
 * automatisch erzeugte LUV-Ausgabesektion - bleibt aber interner Erhebungsbereich
 * (Schritt 3 / Kompetenzkatalog). Relevante Erkenntnisse muessen von der Koordination
 * manuell einem passenden offiziellen Feld zugeordnet werden.
 */
const START_ORDER: LuvSection["key"][] = [
  "initial_situation",
  "school_competences",
  "personal_competences",
  "methodical_competences",
  "social_competences",
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
  "practical_competences",
  "career_orientation",
  "support_needs",
  "support_goals",
  "perspective"
];

/**
 * Abschluss-LUV (Abschnitt 23): Ausgangspunkt -> Entwicklung -> aktueller Stand ->
 * strukturierte Abschlussergebnisse (PH-17 V1.0, 22-Felder-Struktur) -> Perspektive.
 */
const ABSCHLUSS_ORDER: LuvSection["key"][] = [
  "initial_situation",
  "development",
  "school_competences",
  "personal_competences",
  "methodical_competences",
  "social_competences",
  "practical_competences",
  "career_orientation",
  "support_needs",
  "overall_assessment",
  "abschluss_ergebnis",
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
