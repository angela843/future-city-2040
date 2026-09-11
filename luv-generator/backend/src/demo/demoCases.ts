/**
 * Fiktive Demo-Faelle (Spezifikation Abschnitt 39, Version 0.2 / PH-15 v1.1 Abschnitt 86)
 * und weitere fiktive Testpersonen fuer die Entwicklung. ALLE Namen, Daten und
 * Beobachtungen sind frei erfunden und dienen ausschliesslich der Demonstration des
 * TESTSYSTEMS.
 */
import { CaseRecord, SubCompetence, EvidenceItem, SupportGoal, ComparisonClaim, BAFoerderzielbereich, emptyAbschlussErgebnis, emptyStammdaten } from "../domain/types.js";
import { ensureSectionSkeleton } from "../luv_composer/composer.js";
import { deriveSupportAreaCandidates } from "../domain/supportLogic.js";
import { compareRatings } from "../domain/comparisonLogic.js";

type DraftCase = Omit<CaseRecord, "id" | "createdAt">;

function evidence(id: string, source: EvidenceItem["source"], note: string): EvidenceItem {
  return { id, source, note, createdAt: new Date().toISOString() };
}

function sub(
  id: string,
  area: SubCompetence["area"],
  label: string,
  rating: SubCompetence["rating"],
  observationNotes: string,
  evidenceIds: string[],
  foerderzielbereiche: BAFoerderzielbereich[] = []
): SubCompetence {
  return { id, area, label, rating, observationNotes, evidenceIds, relevantForLuv: true, foerderzielbereiche };
}

function emptyTeilnehmerbesprechung() {
  return {
    besprochen: null as boolean | null,
    datum: null as string | null,
    mehrfertigungAusgehaendigt: null as boolean | null,
    besprechungNichtMoeglich: false,
    hinweisGrund: ""
  };
}

function emptyCareer() {
  return {
    berufswunsch: "",
    berufswunschVorhanden: null as boolean | null,
    berufswunschGefestigt: null as boolean | null,
    berufswunschPraktischErprobt: null as boolean | null,
    alternativen: "",
    orientierungsstatus: "" as const,
    weitereOrientierungErforderlich: false,
    berufsfelder: [] as { berufsfeld: string; orientierungspraktikum: boolean; zentraleErkenntnis: string; quelle: EvidenceItem["source"] | "" }[],
    praktikumserkenntnisse: ""
  };
}

/**
 * DEMO A - Start-LUV: ausgewogene Staerken und Foerderbedarfe.
 * Fiktive Testperson: "Alex Fiktiv"
 */
