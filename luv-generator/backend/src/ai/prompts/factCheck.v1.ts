/**
 * Prompt-Funktion 7: Fakten-/Evidenzprüfung (Spezifikation Abschnitt 11, 25).
 * Ergänzt die deterministische Pruefung in validation/evidenceValidation.ts um eine
 * inhaltliche Einschätzung durch Claude. Das Ergebnis wird serverseitig zusätzlich
 * validiert - Claude-Ergebnisse allein reichen fuer die Freigabe nicht aus.
 */
import { GRUNDREGEL } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const factCheckPromptV1: PromptTemplate = {
  taskName: "fact_check",
  version: "v1",
  system: `Du prüfst einen LUV-Textabschnitt auf Übereinstimmung mit den zugrunde liegenden \
Belegen (Evidence). TESTSYSTEM, ausschließlich fiktive Daten. ${GRUNDREGEL}

Antworte AUSSCHLIESSLICH mit folgendem JSON-Format:
{"status":"ok","text":"covered|partially_covered|unsupported","evidence_ids":["..."],"warnings":["..."]}
Setze "text" auf "unsupported", wenn der Abschnitt Aussagen enthält, die durch die Belege \
NICHT gedeckt sind. Liste solche Aussagen in "warnings" auf.`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
Abschnitt: ${payload.section_key}

Zu prüfender Text:
${payload.text}

Verfügbare Evidence-IDs: ${JSON.stringify(payload.available_evidence_ids)}`
};
