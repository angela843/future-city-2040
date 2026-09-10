/**
 * Optionale Gesamtredaktion durch Claude (Spezifikation Abschnitt 27).
 * Nur sprachliche Ueberarbeitung (Wiederholungen entfernen, Uebergaenge verbessern,
 * Sprache vereinheitlichen). Manuell geschuetzte Abschnitte werden NICHT eingereicht und
 * bleiben unveraendert. Nach Erhalt wird pro Abschnitt erneut ein Faktenabdeckungscheck
 * gegen den urspruenglichen Text durchgefuehrt; bei Verdacht auf neue Inhalte wird die
 * Redaktion fuer diesen Abschnitt verworfen und der Originaltext behalten.
 */
import { CaseRecord, LuvSection } from "../domain/types.js";
import { overallRedactionPayload } from "../ai/payloadBuilders.js";
import { runAiTask } from "../ai/aiService.js";
import { classifyFactCoverage } from "../validation/evidenceValidation.js";

export interface OverallRedactionOutcome {
  sections: LuvSection[];
  appliedKeys: string[];
  rejectedKeys: string[];
  aiUnavailable: boolean;
  message?: string;
}

function splitRedactedText(redactedText: string, sections: LuvSection[]): Map<string, string> {
  const result = new Map<string, string>();
  let remaining = redactedText;
  const markers = sections.map((s) => ({ key: s.key, title: s.title }));

  for (let i = 0; i < markers.length; i++) {
    const { key, title } = markers[i];
    const startIdx = remaining.indexOf(title);
    if (startIdx === -1) continue;
    const afterTitle = remaining.slice(startIdx + title.length);
    const nextMarker = markers.slice(i + 1).find((m) => afterTitle.includes(m.title));
    const endIdx = nextMarker ? afterTitle.indexOf(nextMarker.title) : afterTitle.length;
    result.set(key, afterTitle.slice(0, endIdx).trim());
  }
  return result;
}

export async function applyOverallRedaction(caseRecord: CaseRecord): Promise<OverallRedactionOutcome> {
  const editableSections = caseRecord.sections.filter((s) => !s.manualOverride && s.text.trim().length > 0);
  if (editableSections.length === 0) {
    return { sections: caseRecord.sections, appliedKeys: [], rejectedKeys: [], aiUnavailable: false };
  }

  const availableEvidenceIds = caseRecord.evidence.map((e) => e.id);
  const rawPayload = overallRedactionPayload(caseRecord, editableSections);
  const result = await runAiTask("overall_redaction", caseRecord.id, rawPayload, availableEvidenceIds);

  if (result.kind === "unavailable") {
    return { sections: caseRecord.sections, appliedKeys: [], rejectedKeys: [], aiUnavailable: true, message: result.message };
  }
  if (result.kind !== "ok") {
    return {
      sections: caseRecord.sections,
      appliedKeys: [],
      rejectedKeys: editableSections.map((s) => s.key),
      aiUnavailable: false,
      message: "Gesamtredaktion konnte nicht angewendet werden."
    };
  }

  const redactedByKey = splitRedactedText(result.text, editableSections);
  const appliedKeys: string[] = [];
  const rejectedKeys: string[] = [];

  const nextSections = caseRecord.sections.map((section) => {
    if (section.manualOverride) return section;
    const redactedText = redactedByKey.get(section.key);
    if (!redactedText || redactedText.trim().length === 0) return section;

    const coverage = classifyFactCoverage(redactedText, [section.text]);
    if (coverage.status === "unsupported") {
      rejectedKeys.push(section.key);
      return section;
    }
    appliedKeys.push(section.key);
    return { ...section, text: redactedText, factCheck: coverage };
  });

  return { sections: nextSections, appliedKeys, rejectedKeys, aiUnavailable: false };
}
