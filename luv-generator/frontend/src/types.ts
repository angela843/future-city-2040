export type LuvArt = "start" | "verlauf" | "abschluss";

/**
 * Massnahmeart (Version 0.2 / PH-17 V1.0). Dreistufig, kein technischer Default -
 * aktive Auswahl ist Pflicht (Migrationsplan 0.1->0.2, Entscheidung 6).
 */
export const MASSNAHMEART_VALUES = ["bvb1", "bvb2", "bvb3"] as const;
export type Massnahmeart = (typeof MASSNAHMEART_VALUES)[number];
export const MASSNAHMEART_LABELS: Record<Massnahmeart, string> = {
  bvb1: "BvB 1",
  bvb2: "BvB-Reha (BvB 2)",
  bvb3: "BvB-Reha (BvB 3)"
};

/** PH-17 V1.0 Abschnitt 4: Anlass des Verlaufs-LUV, steuert die Fristformel. */
export const VERLAUF_ANLASS_VALUES = ["regulaer", "vor_massnahmeende", "verlaengerung", "sonstiger_anlass"] as const;
export type VerlaufAnlass = (typeof VERLAUF_ANLASS_VALUES)[number];
export const VERLAUF_ANLASS_LABELS: Record<VerlaufAnlass, string> = {
  regulaer: "Regulär",
  vor_massnahmeende: "Vor Maßnahmeende",
  verlaengerung: "Verlängerung",
  sonstiger_anlass: "Sonstiger Anlass"
};

/** PH-17 V1.0 / Entwicklungsauftrag B: Maßnahmeziel, im Start strukturiert festgelegt. */
export const MASSNAHMEZIEL_VALUES = ["berufsausbildung", "sv_beschaeftigung"] as const;
export type Massnahmeziel = (typeof MASSNAHMEZIEL_VALUES)[number];
export const MASSNAHMEZIEL_LABELS: Record<Massnahmeziel, string> = {
  berufsausbildung: "Berufsausbildung",
  sv_beschaeftigung: "Sozialversicherungspflichtige Beschäftigung"
};

/** Migrationsplan 0.1->0.2, Entscheidung 8 (verbindliche Rollenliste des Nutzers). */
export const ROLLE_VALUES = [
  "teilnehmende_person",
  "bildungsbegleitung_case_management",
  "ausbilder",
  "lehrkraft",
  "sozialpaedagogik",
  "psychologe_psychologin",
  "weiteres_fachpersonal",
  "paedagogische_mitarbeitende_lernort_wohnen",
  "gemeinsame_aufgaben"
] as const;
export type Rolle = (typeof ROLLE_VALUES)[number];
export const ROLLE_LABELS: Record<Rolle, string> = {
  teilnehmende_person: "Teilnehmende Person",
  bildungsbegleitung_case_management: "Bildungsbegleitung / Case Management",
  ausbilder: "Ausbilder/in",
  lehrkraft: "Lehrkraft",
  sozialpaedagogik: "Sozialpädagogik",
  psychologe_psychologin: "Psychologe/Psychologin",
  weiteres_fachpersonal: "Weiteres Fachpersonal",
  paedagogische_mitarbeitende_lernort_wohnen: "Pädagogische Mitarbeitende Lernort Wohnen",
  gemeinsame_aufgaben: "Gemeinsame Aufgaben"
};

export type JaNein = "ja" | "nein";
export const JA_NEIN_LABELS: Record<JaNein, string> = { ja: "Ja", nein: "Nein" };
export type JaNeinNichtRelevant = "ja" | "nein" | "nicht_relevant";
export const JA_NEIN_NICHT_RELEVANT_LABELS: Record<JaNeinNichtRelevant, string> = {
  ja: "Ja",
  nein: "Nein",
  nicht_relevant: "Nicht relevant"
};