export function buildDemoA(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("MATH_001", "kompetenzfeststellung", "Grundrechenarten schriftlich getestet, 8 von 10 Aufgaben korrekt."),
    evidence("MATH_002", "unterricht", "Prozentrechnung nur mit Unterstützung der Lehrkraft bearbeitet."),
    evidence("DIGI_001", "praktische_aufgabe", "Textverarbeitung: Brief nach Vorlage selbstständig erstellt."),
    evidence("OBS_001", "beobachtung", "Meldet sich im Unterricht regelmäßig, wartet ab bis aufgerufen wird."),
    evidence("OBS_002", "beobachtung", "Arbeitsaufträge werden nach kurzer Erklärung selbstständig umgesetzt."),
    evidence("SOC_001", "beobachtung", "Unterstützt in Gruppenarbeiten andere Teilnehmende auf Nachfrage."),
    evidence("PRACTICE_001", "praktikum", "Im Praktikum Werkstattaufgaben nach Anleitung zuverlässig ausgeführt."),
    evidence("SELF_001", "selbsteinschaetzung", "Ich bin gut im Team.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "schulische_grundkompetenzen", "Grundrechenarten", "ueberwiegend_sicher", "8 von 10 Aufgaben schriftlich korrekt geloest.", ["MATH_001"], ["grundkompetenzen"]),
    sub("SC_002", "schulische_grundkompetenzen", "Prozentrechnung", "foerderbedarf", "Prozentrechnung nur mit Unterstuetzung der Lehrkraft bearbeitet.", ["MATH_002"], ["grundkompetenzen"]),
    sub("SC_003", "digitale_kompetenzen", "Textverarbeitung", "staerke", "Brief nach Vorlage selbststaendig erstellt, Formatierung korrekt.", ["DIGI_001"]),
    sub("SC_004", "personale_kompetenzen", "Selbststaendigkeit", "ueberwiegend_sicher", "Arbeitsauftraege nach kurzer Erklaerung selbststaendig umgesetzt.", ["OBS_002"]),
    sub("SC_005", "sozial_kommunikative_kompetenzen", "Aktive Beteiligung", "teilweise_sicher", "Meldet sich regelmaessig, wartet ab bis aufgerufen wird.", ["OBS_001"]),
    sub("SC_006", "sozial_kommunikative_kompetenzen", "Unterstuetzung anderer", "staerke", "Unterstuetzt in Gruppenarbeiten andere Teilnehmende auf Nachfrage.", ["SOC_001"]),
    sub("SC_007", "methodische_kompetenzen", "Arbeitsplanung", "teilweise_sicher", "Benoetigt bei mehrschrittigen Aufgaben Struktur-Hilfen.", [], ["berufliche_grundfaehigkeiten"]),
    sub("SC_008", "berufliche_orientierung_praxis", "Werkstattaufgaben", "ueberwiegend_sicher", "Werkstattaufgaben nach Anleitung zuverlaessig ausgefuehrt.", ["PRACTICE_001"])
  ];

  const supportAreaCandidates = deriveSupportAreaCandidates(subCompetences, []);
  const confirmedAreas = supportAreaCandidates.map((c) => ({ ...c, status: "confirmed" as const }));

  const supportGoals: SupportGoal[] = [
    {
      id: "GOAL_001",
      supportAreaId: confirmedAreas.find((a) => a.subCompetenceId === "SC_002")?.id ?? "",
      bereich: "Prozentrechnung",
      ausgangslage: "Prozentrechnung wird aktuell nur mit Unterstuetzung bearbeitet.",
      ziel: "Einfache Prozentaufgaben sollen im weiteren Verlauf selbststaendig geloest werden koennen.",
      massnahme: "Woechentliche Uebungseinheiten mit ansteigendem Schwierigkeitsgrad.",
      ueberpruefungskriterium: "Ueberpruefung anhand eines erneuten Aufgabenblocks in der naechsten LUV.",
      foerderzielbereich: "grundkompetenzen",
      status: "uebernommen",
      manualOverride: false
    }
  ];

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Alex Fiktiv",
      geburtsdatum: "2006-03-14",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme (BvB) - Fachrichtung Handwerk/Technik",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-02-01",
      kompetenzanalyseEnde: "2026-02-28",
      massnahmeEndeGeplant: "2027-01-31",
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-02-01",
      beurteilungszeitraumBis: "2026-04-30",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "kein_schulabschluss",
      beruflicheVorerfahrung: ["praktikum"],
      bisherigePraktika: "Ein einwöchiges Schnupperpraktikum im Bereich Holzverarbeitung (fiktiv).",
      ausgangssituation: "Eintritt in die Maßnahme nach längerer Orientierungsphase, deutliches Interesse an handwerklichen Tätigkeiten."
    },
    subCompetences,
    evidence: evidenceItems,
    career: {
      ...emptyCareer(),
      berufswunsch: "Tischler/in (fiktiv)",
      berufswunschVorhanden: true,
      berufswunschPraktischErprobt: true,
      alternativen: "Maler/in, Lagerlogistik",
      orientierungsstatus: "grundsaetzlich_vorhanden",
      berufsfelder: [
        { berufsfeld: "Holzverarbeitung", orientierungspraktikum: true, zentraleErkenntnis: "Handwerkliches Geschick, Interesse an Werkzeugen.", quelle: "praktikum" }
      ],
      praktikumserkenntnisse: "Zeigte im Schnupperpraktikum handwerkliches Geschick und Interesse an Werkzeugen."
    },
    further: {
      selbsteinschaetzung: "Ich bin gut im Team.",
      weitereBeobachtungen: "",
      freitext: ""
    },
    supportAreaCandidates: confirmedAreas,
    supportGoals,
    previousLuv: null,
    comparisonClaims: [],
    sections: [],
    foerderzielbereichTracking: [{ bereich: "grundkompetenzen", status: "aktiv", von: null, bis: null }],
    teilnehmerbesprechung: emptyTeilnehmerbesprechung(),
    stammdaten: emptyStammdaten(),
    abschlussErgebnis: emptyAbschlussErgebnis(),
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO B - Start-LUV mit sehr wenigen Daten (PH-15 Abschnitt 58).
 * Demonstriert den Qualitaets-/Vollstaendigkeitscheck: viele Bereiche "nicht erhoben",
 * keine dokumentierte Ressource - das System warnt, ergaenzt aber nichts automatisch.
 * Fiktive Testperson: "Sam Wenigdaten"
 */
