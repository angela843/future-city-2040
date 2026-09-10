import { BAFoerderzielbereich, BeruflicheVorerfahrung, CompetenceArea, LuvSection, Orientierungsstatus, Schulabschluss } from "./types.js";

export const AREA_LABELS: Record<CompetenceArea, string> = {
  schulische_grundkompetenzen: "Schulische Grundkompetenzen",
  digitale_kompetenzen: "Digitale Kompetenzen",
  personale_kompetenzen: "Personale Kompetenzen",
  sozial_kommunikative_kompetenzen: "Sozial-kommunikative Kompetenzen",
  methodische_kompetenzen: "Methodische Kompetenzen",
  berufliche_orientierung_praxis: "Berufliche Orientierung und Praxis"
};

export const AREA_TO_SECTION_KEY: Record<CompetenceArea, LuvSection["key"]> = {
  schulische_grundkompetenzen: "school_competences",
  digitale_kompetenzen: "digital_competences",
  personale_kompetenzen: "personal_competences",
  sozial_kommunikative_kompetenzen: "social_competences",
  methodische_kompetenzen: "methodical_competences",
  berufliche_orientierung_praxis: "practical_competences"
};

/** PH-15 v1.1 Abschnitt 8. TODO: fachlich abgleichen - Arbeitsformulierungen, keine offiziellen BA-Bezeichnungen. */
export const BA_FOERDERZIELBEREICH_LABELS: Record<BAFoerderzielbereich, string> = {
  grundkompetenzen: "Grundkompetenzen",
  berufsorientierung_berufswahl: "Berufsorientierung/Berufswahl",
  berufliche_grundfaehigkeiten: "Berufliche Grundfähigkeiten",
  berufsspezifische_qualifizierung: "Berufsspezifische Qualifizierung",
  erwerb_hauptschulabschluss: "Erwerb Hauptschulabschluss"
};

export const MASSNAHMEART_LABELS = {
  bvb: "BvB",
  bvb_reha: "BvB-Reha"
} as const;

export const SCHULABSCHLUSS_LABELS: Record<Schulabschluss, string> = {
  kein_schulabschluss: "kein Schulabschluss",
  esa: "Erster Schulabschluss (ESA)",
  msa: "Mittlerer Schulabschluss (MSA)",
  fachhochschulreife: "Fachhochschulreife",
  abitur: "Abitur",
  sonstiger: "sonstiger Abschluss",
  noch_schulpflichtig: "noch schulpflichtig",
  nicht_bekannt: "nicht bekannt"
};

export const BERUFLICHE_VORERFAHRUNG_LABELS: Record<BeruflicheVorerfahrung, string> = {
  keine: "keine",
  praktikum: "Praktikum",
  mehrere_praktika: "mehrere Praktika",
  ausbildung_begonnen: "Ausbildung begonnen",
  ausbildung_abgebrochen: "Ausbildung abgebrochen",
  beschaeftigung: "Beschäftigung",
  vorherige_massnahme: "vorherige Maßnahme",
  sonstige: "sonstige"
};

export const ORIENTIERUNGSSTATUS_LABELS: Record<Orientierungsstatus, string> = {
  konkret: "konkret",
  grundsaetzlich_vorhanden: "grundsätzlich vorhanden",
  unsicher: "unsicher",
  weitere_orientierung_erforderlich: "weitere Orientierung erforderlich"
};
