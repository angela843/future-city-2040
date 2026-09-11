/**
 * Zentrales Domaenenmodell des LUV-Generators (TESTSYSTEM).
 * Dieses Modell ist bewusst neutral gehalten (siehe Spezifikation Abschnitt 33)
 * und bildet NICHT feste BA-Feldnummern ab.
 */

export type LuvArt = "start" | "verlauf" | "abschluss";

/**
 * Massnahmeart (Version 0.2 / PH-17 V1.0). Dreistufig: BvB 1, BvB-Reha BvB 2,
 * BvB-Reha BvB 3 - steuert fachlich belegte Unterschiede (Fristen, Rollen,
 * BvB-3-Sonderfelder). Kein technischer Default - aktive Auswahl ist Pflicht
 * (Migrationsplan 0.1->0.2, Entscheidung 6).
 */
export const MASSNAHMEART_VALUES = ["bvb1", "bvb2", "bvb3"] as const;
export type Massnahmeart = (typeof MASSNAHMEART_VALUES)[number];

/** PH-17 V1.0 Abschnitt 4: Anlass des Verlaufs-LUV, steuert die Fristformel. */
export const VERLAUF_ANLASS_VALUES = ["regulaer", "vor_massnahmeende", "verlaengerung", "sonstiger_anlass"] as const;
export type VerlaufAnlass = (typeof VERLAUF_ANLASS_VALUES)[number];

/** PH-17 V1.0 / Entwicklungsauftrag B: Maßnahmeziel, im Start strukturiert festgelegt. */
export const MASSNAHMEZIEL_VALUES = ["berufsausbildung", "sv_beschaeftigung"] as const;
export type Massnahmeziel = (typeof MASSNAHMEZIEL_VALUES)[number];

/**
 * Rollen fuer die rollenbezogene Zielvereinbarung (Migrationsplan 0.1->0.2,
 * Entscheidung 8, verbindliche Liste des Nutzers). "paedagogische Mitarbeitende
 * Lernort Wohnen" ist massnahmeabhaengig (nur BvB 3, siehe rollenForMassnahmeart
 * in supportLogic.ts).
 */
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

/**
 * Wiederverwendbares Muster fuer fachliche Einzelentscheidungen, die eine
 * explizite menschliche Bestaetigung benoetigen (PH-17 / Entwicklungsauftrag:
 * HUMAN_CONFIRMED). Claude darf `value` nie selbst setzen; `humanConfirmed`
 * wird ausschliesslich durch eine aktive Aktion der Koordination auf true
 * gesetzt.
 */
export interface HumanConfirmed<T> {
  value: T;
  humanConfirmed: boolean;
}

/**
 * Offizielle BA-Foerderzielbereiche (PH-15 v1.1 Abschnitt 8), technisch getrennt
 * von den sechs internen Kompetenzdomaenen (Abschnitt 9: Zielarchitektur
 * Beobachtung -> Unterkompetenz -> Kompetenzdomaene -> BA-Foerderzielbereich ->
 * bestaetigter Foerderbedarf -> Foerderziel -> LUV-Text).
 * TODO: fachlich abgleichen - exakte offizielle Bezeichnungen/Feldnummern der BA
 * liegen nicht vor, Labels sind Arbeitsformulierungen aus PH-15 v1.1.
 */
export const BA_FOERDERZIELBEREICHE = [
  "grundkompetenzen",
  "berufsorientierung_berufswahl",
  "berufliche_grundfaehigkeiten",
  "berufsspezifische_qualifizierung",
  "erwerb_hauptschulabschluss"
] as const;
export type BAFoerderzielbereich = (typeof BA_FOERDERZIELBEREICHE)[number];

/** PH-15 v1.1 Abschnitt 84: Foerderzielbereiche laufen parallel, nicht linear. */
export type FoerderzielbereichStatus = "begonnen" | "aktiv" | "abgeschlossen" | "erneut_geoeffnet";

