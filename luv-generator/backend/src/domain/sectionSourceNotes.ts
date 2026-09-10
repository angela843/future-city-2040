/**
 * Stellt fuer jeden LUV-Abschnitt, der ueber die generische "Fachabschnitt formulieren"-
 * Aufgabe erzeugt wird, die zugrunde liegenden (bereits bestaetigten) Rohdaten in einer
 * einheitlichen Zeilenform bereit. Dient ausschliesslich der Datenzusammenstellung -
 * keine Bewertung, keine KI-Beteiligung an dieser Stelle.
 */
import { AREA_LABELS, AREA_TO_SECTION_KEY } from "./labels.js";
import { CaseRecord, CompetenceArea, LuvSection, SubCompetence } from "./types.js";

export interface SourceNoteRow {
  label: string;
  rating: SubCompetence["rating"];
  observationNotes: string;
  evidenceIds: string[];
}

const SECTION_TO_AREA: Partial<Record<LuvSection["key"], CompetenceArea>> = Object.fromEntries(
  Object.entries(AREA_TO_SECTION_KEY).map(([area, sectionKey]) => [sectionKey, area as CompetenceArea])
);

export function sourceNotesForSection(caseRecord: CaseRecord, key: LuvSection["key"]): SourceNoteRow[] {
  const area = SECTION_TO_AREA[key];
  if (area) {
    return caseRecord.subCompetences
      .filter((sc) => sc.area === area)
      .map((sc) => ({
        label: sc.label,
        rating: sc.rating,
        observationNotes: sc.observationNotes,
        evidenceIds: sc.evidenceIds
      }));
  }

  switch (key) {
    case "initial_situation":
      return [
        { label: "Schulabschluss", rating: "nicht_relevant" as const, observationNotes: caseRecord.startingSituation.schulabschluss, evidenceIds: [] },
        { label: "Berufliche Vorerfahrung", rating: "nicht_relevant" as const, observationNotes: caseRecord.startingSituation.beruflicheVorerfahrung, evidenceIds: [] },
        { label: "Bisherige Praktika", rating: "nicht_relevant" as const, observationNotes: caseRecord.startingSituation.bisherigePraktika, evidenceIds: [] },
        { label: "Ausgangssituation", rating: "nicht_relevant" as const, observationNotes: caseRecord.startingSituation.ausgangssituation, evidenceIds: [] }
      ].filter((r) => r.observationNotes.trim().length > 0);

    case "career_orientation":
      return [
        { label: "Berufswunsch", rating: "nicht_relevant" as const, observationNotes: caseRecord.career.berufswunsch, evidenceIds: [] },
        { label: "Alternativen", rating: "nicht_relevant" as const, observationNotes: caseRecord.career.alternativen, evidenceIds: [] },
        { label: "Orientierungsstatus", rating: "nicht_relevant" as const, observationNotes: caseRecord.career.orientierungsstatus, evidenceIds: [] },
        { label: "Erprobte Berufsfelder", rating: "nicht_relevant" as const, observationNotes: caseRecord.career.erprobteBerufsfelder, evidenceIds: [] },
        { label: "Praktikumserkenntnisse", rating: "nicht_relevant" as const, observationNotes: caseRecord.career.praktikumserkenntnisse, evidenceIds: [] }
      ].filter((r) => r.observationNotes.trim().length > 0);

    case "support_needs":
      return caseRecord.supportAreaCandidates
        .filter((a) => a.status === "confirmed")
        .map((a) => {
          const sub = caseRecord.subCompetences.find((sc) => sc.id === a.subCompetenceId);
          return {
            label: a.label,
            rating: sub?.rating ?? "foerderbedarf",
            observationNotes: sub?.observationNotes ?? "",
            evidenceIds: sub?.evidenceIds ?? []
          };
        });

    case "perspective":
      return [
        { label: "Selbsteinschätzung", rating: "nicht_relevant" as const, observationNotes: caseRecord.further.selbsteinschaetzung, evidenceIds: [] },
        { label: "Weitere Beobachtungen", rating: "nicht_relevant" as const, observationNotes: caseRecord.further.weitereBeobachtungen, evidenceIds: [] },
        { label: "Freitext", rating: "nicht_relevant" as const, observationNotes: caseRecord.further.freitext, evidenceIds: [] },
        { label: "Beruflicher Orientierungsstatus", rating: "nicht_relevant" as const, observationNotes: caseRecord.career.orientierungsstatus, evidenceIds: [] }
      ].filter((r) => r.observationNotes.trim().length > 0);

    case "overall_assessment":
      return caseRecord.sections
        .filter((s) => s.key !== "overall_assessment" && s.text.trim().length > 0)
        .map((s) => ({ label: s.title, rating: "nicht_relevant" as const, observationNotes: s.text, evidenceIds: s.evidenceIds }));

    default:
      return [];
  }
}

export function areaLabelForSection(key: LuvSection["key"]): string {
  const area = SECTION_TO_AREA[key];
  if (area) return AREA_LABELS[area];
  const fallback: Partial<Record<LuvSection["key"], string>> = {
    initial_situation: "Ausgangslage",
    career_orientation: "Berufliche Orientierung",
    support_needs: "Förderbedarf",
    perspective: "Ausblick / Perspektive",
    overall_assessment: "Gesamtbeurteilung"
  };
  return fallback[key] ?? key;
}
