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
import { runSemanticFactCheck } from "../validation/semanticFactCheck.js";

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

  const nextSections: LuvSection[] = [];
  for (const section of caseRecord.sections) {
    if (section.manualOverride) {
      nextSections.push(section);
      continue;
    }
    const redactedText = redactedByKey.get(section.key);
    if (!redactedText || redactedText.trim().length === 0) {
      nextSections.push(section);
      continue;
    }

    // Erneute Faktenpruefung nach der sprachlichen Ueberarbeitung (Version 0.2,
    // PH-15 Abschnitt 42: "Nach Kuerzung erneute Evidenzpruefung" - gilt analog fuer
    // jede nachtraegliche sprachliche Veraenderung durch Claude).
    const coverage = await runSemanticFactCheck(caseRecord.id, section.key, redactedText, caseRecord.evidence, [section.text]);
    if (coverage.status === "unsupported") {
      rejectedKeys.push(section.key);
      nextSections.push(section);
      continue;
    }
    appliedKeys.push(section.key);
    nextSections.push({ ...section, text: redactedText, factCheck: coverage });
  }

  return { sections: nextSections, appliedKeys, rejectedKeys, aiUnavailable: false };
}
