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
  /** Falls aus dem Kompetenzkatalog uebernommen (Version 0.2, PH-15 Abschnitt 3-11). */
  catalogId?: string;
  /**
   * "Fuer aktuellen LUV relevant?" (Version 0.2, PH-15 Abschnitt 40). Default true.
   * Nicht relevante Eintraege fliessen nicht automatisch in den LUV-Text oder die
   * Foerderlogik ein (PH-15: "Nicht relevante Einzelwerte sollen nicht automatisch
   * den LUV-Text verlaengern").
   */
  relevantForLuv: boolean;
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

/**
 * A = aktuell zentral, B = relevant, C = beobachten (Version 0.2, PH-15 Abschnitt 34).
 * Rein intern/organisatorisch - MUSS laut PH-15 NICHT automatisch im LUV-Text erscheinen.
 */
export type GoalPriority = "A" | "B" | "C";

/** Woher die Massnahme stammt (Version 0.2, PH-15 Abschnitt 32: Bibliothek vs. KI-Vorschlag). */
export type MeasureSource = "bibliothek" | "ki_vorschlag" | "manuell";

/** Zielstatus fuer Verlaufs-/Abschluss-LUV (Version 0.2, PH-15 Abschnitt 22, 55). */
export type GoalCompletionStatus =
  | "erreicht"
  | "teilweise_erreicht"
  | "weiterhin_aktuell"
  | "angepasst"
  | "nicht_erreicht"
  | "nicht_mehr_relevant";

export interface SupportGoal {
  id: string;
  supportAreaId: string;
  bereich: string;
  ausgangslage: string;
  ziel: string;
  massnahme: string;
  ueberpruefungskriterium: string;
  /** Interne Priorisierung (Version 0.2). Erscheint NIE im gerenderten LUV-Text. */
  prioritaet?: GoalPriority;
  /** Woher die aktuelle Massnahme stammt (Bibliothek/KI/manuell). Version 0.2. */
  measureSource?: MeasureSource;
  /** Nur bei Verlaufs-/Abschluss-LUV relevant; von Claude vorschlagbar, nie verbindlich gesetzt. */
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

/**
 * Evidenzstatus (Version 0.2, PH-15 Abschnitt 14). "needs_review" ist neu gegenueber
 * Version 0.1 und deckt Faelle ab, in denen weder klar gedeckt noch klar ungedeckt
 * werden kann (z.B. Fact-Check-KI-Aufruf nicht verfuegbar) - der Abschnitt gilt dann
 * als NICHT automatisch exportierbar, bis die Koordination ihn geprueft hat.
 */
export type EvidenceStatus = "covered" | "partially_covered" | "unsupported" | "needs_review";

/**
 * Eine einzelne fachliche Aussage (Claim) im generierten Text mit ihrer Beleglage
 * (Version 0.2, PH-15 Abschnitt 13: Unterscheidung Claim/Evidence).
 */
export interface FactClaim {
  text: string;
  status: EvidenceStatus;
  evidenceIds: string[];
}

export interface FactCheckResult {
  status: EvidenceStatus;
  details: string[];
  /** Aufschluesselung je Einzelaussage, falls per semantischer Pruefung ermittelt (Version 0.2). */
  claims?: FactClaim[];
  /** "heuristic" = einfache Wortueberlappung (Version 0.1-Fallback), "semantic" = KI-Fact-Check (Version 0.2). */
  method: "heuristic" | "semantic";
}

/**
 * Qualitaets- und Vollstaendigkeitscheck (Version 0.2, PH-15 Abschnitt 18-22).
 * Reine Anzeige/Warnung - blockiert die Erstellung nicht (PH-15 Abschnitt 20:
 * "Warnung statt Zwang").
 */
export interface QualityCheckItem {
  key: string;
  label: string;
  /** true = vorhanden/erfuellt, false = fehlt/offen. */
  ok: boolean;
  /** Erlaeuternder Hinweistext, z.B. bei fehlenden Angaben. */
  hint?: string;
}

export interface QualityCheckResult {
  items: QualityCheckItem[];
  /** Anzahl der Warnungen (ok === false). */
  warningCount: number;
}

/**
 * Massnahmenbibliothek (Version 0.2, PH-15 Abschnitt 30-33). Statische, editierbare
 * Konfiguration - keine Datenbank/Admin-UI in Version 0.2.
 */
export interface MeasureLibraryEntry {
  id: string;
  area: CompetenceArea;
  /** Fachliche Untergruppe, z.B. "Mathematik" (informativ, optional). */
  group?: string;
  text: string;
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