export interface FoerderzielbereichTracking {
  bereich: BAFoerderzielbereich;
  status: FoerderzielbereichStatus;
  /**
   * Voraussichtlicher Zeitraum der Foerder-/Qualifizierungsplanung fuer diesen Bereich
   * (Korrekturauftrag V0.2.1, A5; vom BA-Start-LuV vorgesehen). Keine automatische
   * fachliche Dauer durch Claude - reine strukturierte Dateneingabe.
   */
  von: string | null;
  bis: string | null;
}

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
  /**
   * Zuordnung zu einem oder mehreren BA-Foerderzielbereichen (PH-15 v1.1 Abschnitt 8).
   * Rein fachliche Zuordnung durch die Koordination, keine automatische Ableitung.
   */
  foerderzielbereiche?: BAFoerderzielbereich[];
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
  /**
   * BA-Foerderzielbereich (PH-15 v1.1 Abschnitt 47, 48). Ein Ziel ohne zugeordneten,
   * relevanten Foerderzielbereich loest eine Qualitaetswarnung aus (Abschnitt 48),
   * blockiert aber nichts.
   */
  foerderzielbereich?: BAFoerderzielbereich;
  /** Rollenbezogene Zielvereinbarung (Migrationsplan 0.1->0.2, Entscheidung 8). */
  rolle?: Rolle;
  status: GoalStatus;
  manualOverride: boolean;
}

/** PH-15 v1.1 Abschnitt 38 (MUSS): strukturierter beruflicher Orientierungsstatus. */
export const ORIENTIERUNGSSTATUS_OPTIONS = [
  "konkret",
  "grundsaetzlich_vorhanden",
  "unsicher",
  "weitere_orientierung_erforderlich"
] as const;
export type Orientierungsstatus = (typeof ORIENTIERUNGSSTATUS_OPTIONS)[number];

/** PH-15 v1.1 Abschnitt 39 (SOLL): ein einzelnes erprobtes/analysiertes Berufsfeld. */
export interface BerufsfeldEintrag {
  berufsfeld: string;
  /** true = im Rahmen eines Orientierungspraktikums erprobt. */
  orientierungspraktikum: boolean;
  zentraleErkenntnis: string;
  quelle: EvidenceSource | "";
}

export interface CareerInfo {
  berufswunsch: string;
  /** PH-15 v1.1 Abschnitt 38: Berufswunsch vorhanden / gefestigt / praktisch erprobt. */
  berufswunschVorhanden: boolean | null;
  berufswunschGefestigt: boolean | null;
  berufswunschPraktischErprobt: boolean | null;
  alternativen: string;
  orientierungsstatus: Orientierungsstatus | "";
  weitereOrientierungErforderlich: boolean;
  /**
   * Berufsfeld 1-3 + ggf. weitere (PH-15 v1.1 Abschnitt 39: "flexibel wegen
   * Losvorgaben" - daher als Liste statt starrer Feldanzahl modelliert).
   */
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
  /** BvB 1 / BvB-Reha BvB 2 / BvB-Reha BvB 3 (PH-17 V1.0, MUSS). Kein Default. */
  massnahmeart: Massnahmeart;
  eintrittsdatum: string;
  /**
   * Ende der Kompetenzanalyse - Grundlage fuer die Start-LUV-Frist
   * (PH-15 v1.1 Abschnitt 5: "muss das tatsaechliche Ende der Kompetenzanalyse
   * beruecksichtigen", nicht pauschal aus Massnahmebeginn ableitbar).
   */
  kompetenzanalyseEnde: string | null;
  /**
   * Geplantes Massnahmeende - reiner Planungswert, Grundlage fuer die Frist der
   * weiteren Verlaufs-LUV (6 Wochen vorher, PH-15 v1.1 Abschnitt 5). Darf seit dem
   * Korrekturauftrag V0.2.1 (A2) NICHT mehr ersatzweise als tatsaechlicher letzter
   * Teilnahmetag fuer die Abschluss-LUV-Frist verwendet werden - siehe
   * `tatsaechlicherLetzterTeilnahmetag`.
   */
  massnahmeEndeGeplant: string | null;
  /**
   * Tatsaechlicher letzter Teilnahmetag / tatsaechliches Austrittsdatum
   * (Korrekturauftrag V0.2.1, A2). Einzige Grundlage der Abschluss-LUV-Frist -
   * sowohl bei regulaerem Abschluss als auch bei vorzeitiger Beendigung. Fehlt dieses
   * Datum bei einer Abschluss-LUV, wird KEINE Abschlussfrist als fachlich verbindlich
   * ausgegeben (siehe `fristenLogic.ts: computeFristen`).
   */
  tatsaechlicherLetzterTeilnahmetag: string | null;
  /**
   * Anlass des Verlaufs-LUV (PH-17 V1.0 Abschnitt 4/6), nur bei luvArt="verlauf"
   * relevant. Steuert, welche Fristformel gilt.
   */
  verlaufAnlass: VerlaufAnlass | null;
  /** Nur bei verlaufAnlass="verlaengerung": Termin, auf den sich die Verlaengerungsfrist bezieht. */
  verlaengerungstermin: string | null;
  /**
   * Massnahmeziel (Migrationsplan 0.1->0.2, Entscheidung 2). Wird im Start
   * strukturiert festgelegt und im Abschluss nur referenziell angezeigt, nicht
   * erneut abgefragt.
   */
  massnahmeziel: Massnahmeziel | null;
  /**
   * Pflicht-Freitext bei massnahmeziel="sv_beschaeftigung": Begruendung, weshalb
   * das Ziel Berufsausbildung voraussichtlich nicht erreicht werden kann. Claude
   * darf diesen Text NIE selbst erzeugen oder ableiten (Entscheidung 2).
   */
  begruendungKeineAusbildung: string;
  luvArt: LuvArt;
  beurteilungszeitraumVon: string;
  beurteilungszeitraumBis: string;
  koordination: string;
}