export function buildDemoB(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("OBS_001", "beobachtung", "Erscheint regelmäßig zu den vereinbarten Terminen.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "schulische_grundkompetenzen", "Grundrechenarten", "nicht_erhoben", "", []),
    sub("SC_002", "personale_kompetenzen", "Pünktlichkeit", "ueberwiegend_sicher", "Erscheint regelmäßig zu den vereinbarten Terminen.", ["OBS_001"])
  ];

  const supportAreaCandidates = deriveSupportAreaCandidates(subCompetences, []);

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Sam Wenigdaten",
      geburtsdatum: "2006-09-01",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme (BvB)",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-03-02",
      kompetenzanalyseEnde: null,
      massnahmeEndeGeplant: "2027-03-01",
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-03-02",
      beurteilungszeitraumBis: "2026-03-16",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "nicht_bekannt",
      beruflicheVorerfahrung: [],
      bisherigePraktika: "",
      ausgangssituation: "Sehr früher Zeitpunkt im Maßnahmenverlauf (erste zwei Wochen), noch kaum belastbare fachliche Beobachtungen vorhanden."
    },
    subCompetences,
    evidence: evidenceItems,
    career: emptyCareer(),
    further: {
      selbsteinschaetzung: "",
      weitereBeobachtungen: "",
      freitext: ""
    },
    supportAreaCandidates,
    supportGoals: [],
    previousLuv: null,
    comparisonClaims: [],
    sections: [],
    foerderzielbereichTracking: [],
    teilnehmerbesprechung: emptyTeilnehmerbesprechung(),
    stammdaten: emptyStammdaten(),
    abschlussErgebnis: emptyAbschlussErgebnis(),
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO C - Start-LUV mit problematischen pauschalen Formulierungen (PH-15 Abschnitt 58).
 * Demonstriert den Konkretisierungsassistenten: die Beobachtungsstichpunkte enthalten
 * bewusst kritische, pauschale Begriffe.
 * Fiktive Testperson: "Jamie Pauschal"
 */
export function buildDemoC(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("OBS_001", "beobachtung", "Ist faul und unmotiviert bei den Aufgaben."),
    evidence("OBS_002", "beobachtung", "Wirkt im Unterricht oft unkonzentriert.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "personale_kompetenzen", "Arbeitsbereitschaft", "foerderbedarf", "Ist faul und unmotiviert bei den Aufgaben.", ["OBS_001"]),
    sub("SC_002", "methodische_kompetenzen", "Selbstkontrolle", "foerderbedarf", "Wirkt im Unterricht oft unkonzentriert.", ["OBS_002"])
  ];

  const supportAreaCandidates = deriveSupportAreaCandidates(subCompetences, []);

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Jamie Pauschal",
      geburtsdatum: "2006-01-11",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme (BvB)",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-12",
      kompetenzanalyseEnde: "2026-02-09",
      massnahmeEndeGeplant: "2026-12-11",
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-01-12",
      beurteilungszeitraumBis: "2026-03-12",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "kein_schulabschluss",
      beruflicheVorerfahrung: ["keine"],
      bisherigePraktika: "",
      ausgangssituation: "Eintritt nach längerer Phase ohne Beschäftigung."
    },
    subCompetences,
    evidence: evidenceItems,
    career: emptyCareer(),
    further: {
      selbsteinschaetzung: "",
      weitereBeobachtungen: "",
      freitext: ""
    },
    supportAreaCandidates,
    supportGoals: [],
    previousLuv: null,
    comparisonClaims: [],
    sections: [],
    foerderzielbereichTracking: [],
    teilnehmerbesprechung: emptyTeilnehmerbesprechung(),
    stammdaten: emptyStammdaten(),
    abschlussErgebnis: emptyAbschlussErgebnis(),
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO D - Verlaufs-LUV: tatsaechliche positive Entwicklung bei stabilem Foerderbedarf.
 * (PH-15 Abschnitt 58: "Demo D - Verlaufs-LUV mit echter Entwicklung")
 * Fiktive Testperson: "Robin Beispiel"
 */
