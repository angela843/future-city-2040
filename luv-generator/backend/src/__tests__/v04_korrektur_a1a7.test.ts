/**
 * Korrekturauftrag Version 0.2.1 (A1-A7) - neue Testfaelle.
 * Ergaenzt v02.test.ts / v02_ph15_v11.test.ts / v03_ph17.test.ts (bleiben unveraendert
 * Teil der Suite, Abschnitt 0 des Korrekturauftrags: bestehende Regressionstests
 * muessen weiter bestehen).
 *
 * Deckt ausschliesslich A1-A7 ab:
 *  A1 Abschlussstruktur bereinigen
 *  A2 Tatsaechlicher letzter Teilnahmetag fuer die Abschlussfrist
 *  A3 Abschluss-Vollstaendigkeitsvalidierung (HUMAN_CONFIRMED-Wertpruefung)
 *  A4 Gemeinsamer Stammdatenkern fuer START/VERLAUF/ABSCHLUSS
 *  A5 Foerderzielbereiche mit Von/Bis-Zeitraeumen
 *  A6 Rollenbezogene Zielvereinbarung im Output gruppiert
 *  A7 Privacy Gateway Freitext-Haertung
 */
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../web/app.js";
import { clearAllCases, getCase, putCase } from "../web/store.js";
import { computeFristen } from "../domain/fristenLogic.js";
import { CaseRecord } from "../domain/types.js";
import { runPrivacyGateway } from "../privacy/gateway.js";
import { directIdentifierValuesForCase } from "../privacy/knownIdentifiers.js";

const app = createApp();

async function createCase(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/cases")
    .send({
      teilnehmerName: "Test Person (fiktiv)",
      geburtsdatum: "2005-01-01",
      massnahme: "Testmaßnahme",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      kompetenzanalyseEnde: "2026-01-29",
      massnahmeEndeGeplant: "2026-12-01",
      massnahmeziel: "berufsausbildung",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "Test Koordination",
      ...overrides
    });
  return res;
}

describe("Korrekturauftrag V0.2.1 - A1 Abschlussstruktur bereinigen", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("A1: Abschluss-LuV enthaelt ausschliesslich die Abschlussstruktur, keine Start-/Verlaufs-Kompetenzabschnitte", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    expect(res.status).toBe(201);
    const record = res.body as CaseRecord;
    const keys = record.sections.map((s) => s.key);
    expect(keys).toEqual(["abschluss_ergebnis"]);
    const verbotene = [
      "initial_situation",
      "development",
      "school_competences",
      "digital_competences",
      "personal_competences",
      "social_competences",
      "methodical_competences",
      "practical_competences",
      "career_orientation",
      "support_needs",
      "support_goals",
      "overall_assessment",
      "perspective"
    ];
    for (const key of verbotene) {
      expect(keys).not.toContain(key);
    }
  });

  it("A1: START und VERLAUF sind durch die Abschluss-Bereinigung unveraendert", async () => {
    const start = await createCase({ luvArt: "start" });
    expect((start.body as CaseRecord).sections.map((s) => s.key)).toEqual([
      "initial_situation",
      "school_competences",
      "personal_competences",
      "methodical_competences",
      "social_competences",
      "practical_competences",
      "career_orientation",
      "support_needs",
      "support_goals",
      "perspective"
    ]);

    const verlauf = await createCase({ luvArt: "verlauf" });
    expect((verlauf.body as CaseRecord).sections.map((s) => s.key)).toEqual([
      "initial_situation",
      "development",
      "school_competences",
      "personal_competences",
      "methodical_competences",
      "social_competences",
      "practical_competences",
      "career_orientation",
      "support_needs",
      "support_goals",
      "perspective"
    ]);
  });
});

