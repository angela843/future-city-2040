/**
 * Faktenvalidierung nach jeder wichtigen Claude-Generierung (Spezifikation Abschnitt 25).
 * Prueft, ob referenzierte evidence_ids tatsaechlich existieren, und fuehrt einen
 * einfachen, deterministischen Faktenabdeckungscheck durch.
 */
import { FactCheckResult } from "../domain/types.js";

export interface EvidenceIdCheckResult {
  valid: boolean;
  unknownIds: string[];
}

export function checkEvidenceIdsExist(
  referencedIds: string[],
  availableIds: string[]
): EvidenceIdCheckResult {
  const availableSet = new Set(availableIds);
  const unknownIds = referencedIds.filter((id) => !availableSet.has(id));
  return { valid: unknownIds.length === 0, unknownIds };
}

/**
 * Sehr einfacher, deterministischer Ueberdeckungs-Heuristik-Check: prueft, ob
 * zentrale Woerter aus den zugrunde liegenden Beobachtungsnotizen im generierten
 * Text wiederzufinden sind. Dies ersetzt KEINE fachliche Pruefung durch die
 * Koordination, sondern dient als zusaetzliche technische Absicherung gegen
 * frei erfundene Inhalte.
 *
 * TODO: fachlich abgleichen - fuer Version 0.2 durch praezisere NLP-basierte
 * Abdeckungspruefung ersetzen.
 */
export function classifyFactCoverage(generatedText: string, sourceNotes: string[]): FactCheckResult {
  const normalizedText = normalize(generatedText);
  const sourceTokens = new Set(
    sourceNotes
      .flatMap((note) => normalize(note).split(" "))
      .filter((token) => token.length >= 4)
  );

  if (sourceTokens.size === 0) {
    return { status: "unsupported", details: ["Keine Quellstichpunkte vorhanden."] };
  }

  let covered = 0;
  const missingHintWords: string[] = [];
  for (const token of sourceTokens) {
    if (normalizedText.includes(token)) {
      covered += 1;
    }
  }
  const ratio = covered / sourceTokens.size;

  if (ratio >= 0.5) {
    return { status: "covered", details: [] };
  }
  if (ratio >= 0.2) {
    return {
      status: "partially_covered",
      details: ["Nicht alle Quellstichpunkte sind im generierten Text erkennbar wiedergegeben."]
    };
  }
  return {
    status: "unsupported",
    details: ["Generierter Text laesst sich kaum auf die Quellstichpunkte zurueckfuehren."]
  };
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9äöüß\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
