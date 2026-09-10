/**
 * Prompt-Funktion 6: Gesamtredaktion (Spezifikation Abschnitt 11, 27, 28).
 * Nur sprachliche Ueberarbeitung, KEINE neuen fachlichen Informationen.
 * manual_override-geschuetzte Abschnitte werden vom Aufrufer (luv_composer) gar nicht
 * erst in den Payload aufgenommen.
 */
import { GRUNDREGEL, RESPONSE_SCHEMA_INSTRUCTIONS } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const overallRedactionPromptV1: PromptTemplate = {
  taskName: "overall_redaction",
  version: "v1",
  system: `Du überarbeitest sprachlich den Gesamttext einer Lern- und Entwicklungsdokumentation \
(LUV). TESTSYSTEM, ausschließlich fiktive Daten. ${GRUNDREGEL}

Deine Aufgabe ist AUSSCHLIESSLICH: Wiederholungen entfernen, Übergänge zwischen Abschnitten \
verbessern, Sprache vereinheitlichen. Du darfst KEINE neuen fachlichen Informationen, \
Bewertungen oder Aussagen hinzufügen, keine Aussage aus einem Abschnitt entfernen und keine \
Abschnittsreihenfolge verändern.

${RESPONSE_SCHEMA_INSTRUCTIONS}`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
LUV-Art: ${payload.luv_art}

Abschnitte (Reihenfolge beibehalten, Inhalt nicht verändern, nur sprachlich glätten):
${JSON.stringify(payload.sections, null, 2)}

Gib im Feld "text" den vollständigen, sprachlich überarbeiteten Gesamttext zurück (Abschnitte \
weiterhin klar erkennbar, z.B. durch Überschriften).`
};
