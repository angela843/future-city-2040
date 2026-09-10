/**
 * Allowlist erlaubter Felder pro KI-Aufgabe (Spezifikation Abschnitt 8, 10).
 *
 * Jede Aufgabe (Prompt-Funktion) darf NUR die hier gelisteten Top-Level-Schluessel
 * im an Claude gesendeten Payload enthalten. Dies ist eine zusaetzliche,
 * serverseitige Absicherung (defense in depth) zur Funktion in gateway.ts,
 * die zusaetzlich rekursiv nach direkten Identifikatoren sucht.
 */
export type AiTaskType =
  | "structure_notes"
  | "formulate_section"
  | "support_goal_suggestions"
  | "measure_suggestions"
  | "development_comparison"
  | "overall_redaction"
  | "fact_check";

export const TASK_ALLOWED_FIELDS: Record<AiTaskType, string[]> = {
  structure_notes: ["case_ref", "area_label", "raw_notes", "source_types"],
  formulate_section: [
    "case_ref",
    "luv_art",
    "section_key",
    "area_label",
    "sub_competences",
    "evidence",
    "grundregel"
  ],
  support_goal_suggestions: [
    "case_ref",
    "luv_art",
    "confirmed_support_areas",
    "grundregel"
  ],
  measure_suggestions: ["case_ref", "luv_art", "confirmed_goals", "library_measures", "grundregel"],
  development_comparison: [
    "case_ref",
    "area_label",
    "previous_text",
    "current_text",
    "previous_rating_label",
    "current_rating_label",
    "grundregel"
  ],
  overall_redaction: ["case_ref", "luv_art", "sections", "grundregel"],
  fact_check: ["case_ref", "section_key", "text", "available_evidence_ids", "available_evidence", "grundregel"]
};

/**
 * Felder, die NIEMALS automatisiert an Claude gesendet werden duerfen
 * (Spezifikation Abschnitt 8), unabhaengig von der Aufgabe. Case-insensitiver
 * Abgleich auf Schluesselnamen, rekursiv auf jeder Verschachtelungsebene.
 */
export const DIRECT_IDENTIFIER_KEYS = [
  "teilnehmername",
  "name",
  "vorname",
  "nachname",
  "fullname",
  "geburtsdatum",
  "birthdate",
  "geburtstag",
  "adresse",
  "address",
  "strasse",
  "plz",
  "wohnort",
  "telefonnummer",
  "telefon",
  "phone",
  "mobilnummer",
  "email",
  "e-mail",
  "mail",
  "teilnehmernummer",
  "participantid",
  "kundennummer",
  "personalausweis",
  "sozialversicherungsnummer"
];