/** PH-15 v1.1 Abschnitt 36: Schulabschluss als strukturierte Auswahl. */
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

/** PH-15 v1.1 Abschnitt 37: berufliche Vorerfahrung als Mehrfachauswahl. */
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

export interface StartingSituation {
  schulabschluss: Schulabschluss;
  beruflicheVorerfahrung: BeruflicheVorerfahrung[];
  bisherigePraktika: string;
  ausgangssituation: string;
}

/**
 * Teilnehmerbesprechung/Bekanntgabe (PH-15 v1.1 Abschnitt 65, MUSS).
 * TODO: fachlich abgleichen - welche dieser Angaben in das offizielle
 * Muster-LUV gehoeren und welche nur interne Prozessdokumentation sind.
 */
export interface Teilnehmerbesprechung {
  besprochen: boolean | null;
  datum: string | null;
  mehrfertigungAusgehaendigt: boolean | null;
  besprechungNichtMoeglich: boolean;
  hinweisGrund: string;
}

/**
 * Abschluss-Modul (PH-17 V1.0 / Migrationsplan 0.1->0.2, Entscheidung 9).
 * Verbindliche 22-Felder-Struktur des offiziellen BA-Abschluss-LuV 10/2025,
 * vom Nutzer vorgegeben - keine eigene Interpretation. Felder 2 (Art der
 * Massnahme) und 22 (Besprechungsdatum) werden NICHT dupliziert, sondern aus
 * `baseData.massnahmeart` bzw. `teilnehmerbesprechung.datum` referenziert.
 */
export type JaNein = "ja" | "nein";
export type JaNeinNichtRelevant = "ja" | "nein" | "nicht_relevant";

/** Feld 3: Uebermittlungsanlass - eigener, zweiwertiger Enum, NICHT identisch mit VerlaufAnlass. */
export const UEBERMITTLUNGSANLASS_VALUES = ["regulaeres_ende", "vorzeitige_beendigung"] as const;
export type Uebermittlungsanlass = (typeof UEBERMITTLUNGSANLASS_VALUES)[number];

/** Nur bei uebermittlungsanlass="vorzeitige_beendigung" (PH-17 V1.0 Abschnitt 5). */
export const VORZEITIGE_BEENDIGUNG_ART_VALUES = ["uebergang_ausbildung_arbeit", "abbruch"] as const;
export type VorzeitigeBeendigungArt = (typeof VORZEITIGE_BEENDIGUNG_ART_VALUES)[number];

/**
 * Gemeinsamer Stammdatenkern fuer START, VERLAUF und ABSCHLUSS (Korrekturauftrag
 * V0.2.1, A4), soweit die offiziellen Felder gemeinsam sind: LuV-Datum sowie die
 * direkten Identifikatoren (Vorname, Nachname, Kundennummer, Traeger/Einrichtung,
 * Ansprechperson, Telefon, E-Mail) und das BvB-3-Sonderfeld Lernort Wohnen/Internat.
 * Ersetzt die vormals nur im Abschluss-Modul gefuehrten, isolierten Kopien dieser
 * Felder ("keine doppelten konkurrierenden Stammdatenmodelle"). Rein lokale Erfassung
 * fuer Pruefansicht/DOCX-Export - werden NIEMALS Teil eines Claude-Payloads (Privacy
 * Gateway Allowlist enthaelt diese Schluessel bewusst nicht).
 */