export function buildDemoD(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("MATH_001", "kompetenzfeststellung", "Einfache Prozentaufgaben selbststaendig geloest, komplexe mit Hilfe."),
    evidence("DIGI_001", "unterricht", "Tabellenkalkulation: erstmals eigenstaendig einfache Formeln genutzt."),
    evidence("OBS_001", "beobachtung", "Bringt sich in Gruppenarbeiten aktiver ein als zu Beginn der Maßnahme."),
    evidence("SOC_001", "gespraech", "Rueckmeldung aus dem Praktikumsbetrieb: zuverlaessig, braucht bei neuen Aufgaben Anleitung.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "schulische_grundkompetenzen", "Prozentrechnung", "teilweise_sicher", "Einfache Prozentaufgaben selbststaendig geloest, komplexe mit Hilfe.", ["MATH_001"], ["grundkompetenzen"]),
    sub("SC_002", "digitale_kompetenzen", "Tabellenkalkulation", "ueberwiegend_sicher", "Erstmals eigenstaendig einfache Formeln genutzt.", ["DIGI_001"]),
    sub("SC_003", "sozial_kommunikative_kompetenzen", "Beteiligung in Gruppenarbeiten", "ueberwiegend_sicher", "Bringt sich aktiver ein als zu Beginn der Massnahme.", ["OBS_001"]),
    sub("SC_004", "berufliche_orientierung_praxis", "Betriebliche Erprobung", "teilweise_sicher", "Zuverlaessig, braucht bei neuen Aufgaben weiterhin Anleitung.", ["SOC_001"], ["berufliche_grundfaehigkeiten"])
  ];

  const supportAreaCandidates = deriveSupportAreaCandidates(subCompetences, []).map((c) => ({
    ...c,
    status: "confirmed" as const
  }));

  const previousRawText =
    "Prozentrechnung nur mit Unterstützung. EDV-Kenntnisse wurden bisher nicht erhoben. " +
    "Beteiligt sich im Unterricht selten aktiv.";

  const claimPercent: ComparisonClaim = {
    id: "CMP_001",
    subCompetenceId: "SC_001",
    areaLabel: "Prozentrechnung",
    previousText: "Prozentrechnung nur mit Unterstützung.",
    currentText: "Einfache Prozentaufgaben selbstständig, komplexe mit Hilfe.",
    previousRating: "foerderbedarf",
    currentRating: "teilweise_sicher",
    suggestedStatus: compareRatings("foerderbedarf", "teilweise_sicher"),
    confirmed: true,
    confirmedStatus: compareRatings("foerderbedarf", "teilweise_sicher")
  };

  const claimDigi: ComparisonClaim = {
    id: "CMP_002",
    subCompetenceId: "SC_002",
    areaLabel: "Digitale Kompetenzen",
    previousText: "EDV-Kenntnisse wurden bisher nicht erhoben.",
    currentText: "Erstmals eigenständig einfache Formeln in der Tabellenkalkulation genutzt.",
    previousRating: "nicht_erhoben",
    currentRating: "ueberwiegend_sicher",
    suggestedStatus: compareRatings("nicht_erhoben", "ueberwiegend_sicher"),
    confirmed: true,
    confirmedStatus: compareRatings("nicht_erhoben", "ueberwiegend_sicher")
  };

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Robin Beispiel",
      geburtsdatum: "2005-11-02",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme (BvB) - Fachrichtung Wirtschaft/Verwaltung",
      massnahmeart: "bvb1",
      eintrittsdatum: "2025-09-01",
      kompetenzanalyseEnde: "2025-10-03",
      massnahmeEndeGeplant: "2026-08-31",
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "verlauf",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-31",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "esa",
      beruflicheVorerfahrung: ["keine"],
      bisherigePraktika: "Praktikum in einem fiktiven Bürobetrieb.",
      ausgangssituation: "Eintritt mit zurückhaltendem Auftreten, guter schriftsprachlicher Basis."
    },
    subCompetences,
    evidence: evidenceItems,
    career: {
      ...emptyCareer(),
      berufswunsch: "Kaufmann/-frau für Büromanagement (fiktiv)",
      berufswunschVorhanden: true,
      berufswunschGefestigt: true,
      berufswunschPraktischErprobt: true,
      alternativen: "Fachlagerist/in",
      orientierungsstatus: "konkret",
      berufsfelder: [
        { berufsfeld: "Büro/Verwaltung", orientierungspraktikum: false, zentraleErkenntnis: "Zuverlässig, benötigt bei neuen Aufgaben zunächst Anleitung.", quelle: "betriebliche_erprobung" }
      ],
      praktikumserkenntnisse: "Zuverlässig, benötigt bei neuen Aufgaben zunächst Anleitung."
    },
    further: {
      selbsteinschaetzung: "Ich fühle mich im Betrieb inzwischen sicherer als zu Beginn.",
      weitereBeobachtungen: "",
      freitext: ""
    },
    supportAreaCandidates,
    supportGoals: [
      {
        id: "GOAL_001",
        supportAreaId: supportAreaCandidates.find((a) => a.subCompetenceId === "SC_001")?.id ?? "",
        bereich: "Prozentrechnung",
        ausgangslage: "Prozentrechnung gelingt bei einfachen Aufgaben bereits selbstständig.",
        ziel: "Sicherheit auch bei komplexeren Prozentaufgaben aufbauen.",
        massnahme: "Fortführung der wöchentlichen Übungseinheiten mit steigendem Anspruch.",
        ueberpruefungskriterium: "Erneute Überprüfung in der Abschluss-LUV.",
        foerderzielbereich: "grundkompetenzen",
        status: "uebernommen",
        manualOverride: false
      }
    ],
    previousLuv: { rawText: previousRawText, extractedClaims: [claimPercent, claimDigi] },
    comparisonClaims: [claimPercent, claimDigi],
    sections: [],
    foerderzielbereichTracking: [{ bereich: "grundkompetenzen", status: "aktiv", von: null, bis: null }],
    teilnehmerbesprechung: { besprochen: true, datum: "2026-04-02", mehrfertigungAusgehaendigt: true, besprechungNichtMoeglich: false, hinweisGrund: "" },
    stammdaten: emptyStammdaten(),
    abschlussErgebnis: emptyAbschlussErgebnis(),
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO E - Abschluss-LUV: verdichtete Entwicklung mit beruflicher Perspektive und Zielstatus.
 * (PH-15 Abschnitt 58: "Demo E - Abschluss-LUV mit Zielstatus und Perspektive")
 * Fiktive Testperson: "Kim Mustermann"
 */
