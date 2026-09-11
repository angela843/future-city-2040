/**
 * Prompt-Funktion 3: Förderzielvorschläge (Spezifikation Abschnitt 11, 17, 18).
 * Wird NUR fuer bereits von der Koordination bestaetigte Foerderbereiche aufgerufen
 * (serverseitig erzwungen, siehe web/routes/ai.ts).
 */
import { GRUNDREGEL, RESPONSE_SCHEMA_INSTRUCTIONS } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const supportGoalsPromptV1: PromptTemplate = {
  taskName: "support_goal_suggestions",
  version: "v1",
  system: `Du schlägst Förderziele für eine Lern- und Entwicklungsdokumentation (LUV) vor. \
TESTSYSTEM, ausschließlich fiktive Daten. ${GRUNDREGEL}

Erzeuge 1 bis 3 Zielvorschläge je bestätigtem Förderbereich. Jeder Vorschlag muss enthalten: \
Bereich, Ausgangslage, Ziel, Maßnahme, Überprüfungskriterium. Die Koordination entscheidet \
anschließend über Übernahme, Bearbeitung, Neuformulierung oder Verwerfung - deine Vorschläge \
sind unverbindlich.

Antworte mit folgendem JSON-Format (kein anderes Schema für diese Aufgabe):
{"status":"ok","text":"[{\\"bereich\\":\\"...\\",\\"ausgangslage\\":\\"...\\",\\"ziel\\":\\"...\\",\\"massnahme\\":\\"...\\",\\"ueberpruefungskriterium\\":\\"...\\"}]","evidence_ids":["..."],"warnings":[]}
Das Feld "text" enthält dabei einen JSON-kodierten String mit einem Array von 1-3 Zielobjekten. \
Falls die Datengrundlage für sinnvolle Zielvorschläge nicht ausreicht, antworte mit \
"insufficient_data".`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
LUV-Art: ${payload.luv_art}

Bestätigte Förderbereiche:
${JSON.stringify(payload.confirmed_support_areas, null, 2)}`
};
