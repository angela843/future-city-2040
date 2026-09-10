/**
 * Deterministischer Mock fuer Claude-Antworten.
 *
 * Wird verwendet, wenn LUV_TEST_MODE=true (kein API-Key noetig, fuer Demo/Entwicklung)
 * sowie direkt in den automatisierten Tests (Abschnitt 38/39). Bildet die in der
 * Spezifikation geforderten Grundregeln (12, 14, 15, 16) nach, damit das System auch
 * ohne echten Claude-Zugang sinnvoll demonstriert und getestet werden kann.
 */
import { AiTaskType } from "../privacy/allowlist.js";

const VAGUE_PATTERNS = [
  /^[a-zäöüß]+\s*(schlecht|gut|mittel)\.?$/i,
  /^(sehr\s+)?(schlecht|gut|mittel)\.?$/i
];

const PAUSCHAL_TRAITS = ["faul", "unmotiviert", "fleißig", "schwierig", "anstrengend", "bequem"];

function containsVagueOnly(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  return VAGUE_PATTERNS.some((p) => p.test(trimmed));
}

function containsPauschalTrait(text: string): string | null {
  const lower = text.toLowerCase();
  return PAUSCHAL_TRAITS.find((t) => lower.includes(t)) ?? null;
}

function extractInputText(payload: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof payload.raw_notes === "string") parts.push(payload.raw_notes);
  if (Array.isArray(payload.sub_competences)) {
    for (const sc of payload.sub_competences as Array<Record<string, unknown>>) {
      if (typeof sc.observationNotes === "string") parts.push(sc.observationNotes);
    }
  }
  if (typeof payload.current_text === "string") parts.push(payload.current_text);
  return parts.join(" ");
}

function collectEvidenceIds(payload: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  if (Array.isArray(payload.sub_competences)) {
    for (const sc of payload.sub_competences as Array<Record<string, unknown>>) {
      if (Array.isArray(sc.evidenceIds)) {
        (sc.evidenceIds as string[]).forEach((id) => ids.add(id));
      }
    }
  }
  return Array.from(ids);
}

function isSelfAssessmentOnly(payload: Record<string, unknown>): boolean {
  if (!Array.isArray(payload.sub_competences)) return false;
  const entries = payload.sub_competences as Array<Record<string, unknown>>;
  if (entries.length === 0) return false;
  return entries.every((sc) => sc.source === "selbsteinschaetzung" || sc.onlySelfAssessment === true);
}

export function generateMockResponse(task: AiTaskType, payload: Record<string, unknown>): unknown {
  switch (task) {
    case "structure_notes": {
      const text = String(payload.raw_notes ?? "");
      if (containsVagueOnly(text)) {
        return {
          status: "insufficient_data",
          text: "",
          questions: ["Welche konkreten Aufgaben oder Situationen wurden beobachtet?"]
        };
      }
      return {
        status: "ok",
        text: text
          .split(/\n|\.\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `- ${s}`)
          .join("\n"),
        evidence_ids: [],
        warnings: []
      };
    }

    case "formulate_section": {
      const inputText = extractInputText(payload);
      const trait = containsPauschalTrait(inputText);
      if (trait) {
        return {
          status: "insufficient_data",
          text: "",
          questions: ["Bitte beschreiben Sie das beobachtbare Verhalten konkret."]
        };
      }
      if (containsVagueOnly(inputText)) {
        return {
          status: "insufficient_data",
          text: "",
          questions: [
            "Welche konkreten Bereiche wurden getestet oder beobachtet? Bitte konkrete Beispiele angeben."
          ]
        };
      }
      const evidenceIds = collectEvidenceIds(payload);
      if (isSelfAssessmentOnly(payload)) {
        return {
          status: "ok",
          text: `Die teilnehmende Person schätzt sich im Bereich ${payload.area_label} selbst positiv ein.`,
          evidence_ids: evidenceIds,
          warnings: []
        };
      }
      return {
        status: "ok",
        text: `Im Bereich ${payload.area_label} zeigten sich im Beurteilungszeitraum folgende Beobachtungen: ${inputText.trim()}`,
        evidence_ids: evidenceIds,
        warnings: []
      };
    }

    case "support_goal_suggestions": {
      const areas = Array.isArray(payload.confirmed_support_areas)
        ? (payload.confirmed_support_areas as Array<Record<string, unknown>>)
        : [];
      if (areas.length === 0) {
        return { status: "insufficient_data", text: "", questions: ["Welche Förderbereiche sind bestätigt?"] };
      }
      const goals = areas.slice(0, 3).map((area) => ({
        bereich: area.label,
        ausgangslage: `Aktueller Stand im Bereich ${area.label} zeigt Entwicklungsbedarf.`,
        ziel: `Verbesserung der Kompetenzen im Bereich ${area.label} im weiteren Maßnahmenverlauf.`,
        massnahme: `Gezielte Übungseinheiten und Rückmeldung im Bereich ${area.label}.`,
        ueberpruefungskriterium: `Beobachtbare Verbesserung wird in der nächsten LUV-Erhebung überprüft.`
      }));
      return { status: "ok", text: JSON.stringify(goals), evidence_ids: [], warnings: [] };
    }

    case "measure_suggestions": {
      const goals = Array.isArray(payload.confirmed_goals)
        ? (payload.confirmed_goals as Array<Record<string, unknown>>)
        : [];
      if (goals.length === 0) {
        return { status: "insufficient_data", text: "", questions: ["Welche Förderziele sind bestätigt?"] };
      }
      const lines = goals.map((g) => `Regelmäßige Förderung im Bereich ${g.bereich} mit konkreter Rückmeldung.`);
      return { status: "ok", text: lines.join("\n"), evidence_ids: [], warnings: [] };
    }

    case "development_comparison": {
      return {
        status: "ok",
        text: `Im Bereich ${payload.area_label} ergibt sich im Vergleich zum vorherigen Stand: ${payload.previous_rating_label ?? "unbekannt"} -> ${payload.current_rating_label ?? "unbekannt"}.`,
        evidence_ids: [],
        warnings: []
      };
    }

    case "overall_redaction": {
      const sections = Array.isArray(payload.sections) ? (payload.sections as Array<Record<string, unknown>>) : [];
      const text = sections.map((s) => `${s.title}\n${s.text}`).join("\n\n");
      return { status: "ok", text, evidence_ids: [], warnings: [] };
    }

    case "fact_check": {
      return { status: "ok", text: "covered", evidence_ids: payload.available_evidence_ids ?? [], warnings: [] };
    }

    default:
      return { status: "insufficient_data", text: "", questions: ["Unbekannte Aufgabe."] };
  }
}
