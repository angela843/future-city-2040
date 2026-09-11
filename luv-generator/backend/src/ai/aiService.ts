/**
 * Orchestriert einen vollstaendigen KI-Aufruf entlang der geforderten Architektur:
 * Domain-Payload -> Privacy Gateway -> Prompt Builder -> Claude API -> Validation Layer.
 */
import { AiTaskType } from "../privacy/allowlist.js";
import { runPrivacyGateway } from "../privacy/gateway.js";
import { buildPrompt } from "./promptBuilder.js";
import { callClaude, ClaudeUnavailableError } from "./claudeClient.js";
import { validateClaudeResponse } from "../validation/schema.js";
import { checkEvidenceIdsExist } from "../validation/evidenceValidation.js";

export type AiServiceResult =
  | { kind: "ok"; text: string; evidenceIds: string[]; warnings: string[]; promptVersion: string }
  | { kind: "insufficient_data"; questions: string[] }
  | { kind: "conflict"; conflicts: string[] }
  | { kind: "blocked_privacy"; reason: string; matchedTerms?: string[] }
  | { kind: "invalid_schema"; message: string }
  | { kind: "unavailable"; message: string };

export async function runAiTask(
  task: AiTaskType,
  caseId: string,
  rawPayload: Record<string, unknown>,
  availableEvidenceIds: string[],
  knownIdentifierValues: string[] = []
): Promise<AiServiceResult> {
  const gatewayResult = runPrivacyGateway(task, caseId, rawPayload, knownIdentifierValues);
  if (!gatewayResult.ok || !gatewayResult.sanitizedPayload) {
    if (gatewayResult.blockedReason === "sensitive_data_check_required") {
      return {
        kind: "blocked_privacy",
        reason: "Datenschutzprüfung erforderlich",
        matchedTerms: gatewayResult.matchedSensitiveTerms
      };
    }
    if (gatewayResult.blockedReason === "unresolved_identifier_in_freetext") {
      return {
        kind: "blocked_privacy",
        reason:
          "Der Text enthält ein Muster, das nicht sicher datensparsam übertragen werden kann (z. B. eine E-Mail-Adresse), und wurde deshalb nicht an Claude gesendet."
      };
    }
    return { kind: "blocked_privacy", reason: "Keine ausreichenden Daten für eine KI-Anfrage." };
  }

  const prompt = buildPrompt(task, gatewayResult.sanitizedPayload);

  let callResult;
  try {
    callResult = await callClaude(task, prompt, gatewayResult.sanitizedPayload);
  } catch (error) {
    if (error instanceof ClaudeUnavailableError) {
      return { kind: "unavailable", message: error.message };
    }
    return { kind: "unavailable", message: "Die KI-Anfrage konnte nicht verarbeitet werden." };
  }

  const validation = validateClaudeResponse(callResult.raw);
  if (!validation.valid || !validation.data) {
    return { kind: "invalid_schema", message: validation.error ?? "Antwort konnte nicht sicher verarbeitet werden." };
  }

  const data = validation.data;
  if (data.status === "insufficient_data") {
    return { kind: "insufficient_data", questions: data.questions };
  }
  if (data.status === "conflict") {
    return { kind: "conflict", conflicts: data.conflicts };
  }

  // status === "ok"
  const evidenceCheck = checkEvidenceIdsExist(data.evidence_ids, availableEvidenceIds);
  const warnings = [...data.warnings];
  let evidenceIds = data.evidence_ids;
  if (!evidenceCheck.valid) {
    warnings.push(
      `Nicht existierende Evidence-IDs wurden entfernt: ${evidenceCheck.unknownIds.join(", ")}`
    );
    evidenceIds = data.evidence_ids.filter((id) => !evidenceCheck.unknownIds.includes(id));
  }

  return { kind: "ok", text: data.text, evidenceIds, warnings, promptVersion: prompt.version };
}