describe("Korrekturauftrag V0.2.1 - A2 Tatsaechlicher letzter Teilnahmetag", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("A2: reguläres Ende - Abschlussfrist kommt aus dem tatsächlichen letzten Teilnahmetag, nicht aus dem geplanten Maßnahmeende", () => {
    const fristen = computeFristen({
      teilnehmerName: "x",
      geburtsdatum: null,
      massnahme: "x",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      kompetenzanalyseEnde: "2026-02-01",
      massnahmeEndeGeplant: "2026-12-01",
      tatsaechlicherLetzterTeilnahmetag: "2026-11-28",
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "abschluss",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "x"
    });
    expect(fristen.abschlussLuvFaellig).toBe("2026-11-28");
    expect(fristen.abschlussLuvFaelligHinweis).toBeNull();
  });

  it("A2: vorzeitige Beendigung - das (frühere) tatsächliche Austrittsdatum ist maßgeblich, nicht das geplante Maßnahmeende", () => {
    const fristen = computeFristen({
      teilnehmerName: "x",
      geburtsdatum: null,
      massnahme: "x",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      kompetenzanalyseEnde: "2026-02-01",
      massnahmeEndeGeplant: "2026-12-01",
      tatsaechlicherLetzterTeilnahmetag: "2026-05-15",
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "abschluss",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "x"
    });
    expect(fristen.abschlussLuvFaellig).toBe("2026-05-15");
    expect(fristen.abschlussLuvFaelligHinweis).toBeNull();
  });

  it("A2: fehlt der tatsächliche letzte Teilnahmetag, wird KEINE Abschlussfrist als verbindlich ausgegeben (kein Rückfall auf das geplante Maßnahmeende)", () => {
    const fristen = computeFristen({
      teilnehmerName: "x",
      geburtsdatum: null,
      massnahme: "x",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      kompetenzanalyseEnde: "2026-02-01",
      massnahmeEndeGeplant: "2026-12-01",
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "abschluss",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "x"
    });
    expect(fristen.abschlussLuvFaellig).toBeNull();
    expect(fristen.abschlussLuvFaelligHinweis).toBeTruthy();
  });
});

