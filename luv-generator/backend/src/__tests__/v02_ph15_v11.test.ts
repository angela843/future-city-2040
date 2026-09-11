/**
 * PH-15 Anforderungskatalog Version 0.2, Arbeitsfassung 1.1 - neue Testfaelle
 * (Abschnitt 87: V02-T11 bis V02-T19). Ergaenzt v02.test.ts (V02-T01..T10), welches
 * unveraendert Teil der Suite bleibt (Abschnitt 88: Regressionstests V0.1/V0.2 bleiben
 * bestehen).
 */
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../web/app.js";
import { clearAllCases } from "../web/store.js";
import { checkKompetenzanalyseDauer, computeFristen } from "../domain/fristenLogic.js";
import { runQualityCheck } from "../domain/qualityCheck.js";
import { runPrivacyGateway } from "../privacy/gateway.js";
import { runAiTask } from "../ai/aiService.js";
import { CaseRecord } from "../domain/types.js";
import { buildDemoF, buildDemoG } from "../demo/demoCases.js";

const app = createApp();

async function createBaseCase(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/cases")
    .send({
      teilnehmerName: "Test Person (fiktiv)",
      geburtsdatum: "2005-01-01",
      massnahme: "Testmaßnahme",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "Test Koordination",
      ...overrides
    });
  expect(res.status).toBe(201);
  return res.body as CaseRecord;
}

