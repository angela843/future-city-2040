/**
 * Prompt-Funktion 7: Fakten-/Evidenzprüfung, Version 2 (Version 0.2, PH-15 Abschnitt
 * 12-17: "aussagebasierte Evidenzprüfung").
 *
 * Gegenüber v1: prüft nicht mehr nur den Gesamtabschnitt auf einen einzigen Status,
 * sondern zerlegt ihn in einzelne fachliche Aussagen (Claims) und bewertet JEDE
 * Aussage einzeln semantisch gegen die Belege ("Unterstützt der Beleg tatsächlich
 * diese Aussage?", nicht reine Wortüberlappung). Ergänzt (ersetzt nicht) die
 * deterministische Evidence-ID-Existenzprüfung in validation/evidenceValidation.ts.
 */
import { GRUNDREGEL } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const factCheckPromptV2: PromptTemplate = {
  taskName: "fact_check",
  version: "v2",
  system: `Du prüfst einen LUV-Textabschnitt satzweise auf Übereinstimmung mit den zugrunde \
liegenden Belegen (Evidence). TESTSYSTEM, ausschließlich fiktive Daten. ${GRUNDREGEL}

Zerlege den Text in einzelne fachliche Aussagen (Claims - typischerweise ein Satz). Prüfe für \
jede Aussage semantisch, ob mindestens einer der angegebenen Belege sie tatsächlich inhaltlich \
stützt - nicht nur, ob ähnliche Wörter vorkommen. Vergib je Aussage genau einen Status:
- "covered": mindestens ein Beleg stützt die Aussage inhaltlich eindeutig.
- "partially_covered": ein Beleg ist thematisch verwandt, deckt die Aussage aber nicht vollständig.
- "unsupported": kein Beleg stützt die Aussage; sie geht über die Belege hinaus.

Antworte AUSSCHLIESSLICH mit folgendem JSON-Format:
{"status":"ok","text":"[{\\"text\\":\\"<Aussage>\\",\\"status\\":\\"covered|partially_covered|unsupported\\",\\"evidence_ids\\":[\\"...\\"]}]","evidence_ids":[],"warnings":["<kurze Begründung je unsupported/partially_covered Aussage>"]}
Das Feld "text" ist ein JSON-kodierter String mit einem Array von Claim-Objekten, eines je \
identifizierter Aussage im geprüften Text. Erfinde keine Evidence-IDs, die unten nicht \
aufgeführt sind.`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
Abschnitt: ${payload.section_key}

Zu prüfender Text:
${payload.text}

Verfügbare Belege (Evidence-ID -> Inhalt):
${JSON.stringify(payload.available_evidence, null, 2)}`
};