describe("Korrekturauftrag V0.2.1 - A3 Abschluss-Vollständigkeitsvalidierung", () => {
  beforeEach(() => {
    clearAllCases();
  });

  async function approveAndGetError(caseId: string) {
    const res = await request(app)
      .post(`/api/cases/${caseId}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    return res;
  }

  it("A3 Negativ: humanConfirmed=true + value=null (Ausbildungsreife) blockiert die Freigabe trotz gesetztem Flag", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    const record = getCase(res.body.id)!;
    record.abschlussErgebnis.ausbildungsreifeErreicht = { value: null, humanConfirmed: true };
    record.abschlussErgebnis.berufseignung = { value: "Lagerlogistik (fiktiv)", humanConfirmed: true };
    record.abschlussErgebnis.unterstuetzungsbedarf = { value: "nein", humanConfirmed: true };
    putCase(record);

    const approveRes = await approveAndGetError(record.id);
    expect(approveRes.status).toBe(409);
    expect(approveRes.body.error.code).toBe("pre_validation_blocked");
    expect(approveRes.body.error.message).toMatch(/Ausbildungsreife/);
  });

  it("A3 Negativ: humanConfirmed=true + leerer Wert (Berufseignung) blockiert die Freigabe", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    const record = getCase(res.body.id)!;
    record.abschlussErgebnis.ausbildungsreifeErreicht = { value: "ja", humanConfirmed: true };
    record.abschlussErgebnis.berufseignung = { value: "   ", humanConfirmed: true };
    record.abschlussErgebnis.unterstuetzungsbedarf = { value: "nein", humanConfirmed: true };
    putCase(record);

    const approveRes = await approveAndGetError(record.id);
    expect(approveRes.status).toBe(409);
    expect(approveRes.body.error.code).toBe("pre_validation_blocked");
    expect(approveRes.body.error.message).toMatch(/Berufseignung/);
  });

  it("A3 Negativ: Unterstützungsbedarf=Ja ohne Beschreibung/Empfehlung blockiert die Freigabe", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    const record = getCase(res.body.id)!;
    record.abschlussErgebnis.ausbildungsreifeErreicht = { value: "ja", humanConfirmed: true };
    record.abschlussErgebnis.berufseignung = { value: "Lagerlogistik (fiktiv)", humanConfirmed: true };
    record.abschlussErgebnis.unterstuetzungsbedarf = { value: "ja", humanConfirmed: true };
    record.abschlussErgebnis.unterstuetzungsbedarfBeschreibungEmpfehlung = "";
    putCase(record);

    const approveRes = await approveAndGetError(record.id);
    expect(approveRes.status).toBe(409);
    expect(approveRes.body.error.code).toBe("pre_validation_blocked");
    expect(approveRes.body.error.message).toMatch(/Unterstützungsbedarf/);

    // Nach Ergänzung der Beschreibung ist die Freigabe möglich.
    record.abschlussErgebnis.unterstuetzungsbedarfBeschreibungEmpfehlung = "Empfehlung: Nachbetreuung durch Bildungsbegleitung (fiktiv).";
    putCase(record);
    const okRes = await approveAndGetError(record.id);
    expect(okRes.status).toBe(200);
  });

  it("A3 Positiv: Unterstützungsbedarf=Nein erzwingt KEINE Beschreibung", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    const record = getCase(res.body.id)!;
    record.abschlussErgebnis.ausbildungsreifeErreicht = { value: "ja", humanConfirmed: true };
    record.abschlussErgebnis.berufseignung = { value: "Lagerlogistik (fiktiv)", humanConfirmed: true };
    record.abschlussErgebnis.unterstuetzungsbedarf = { value: "nein", humanConfirmed: true };
    record.abschlussErgebnis.unterstuetzungsbedarfBeschreibungEmpfehlung = "";
    putCase(record);

    const approveRes = await approveAndGetError(record.id);
    expect(approveRes.status).toBe(200);
  });
});

function emptyStammdatenPayload() {
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

describe("Korrekturauftrag V0.2.1 - A4 Gemeinsamer Stammdatenkern", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("A4: Stammdaten (Vorname, Nachname, Kundennummer, Träger/Einrichtung, Ansprechperson, Telefon, E-Mail, LuV-Datum) sind für START verfügbar und speicherbar", async () => {
    const res = await createCase({ luvArt: "start" });
    const putRes = await request(app)
      .put(`/api/cases/${res.body.id}/stammdaten`)
      .send({
        ...emptyStammdatenPayload(),
        luvDatum: "2026-02-15",
        vorname: "Alex",
        nachname: "Fiktiv",
        kundennummer: "K-0001",
        traegerEinrichtung: "Fiktiver Bildungsträger (TESTSYSTEM)",
        ansprechpersonVorname: "Erika",
        ansprechpersonNachname: "Musterfrau",
        telefon: "0151-0000000",
        email: "erika@example-testsystem.invalid"
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.stammdaten.vorname).toBe("Alex");
    expect(putRes.body.stammdaten.kundennummer).toBe("K-0001");

    const fresh = await request(app).get(`/api/cases/${res.body.id}`);
    expect((fresh.body as CaseRecord).stammdaten.traegerEinrichtung).toBe("Fiktiver Bildungsträger (TESTSYSTEM)");
  });

  it("A4: Stammdaten sind auch für VERLAUF verfügbar und speicherbar (kein Abschluss-exklusives Modell mehr)", async () => {
    const res = await createCase({ luvArt: "verlauf" });
    const putRes = await request(app)
      .put(`/api/cases/${res.body.id}/stammdaten`)
      .send({ ...emptyStammdatenPayload(), vorname: "Robin", nachname: "Beispiel" });
    expect(putRes.status).toBe(200);
    expect(putRes.body.stammdaten.vorname).toBe("Robin");
  });

  it("A4: Stammdaten sind für ABSCHLUSS verfügbar (migriert aus dem vormaligen Abschluss-Modul)", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    const putRes = await request(app)
      .put(`/api/cases/${res.body.id}/stammdaten`)
      .send({ ...emptyStammdatenPayload(), vorname: "Kim", nachname: "Mustermann", kundennummer: "K-0002" });
    expect(putRes.status).toBe(200);
    expect(putRes.body.stammdaten.nachname).toBe("Mustermann");
  });

  it("A4: keine doppelten konkurrierenden Stammdatenmodelle - AbschlussErgebnis enthält keine Identifikatoren/LuV-Datum mehr", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    const record = res.body as CaseRecord;
    expect(record.abschlussErgebnis).not.toHaveProperty("vorname");
    expect(record.abschlussErgebnis).not.toHaveProperty("nachname");
    expect(record.abschlussErgebnis).not.toHaveProperty("kundennummer");
    expect(record.abschlussErgebnis).not.toHaveProperty("traegerEinrichtung");
    expect(record.abschlussErgebnis).not.toHaveProperty("ansprechpersonVorname");
    expect(record.abschlussErgebnis).not.toHaveProperty("ansprechpersonNachname");
    expect(record.abschlussErgebnis).not.toHaveProperty("telefon");
    expect(record.abschlussErgebnis).not.toHaveProperty("email");
    expect(record.abschlussErgebnis).not.toHaveProperty("lernortWohnenInternat");
    expect(record.abschlussErgebnis).not.toHaveProperty("abschlussLuvVom");
  });
});

function findSection(record: CaseRecord, key: string) {
  return record.sections.find((s) => s.key === key);
}

describe("Korrekturauftrag V0.2.1 - A5 Förderzielbereiche mit Von/Bis-Zeiträumen", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("A5: Von/Bis wird gespeichert und im START-Output feldgerecht ausgegeben", async () => {
    const res = await createCase({ luvArt: "start" });
    const putRes = await request(app)
      .put(`/api/cases/${res.body.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "aktiv", von: "2026-02-01", bis: "2026-04-30" });
    expect(putRes.status).toBe(200);
    expect(putRes.body.find((t: { bereich: string }) => t.bereich === "grundkompetenzen").von).toBe("2026-02-01");

    const fresh = await request(app).get(`/api/cases/${res.body.id}`);
    const section = findSection(fresh.body as CaseRecord, "support_goals");
    expect(section?.text).toContain("2026-02-01 bis 2026-04-30");
  });

  it("A5: ein reines Status-Update löscht einen zuvor erfassten Zeitraum nicht", async () => {
    const res = await createCase({ luvArt: "start" });
    await request(app)
      .put(`/api/cases/${res.body.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "aktiv", von: "2026-02-01", bis: "2026-04-30" });
    const statusOnly = await request(app)
      .put(`/api/cases/${res.body.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "abgeschlossen" });
    expect(statusOnly.status).toBe(200);
    const entry = statusOnly.body.find((t: { bereich: string }) => t.bereich === "grundkompetenzen");
    expect(entry.von).toBe("2026-02-01");
    expect(entry.bis).toBe("2026-04-30");
    expect(entry.status).toBe("abgeschlossen");
  });

  it("A5: VERLAUF unterstützt den Abschlussstatus 'Maßnahme abgeschlossen' feldgerecht im Output", async () => {
    const res = await createCase({ luvArt: "verlauf" });
    await request(app)
      .put(`/api/cases/${res.body.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "abgeschlossen" });
    const fresh = await request(app).get(`/api/cases/${res.body.id}`);
    const section = findSection(fresh.body as CaseRecord, "support_goals");
    expect(section?.text).toContain("Maßnahme abgeschlossen");
  });

  it("A5: der interne Zustand 'erneut_geoeffnet' erscheint nicht wörtlich als offizielles Feld im Output", async () => {
    const res = await createCase({ luvArt: "start" });
    await request(app)
      .put(`/api/cases/${res.body.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "abgeschlossen" });
    await request(app)
      .put(`/api/cases/${res.body.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "erneut_geoeffnet" });
    const fresh = await request(app).get(`/api/cases/${res.body.id}`);
    const section = findSection(fresh.body as CaseRecord, "support_goals");
    expect(section?.text).not.toMatch(/erneut.?ge.?ffnet/i);
    expect(section?.text).not.toMatch(/wieder.?ge.?ffnet/i);
  });
});

describe("Korrekturauftrag V0.2.1 - A6 Rollenbezogene Zielvereinbarung im Output", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("A6: Ziele mit unterschiedlichen Rollen werden im Output korrekt nach Rolle gruppiert", async () => {
    const res = await createCase({ luvArt: "start" });
    const record = getCase(res.body.id)!;
    record.supportGoals = [
      {
        id: "GOAL_1",
        supportAreaId: "SUPPORT_1",
        bereich: "Grundrechenarten",
        ausgangslage: "x",
        ziel: "Ziel A",
        massnahme: "x",
        ueberpruefungskriterium: "x",
        status: "uebernommen",
        manualOverride: false,
        rolle: "lehrkraft"
      },
      {
        id: "GOAL_2",
        supportAreaId: "SUPPORT_2",
        bereich: "Sozialverhalten",
        ausgangslage: "x",
        ziel: "Ziel B",
        massnahme: "x",
        ueberpruefungskriterium: "x",
        status: "uebernommen",
        manualOverride: false,
        rolle: "sozialpaedagogik"
      },
      {
        id: "GOAL_3",
        supportAreaId: "SUPPORT_3",
        bereich: "Ohne Rolle",
        ausgangslage: "x",
        ziel: "Ziel C",
        massnahme: "x",
        ueberpruefungskriterium: "x",
        status: "uebernommen",
        manualOverride: false
      }
    ];
    putCase(record);
    // Re-Rendering ueber die bestehende Tracking-Route ausloesen (kein eigener Endpunkt noetig).
    await request(app)
      .put(`/api/cases/${res.body.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "begonnen" });

    const fresh = await request(app).get(`/api/cases/${res.body.id}`);
    const section = findSection(fresh.body as CaseRecord, "support_goals");
    expect(section?.text).toContain("Lehrkraft:");
    expect(section?.text).toContain("Ziel A");
    expect(section?.text).toContain("Sozialpädagogik:");
    expect(section?.text).toContain("Ziel B");
    expect(section?.text).toContain("Ziel C");

    // Keine leeren Rollenblöcke fuer nicht verwendete Rollen (z.B. Ausbilder/in).
    expect(section?.text).not.toContain("Ausbilder/in:");
  });
});

