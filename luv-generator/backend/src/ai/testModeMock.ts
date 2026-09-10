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

/**
 * Deterministischer Mock fuer die semantische Faktenpruefung (Version 0.2, fact_check v2).
 * Zerlegt den zu pruefenden Text in Saetze und bewertet jeden Satz per einfachem
 * Wortabgleich gegen die verfuegbaren Belege - ausreichend fuer Demo/Testmodus, ersetzt
 * aber keine echte semantische Pruefung durch Claude im Produktivbetrieb.
 *
 * Test-Hooks (nur fuer automatisierte Tests, keine echte Fachlogik): ein Satz kann die
 * Marker "[FORCE_UNSUPPORTED]", "[FORCE_PARTIAL:<ID>]", "[FORCE_COVERED:<ID>]" oder
 * "[FORCE_FAKE_ID:<ID>]" enthalten, um einen bestimmten Evidenzstatus deterministisch zu
 * erzwingen (z.B. um eine erfundene, nicht existierende Evidence-ID zu simulieren).
 */
function generateFactCheckMock(payload: Record<string, unknown>): unknown {
  const text = String(payload.text ?? "");
  const availableEvidence = Array.isArray(payload.available_evidence)
    ? (payload.available_evidence as Array<{ id?: string; note?: string }>)
    : [];

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) {
    return { status: "ok", text: "[]", evidence_ids: [], warnings: [] };
  }

  const claims = sentences.map((sentence) => {
    const forceUnsupported = /\[FORCE_UNSUPPORTED\]/.exec(sentence);
    const forcePartial = /\[FORCE_PARTIAL:([A-Z0-9_]+)\]/.exec(sentence);
    const forceCovered = /\[FORCE_COVERED:([A-Z0-9_]+)\]/.exec(sentence);
    const forceFakeId = /\[FORCE_FAKE_ID:([A-Z0-9_]+)\]/.exec(sentence);
    const cleanText = sentence.replace(/\[FORCE_[A-Z_]+(:[A-Z0-9_]+)?\]/g, "").trim();

    if (forceUnsupported) return { text: cleanText, status: "unsupported", evidence_ids: [] };
    if (forcePartial) return { text: cleanText, status: "partially_covered", evidence_ids: [forcePartial[1]] };
    if (forceCovered) return { text: cleanText, status: "covered", evidence_ids: [forceCovered[1]] };
    if (forceFakeId) return { text: cleanText, status: "covered", evidence_ids: [forceFakeId[1]] };

    const sentenceWords = sentence
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    let bestId: string | null = null;
    let bestOverlap = 0;
    for (const ev of availableEvidence) {
      const note = String(ev.note ?? "").toLowerCase();
      const overlap = sentenceWords.filter((w) => note.includes(w)).length;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestId = ev.id ?? null;
      }
    }
    if (!bestId || bestOverlap === 0) return { text: cleanText, status: "unsupported", evidence_ids: [] };
    if (bestOverlap >= 2) return { text: cleanText, status: "covered", evidence_ids: [bestId] };
    return { text: cleanText, status: "partially_covered", evidence_ids: [bestId] };
  });

  return { status: "ok", text: JSON.stringify(claims), evidence_ids: [], warnings: [] };
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
      return generateFactCheckMock(payload);
    }

    default:
      return { status: "insufficient_data", text: "", questions: ["Unbekannte Aufgabe."] };
  }
}
