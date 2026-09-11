/**
 * Version 0.2 (PH-17 V1.0 / Entwicklungsauftrag V0.2) - neue Testfaelle.
 * Ergaenzt v02.test.ts und v02_ph15_v11.test.ts (bleiben unveraendert Teil der Suite).
 *
 * Deckt ab (Migrationsplan 0.1->0.2 Abschnitt 3 Punkt 9, Freigabe-Auftrag):
 *  - 3x3-Testmatrix START/VERLAUF/ABSCHLUSS x BvB1/BvB2/BvB3 (mind. 9 E2E-Faelle)
 *  - Negativtests: Beschäftigungsziel ohne Begründung, Förderbedarf ohne Beleg,
 *    Abschluss ohne HUMAN_CONFIRMED, BvB-3-Feld in BvB-2-Kontext, Verlauf ohne neue
 *    Daten, direkte Identifikatoren im KI-Payload (Halluzinationsversuch/erfundene
 *    Evidence-ID bleibt als Regression in v02.test.ts V02-T05 abgedeckt).
 */
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../web/app.js";
import { clearAllCases, getCase, putCase } from "../web/store.js";
import { runPrivacyGateway } from "../privacy/gateway.js";
import { computeFristen } from "../domain/fristenLogic.js";
import { sectionOrderForLuvArt } from "../domain/composerRules.js";
import { CaseRecord, LuvArt, Massnahmeart, MASSNAHMEART_VALUES } from "../domain/types.js";

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

describe("V0.2 / PH-17 - 3x3-Testmatrix (START/VERLAUF/ABSCHLUSS x BvB1/BvB2/BvB3)", () => {
  beforeEach(() => {
    clearAllCases();
  });

  const luvArten: LuvArt[] = ["start", "verlauf", "abschluss"];

  for (const massnahmeart of MASSNAHMEART_VALUES) {
    for (const luvArt of luvArten) {
      it(`E2E ${massnahmeart.toUpperCase()} x ${luvArt}: Fall wird korrekt angelegt, Abschnitts-Skelett und Fristen passen zur Massnahmeart`, async () => {
        const res = await createCase({ massnahmeart, luvArt });
        expect(res.status).toBe(201);
        const record = res.body as CaseRecord;

        expect(record.baseData.massnahmeart).toBe(massnahmeart);
        expect(record.baseData.luvArt).toBe(luvArt);

        // Kein "digital_competences" mehr als eigene Ausgabesektion (Entscheidung 1).
        const expectedKeys = sectionOrderForLuvArt(luvArt);
        expect(record.sections.map((s: { key: string }) => s.key)).toEqual(expectedKeys);
        expect(expectedKeys).not.toContain("digital_competences");
        if (luvArt === "abschluss") {
          expect(expectedKeys).toContain("abschluss_ergebnis");
        }

        const fristenRes = await request(app).get(`/api/cases/${record.id}/fristen`);
        expect(fristenRes.status).toBe(200);
        const fristen = computeFristen(record.baseData as never);
        // BvB 3: 7 Monate bis zur ersten Verlaufs-LUV; BvB 1/BvB 2: 6 Monate.
        const expectedMonth = massnahmeart === "bvb3" ? "2026-08-01" : "2026-07-01";
        expect(fristen.ersteVerlaufsLuvFaellig).toBe(expectedMonth);
      });
    }
  }
});