export const UEBERMITTLUNGSANLASS_VALUES = ["regulaeres_ende", "vorzeitige_beendigung"] as const;
export type Uebermittlungsanlass = (typeof UEBERMITTLUNGSANLASS_VALUES)[number];
export const UEBERMITTLUNGSANLASS_LABELS: Record<Uebermittlungsanlass, string> = {
  regulaeres_ende: "Reguläres Ende",
  vorzeitige_beendigung: "Vorzeitige Beendigung"
};

export const VORZEITIGE_BEENDIGUNG_ART_VALUES = ["uebergang_ausbildung_arbeit", "abbruch"] as const;
export type VorzeitigeBeendigungArt = (typeof VORZEITIGE_BEENDIGUNG_ART_VALUES)[number];
export const VORZEITIGE_BEENDIGUNG_ART_LABELS: Record<VorzeitigeBeendigungArt, string> = {
  uebergang_ausbildung_arbeit: "Übergang in Ausbildung/Arbeit",
  abbruch: "Abbruch"
};

export interface HumanConfirmed<T> {
  value: T;
  humanConfirmed: boolean;
}

/**
 * Abschluss-Modul (offizieller BA-Abschluss-LuV 10/2025, Migrationsplan 0.1->0.2
 * Abschnitt 3.4). Felder 4-6/8-12 sind direkte Identifikatoren - rein lokal, nie
 * Teil eines Claude-Payloads. Felder 14/15/19 sind HUMAN_CONFIRMED-pflichtig.
 */
export interface AbschlussErgebnis {
  abschlussLuvVom: string | null;
  uebermittlungsanlass: Uebermittlungsanlass | null;
  vorzeitigeBeendigungArt: VorzeitigeBeendigungArt | null;
  vorname: string;
  nachname: string;
  kundennummer: string;
  lernortWohnenInternat: JaNein | null;
  traegerEinrichtung: string;
  ansprechpersonVorname: string;
  ansprechpersonNachname: string;
  telefon: string;
  email: string;
  hauptschulabschlussErreicht: JaNeinNichtRelevant | null;
  ausbildungsreifeErreicht: HumanConfirmed<JaNein | null>;
  berufseignung: HumanConfirmed<string>;
  qualifizierungsAusbildungsbausteine: string;
  vermittlungsfaehigkeit: string;
  eingliederungsergebnis: string;
  unterstuetzungsbedarf: HumanConfirmed<JaNein | null>;
  unterstuetzungsbedarfBeschreibungEmpfehlung: string;
  stabilisierungFestigung: string;
}

export function emptyAbschlussErgebnis(): AbschlussErgebnis {
  return {
    abschlussLuvVom: null,
    uebermittlungsanlass: null,
    vorzeitigeBeendigungArt: null,
    vorname: "",
    nachname: "",
    kundennummer: "",
    lernortWohnenInternat: null,
    traegerEinrichtung: "",
    ansprechpersonVorname: "",
    ansprechpersonNachname: "",
    telefon: "",
    email: "",
    hauptschulabschlussErreicht: null,
    ausbildungsreifeErreicht: { value: null, humanConfirmed: false },
    berufseignung: { value: "", humanConfirmed: false },
    qualifizierungsAusbildungsbausteine: "",
    vermittlungsfaehigkeit: "",
    eingliederungsergebnis: "",
    unterstuetzungsbedarf: { value: null, humanConfirmed: false },
    unterstuetzungsbedarfBeschreibungEmpfehlung: "",
    stabilisierungFestigung: ""
  };
}

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
  rolle?: Rolle;
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
  verlaufAnlass: VerlaufAnlass | null;
  verlaengerungstermin: string | null;
  massnahmeziel: Massnahmeziel | null;
  begruendungKeineAusbildung: string;
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
  verlaengerungsVerlaufsLuvFaellig: string | null;
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
  | "abschluss_ergebnis"
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
  abschlussErgebnis: AbschlussErgebnis;
  approvedForExport: boolean;
  approvalTimestamp: string | null;
}