export function buildDemoE(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("MATH_001", "kompetenzfeststellung", "Grundrechenarten und einfache Prozentrechnung sicher beherrscht."),
    evidence("PRACTICE_001", "betriebliche_erprobung", "Vierwöchige betriebliche Erprobung im Lager erfolgreich abgeschlossen."),
    evidence("SOC_001", "rueckmeldung_dritter", "Rückmeldung des Betriebs: pünktlich, teamfähig, übernimmt zunehmend Verantwortung.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "schulische_grundkompetenzen", "Grundrechenarten/Prozentrechnung", "ueberwiegend_sicher", "Grundrechenarten und einfache Prozentrechnung sicher beherrscht.", ["MATH_001"], ["grundkompetenzen"]),
    sub("SC_002", "berufliche_orientierung_praxis", "Betriebliche Erprobung Lager", "staerke", "Vierwoechige betriebliche Erprobung im Lager erfolgreich abgeschlossen.", ["PRACTICE_001"], ["berufsspezifische_qualifizierung"]),
    sub("SC_003", "sozial_kommunikative_kompetenzen", "Teamfaehigkeit im Betrieb", "staerke", "Puenktlich, teamfaehig, uebernimmt zunehmend Verantwortung.", ["SOC_001"])
  ];

  // Kein aktueller Foerderbereich mehr ausgeloest (alle Bewertungen staerke/ueberwiegend_sicher) -
  // das fruehere Foerderziel "Prozentrechnung" wird hier zur Demonstration von PH-15 Abschnitt 22/55
  // (Zielstatus im Abschluss-LUV) manuell als abgeschlossen nachgezeichnet.
  const closedSupportArea = {
    id: "SUPPORT_SC_001_CLOSED",
    subCompetenceId: "SC_001",
    area: "schulische_grundkompetenzen" as const,
    label: "Grundrechenarten/Prozentrechnung",
    triggerLevel: "development" as const,
    status: "confirmed" as const
  };
  const supportAreaCandidates = [closedSupportArea];

  const previousRawText = "Prozentrechnung teilweise sicher, weiterer Uebungsbedarf bei komplexen Aufgaben.";
  const claim: ComparisonClaim = {
    id: "CMP_001",
    subCompetenceId: "SC_001",
    areaLabel: "Grundrechenarten/Prozentrechnung",
    previousText: previousRawText,
    currentText: "Grundrechenarten und einfache Prozentrechnung sicher beherrscht.",
    previousRating: "teilweise_sicher",
    currentRating: "ueberwiegend_sicher",
    suggestedStatus: compareRatings("teilweise_sicher", "ueberwiegend_sicher"),
    confirmed: true,
    confirmedStatus: compareRatings("teilweise_sicher", "ueberwiegend_sicher")
  };

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Kim Mustermann",
      geburtsdatum: "2005-06-20",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme (BvB) - Fachrichtung Lager/Logistik",
      massnahmeart: "bvb1",
      eintrittsdatum: "2025-08-01",
      kompetenzanalyseEnde: "2025-09-02",
      massnahmeEndeGeplant: "2026-07-31",
      tatsaechlicherLetzterTeilnahmetag: "2026-07-31",
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "abschluss",
      beurteilungszeitraumVon: "2026-05-01",
      beurteilungszeitraumBis: "2026-07-31",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "msa",
      beruflicheVorerfahrung: ["mehrere_praktika"],
      bisherigePraktika: "Mehrere Kurzpraktika im Bereich Lager (fiktiv).",
      ausgangssituation: "Eintritt mit klarem Interesse an Lagerlogistik, anfangs zurückhaltend im Kontakt mit Kolleg:innen."
    },
    subCompetences,
    evidence: evidenceItems,
    career: {
      ...emptyCareer(),
      berufswunsch: "Fachkraft für Lagerlogistik (fiktiv)",
      berufswunschVorhanden: true,
      berufswunschGefestigt: true,
      berufswunschPraktischErprobt: true,
      alternativen: "-",
      orientierungsstatus: "konkret",
      berufsfelder: [
        { berufsfeld: "Lager/Logistik", orientierungspraktikum: false, zentraleErkenntnis: "Durchgehend positive Rückmeldung des Betriebs.", quelle: "betriebliche_erprobung" }
      ],
      praktikumserkenntnisse: "Durchgehend positive Rückmeldung des Betriebs, Übernahme in Aussicht (fiktiv)."
    },
    further: {
      selbsteinschaetzung: "Ich fühle mich inzwischen sicher im Umgang mit dem Team.",
      weitereBeobachtungen: "",
      freitext: ""
    },
    supportAreaCandidates,
    supportGoals: [
      {
        id: "GOAL_001",
        supportAreaId: closedSupportArea.id,
        bereich: "Grundrechenarten/Prozentrechnung",
        ausgangslage: "Prozentrechnung war zu Beginn des Beurteilungszeitraums teilweise sicher, mit Übungsbedarf bei komplexen Aufgaben.",
        ziel: "Prozentrechnung im Alltags- und Berufsbezug sicher anwenden können.",
        massnahme: "Praxisbezogene Übungsaufgaben und Wiederholungssequenzen.",
        ueberpruefungskriterium: "Erneute Kompetenzfeststellung zum Ende des Beurteilungszeitraums.",
        foerderzielbereich: "grundkompetenzen",
        completionStatus: "erreicht",
        status: "uebernommen",
        manualOverride: false
      }
    ],
    previousLuv: { rawText: previousRawText, extractedClaims: [claim] },
    comparisonClaims: [claim],
    sections: [],
    foerderzielbereichTracking: [{ bereich: "grundkompetenzen", status: "abgeschlossen", von: null, bis: null }],
    teilnehmerbesprechung: { besprochen: true, datum: "2026-07-28", mehrfertigungAusgehaendigt: true, besprechungNichtMoeglich: false, hinweisGrund: "" },
    stammdaten: emptyStammdaten(),
    abschlussErgebnis: emptyAbschlussErgebnis(),
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO F - BvB, Start-LUV mit mehreren gleichzeitig aktiven BA-Foerderzielbereichen
 * (PH-15 v1.1 Abschnitt 86: "BvB mit mehreren aktiven Förderzielbereichen").
 * Demonstriert PH-15 v1.1 Abschnitt 84: Foerderzielbereiche laufen parallel, nicht linear.
 * Fiktive Testperson: "Toni Mehrbereich"
 */
