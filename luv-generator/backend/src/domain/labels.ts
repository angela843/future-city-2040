import {
  BAFoerderzielbereich,
  BeruflicheVorerfahrung,
  CompetenceArea,
  JaNein,
  JaNeinNichtRelevant,
  LuvSection,
  Massnahmeart,
  Massnahmeziel,
  Orientierungsstatus,
  Rolle,
  Schulabschluss,
  Uebermittlungsanlass,
  VerlaufAnlass,
  VorzeitigeBeendigungArt
} from "./types.js";

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

export const MASSNAHMEART_LABELS: Record<Massnahmeart, string> = {
  bvb1: "BvB 1",
  bvb2: "BvB-Reha (BvB 2)",
  bvb3: "BvB-Reha (BvB 3)"
};

export const VERLAUF_ANLASS_LABELS: Record<VerlaufAnlass, string> = {
  regulaer: "Regulär",
  vor_massnahmeende: "Vor Maßnahmeende",
  verlaengerung: "Verlängerung",
  sonstiger_anlass: "Sonstiger Anlass"
};

export const MASSNAHMEZIEL_LABELS: Record<Massnahmeziel, string> = {
  berufsausbildung: "Berufsausbildung",
  sv_beschaeftigung: "Sozialversicherungspflichtige Beschäftigung"
};

/** Migrationsplan 0.1->0.2, Entscheidung 8 (verbindliche Rollenliste des Nutzers). */
export const ROLLE_LABELS: Record<Rolle, string> = {
  teilnehmende_person: "Teilnehmende Person",
  bildungsbegleitung_case_management: "Bildungsbegleitung / Case Management",
  ausbilder: "Ausbilder/in",
  lehrkraft: "Lehrkraft",
  sozialpaedagogik: "Sozialpädagogik",
  psychologe_psychologin: "Psychologe/Psychologin",
  weiteres_fachpersonal: "Weiteres Fachpersonal",
  paedagogische_mitarbeitende_lernort_wohnen: "Pädagogische Mitarbeitende Lernort Wohnen",
  gemeinsame_aufgaben: "Gemeinsame Aufgaben"
};

export const UEBERMITTLUNGSANLASS_LABELS: Record<Uebermittlungsanlass, string> = {
  regulaeres_ende: "Reguläres Ende",
  vorzeitige_beendigung: "Vorzeitige Beendigung"
};

export const VORZEITIGE_BEENDIGUNG_ART_LABELS: Record<VorzeitigeBeendigungArt, string> = {
  uebergang_ausbildung_arbeit: "Übergang in Ausbildung/Arbeit",
  abbruch: "Abbruch"
};

export const JA_NEIN_LABELS: Record<JaNein, string> = { ja: "Ja", nein: "Nein" };
export const JA_NEIN_NICHT_RELEVANT_LABELS: Record<JaNeinNichtRelevant, string> = {
  ja: "Ja",
  nein: "Nein",
  nicht_relevant: "Nicht relevant"
};

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
