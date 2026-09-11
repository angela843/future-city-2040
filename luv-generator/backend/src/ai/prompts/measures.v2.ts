/**
 * Prompt-Funktion 4: Maßnahmenvorschläge, Version 2 (Version 0.2, PH-15 Abschnitt 30-33).
 * Gleiche Bestätigungslogik wie Förderziele: nur zu bereits bestätigten Zielen.
 * Neu gegenüber v1: die Massnahmenbibliothek wird als Kontext mitgegeben, Claude darf
 * daraus zitieren oder eigene Vorschläge formulieren - beides bleibt Vorschlagssprache.
 */
import { GRUNDREGEL, RESPONSE_SCHEMA_INSTRUCTIONS } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const measuresPromptV2: PromptTemplate = {
  taskName: "measure_suggestions",
  version: "v2",
  system: `Du schlägst konkrete Fördermaßnahmen zu bereits bestätigten Förderzielen vor. \
TESTSYSTEM, ausschließlich fiktive Daten. ${GRUNDREGEL}

WICHTIG (Version 0.2): Eine Maßnahme - ob aus der mitgegebenen Bibliothek oder frei formuliert \
- ist IMMER ein Vorschlag. Du darfst NIEMALS behaupten oder andeuten, dass eine Maßnahme \
bereits stattfindet, begonnen wurde oder verbindlich eingeplant ist, sofern dies nicht \
ausdrücklich in den übergebenen Daten bestätigt ist. Verwende ausschließlich Vorschlagssprache \
("könnte", "wird vorgeschlagen", "bietet sich an").

${RESPONSE_SCHEMA_INSTRUCTIONS}`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
LUV-Art: ${payload.luv_art}

Bestätigte Förderziele:
${JSON.stringify(payload.confirmed_goals, null, 2)}

Verfügbare Maßnahmen aus der Maßnahmenbibliothek (optionale Orientierung, kein Zwang):
${JSON.stringify(payload.library_measures ?? [], null, 2)}

Aufgabe: Formuliere für jedes Ziel eine konkrete, umsetzbare Maßnahme in Vorschlagssprache. \
Gib im Feld "text" die Maßnahmen als Liste (ein Eintrag je Ziel, durch Zeilenumbruch getrennt) \
zurück.`
};