export function buildDemoF(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("MATH_001", "kompetenzfeststellung", "Grundrechenarten nur mit Unterstützung sicher."),
    evidence("PRACTICE_001", "praktische_aufgabe", "Werkstattaufgaben nach mehrfacher Anleitung selbstständig fortgeführt."),
    evidence("OBS_001", "beobachtung", "Berufswunsch noch nicht gefestigt, mehrere Berufsfelder werden aktuell erprobt.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "schulische_grundkompetenzen", "Grundrechenarten", "foerderbedarf", "Grundrechenarten nur mit Unterstützung sicher.", ["MATH_001"], ["grundkompetenzen"]),
    sub(
      "SC_002",
      "berufliche_orientierung_praxis",
      "Werkstattaufgaben",
      "teilweise_sicher",
      "Werkstattaufgaben nach mehrfacher Anleitung selbstständig fortgeführt.",
      ["PRACTICE_001"],
      ["berufliche_grundfaehigkeiten", "berufsspezifische_qualifizierung"]
    ),
    sub("SC_003", "personale_kompetenzen", "Berufsorientierung", "teilweise_sicher", "Berufswunsch noch nicht gefestigt, mehrere Berufsfelder werden aktuell erprobt.", ["OBS_001"], ["berufsorientierung_berufswahl"])
  ];

  const supportAreaCandidates = deriveSupportAreaCandidates(subCompetences, []).map((c) => ({ ...c, status: "confirmed" as const }));

  const supportGoals: SupportGoal[] = [
    {
      id: "GOAL_001",
      supportAreaId: supportAreaCandidates.find((a) => a.subCompetenceId === "SC_001")?.id ?? "",
      bereich: "Grundrechenarten",
      ausgangslage: "Grundrechenarten gelingen aktuell nur mit Unterstützung.",
      ziel: "Grundrechenarten im Alltagsbezug selbstständig anwenden können.",
      massnahme: "Praxisbezogene Übungsaufgaben.",
      ueberpruefungskriterium: "Erneute Kompetenzfeststellung zur nächsten LUV.",
      foerderzielbereich: "grundkompetenzen",
      prioritaet: "A",
      status: "uebernommen",
      manualOverride: false
    },
    {
      id: "GOAL_002",
      supportAreaId: supportAreaCandidates.find((a) => a.subCompetenceId === "SC_002")?.id ?? "",
      bereich: "Werkstattaufgaben",
      ausgangslage: "Werkstattaufgaben werden nach mehrfacher Anleitung selbstständig fortgeführt.",
      ziel: "Werkstattaufgaben zunehmend selbstständig ohne wiederholte Anleitung bearbeiten.",
      massnahme: "Schrittweise Reduzierung der Anleitung, Checklisten.",
      ueberpruefungskriterium: "Rückmeldung aus der Werkstattpraxis zur nächsten LUV.",
      foerderzielbereich: "berufliche_grundfaehigkeiten",
      prioritaet: "B",
      status: "uebernommen",
      manualOverride: false
    },
    {
      id: "GOAL_003",
      supportAreaId: supportAreaCandidates.find((a) => a.subCompetenceId === "SC_003")?.id ?? "",
      bereich: "Berufsorientierung",
      ausgangslage: "Berufswunsch ist noch nicht gefestigt.",
      ziel: "Weitere Berufsfelder erproben und Berufswunsch schrittweise festigen.",
      massnahme: "Zusätzliche Berufsfelderprobungen, Auswertungsgespräche.",
      ueberpruefungskriterium: "Auswertung der Erprobungen zur nächsten LUV.",
      foerderzielbereich: "berufsorientierung_berufswahl",
      prioritaet: "B",
      status: "uebernommen",
      manualOverride: false
    }
  ];

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Toni Mehrbereich",
      geburtsdatum: "2006-05-19",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme (BvB) - Fachrichtung Handwerk/Technik",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-02-02",
      kompetenzanalyseEnde: "2026-03-06",
      massnahmeEndeGeplant: "2027-02-01",
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-02-02",
      beurteilungszeitraumBis: "2026-04-30",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "kein_schulabschluss",
      beruflicheVorerfahrung: ["praktikum", "mehrere_praktika"],
      bisherigePraktika: "Mehrere Kurzpraktika in unterschiedlichen Berufsfeldern (fiktiv).",
      ausgangssituation: "Eintritt mit noch offener beruflicher Orientierung, mehrere parallele Förderthemen."
    },
    subCompetences,
    evidence: evidenceItems,
    career: {
      ...emptyCareer(),
      berufswunschVorhanden: false,
      weitereOrientierungErforderlich: true,
      orientierungsstatus: "weitere_orientierung_erforderlich",
      berufsfelder: [
        { berufsfeld: "Holz/Technik", orientierungspraktikum: true, zentraleErkenntnis: "Interesse vorhanden, noch keine Festlegung.", quelle: "praktikum" },
        { berufsfeld: "Lager/Logistik", orientierungspraktikum: true, zentraleErkenntnis: "Ebenfalls Interesse, Vergleich mit erstem Feld noch offen.", quelle: "praktikum" }
      ]
    },
    further: { selbsteinschaetzung: "", weitereBeobachtungen: "", freitext: "" },
    supportAreaCandidates,
    supportGoals,
    previousLuv: null,
    comparisonClaims: [],
    sections: [],
    foerderzielbereichTracking: [
      { bereich: "grundkompetenzen", status: "aktiv", von: null, bis: null },
      { bereich: "berufliche_grundfaehigkeiten", status: "aktiv", von: null, bis: null },
      { bereich: "berufsorientierung_berufswahl", status: "begonnen", von: null, bis: null }
    ],
    teilnehmerbesprechung: emptyTeilnehmerbesprechung(),
    stammdaten: emptyStammdaten(),
    abschlussErgebnis: emptyAbschlussErgebnis(),
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO G - BvB-Reha mit sensibler Information, die ueber die bestehende Privacy-
 * Gateway-/Sensitive-Content-Erkennung blockiert werden MUSS, ohne dass die
 * Massnahmeart BvB-Reha selbst blockiert wird (PH-15 v1.1 Abschnitt 73, MUSS).
 * Fiktive Testperson: "Sascha Reha"
 */
