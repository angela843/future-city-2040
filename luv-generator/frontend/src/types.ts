export type LuvArt = "start" | "verlauf" | "abschluss";

export type CompetenceRating =
  | "staerke"
  | "ueberwiegend_sicher"
  | "teilweise_sicher"
  | "foerderbedarf"
  | "deutlicher_foerderbedarf"
  | "nicht_erhoben"
  | "nicht_beurteilbar"
  | "nicht_relevant";

export const RATING_LABELS: Record<CompetenceRating, string> = {
  staerke: "Stärke",
  ueberwiegend_sicher: "Überwiegend sicher",
  teilweise_sicher: "Teilweise sicher",
  foerderbedarf: "Förderbedarf",
  deutlicher_foerderbedarf: "Deutlicher Förderbedarf",
  nicht_erhoben: "Nicht erhoben",
  nicht_beurteilbar: "Nicht beurteilbar",
  nicht_relevant: "Nicht relevant"
};

export type EvidenceSource =
  | "kompetenzfeststellung"
  | "unterricht"
  | "praktische_aufgabe"
  | "beobachtung"
  | "praktikum"
  | "betriebliche_erprobung"
  | "gespraech"
  | "selbsteinschaetzung"
  | "rueckmeldung_dritter"
  | "vorhandene_dokumentation";

export const SOURCE_LABELS: Record<EvidenceSource, string> = {
  kompetenzfeststellung: "Kompetenzfeststellung",
  unterricht: "Unterricht",
  praktische_aufgabe: "Praktische Aufgabe",
  beobachtung: "Beobachtung",
  praktikum: "Praktikum",
  betriebliche_erprobung: "Betriebliche Erprobung",
  gespraech: "Gespräch",
  selbsteinschaetzung: "Selbsteinschätzung",
  rueckmeldung_dritter: "Rückmeldung Dritter",
  vorhandene_dokumentation: "Vorhandene Dokumentation"
};

export const COMPETENCE_AREAS = [
  "schulische_grundkompetenzen",
  "digitale_kompetenzen",
  "personale_kompetenzen",
  "sozial_kommunikative_kompetenzen",
  "methodische_kompetenzen",
  "berufliche_orientierung_praxis"
] as const;
export type CompetenceArea = (typeof COMPETENCE_AREAS)[number];

export const AREA_LABELS: Record<CompetenceArea, string> = {
  schulische_grundkompetenzen: "Schulische Grundkompetenzen",
  digitale_kompetenzen: "Digitale Kompetenzen",
  personale_kompetenzen: "Personale Kompetenzen",
  sozial_kommunikative_kompetenzen: "Sozial-kommunikative Kompetenzen",
  methodische_kompetenzen: "Methodische Kompetenzen",
  berufliche_orientierung_praxis: "Berufliche Orientierung und Praxis"
};

export interface EvidenceItem {
  id: string;
  source: EvidenceSource;
  note: string;
  createdAt: string;
}

export interface SubCompetence {
  id: string;
  area: CompetenceArea;
  label: string;
  rating: CompetenceRating;
  observationNotes: string;
  evidenceIds: string[];
  catalogId?: string;
  relevantForLuv: boolean;
}

export type SupportAreaStatus = "pending" | "confirmed" | "rejected";

export interface SupportAreaCandidate {
  id: string;
  subCompetenceId: string;
  area: CompetenceArea;
  label: string;
  triggerLevel: "development" | "support" | "priority";
  status: SupportAreaStatus;
}

export type GoalStatus = "vorschlag" | "uebernommen" | "bearbeitet" | "neu_formuliert" | "verworfen";

/** A = aktuell zentral, B = relevant, C = beobachten. Erscheint NIE im LUV-Text. */
export type GoalPriority = "A" | "B" | "C";
export type MeasureSource = "bibliothek" | "ki_vorschlag" | "manuell";
export type GoalCompletionStatus =
  | "erreicht"
  | "teilweise_erreicht"
  | "weiterhin_aktuell"
  | "angepasst"
  | "nicht_erreicht"
  | "nicht_mehr_relevant";

export const COMPLETION_STATUS_LABELS: Record<GoalCompletionStatus, string> = {
  erreicht: "Erreicht",
  teilweise_erreicht: "Teilweise erreicht",
  weiterhin_aktuell: "Weiterhin aktuell",
  angepasst: "Angepasst / weiterentwickelt",
  nicht_erreicht: "Nicht erreicht",
  nicht_mehr_relevant: "Nicht mehr relevant"
};

export interface SupportGoal {
  id: string;
  supportAreaId: string;
  bereich: string;
  ausgangslage: string;
  ziel: string;
  massnahme: string;
  ueberpruefungskriterium: string;
  prioritaet?: GoalPriority;
  measureSource?: MeasureSource;
  completionStatus?: GoalCompletionStatus;
  status: GoalStatus;
  manualOverride: boolean;
}

