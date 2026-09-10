/**
 * Zentrales Domaenenmodell des LUV-Generators (TESTSYSTEM).
 * Dieses Modell ist bewusst neutral gehalten (siehe Spezifikation Abschnitt 33)
 * und bildet NICHT feste BA-Feldnummern ab.
 */

export type LuvArt = "start" | "verlauf" | "abschluss";

/** Erlaubte Bewertungswerte fuer Kompetenzen (fachlich, erscheinen so im LUV-Text). */
export type CompetenceRating =
  | "staerke"
  | "ueberwiegend_sicher"
  | "teilweise_sicher"
  | "foerderbedarf"
  | "deutlicher_foerderbedarf"
  | "nicht_erhoben"
  | "nicht_beurteilbar"
  | "nicht_relevant";

/**
 * Rein technische interne Abbildung 0-4 fuer deterministische Foerderlogik.
 * Darf NIEMALS im fertigen LUV-Text oder in einer Nutzerausgabe erscheinen.
 * (Spezifikation Abschnitt 6, 17)
 */
export const RATING_INTERNAL_SCORE: Record<CompetenceRating, number | null> = {
  staerke: 4,
  ueberwiegend_sicher: 3,
  teilweise_sicher: 2,
  foerderbedarf: 1,
  deutlicher_foerderbedarf: 0,
  nicht_erhoben: null,
  nicht_beurteilbar: null,
  nicht_relevant: null
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

/** Ein einzelner Beobachtungs-/Beleg-Eintrag mit eindeutiger Evidence-ID. */
export interface EvidenceItem {
  /** z.B. MATH_001, OBS_012, PRACTICE_004 */
  id: string;
  source: EvidenceSource;
  /** Kurzer Freitext-Stichpunkt der Koordination. */
  note: string;
  createdAt: string;
}

export const COMPETENCE_AREAS = [
  "schulische_grundkompetenzen",
  "digitale_kompetenzen",
  "personale_kompetenzen",
  "sozial_kommunikative_kompetenzen",
  "methodische_kompetenzen",
  "berufliche_orientierung_praxis"
] as const;

export type CompetenceArea = (typeof COMPETENCE_AREAS)[number];

/** Eine Unterkompetenz innerhalb eines Kompetenzbereichs. */
export interface SubCompetence {
  id: string;
  area: CompetenceArea;
  /** Sprechender Name der Unterkompetenz, z.B. "Grundrechenarten". */
  label: string;
  rating: CompetenceRating;
  /** Kurze Beobachtungsstichpunkte (Freitext, Rohmaterial fuer Claude). */
  observationNotes: string;
  /** IDs von EvidenceItems, die diese Einschaetzung stuetzen. */
  evidenceIds: string[];
}

export type SupportAreaStatus = "pending" | "confirmed" | "rejected";

/** Vom deterministischen Regelwerk vorgeschlagener moeglicher Foerderbereich. */
export interface SupportAreaCandidate {
  id: string;
  subCompetenceId: string;
  area: CompetenceArea;
  label: string;
  /** "development" | "support" | "priority" je nach Bewertung (siehe support-logic). */
  triggerLevel: "development" | "support" | "priority";
  status: SupportAreaStatus;
}

export type GoalStatus = "vorschlag" | "uebernommen" | "bearbeitet" | "neu_formuliert" | "verworfen";

export interface SupportGoal {
  id: string;
  supportAreaId: string;
  bereich: string;
  ausgangslage: string;
  ziel: string;
  massnahme: string;
  ueberpruefungskriterium: string;
  prioritaet?: "hoch" | "mittel" | "niedrig";
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

/** Vorheriger LUV-Text, wie er fuer Verlaufs-/Abschluss-LUV eingefuegt werden kann. */
export interface PreviousLuvInput {
  rawText: string;
  /** Vom System extrahierte, noch unbestaetigte Vergleichs-Kandidaten. */
  extractedClaims: ComparisonClaim[];
}

export type ComparisonStatus =
  | "positive_entwicklung"
  | "stabil"
  | "moegliche_negative_abweichung"
  | "neu_erhoben"
  | "nicht_vergleichbar";

export interface ComparisonClaim {
  id: string;
  subCompetenceId: string | null;
  areaLabel: string;
  previousText: string;
  currentText: string;
  /** Optional strukturierte vorherige Bewertung, falls bekannt (fuer deterministischen Vergleich). */
  previousRating: CompetenceRating | null;
  /** Aktuelle Bewertung, falls einer Unterkompetenz zugeordnet. */
  currentRating: CompetenceRating | null;
  suggestedStatus: ComparisonStatus;
  confirmed: boolean;
  confirmedStatus?: ComparisonStatus;
}

/** Ein einzelner, generierter/redigierter LUV-Abschnitt. */
export interface LuvSection {
  key:
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
  title: string;
  text: string;
  evidenceIds: string[];
  warnings: string[];
  /** true, sobald ein Mensch den Text manuell bearbeitet hat -> vor KI-Ueberschreibung geschuetzt. */
  manualOverride: boolean;
  factCheck?: FactCheckResult;
}

export interface FactCheckResult {
  status: "covered" | "partially_covered" | "unsupported";
  details: string[];
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
  /** Muss durch aktive Bestaetigung der Koordination gesetzt werden. Claude darf dies nie setzen. */
  approvedForExport: boolean;
  approvalTimestamp: string | null;
}