export function buildDemoG(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("OBS_001", "beobachtung", "Arbeitet konzentriert, benötigt bei komplexen Aufgaben mehr Zeit als der Durchschnitt."),
    evidence(
      "OBS_002",
      "vorhandene_dokumentation",
      "Ärztliche Diagnose liegt laut vorliegender Dokumentation vor, nimmt regelmäßig Medikamente (TESTSYSTEM - sensibler Beispieltext zur Demonstration der Privacy-Gateway-Blockade)."
    )
  ];

  const subCompetences: SubCompetence[] = [
    sub(
      "SC_001",
      "personale_kompetenzen",
      "Ausdauer",
      "teilweise_sicher",
      "Arbeitet konzentriert, benötigt bei komplexen Aufgaben mehr Zeit als der Durchschnitt.",
      ["OBS_001"]
    ),
    // Bewusst sensibler Beobachtungstext (PH-15 v1.1 Abschnitt 73/75): darf NICHT an Claude
    // uebertragen werden und darf NICHT in regulaeren LUV-/EMAW-Text uebernommen werden.
    sub(
      "SC_002",
      "personale_kompetenzen",
      "Belastbarkeit",
      "nicht_beurteilbar",
      "Ärztliche Diagnose liegt laut vorliegender Dokumentation vor, nimmt regelmäßig Medikamente (TESTSYSTEM - sensibler Beispieltext zur Demonstration der Privacy-Gateway-Blockade).",
      ["OBS_002"]
    )
  ];

  const supportAreaCandidates = deriveSupportAreaCandidates(subCompetences, []);

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Sascha Reha",
      geburtsdatum: "2005-12-08",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme Reha (BvB-Reha) - Fachrichtung Wirtschaft/Verwaltung",
      massnahmeart: "bvb2",
      eintrittsdatum: "2026-01-05",
      kompetenzanalyseEnde: "2026-02-16",
      massnahmeEndeGeplant: "2027-06-30",
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-01-05",
      beurteilungszeitraumBis: "2026-04-05",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "esa",
      beruflicheVorerfahrung: ["keine"],
      bisherigePraktika: "",
      ausgangssituation: "Eintritt in BvB-Reha nach längerer Kompetenzanalyse-Phase (fiktiv, Regelfall BvB-Reha: bis zu 6 Wochen)."
    },
    subCompetences,
    evidence: evidenceItems,
    career: emptyCareer(),
    further: { selbsteinschaetzung: "", weitereBeobachtungen: "", freitext: "" },
    supportAreaCandidates,
    supportGoals: [],
    previousLuv: null,
    comparisonClaims: [],
    sections: [],
    foerderzielbereichTracking: [],
    teilnehmerbesprechung: emptyTeilnehmerbesprechung(),
    stammdaten: emptyStammdaten(),
    abschlussErgebnis: emptyAbschlussErgebnis(),
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

export const DEMO_CASES = {
  A: { key: "A", label: "Demo A – Start-LUV, ausgewogen (Alex Fiktiv)", build: buildDemoA },
  B: { key: "B", label: "Demo B – Start-LUV, sehr wenige Daten (Sam Wenigdaten)", build: buildDemoB },
  C: { key: "C", label: "Demo C – Start-LUV, pauschale Formulierungen (Jamie Pauschal)", build: buildDemoC },
  D: { key: "D", label: "Demo D – Verlaufs-LUV, echte Entwicklung (Robin Beispiel)", build: buildDemoD },
  E: { key: "E", label: "Demo E – Abschluss-LUV, Zielstatus & Perspektive (Kim Mustermann)", build: buildDemoE },
  F: { key: "F", label: "Demo F – BvB, mehrere aktive Förderzielbereiche (Toni Mehrbereich)", build: buildDemoF },
  G: { key: "G", label: "Demo G – BvB-Reha, sensible Angabe wird blockiert (Sascha Reha)", build: buildDemoG }
} as const;

export type DemoKey = keyof typeof DEMO_CASES;
