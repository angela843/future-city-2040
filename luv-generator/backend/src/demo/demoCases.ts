/**
 * Fiktive Demo-Faelle (Spezifikation Abschnitt 39) und weitere fiktive Testpersonen
 * fuer die Entwicklung (Abschnitt 4). ALLE Namen, Daten und Beobachtungen sind frei
 * erfunden und dienen ausschliesslich der Demonstration des TESTSYSTEMS.
 */
import { CaseRecord, SubCompetence, EvidenceItem, SupportGoal, ComparisonClaim } from "../domain/types.js";
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
  evidenceIds: string[]
): SubCompetence {
  return { id, area, label, rating, observationNotes, evidenceIds };
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
    sub("SC_001", "schulische_grundkompetenzen", "Grundrechenarten", "ueberwiegend_sicher", "8 von 10 Aufgaben schriftlich korrekt geloest.", ["MATH_001"]),
    sub("SC_002", "schulische_grundkompetenzen", "Prozentrechnung", "foerderbedarf", "Prozentrechnung nur mit Unterstuetzung der Lehrkraft bearbeitet.", ["MATH_002"]),
    sub("SC_003", "digitale_kompetenzen", "Textverarbeitung", "staerke", "Brief nach Vorlage selbststaendig erstellt, Formatierung korrekt.", ["DIGI_001"]),
    sub("SC_004", "personale_kompetenzen", "Selbststaendigkeit", "ueberwiegend_sicher", "Arbeitsauftraege nach kurzer Erklaerung selbststaendig umgesetzt.", ["OBS_002"]),
    sub("SC_005", "sozial_kommunikative_kompetenzen", "Aktive Beteiligung", "teilweise_sicher", "Meldet sich regelmaessig, wartet ab bis aufgerufen wird.", ["OBS_001"]),
    sub("SC_006", "sozial_kommunikative_kompetenzen", "Unterstuetzung anderer", "staerke", "Unterstuetzt in Gruppenarbeiten andere Teilnehmende auf Nachfrage.", ["SOC_001"]),
    sub("SC_007", "methodische_kompetenzen", "Arbeitsplanung", "teilweise_sicher", "Benoetigt bei mehrschrittigen Aufgaben Struktur-Hilfen.", []),
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
      status: "uebernommen",
      manualOverride: false
    }
  ];

  const draft: DraftCase = {
    baseData: {
      teilnehmerName: "Alex Fiktiv",
      geburtsdatum: "2006-03-14",
      massnahme: "Berufsvorbereitende Bildungsmaßnahme (BvB) - Fachrichtung Handwerk/Technik",
      eintrittsdatum: "2026-02-01",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-02-01",
      beurteilungszeitraumBis: "2026-04-30",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "Kein Schulabschluss (fiktiv)",
      beruflicheVorerfahrung: "Keine nennenswerte Vorerfahrung.",
      bisherigePraktika: "Ein einwöchiges Schnupperpraktikum im Bereich Holzverarbeitung (fiktiv).",
      ausgangssituation: "Eintritt in die Maßnahme nach längerer Orientierungsphase, deutliches Interesse an handwerklichen Tätigkeiten."
    },
    subCompetences,
    evidence: evidenceItems,
    career: {
      berufswunsch: "Tischler/in (fiktiv)",
      alternativen: "Maler/in, Lagerlogistik",
      orientierungsstatus: "In Orientierung, erste praktische Erprobung erfolgt.",
      erprobteBerufsfelder: "Holzverarbeitung",
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
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO B - Verlaufs-LUV: tatsaechliche positive Entwicklung bei stabilem Foerderbedarf.
 * Fiktive Testperson: "Robin Beispiel"
 */
export function buildDemoB(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("MATH_001", "kompetenzfeststellung", "Einfache Prozentaufgaben selbststaendig geloest, komplexe mit Hilfe."),
    evidence("DIGI_001", "unterricht", "Tabellenkalkulation: erstmals eigenstaendig einfache Formeln genutzt."),
    evidence("OBS_001", "beobachtung", "Bringt sich in Gruppenarbeiten aktiver ein als zu Beginn der Maßnahme."),
    evidence("SOC_001", "gespraech", "Rueckmeldung aus dem Praktikumsbetrieb: zuverlaessig, braucht bei neuen Aufgaben Anleitung.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "schulische_grundkompetenzen", "Prozentrechnung", "teilweise_sicher", "Einfache Prozentaufgaben selbststaendig geloest, komplexe mit Hilfe.", ["MATH_001"]),
    sub("SC_002", "digitale_kompetenzen", "Tabellenkalkulation", "ueberwiegend_sicher", "Erstmals eigenstaendig einfache Formeln genutzt.", ["DIGI_001"]),
    sub("SC_003", "sozial_kommunikative_kompetenzen", "Beteiligung in Gruppenarbeiten", "ueberwiegend_sicher", "Bringt sich aktiver ein als zu Beginn der Massnahme.", ["OBS_001"]),
    sub("SC_004", "berufliche_orientierung_praxis", "Betriebliche Erprobung", "teilweise_sicher", "Zuverlaessig, braucht bei neuen Aufgaben weiterhin Anleitung.", ["SOC_001"])
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
      eintrittsdatum: "2025-09-01",
      luvArt: "verlauf",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-31",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "Hauptschulabschluss (fiktiv)",
      beruflicheVorerfahrung: "Keine.",
      bisherigePraktika: "Praktikum in einem fiktiven Bürobetrieb.",
      ausgangssituation: "Eintritt mit zurückhaltendem Auftreten, guter schriftsprachlicher Basis."
    },
    subCompetences,
    evidence: evidenceItems,
    career: {
      berufswunsch: "Kaufmann/-frau für Büromanagement (fiktiv)",
      alternativen: "Fachlagerist/in",
      orientierungsstatus: "Berufswunsch gefestigt, betriebliche Erprobung läuft.",
      erprobteBerufsfelder: "Büro/Verwaltung",
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
        status: "uebernommen",
        manualOverride: false
      }
    ],
    previousLuv: { rawText: previousRawText, extractedClaims: [claimPercent, claimDigi] },
    comparisonClaims: [claimPercent, claimDigi],
    sections: [],
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

/**
 * DEMO C - Abschluss-LUV: verdichtete Entwicklung mit beruflicher Perspektive.
 * Fiktive Testperson: "Kim Mustermann"
 */
export function buildDemoC(): DraftCase {
  const evidenceItems: EvidenceItem[] = [
    evidence("MATH_001", "kompetenzfeststellung", "Grundrechenarten und einfache Prozentrechnung sicher beherrscht."),
    evidence("PRACTICE_001", "betriebliche_erprobung", "Vierwöchige betriebliche Erprobung im Lager erfolgreich abgeschlossen."),
    evidence("SOC_001", "rueckmeldung_dritter", "Rückmeldung des Betriebs: pünktlich, teamfähig, übernimmt zunehmend Verantwortung.")
  ];

  const subCompetences: SubCompetence[] = [
    sub("SC_001", "schulische_grundkompetenzen", "Grundrechenarten/Prozentrechnung", "ueberwiegend_sicher", "Grundrechenarten und einfache Prozentrechnung sicher beherrscht.", ["MATH_001"]),
    sub("SC_002", "berufliche_orientierung_praxis", "Betriebliche Erprobung Lager", "staerke", "Vierwoechige betriebliche Erprobung im Lager erfolgreich abgeschlossen.", ["PRACTICE_001"]),
    sub("SC_003", "sozial_kommunikative_kompetenzen", "Teamfaehigkeit im Betrieb", "staerke", "Puenktlich, teamfaehig, uebernimmt zunehmend Verantwortung.", ["SOC_001"])
  ];

  const supportAreaCandidates = deriveSupportAreaCandidates(subCompetences, []).map((c) => ({
    ...c,
    status: "confirmed" as const
  }));

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
      eintrittsdatum: "2025-08-01",
      luvArt: "abschluss",
      beurteilungszeitraumVon: "2026-05-01",
      beurteilungszeitraumBis: "2026-07-31",
      koordination: "Team Koordination TESTSYSTEM"
    },
    startingSituation: {
      schulabschluss: "Mittlerer Schulabschluss (fiktiv)",
      beruflicheVorerfahrung: "Keine.",
      bisherigePraktika: "Mehrere Kurzpraktika im Bereich Lager (fiktiv).",
      ausgangssituation: "Eintritt mit klarem Interesse an Lagerlogistik, anfangs zurückhaltend im Kontakt mit Kolleg:innen."
    },
    subCompetences,
    evidence: evidenceItems,
    career: {
      berufswunsch: "Fachkraft für Lagerlogistik (fiktiv)",
      alternativen: "-",
      orientierungsstatus: "Berufswunsch bestätigt durch erfolgreiche betriebliche Erprobung.",
      erprobteBerufsfelder: "Lager/Logistik",
      praktikumserkenntnisse: "Durchgehend positive Rückmeldung des Betriebs, Übernahme in Aussicht (fiktiv)."
    },
    further: {
      selbsteinschaetzung: "Ich fühle mich inzwischen sicher im Umgang mit dem Team.",
      weitereBeobachtungen: "",
      freitext: ""
    },
    supportAreaCandidates,
    supportGoals: [],
    previousLuv: { rawText: previousRawText, extractedClaims: [claim] },
    comparisonClaims: [claim],
    sections: [],
    approvedForExport: false,
    approvalTimestamp: null
  };

  draft.sections = ensureSectionSkeleton({ ...draft, id: "draft", createdAt: "" });
  return draft;
}

export const DEMO_CASES = {
  A: { key: "A", label: "Demo A – Start-LUV (Alex Fiktiv)", build: buildDemoA },
  B: { key: "B", label: "Demo B – Verlaufs-LUV (Robin Beispiel)", build: buildDemoB },
  C: { key: "C", label: "Demo C – Abschluss-LUV (Kim Mustermann)", build: buildDemoC }
} as const;

export type DemoKey = keyof typeof DEMO_CASES;