export interface Stammdaten {
  /** Datum dieser LuV (Start-, Verlaufs- oder Abschluss-LuV). */
  luvDatum: string | null;
  vorname: string;
  nachname: string;
  kundennummer: string;
  traegerEinrichtung: string;
  ansprechpersonVorname: string;
  ansprechpersonNachname: string;
  telefon: string;
  email: string;
  /** Nur bei massnahmeart="bvb3" erfasst/angezeigt/exportiert. */
  lernortWohnenInternat: JaNein | null;
}

export function emptyStammdaten(): Stammdaten {
  return {
    luvDatum: null,
    vorname: "",
    nachname: "",
    kundennummer: "",
    traegerEinrichtung: "",
    ansprechpersonVorname: "",
    ansprechpersonNachname: "",
    telefon: "",
    email: "",
    lernortWohnenInternat: null
  };
}

/**
 * Abschluss-spezifische Ergebnisfelder (offizieller BA-Abschluss-LuV 10/2025). Die
 * direkten Identifikatoren und das LuV-Datum sind seit Korrekturauftrag V0.2.1 (A4)
 * Teil des gemeinsamen `Stammdaten`-Kerns und hier NICHT mehr dupliziert.
 */
export interface AbschlussErgebnis {
  /** Feld 3. */
  uebermittlungsanlass: Uebermittlungsanlass | null;
  /** Nur bei uebermittlungsanlass="vorzeitige_beendigung". */
  vorzeitigeBeendigungArt: VorzeitigeBeendigungArt | null;
  /** Feld 13. */
  hauptschulabschlussErreicht: JaNeinNichtRelevant | null;
  /** Feld 14: HUMAN_CONFIRMED, Claude leitet dies nie selbst ab. */
  ausbildungsreifeErreicht: HumanConfirmed<JaNein | null>;
  /** Feld 15 (Freitext: Berufe/Qualifikationsniveau): HUMAN_CONFIRMED. */
  berufseignung: HumanConfirmed<string>;
  /** Feld 16 (optional). */
  qualifizierungsAusbildungsbausteine: string;
  /** Feld 17. */
  vermittlungsfaehigkeit: string;
  /** Feld 18 (inkl. Begruendung, falls keine Eingliederung erfolgt ist). */
  eingliederungsergebnis: string;
  /** Feld 19: HUMAN_CONFIRMED, Claude leitet dies nie selbst ab. */
  unterstuetzungsbedarf: HumanConfirmed<JaNein | null>;
  /** Feld 20: nur Pflicht/relevant, wenn unterstuetzungsbedarf.value="ja". */
  unterstuetzungsbedarfBeschreibungEmpfehlung: string;
  /** Feld 21: Claude formuliert hier ausschliesslich bereits bestaetigte Angaben. */
  stabilisierungFestigung: string;
}

/** Leerer Ausgangszustand bei Fallanlage - keine HUMAN_CONFIRMED-Entscheidung ist vorbelegt. */
export function emptyAbschlussErgebnis(): AbschlussErgebnis {
  return {
    uebermittlungsanlass: null,
    vorzeitigeBeendigungArt: null,
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
    | "abschluss_ergebnis"
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
  /** Zusaetzliche Filterung/Zuordnung nach BA-Foerderzielbereich (PH-15 v1.1 Abschnitt 42, SOLL). */
  foerderzielbereiche?: BAFoerderzielbereich[];
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
  /**
   * Parallel aktive/abgeschlossene BA-Foerderzielbereiche (PH-15 v1.1 Abschnitt 84).
   * Nicht linear modelliert - mehrere Bereiche koennen gleichzeitig aktiv sein.
   */
  foerderzielbereichTracking: FoerderzielbereichTracking[];
  teilnehmerbesprechung: Teilnehmerbesprechung;
  /**
   * Gemeinsamer Stammdatenkern fuer START/VERLAUF/ABSCHLUSS (Korrekturauftrag V0.2.1,
   * A4). Direkte Identifikatoren - rein lokal, nie Teil eines Claude-Payloads.
   */
  stammdaten: Stammdaten;
  /** Abschluss-Modul (PH-17 V1.0, Migrationsplan Entscheidung 9). Nur bei luvArt="abschluss" fachlich relevant. */
  abschlussErgebnis: AbschlussErgebnis;
  /** Muss durch aktive Bestaetigung der Koordination gesetzt werden. Claude darf dies nie setzen. */
  approvedForExport: boolean;
  approvalTimestamp: string | null;
}
