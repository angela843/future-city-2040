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
 * Seit Version 0.2 (PH-15 Abschnitt 17) ist dies NICHT mehr die primaere
 * Faktenabsicherung, sondern nur noch eine technische Zusatzpruefung/Fallback,
 * falls die semantische Pruefung (validation/semanticFactCheck.ts) nicht verfuegbar
 * ist. Primaer soll die semantische Pruefung per Claude-Fact-Check-Aufruf erfolgen.
 *
 * TODO: fachlich abgleichen - Schwellenwerte (0.5/0.2) sind technisch gesetzt, nicht
 * fachlich abgenommen.
 */
export function classifyFactCoverage(generatedText: string, sourceNotes: string[]): FactCheckResult {
  const normalizedText = normalize(generatedText);
  const sourceTokens = new Set(
    sourceNotes
      .flatMap((note) => normalize(note).split(" "))
      .filter((token) => token.length >= 4)
  );

  if (sourceTokens.size === 0) {
    return { status: "unsupported", details: ["Keine Quellstichpunkte vorhanden."], method: "heuristic" };
  }

  let covered = 0;
  for (const token of sourceTokens) {
    if (normalizedText.includes(token)) {
      covered += 1;
    }
  }
  const ratio = covered / sourceTokens.size;

  if (ratio >= 0.5) {
    return { status: "covered", details: [], method: "heuristic" };
  }
  if (ratio >= 0.2) {
    return {
      status: "partially_covered",
      details: ["Nicht alle Quellstichpunkte sind im generierten Text erkennbar wiedergegeben."],
      method: "heuristic"
    };
  }
  return {
    status: "unsupported",
    details: ["Generierter Text laesst sich kaum auf die Quellstichpunkte zurueckfuehren."],
    method: "heuristic"
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
