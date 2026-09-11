/**
 * Massnahmenbibliothek (Version 0.2, PH-15 Abschnitt 30-33).
 *
 * Statische, editierbare Konfiguration mit Beispiel-Foerdermassnahmen je fachlicher
 * Untergruppe. Fuer Version 0.2 bewusst als Konfigurationsdatei umgesetzt (PH-15 §33:
 * "Fuer Version 0.2 kann dies zunaechst ueber eine Konfigurationsdatei erfolgen"),
 * keine Datenbank/Admin-Oberflaeche.
 *
 * WICHTIG (PH-15 Abschnitt 32): Eine Massnahme aus der Bibliothek ist eine
 * "tatsaechlich verfuegbare Massnahme" - das bedeutet NICHT, dass sie bereits
 * durchgefuehrt wird. Claude darf das nicht behaupten (siehe ai/prompts/measures.v1.ts
 * und Grundregel). Die Unterscheidung erfolgt ueber SupportGoal.measureSource.
 *
 * TODO: fachlich abgleichen - Beispielmassnahmen sind unverbindliche Vorschlaege aus
 * PH-15, keine offizielle/vertraglich hinterlegte Massnahmenliste. Die Zuordnung zu
 * BA-Foerderzielbereichen (PH-15 v1.1 Abschnitt 42) ist ebenfalls eine plausible
 * Arbeitsannahme, keine offizielle Zuordnung.
 */
import { BAFoerderzielbereich, CompetenceArea, MeasureLibraryEntry } from "./types.js";

export const MEASURE_LIBRARY: MeasureLibraryEntry[] = [
  // Mathematik (schulische_grundkompetenzen)
  {
    id: "MEAS_MATH_001",
    area: "schulische_grundkompetenzen",
    group: "Mathematik",
    text: "Praxisbezogene Übungsaufgaben",
    foerderzielbereiche: ["grundkompetenzen"]
  },
  { id: "MEAS_MATH_002", area: "schulische_grundkompetenzen", group: "Mathematik", text: "Wiederholungssequenzen", foerderzielbereiche: ["grundkompetenzen"] },
  {
    id: "MEAS_MATH_003",
    area: "schulische_grundkompetenzen",
    group: "Mathematik",
    text: "Kurze individuelle Lernaufträge",
    foerderzielbereiche: ["grundkompetenzen"]
  },
  { id: "MEAS_MATH_004", area: "schulische_grundkompetenzen", group: "Mathematik", text: "Lernkontrolle", foerderzielbereiche: ["grundkompetenzen"] },
  {
    id: "MEAS_MATH_005",
    area: "schulische_grundkompetenzen",
    group: "Mathematik",
    text: "Übungen mit Berufsbezug",
    foerderzielbereiche: ["grundkompetenzen", "berufsspezifische_qualifizierung"]
  },
  // Deutsch (schulische_grundkompetenzen)
  { id: "MEAS_DE_001", area: "schulische_grundkompetenzen", group: "Deutsch", text: "Lesetexte mit Arbeitsaufträgen", foerderzielbereiche: ["grundkompetenzen"] },
  {
    id: "MEAS_DE_002",
    area: "schulische_grundkompetenzen",
    group: "Deutsch",
    text: "Übungen zum schriftlichen Ausdruck",
    foerderzielbereiche: ["grundkompetenzen", "erwerb_hauptschulabschluss"]
  },
  { id: "MEAS_DE_003", area: "schulische_grundkompetenzen", group: "Deutsch", text: "Rechtschreibtraining", foerderzielbereiche: ["grundkompetenzen", "erwerb_hauptschulabschluss"] },
  {
    id: "MEAS_DE_004",
    area: "schulische_grundkompetenzen",
    group: "Deutsch",
    text: "Bearbeiten berufstypischer Texte",
    foerderzielbereiche: ["grundkompetenzen", "berufsspezifische_qualifizierung"]
  },
  // Arbeitsorganisation (methodische_kompetenzen)
  { id: "MEAS_ORG_001", area: "methodische_kompetenzen", group: "Arbeitsorganisation", text: "Checklisten", foerderzielbereiche: ["berufliche_grundfaehigkeiten"] },
  { id: "MEAS_ORG_002", area: "methodische_kompetenzen", group: "Arbeitsorganisation", text: "Arbeitsschrittpläne", foerderzielbereiche: ["berufliche_grundfaehigkeiten"] },
  {
    id: "MEAS_ORG_003",
    area: "methodische_kompetenzen",
    group: "Arbeitsorganisation",
    text: "Aufgaben in Teilaufgaben strukturieren",
    foerderzielbereiche: ["berufliche_grundfaehigkeiten"]
  },
  {
    id: "MEAS_ORG_004",
    area: "methodische_kompetenzen",
    group: "Arbeitsorganisation",
    text: "Schrittweise Reduzierung von Hilfestellung",
    foerderzielbereiche: ["berufliche_grundfaehigkeiten"]
  },
  { id: "MEAS_ORG_005", area: "methodische_kompetenzen", group: "Arbeitsorganisation", text: "Selbstkontrollbogen", foerderzielbereiche: ["berufliche_grundfaehigkeiten"] },
  // Sozial-kommunikativ (sozial_kommunikative_kompetenzen)
  { id: "MEAS_SOC_001", area: "sozial_kommunikative_kompetenzen", group: "Sozial-kommunikativ", text: "Partnerarbeit", foerderzielbereiche: ["berufliche_grundfaehigkeiten"] },
  { id: "MEAS_SOC_002", area: "sozial_kommunikative_kompetenzen", group: "Sozial-kommunikativ", text: "Gruppenaufgabe", foerderzielbereiche: ["berufliche_grundfaehigkeiten"] },
  {
    id: "MEAS_SOC_003",
    area: "sozial_kommunikative_kompetenzen",
    group: "Sozial-kommunikativ",
    text: "Strukturierte Gesprächssituationen",
    foerderzielbereiche: ["berufliche_grundfaehigkeiten"]
  },
  { id: "MEAS_SOC_004", area: "sozial_kommunikative_kompetenzen", group: "Sozial-kommunikativ", text: "Feedbackgespräch", foerderzielbereiche: ["berufliche_grundfaehigkeiten"] },
  { id: "MEAS_SOC_005", area: "sozial_kommunikative_kompetenzen", group: "Sozial-kommunikativ", text: "Reflexionsaufgabe", foerderzielbereiche: ["berufliche_grundfaehigkeiten"] }
];

export function measuresForArea(area: CompetenceArea): MeasureLibraryEntry[] {
  return MEASURE_LIBRARY.filter((m) => m.area === area);
}

/** PH-15 v1.1 Abschnitt 42 (SOLL): zusaetzliche Filterung nach BA-Foerderzielbereich. */
export function measuresForFoerderzielbereich(bereich: BAFoerderzielbereich): MeasureLibraryEntry[] {
  return MEASURE_LIBRARY.filter((m) => m.foerderzielbereiche?.includes(bereich));
}
