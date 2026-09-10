/**
 * Prompt-Funktion 5: Entwicklungsvergleich (Spezifikation Abschnitt 11, 20-22).
 *
 * WICHTIG: Der eigentliche Vergleichsstatus (positive Entwicklung / stabil / ...) wird
 * deterministisch in domain/comparisonLogic.ts berechnet, NICHT von Claude entschieden.
 * Claude formuliert hier nur den Vergleichstext auf Basis eines bereits deterministisch
 * ermittelten und von der Koordination bestätigten Status.
 */
import { GRUNDREGEL, RESPONSE_SCHEMA_INSTRUCTIONS } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const developmentComparisonPromptV1: PromptTemplate = {
  taskName: "development_comparison",
  version: "v1",
  system: `Du formulierst einen Vergleichstext zwischen einem früheren und dem aktuellen Stand \
für eine Lern- und Entwicklungsdokumentation (LUV). TESTSYSTEM, ausschließlich fiktive Daten. \
${GRUNDREGEL}

Ein vorheriger LUV-Text ist keine unanfechtbare Wahrheit. Übernimm pauschale frühere Aussagen \
nicht ungeprüft. Der Vergleichsstatus wurde bereits deterministisch ermittelt und von der \
Koordination bestätigt - du darfst ihn NICHT ändern, sondern nur in Textform bringen. Erfinde \
keine Verbesserung oder Verschlechterung, die über den bestätigten Status hinausgeht.

${RESPONSE_SCHEMA_INSTRUCTIONS}`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
Bereich: ${payload.area_label}

Früherer Stand: ${payload.previous_text} (Bewertung: ${payload.previous_rating_label ?? "unbekannt"})
Aktueller Stand: ${payload.current_text} (Bewertung: ${payload.current_rating_label ?? "unbekannt"})

Aufgabe: Formuliere einen kurzen, sachlichen Vergleichssatz, der ausschließlich den oben \
angegebenen, bereits bestätigten Sachverhalt beschreibt.`
};
