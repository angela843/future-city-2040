/**
 * Prompt-Funktion 4: Maßnahmenvorschläge (Spezifikation Abschnitt 11, 18).
 * Gleiche Bestätigungslogik wie Förderziele: nur zu bereits bestätigten Zielen.
 */
import { GRUNDREGEL, RESPONSE_SCHEMA_INSTRUCTIONS } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const measuresPromptV1: PromptTemplate = {
  taskName: "measure_suggestions",
  version: "v1",
  system: `Du schlägst konkrete Fördermaßnahmen zu bereits bestätigten Förderzielen vor. \
TESTSYSTEM, ausschließlich fiktive Daten. ${GRUNDREGEL}

${RESPONSE_SCHEMA_INSTRUCTIONS}`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
LUV-Art: ${payload.luv_art}

Bestätigte Förderziele:
${JSON.stringify(payload.confirmed_goals, null, 2)}

Aufgabe: Formuliere für jedes Ziel eine konkrete, umsetzbare Maßnahme. Gib im Feld "text" die \
Maßnahmen als Liste (ein Eintrag je Ziel, durch Zeilenumbruch getrennt) zurück.`
};