describe("V0.2 / PH-17 - Negativtests (harte Blocker)", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("Negativ 1: Maßnahmeziel sv_beschaeftigung ohne Begründung wird bereits bei Fallanlage abgelehnt (Entscheidung 2)", async () => {
    const res = await createCase({ massnahmeziel: "sv_beschaeftigung", begruendungKeineAusbildung: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("Negativ 1b: mit ausgefüllter Begründung ist die Fallanlage möglich und die Freigabe nicht deswegen blockiert", async () => {
    const res = await createCase({
      massnahmeziel: "sv_beschaeftigung",
      begruendungKeineAusbildung: "Gesundheitliche Gründe stehen einer Berufsausbildung derzeit entgegen (TESTSYSTEM, fiktiv)."
    });
    expect(res.status).toBe(201);
    const approveRes = await request(app)
      .post(`/api/cases/${res.body.id}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    expect(approveRes.status).toBe(200);
  });

  it("Negativ 2: bestätigter Förderbereich ohne Beleg blockiert Förderzielvorschläge UND die Freigabe (Entscheidung 3, PH-17 vor PH-15)", async () => {
    const res = await createCase();
    const record = res.body as CaseRecord;

    await request(app)
      .post(`/api/cases/${record.id}/sub-competences`)
      .send({
        area: "schulische_grundkompetenzen",
        label: "Grundrechenarten",
        rating: "foerderbedarf",
        observationNotes: "",
        evidenceIds: []
      });

    const derived = getCase(record.id)!;
    expect(derived.supportAreaCandidates.length).toBe(1);
    derived.supportAreaCandidates[0].status = "confirmed";
    putCase(derived);

    const suggestRes = await request(app).post(`/api/cases/${record.id}/ai/support-goals/suggest`).send({});
    expect(suggestRes.status).toBe(200);
    expect(suggestRes.body.kind).toBe("blocked_pre_validation");
    expect(suggestRes.body.reason).toMatch(/Beobachtung\/Quelle/);

    const approveRes = await request(app)
      .post(`/api/cases/${record.id}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    expect(approveRes.status).toBe(409);
    expect(approveRes.body.error.code).toBe("pre_validation_blocked");
  });

  it("Negativ 3: Abschluss-LuV ohne HUMAN_CONFIRMED (Ausbildungsreife/Berufseignung/Unterstützungsbedarf) blockiert die Freigabe", async () => {
    const res = await createCase({ luvArt: "abschluss" });
    const record = res.body as CaseRecord;

    const blockedApprove = await request(app)
      .post(`/api/cases/${record.id}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    expect(blockedApprove.status).toBe(409);
    expect(blockedApprove.body.error.code).toBe("pre_validation_blocked");
    expect(blockedApprove.body.error.message).toMatch(/HUMAN_CONFIRMED/);

    // Aktive Bestätigung durch die Koordination (Claude darf diese Werte nie selbst setzen).
    const current = getCase(record.id)!;
    current.abschlussErgebnis.ausbildungsreifeErreicht = { value: "ja", humanConfirmed: true };
    current.abschlussErgebnis.berufseignung = { value: "Lagerlogistik (fiktiv)", humanConfirmed: true };
    current.abschlussErgebnis.unterstuetzungsbedarf = { value: "nein", humanConfirmed: true };
    putCase(current);

    const okApprove = await request(app)
      .post(`/api/cases/${record.id}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    expect(okApprove.status).toBe(200);
    expect(okApprove.body.approvedForExport).toBe(true);
  });

  it("Negativ 4: BvB-3-Sonderfeld 'Lernort Wohnen/Internat' wird bei BvB 2 abgelehnt, bei BvB 3 angenommen", async () => {
    const bvb2 = await createCase({ massnahmeart: "bvb2", luvArt: "abschluss" });
    const rejectRes = await request(app)
      .put(`/api/cases/${bvb2.body.id}/abschluss-ergebnis`)
      .send({ ...emptyAbschlussPayload(), lernortWohnenInternat: "ja" });
    expect(rejectRes.status).toBe(400);
    expect(rejectRes.body.error.code).toBe("bvb3_field_not_applicable");

    const bvb3 = await createCase({ massnahmeart: "bvb3", luvArt: "abschluss" });
    const acceptRes = await request(app)
      .put(`/api/cases/${bvb3.body.id}/abschluss-ergebnis`)
      .send({ ...emptyAbschlussPayload(), lernortWohnenInternat: "ja" });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.abschlussErgebnis.lernortWohnenInternat).toBe("ja");
  });

  it("Negativ 5: Verlauf ohne bestätigte, vergleichbare Zeitpunkte erzeugt keine erfundene Entwicklung ('insufficient_data')", async () => {
    const res = await createCase({ luvArt: "verlauf" });
    const genRes = await request(app).post(`/api/cases/${res.body.id}/ai/sections/development/generate`).send({});
    expect(genRes.status).toBe(200);
    expect(genRes.body.kind).toBe("insufficient_data");
  });

  it("Negativ 6: direkte Identifikatoren des Abschluss-Moduls (Ansprechperson, Träger/Einrichtung) werden aus jedem KI-Payload entfernt", () => {
    const rawPayload = {
      luv_art: "abschluss",
      section_key: "overall_assessment",
      area_label: "Gesamtbeurteilung",
      sub_competences: [],
      evidence: [],
      ansprechpersonVorname: "Erika",
      ansprechpersonNachname: "Musterfrau",
      traegerEinrichtung: "Fiktiver Bildungsträger GmbH"
    };
    const result = runPrivacyGateway("formulate_section", "case-abschluss-identifiers", rawPayload);
    expect(result.ok).toBe(true);
    const json = JSON.stringify(result.sanitizedPayload);
    expect(json).not.toContain("Erika");
    expect(json).not.toContain("Musterfrau");
    expect(json).not.toContain("Fiktiver Bildungsträger GmbH");
    expect(json).not.toMatch(/ansprechperson/i);
    expect(json).not.toMatch(/traegereinrichtung/i);
  });
});

function emptyAbschlussPayload() {
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