describe("PH-15 v1.1 - neue Testfaelle (Arbeitsfassung 1.1)", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("V02-T11: Fristenberechnung - Start-LUV 14 Tage nach Ende der Kompetenzanalyse, nicht aus Massnahmebeginn geraten", () => {
    const fristen = computeFristen({
      teilnehmerName: "x",
      geburtsdatum: null,
      massnahme: "x",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      kompetenzanalyseEnde: "2026-02-01",
      massnahmeEndeGeplant: "2026-12-01",
      // Korrekturauftrag V0.2.1 (A2): die Abschluss-LUV-Frist kommt ausschliesslich aus
      // dem tatsaechlichen letzten Teilnahmetag, NIE aus dem geplanten Massnahmeende.
      tatsaechlicherLetzterTeilnahmetag: "2026-12-05",
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "x"
    });
    expect(fristen.startLuvFaellig).toBe("2026-02-15");
    // Erste Verlaufs-LUV: 6 Monate nach Massnahmebeginn (Eintrittsdatum), NICHT nach Kompetenzanalyse-Ende. Gilt fuer BvB 1/BvB 2; BvB 3 = 7 Monate (siehe V02-T20ff).
    expect(fristen.ersteVerlaufsLuvFaellig).toBe("2026-07-01");
    // Weitere Verlaufs-LUV: 6 Wochen (42 Tage) vor Massnahmeende.
    expect(fristen.weitereVerlaufsLuvFaellig).toBe("2026-10-20");
    // Abschluss-LUV faellig = tatsaechlicher letzter Teilnahmetag, bewusst abweichend
    // vom geplanten Massnahmeende (2026-12-01), um zu beweisen, dass dieses NICHT
    // ersatzweise verwendet wird.
    expect(fristen.abschlussLuvFaellig).toBe("2026-12-05");
    expect(fristen.abschlussLuvFaelligHinweis).toBeNull();
  });

  it("V02-T12: Kompetenzanalyse-Plausibilität - Hinweis (keine Blockade) nur fuer BvB 1; fuer BvB 2/BvB 3 keine Regel ohne verbindliche Grundlage (Migrationsplan 0.1->0.2 Entscheidung 7)", () => {
    const bvb1ZuKurz = checkKompetenzanalyseDauer({
      teilnehmerName: "x",
      geburtsdatum: null,
      massnahme: "x",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      kompetenzanalyseEnde: "2026-01-08", // 1 Woche, unter dem Regelfall (3-5 Wochen)
      massnahmeEndeGeplant: null,
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "x"
    });
    expect(bvb1ZuKurz.ok).toBe(false);
    expect(bvb1ZuKurz.hinweis).toBeTruthy();

    // BvB 2 (ehem. "BvB-Reha"): keine ungeprüfte Übertragung der alten "4-8 Wochen"-Regel -
    // ohne verbindliche fachliche Grundlage gibt es fuer BvB 2/BvB 3 unconditional keinen Hinweis.
    const bvb2OhneRegel = checkKompetenzanalyseDauer({
      teilnehmerName: "x",
      geburtsdatum: null,
      massnahme: "x",
      massnahmeart: "bvb2",
      eintrittsdatum: "2026-01-01",
      kompetenzanalyseEnde: "2026-02-12",
      massnahmeEndeGeplant: null,
      tatsaechlicherLetzterTeilnahmetag: null,
      verlaufAnlass: null,
      verlaengerungstermin: null,
      massnahmeziel: "berufsausbildung",
      begruendungKeineAusbildung: "",
      luvArt: "start",
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "x"
    });
    expect(bvb2OhneRegel.ok).toBe(true);
  });

  it("V02-T13: Förderziel ohne BA-Förderzielbereich löst Qualitätswarnung aus, keine Blockade", async () => {
    const record = await createBaseCase();
    await request(app).post(`/api/cases/${record.id}/sub-competences`).send({
      area: "schulische_grundkompetenzen",
      label: "Grundrechenarten",
      rating: "foerderbedarf",
      observationNotes: "x",
      evidenceIds: [],
      relevantForLuv: true
    });
    const fresh = await request(app).get(`/api/cases/${record.id}`);
    const areaId = fresh.body.supportAreaCandidates[0].id;
    await request(app).put(`/api/cases/${record.id}/support-areas/${areaId}`).send({ status: "confirmed" });
    // Der Qualitaetscheck arbeitet rein auf dem CaseRecord; ein bestaetigtes Ziel ohne
    // Foerderzielbereich wird hier direkt gegen die Check-Logik geprueft (PH-15 v1.1 §48).
    const caseWithGoal = {
      ...fresh.body,
      supportGoals: [
        {
          id: "G1",
          supportAreaId: areaId,
          bereich: "Grundrechenarten",
          ausgangslage: "x",
          ziel: "x",
          massnahme: "x",
          ueberpruefungskriterium: "x",
          status: "uebernommen",
          manualOverride: false
        }
      ]
    };
    const qc = runQualityCheck(caseWithGoal);
    const item = qc.items.find((i) => i.key === "goal_foerderzielbereich");
    expect(item?.ok).toBe(false);
  });

  it("V02-T14: parallele BA-Förderzielbereiche - mehrere Bereiche gleichzeitig aktiv (Demo F)", () => {
    const demoF = buildDemoF();
    const activeCount = demoF.foerderzielbereichTracking.filter((t) => t.status === "aktiv" || t.status === "begonnen").length;
    expect(activeCount).toBeGreaterThanOrEqual(2);
    // Nicht linear: unterschiedliche Bereiche duerfen unterschiedliche Status gleichzeitig haben.
    const statuses = new Set(demoF.foerderzielbereichTracking.map((t) => t.status));
    expect(statuses.size).toBeGreaterThan(1);
  });

  it("V02-T15: Wiederöffnung eines BA-Förderzielbereichs (erneut_geoeffnet)", async () => {
    const record = await createBaseCase();
    await request(app)
      .put(`/api/cases/${record.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "abgeschlossen" });
    const reopen = await request(app)
      .put(`/api/cases/${record.id}/foerderzielbereich-tracking`)
      .send({ bereich: "grundkompetenzen", status: "erneut_geoeffnet" });
    expect(reopen.status).toBe(200);
    const tracking = reopen.body as { bereich: string; status: string }[];
    expect(tracking.find((t) => t.bereich === "grundkompetenzen")?.status).toBe("erneut_geoeffnet");
    // Genau ein Eintrag je Bereich - kein Duplikat durch das erneute Oeffnen.
    expect(tracking.filter((t) => t.bereich === "grundkompetenzen")).toHaveLength(1);
  });

  it("V02-T16: sensible Angabe (Diagnose/Medikamente) wird über die Privacy Gateway blockiert (Demo G)", async () => {
    const demoG = buildDemoG();
    const sensitiveSub = demoG.subCompetences.find((sc) => sc.label === "Belastbarkeit");
    expect(sensitiveSub).toBeTruthy();
    const result = await runAiTask(
      "formulate_section",
      "case-demo-g",
      {
        luv_art: "start",
        section_key: "personal_competences",
        area_label: "Personale Kompetenzen",
        sub_competences: [sensitiveSub],
        evidence: []
      },
      []
    );
    expect(result.kind).toBe("blocked_privacy");
  });

  it("V02-T17: Massnahmeart BvB-Reha selbst wird NICHT blockiert (nur die sensible Angabe)", async () => {
    const res = await createBaseCase({ massnahmeart: "bvb2", massnahme: "Berufsvorbereitende Bildungsmaßnahme Reha (BvB-Reha)" });
    expect(res.baseData.massnahmeart).toBe("bvb2");

    // Ein harmloser Abschnitt mit derselben Massnahmeart darf regulaer verarbeitet werden -
    // "BvB-Reha" als Begriff selbst loest KEINE Privacy-Blockade aus.
    const harmless = runPrivacyGateway("formulate_section", "case-reha-harmless", {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        { label: "Zuverlässigkeit", rating: "ueberwiegend_sicher", observationNotes: "Erscheint regelmäßig, BvB-Reha-Maßnahme läuft planmäßig.", evidenceIds: [] }
      ],
      evidence: []
    });
    expect(harmless.ok).toBe(true);
  });

  it("V02-T18: Teilnehmerbesprechung/Bekanntgabe wird dokumentiert und fließt in den Qualitätscheck ein", async () => {
    const record = await createBaseCase();
    const before = runQualityCheck(record);
    expect(before.items.find((i) => i.key === "teilnehmerbesprechung")?.ok).toBe(false);

    const updateRes = await request(app).put(`/api/cases/${record.id}/teilnehmerbesprechung`).send({
      besprochen: true,
      datum: "2026-03-01",
      mehrfertigungAusgehaendigt: true,
      besprechungNichtMoeglich: false,
      hinweisGrund: ""
    });
    expect(updateRes.status).toBe(200);
    const after = runQualityCheck(updateRes.body);
    expect(after.items.find((i) => i.key === "teilnehmerbesprechung")?.ok).toBe(true);
  });

  it("V02-T19: Fremdrückmeldung bleibt als Fremdquelle gekennzeichnet (EvidenceSource 'rueckmeldung_dritter')", async () => {
    const record = await createBaseCase();
    const res = await request(app).post(`/api/cases/${record.id}/evidence`).send({
      source: "rueckmeldung_dritter",
      note: "Rückmeldung des Praktikumsbetriebs: zuverlässig und pünktlich.",
      area: "berufliche_orientierung_praxis"
    });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("rueckmeldung_dritter");
  });
});
