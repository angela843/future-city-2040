/**
 * Prompt-Funktion 1: Stichpunkte strukturieren (Spezifikation Abschnitt 11).
 * Wandelt lose Beobachtungsstichpunkte in strukturierte, neutrale Stichpunkte um -
 * OHNE bereits einen fertigen Fachabschnitt zu formulieren.
 */
import { GRUNDREGEL, RESPONSE_SCHEMA_INSTRUCTIONS } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const structureNotesPromptV1: PromptTemplate = {
  taskName: "structure_notes",
  version: "v1",
  system: `Du unterstützt eine Koordination in einer berufsvorbereitenden Bildungsmaßnahme (BvB) \
beim Strukturieren von Beobachtungsstichpunkten für eine Lern- und Entwicklungsdokumentation (LUV). \
Dies ist ein TESTSYSTEM mit ausschließlich fiktiven Daten. ${GRUNDREGEL}

${RESPONSE_SCHEMA_INSTRUCTIONS}`,
  buildUserPrompt: (payload) => `Bereich: ${payload.area_label}
Vorliegende Quellenarten: ${JSON.stringify(payload.source_types)}
Fallreferenz: ${payload.case_ref}

Rohe Stichpunkte der Koordination:
${payload.raw_notes}

Aufgabe: Strukturiere diese Stichpunkte in klare, neutrale Einzelaussagen (keine Bewertung, \
keine Interpretation, keine neuen Inhalte). Gib im Feld "text" die strukturierten Stichpunkte \
als einfache Liste (durch Zeilenumbrüche getrennt) zurück.`
};
