/**
 * Baut fuer jede KI-Aufgabe einen bereits minimalen Payload (Spezifikation Abschnitt 10:
 * "Sende Claude nur die Informationen, die es fuer die jeweilige Aufgabe benoetigt").
 * Direkte Identifikatoren (Name, Geburtsdatum) werden hier bewusst NICHT eingefuegt.
 * Der Privacy Gateway (privacy/gateway.ts) prueft dies zusaetzlich als zweite Absicherung.
 */
import {
  CaseRecord,
  CompetenceRating,
  EvidenceItem,
  LuvSection,
  SupportAreaCandidate,
  SupportGoal
} from "../domain/types.js";

export interface FormulateSectionNoteInput {
  label: string;
  rating: CompetenceRating;
  observationNotes: string;
  evidenceIds: string[];
}

export function structureNotesPayload(areaLabel: string, rawNotes: string, sourceTypes: string[]) {
  return { area_label: areaLabel, raw_notes: rawNotes, source_types: sourceTypes };
}

export function formulateSectionPayload(
  caseRecord: CaseRecord,
  sectionKey: LuvSection["key"],
  areaLabel: string,
  subCompetences: FormulateSectionNoteInput[],
  evidence: EvidenceItem[]
) {
  const evidenceById = new Map(evidence.map((e) => [e.id, e]));

  return {
    luv_art: caseRecord.baseData.luvArt,
    section_key: sectionKey,
    area_label: areaLabel,
    sub_competences: subCompetences.map((sc) => {
      const linkedEvidence = sc.evidenceIds.map((id) => evidenceById.get(id)).filter((e): e is EvidenceItem => !!e);
      const onlySelfAssessment =
        linkedEvidence.length > 0 && linkedEvidence.every((e) => e.source === "selbsteinschaetzung");
      return {
        label: sc.label,
        rating: sc.rating,
        observationNotes: sc.observationNotes,
        evidenceIds: sc.evidenceIds,
        onlySelfAssessment
      };
    }),
    evidence: evidence.map((e) => ({ id: e.id, source: e.source, note: e.note }))
  };
}

export function supportGoalsPayload(caseRecord: CaseRecord, confirmedAreas: SupportAreaCandidate[]) {
  return {
    luv_art: caseRecord.baseData.luvArt,
    confirmed_support_areas: confirmedAreas.map((a) => ({ label: a.label, triggerLevel: a.triggerLevel }))
  };
}

export function measuresPayload(caseRecord: CaseRecord, confirmedGoals: SupportGoal[]) {
  return {
    luv_art: caseRecord.baseData.luvArt,
    confirmed_goals: confirmedGoals.map((g) => ({
      bereich: g.bereich,
      ausgangslage: g.ausgangslage,
      ziel: g.ziel
    }))
  };
}

export function developmentComparisonPayload(
  areaLabel: string,
  previousText: string,
  currentText: string,
  previousRatingLabel: string | null,
  currentRatingLabel: string | null
) {
  return {
    area_label: areaLabel,
    previous_text: previousText,
    current_text: currentText,
    previous_rating_label: previousRatingLabel,
    current_rating_label: currentRatingLabel
  };
}

export function overallRedactionPayload(caseRecord: CaseRecord, sections: LuvSection[]) {
  return {
    luv_art: caseRecord.baseData.luvArt,
    sections: sections.map((s) => ({ key: s.key, title: s.title, text: s.text }))
  };
}

export function factCheckPayload(sectionKey: string, text: string, availableEvidenceIds: string[]) {
  return { section_key: sectionKey, text, available_evidence_ids: availableEvidenceIds };
}
