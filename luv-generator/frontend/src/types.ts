export type LuvArt = "start" | "verlauf" | "abschluss";

export const MASSNAHMEART_VALUES = ["bvb", "bvb_reha"] as const;
export type Massnahmeart = (typeof MASSNAHMEART_VALUES)[number];
export const MASSNAHMEART_LABELS: Record<Massnahmeart, string> = {
  bvb: "BvB",
  bvb_reha: "BvB-Reha"
};

export const BA_FOERDERZIELBEREICHE = [
  "grundkompetenzen",
  "berufsorientierung_berufswahl",
  "berufliche_grundfaehigkeiten",
  "berufsspezifische_qualifizierung",
  "erwerb_hauptschulabschluss"
] as const;
export type BAFoerderzielbereich = (typeof BA_FOERDERZIELBEREICHE)[number];
export const BA_FOERDERZIELBEREICH_LABELS: Record<BAFoerderzielbereich, string> = {
  grundkompetenzen: "Grundkompetenzen",
  berufsorientierung_berufswahl: "Berufsorientierung/Berufswahl",
  berufliche_grundfaehigkeiten: "Berufliche Grundfähigkeiten",
  berufsspezifische_qualifizierung: "Berufsspezifische Qualifizierung",
  erwerb_hauptschulabschluss: "Erwerb Hauptschulabschluss"
};

export type FoerderzielbereichStatus = "begonnen" | "aktiv" | "abgeschlossen" | "erneut_geoeffnet";
export const FOERDERZIELBEREICH_STATUS_LABELS: Record<FoerderzielbereichStatus, string> = {
  begonnen: "Begonnen",
  aktiv: "Aktiv",
  abgeschlossen: "Abgeschlossen",
  erneut_geoeffnet: "Erneut geöffnet"
};
export interface FoerderzielbereichTracking {
  bereich: BAFoerderzielbereich;
  status: FoerderzielbereichStatus;
}

export const SCHULABSCHLUSS_OPTIONS = [
  "kein_schulabschluss",
  "esa",
  "msa",
  "fachhochschulreife",
  "abitur",
  "sonstiger",
  "noch_schulpflichtig",
  "nicht_bekannt"
] as const;
export type Schulabschluss = (typeof SCHULABSCHLUSS_OPTIONS)[number];
export const SCHULABSCHLUSS_LABELS: Record<Schulabschluss, string> = {
  kein_schulabschluss: "Kein Schulabschluss",
  esa: "Erster Schulabschluss (ESA)",
  msa: "Mittlerer Schulabschluss (MSA)",
  fachhochschulreife: "Fachhochschulreife",
  abitur: "Abitur",
  sonstiger: "Sonstiger Abschluss",
  noch_schulpflichtig: "Noch schulpflichtig",
  nicht_bekannt: "Nicht bekannt"
};

export const BERUFLICHE_VORERFAHRUNG_OPTIONS = [
  "keine",
  "praktikum",
  "mehrere_praktika",
  "ausbildung_begonnen",
  "ausbildung_abgebrochen",
  "beschaeftigung",
  "vorherige_massnahme",
  "sonstige"
] as const;
export type BeruflicheVorerfahrung = (typeof BERUFLICHE_VORERFAHRUNG_OPTIONS)[number];
export const BERUFLICHE_VORERFAHRUNG_LABELS: Record<BeruflicheVorerfahrung, string> = {
  keine: "Keine",
  praktikum: "Praktikum",
  mehrere_praktika: "Mehrere Praktika",
  ausbildung_begonnen: "Ausbildung begonnen",
  ausbildung_abgebrochen: "Ausbildung abgebrochen",
  beschaeftigung: "Beschäftigung",
  vorherige_massnahme: "Vorherige Maßnahme",
  sonstige: "Sonstige"
};

export const ORIENTIERUNGSSTATUS_OPTIONS = ["konkret", "grundsaetzlich_vorhanden", "unsicher", "weitere_orientierung_erforderlich"] as const;
export type Orientierungsstatus = (typeof ORIENTIERUNGSSTATUS_OPTIONS)[number];
export const ORIENTIERUNGSSTATUS_LABELS: Record<Orientierungsstatus, string> = {
  konkret: "Konkret",
  grundsaetzlich_vorhanden: "Grundsätzlich vorhanden",
  unsicher: "Unsicher",
  weitere_orientierung_erforderlich: "Weitere Orientierung erforderlich"
};

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
  foerderzielbereiche?: BAFoerderzielbereich[];
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
  foerderzielbereich?: BAFoerderzielbereich;
  status: GoalStatus;
  manualOverride: boolean;
}

export interface BerufsfeldEintrag {
  berufsfeld: string;
  orientierungspraktikum: boolean;
  zentraleErkenntnis: string;
  quelle: EvidenceSource | "";
}

export interface CareerInfo {
  berufswunsch: string;
  berufswunschVorhanden: boolean | null;
  berufswunschGefestigt: boolean | null;
  berufswunschPraktischErprobt: boolean | null;
  alternativen: string;
  orientierungsstatus: Orientierungsstatus | "";
  weitereOrientierungErforderlich: boolean;
  berufsfelder: BerufsfeldEintrag[];
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
  massnahmeart: Massnahmeart;
  eintrittsdatum: string;
  kompetenzanalyseEnde: string | null;
  massnahmeEndeGeplant: string | null;
  luvArt: LuvArt;
  beurteilungszeitraumVon: string;
  beurteilungszeitraumBis: string;
  koordination: string;
}

export interface StartingSituation {
  schulabschluss: Schulabschluss;
  beruflicheVorerfahrung: BeruflicheVorerfahrung[];
  bisherigePraktika: string;
  ausgangssituation: string;
}

export interface Teilnehmerbesprechung {
  besprochen: boolean | null;
  datum: string | null;
  mehrfertigungAusgehaendigt: boolean | null;
  besprechungNichtMoeglich: boolean;
  hinweisGrund: string;
}

export interface FristenResult {
  startLuvFaellig: string | null;
  ersteVerlaufsLuvFaellig: string | null;
  weitereVerlaufsLuvFaellig: string | null;
  abschlussLuvFaellig: string | null;
}

export interface KompetenzanalyseDauerHinweis {
  ok: boolean;
  wochenGerundet?: number;
  hinweis?: string;
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
  openQualityWarnings: number;
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
  foerderzielbereiche?: BAFoerderzielbereich[];
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
  foerderzielbereichTracking: FoerderzielbereichTracking[];
  teilnehmerbesprechung: Teilnehmerbesprechung;
  approvedForExport: boolean;
  approvalTimestamp: string | null;
}
