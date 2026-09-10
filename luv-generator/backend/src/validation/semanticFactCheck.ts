/**
 * Semantische Faktenprüfung (Version 0.2, PH-15 Abschnitt 12-17).
 *
 * Orchestriert den "fact_check"-Prompt (aussagebasiert, semantisch) als primäre
 * Faktenabsicherung. Faellt auf die einfache Wortueberlappungs-Heuristik aus
 * Version 0.1 zurueck, wenn die KI nicht verfuegbar ist oder eine ungueltige Antwort
 * liefert (PH-15 §17: Heuristik nur noch als technische Zusatzpruefung/Fallback).
 * Erfundene Evidence-IDs werden IMMER technisch blockiert (PH-15 §16), unabhaengig
 * vom Claude-Ergebnis.
 */
import { EvidenceItem, FactCheckResult, FactClaim, EvidenceStatus } from "../domain/types.js";
import { runAiTask } from "../ai/aiService.js";
import { factCheckPayload } from "../ai/payloadBuilders.js";
import { checkEvidenceIdsExist, classifyFactCoverage } from "./evidenceValidation.js";

interface RawClaim {
  text?: unknown;
  status?: unknown;
  evidence_ids?: unknown;
}

function worstStatus(statuses: EvidenceStatus[]): EvidenceStatus {
  if (statuses.length === 0) return "needs_review";
  if (statuses.includes("unsupported")) return "unsupported";
  if (statuses.includes("needs_review")) return "needs_review";
  if (statuses.includes("partially_covered")) return "partially_covered";
  return "covered";
}

function isValidClaimStatus(status: unknown): status is EvidenceStatus {
  return status === "covered" || status === "partially_covered" || status === "unsupported";
}

export async function runSemanticFactCheck(
  caseId: string,
  sectionKey: string,
  text: string,
  availableEvidence: EvidenceItem[],
  fallbackSourceNotes: string[]
): Promise<FactCheckResult> {
  const availableIds = availableEvidence.map((e) => e.id);
  const payload = factCheckPayload(sectionKey, text, availableEvidence);
  const result = await runAiTask("fact_check", caseId, payload, availableIds);

  if (result.kind === "ok") {
    let rawClaims: RawClaim[];
    try {
      const parsed = JSON.parse(result.text);
      rawClaims = Array.isArray(parsed) ? parsed : [];
    } catch {
      rawClaims = [];
    }

    if (rawClaims.length > 0) {
      const claims: FactClaim[] = [];
      const details: string[] = [];

      for (const raw of rawClaims) {
        const claimText = typeof raw.text === "string" ? raw.text : "";
        const rawEvidenceIds = Array.isArray(raw.evidence_ids)
          ? raw.evidence_ids.filter((id): id is string => typeof id === "string")
          : [];
        // PH-15 §16: erfundene Evidence-IDs werden technisch blockiert, unabhaengig
        // davon, was Claude als Status angibt.
        const evidenceCheck = checkEvidenceIdsExist(rawEvidenceIds, availableIds);
        const evidenceIds = rawEvidenceIds.filter((id) => !evidenceCheck.unknownIds.includes(id));

        let status: EvidenceStatus = isValidClaimStatus(raw.status) ? raw.status : "needs_review";
        // Eine Evidence-ID allein reicht nicht, wenn keine gueltige IDs mehr uebrig sind,
        // aber Claude "covered" behauptet hat - dann gilt die Aussage als ungedeckt.
        if (!evidenceCheck.valid && evidenceIds.length === 0 && status === "covered") {
          status = "unsupported";
          details.push(`Von Claude referenzierte Evidence-ID(s) existieren nicht: ${evidenceCheck.unknownIds.join(", ")}`);
        }

        claims.push({ text: claimText, status, evidenceIds });
      }

      const overall = worstStatus(claims.map((c) => c.status));
      return { status: overall, details, claims, method: "semantic" };
    }
  }

  // Fallback: KI nicht verfuegbar, ungueltige Antwort oder leere Claim-Liste ->
  // Wortueberlappungs-Heuristik als technische Zusatzpruefung (PH-15 §17).
  return classifyFactCoverage(text, fallbackSourceNotes);
}