export interface CareerInfo {
  berufswunsch: string;
  alternativen: string;
  orientierungsstatus: string;
  erprobteBerufsfelder: string;
  praktikumserkenntnisse: string;
}

export interface FurtherFindings {
  selbsteinschaetzung: string;
  weitereBeobachtungen: string;
  freitext: string;
}

export interface BaseData {
  teilnehmerName: string;
  geburtsdatum: string | null;
  massnahme: string;
  eintrittsdatum: string;
  luvArt: LuvArt;
  beurteilungszeitraumVon: string;
  beurteilungszeitraumBis: string;
  koordination: string;
}

export interface StartingSituation {
  schulabschluss: string;
  beruflicheVorerfahrung: string;
  bisherigePraktika: string;
  ausgangssituation: string;
}

export type ComparisonStatus =
  | "positive_entwicklung"
  | "stabil"
  | "moegliche_negative_abweichung"
  | "neu_erhoben"
  | "nicht_vergleichbar";

export const COMPARISON_STATUS_LABELS: Record<ComparisonStatus, string> = {
  positive_entwicklung: "Mögliche positive Entwicklung",
  stabil: "Stabil",
  moegliche_negative_abweichung: "Mögliche negative Abweichung",
  neu_erhoben: "Neu erhoben",
  nicht_vergleichbar: "Nicht vergleichbar"
};

export interface ComparisonClaim {
  id: string;
  subCompetenceId: string | null;
  areaLabel: string;
  previousText: string;
  currentText: string;
  previousRating: CompetenceRating | null;
  currentRating: CompetenceRating | null;
  suggestedStatus: ComparisonStatus;
  confirmed: boolean;
  confirmedStatus?: ComparisonStatus;
}

export interface PreviousLuvInput {
  rawText: string;
  extractedClaims: ComparisonClaim[];
}

export type SectionKey =
  | "initial_situation"
  | "school_competences"
  | "digital_competences"
  | "personal_competences"
  | "social_competences"
  | "methodical_competences"
  | "practical_competences"
  | "career_orientation"
  | "development"
  | "support_needs"
  | "support_goals"
  | "measures"
  | "overall_assessment"
  | "perspective";

export type EvidenceStatus = "covered" | "partially_covered" | "unsupported" | "needs_review";

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  covered: "Belege gedeckt",
  partially_covered: "Teilweise gedeckt",
  unsupported: "Nicht ausreichend belegt",
  needs_review: "Fachliche Prüfung erforderlich"
};

export interface FactClaim {
  text: string;
  status: EvidenceStatus;
  evidenceIds: string[];
}

export interface FactCheckResult {
  status: EvidenceStatus;
  details: string[];
  claims?: FactClaim[];
  method: "heuristic" | "semantic";
}

export interface QualityCheckItem {
  key: string;
  label: string;
  ok: boolean;
  hint?: string;
}

export interface QualityCheckResult {
  items: QualityCheckItem[];
  warningCount: number;
}

export interface ReleaseCheckBlockingSection {
  key: SectionKey;
  title: string;
  reason: string;
}

export interface ReleaseCheckResult {
  blocked: boolean;
  blockingSections: ReleaseCheckBlockingSection[];
  unresolvedSupportGoals: number;
  unresolvedSupportAreas: number;
  openWarnings: number;
}

export interface CatalogEntry {
  id: string;
  label: string;
  group?: string;
}

export type CompetenceCatalog = Record<CompetenceArea, CatalogEntry[]>;

export interface MeasureLibraryEntry {
  id: string;
  area: CompetenceArea;
  group?: string;
  text: string;
}

export interface ClarificationCheckResult {
  needsClarification: boolean;
  matchedTerms: string[];
  message?: string;
  questions: string[];
}

export interface LuvSection {
  key: SectionKey;
  title: string;
  text: string;
  evidenceIds: string[];
  warnings: string[];
  manualOverride: boolean;
  factCheck?: FactCheckResult;
}

export interface CaseRecord {
  id: string;
  createdAt: string;
  baseData: BaseData;
  startingSituation: StartingSituation;
  subCompetences: SubCompetence[];
  evidence: EvidenceItem[];
  career: CareerInfo;
  further: FurtherFindings;
  supportAreaCandidates: SupportAreaCandidate[];
  supportGoals: SupportGoal[];
  previousLuv: PreviousLuvInput | null;
  comparisonClaims: ComparisonClaim[];
  sections: LuvSection[];
  approvedForExport: boolean;
  approvalTimestamp: string | null;
}