describe("Korrekturauftrag V0.2.1 - A7 Privacy Gateway Freitext-Härtung", () => {
  beforeEach(() => {
    clearAllCases();
  });

  async function caseWithKnownIdentifiers() {
    const res = await createCase({ luvArt: "start" });
    const record = getCase(res.body.id)!;
    record.baseData.teilnehmerName = "Alex Fiktiv";
    record.stammdaten.vorname = "Alex";
    record.stammdaten.nachname = "Fiktiv";
    record.stammdaten.kundennummer = "K-99887766";
    record.stammdaten.telefon = "0151-2345678";
    record.stammdaten.email = "alex.fiktiv@example-testsystem.invalid";
    putCase(record);
    return getCase(res.body.id)!;
  }

  it("A7: Name im Beobachtungstext wird auch im Freitext ersetzt, nicht nur bei strukturierten Feldern", async () => {
    const record = await caseWithKnownIdentifiers();
    const knownValues = directIdentifierValuesForCase(record);
    const rawPayload = {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        { label: "Ausdauer", rating: "ueberwiegend_sicher", observationNotes: "Alex Fiktiv arbeitet konzentriert mit.", evidenceIds: [] }
      ],
      evidence: []
    };
    const result = runPrivacyGateway("formulate_section", record.id, rawPayload, knownValues);
    expect(result.ok).toBe(true);
    const json = JSON.stringify(result.sanitizedPayload);
    expect(json).not.toContain("Alex Fiktiv");
    expect(json).not.toContain("Alex");
    expect(json).not.toContain("Fiktiv");
  });

  it("A7: Kundennummer im Freitext wird ersetzt", async () => {
    const record = await caseWithKnownIdentifiers();
    const knownValues = directIdentifierValuesForCase(record);
    const rawPayload = {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        { label: "Sorgfalt", rating: "staerke", observationNotes: "Vorgang unter Kundennummer K-99887766 vollständig bearbeitet.", evidenceIds: [] }
      ],
      evidence: []
    };
    const result = runPrivacyGateway("formulate_section", record.id, rawPayload, knownValues);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result.sanitizedPayload)).not.toContain("K-99887766");
  });

  it("A7: Telefonnummer im Freitext wird ersetzt", async () => {
    const record = await caseWithKnownIdentifiers();
    const knownValues = directIdentifierValuesForCase(record);
    const rawPayload = {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        { label: "Kommunikation", rating: "staerke", observationNotes: "Rückruf unter 0151-2345678 vereinbart.", evidenceIds: [] }
      ],
      evidence: []
    };
    const result = runPrivacyGateway("formulate_section", record.id, rawPayload, knownValues);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result.sanitizedPayload)).not.toContain("0151-2345678");
  });

  it("A7: E-Mail-Adresse im Freitext wird ersetzt (bekannter Wert)", async () => {
    const record = await caseWithKnownIdentifiers();
    const knownValues = directIdentifierValuesForCase(record);
    const rawPayload = {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        { label: "Selbstständigkeit", rating: "staerke", observationNotes: "Rückmeldung an alex.fiktiv@example-testsystem.invalid gesendet.", evidenceIds: [] }
      ],
      evidence: []
    };
    const result = runPrivacyGateway("formulate_section", record.id, rawPayload, knownValues);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result.sanitizedPayload)).not.toContain("alex.fiktiv@example-testsystem.invalid");
  });

  it("A7: eine E-Mail-Adresse im Freitext, die KEINEM bekannten Stammdatenwert entspricht, wird als nicht sicher behandelbar blockiert statt ungefiltert gesendet", async () => {
    const record = await caseWithKnownIdentifiers();
    const knownValues = directIdentifierValuesForCase(record);
    const rawPayload = {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        {
          label: "Kommunikation",
          rating: "staerke",
          observationNotes: "Bitte an unbekannte-adresse@example-testsystem.invalid weiterleiten.",
          evidenceIds: []
        }
      ],
      evidence: []
    };
    const result = runPrivacyGateway("formulate_section", record.id, rawPayload, knownValues);
    expect(result.ok).toBe(false);
    expect(result.blockedReason).toBe("unresolved_identifier_in_freetext");
  });

  it("A7: bestehende Allowlist-/Key-Filterung bleibt zusätzlich bestehen (strukturierte direkte Identifikatoren weiterhin entfernt)", async () => {
    const record = await caseWithKnownIdentifiers();
    const knownValues = directIdentifierValuesForCase(record);
    const rawPayload = {
      luv_art: "start",
      section_key: "school_competences",
      area_label: "Mathematik",
      teilnehmerName: "Max Mustermann",
      geburtsdatum: "2005-01-01",
      sub_competences: [{ label: "Grundrechenarten", rating: "ueberwiegend_sicher", observationNotes: "8 von 10 Aufgaben korrekt.", evidenceIds: ["MATH_001"] }],
      evidence: []
    };
    const result = runPrivacyGateway("formulate_section", record.id, rawPayload, knownValues);
    expect(result.ok).toBe(true);
    const json = JSON.stringify(result.sanitizedPayload);
    expect(json).not.toMatch(/teilnehmerName/i);
    expect(json).not.toMatch(/geburtsdatum/i);
  });
});
