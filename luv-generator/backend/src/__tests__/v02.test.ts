/**
 * Version 0.2 - neue Testfaelle (PH-15 Abschnitt 59) + Kern-Regressionssuite bleibt in
 * den bestehenden Test-Dateien (aiMock.test.ts, privacyGateway.test.ts,
 * comparisonLogic.test.ts, apiFlows.test.ts, domainRules.test.ts) unveraendert bestehen.
 */
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../web/app.js";
import { clearAllCases } from "../web/store.js";
import { checkForClarification } from "../domain/clarificationAssistant.js";
import { runQualityCheck } from "../domain/qualityCheck.js";
import { checkGoalCountWarning, GOAL_COUNT_WARNING_THRESHOLD } from "../domain/supportLogic.js";
import { measuresPromptV2 } from "../ai/prompts/measures.v2.js";
import { CaseRecord } from "../domain/types.js";
import { getCase, putCase } from "../web/store.js";

const app = createApp();

async function createBaseCase(luvArt: "start" | "verlauf" | "abschluss" = "start") {
  const res = await request(app)
    .post("/api/cases")
    .send({
      teilnehmerName: "Test Person (fiktiv)",
      geburtsdatum: "2005-01-01",
      massnahme: "Testmaßnahme",
      massnahmeart: "bvb",
      eintrittsdatum: "2026-01-01",
      luvArt,
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "Test Koordination"
    });
  expect(res.status).toBe(201);
  return res.body as CaseRecord;
}

describe("Version 0.2 - PH-15 Testfaelle", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("V02-T01: Unterkompetenz aus Katalog auswählen - kein manuelles Neueintippen erforderlich", async () => {
    const record = await createBaseCase();
    const catalogRes = await request(app).get("/api/catalog/competences");
    expect(catalogRes.status).toBe(200);
    const entry = catalogRes.body.schulische_grundkompetenzen[0];
    expect(entry).toBeTruthy();

    const res = await request(app)
      .post(`/api/cases/${record.id}/sub-competences`)
      .send({
        area: "schulische_grundkompetenzen",
        catalogId: entry.id,
        label: entry.label,
        rating: "ueberwiegend_sicher",
        observationNotes: "Beispielbeobachtung.",
        evidenceIds: [],
        relevantForLuv: true
      });
    expect(res.status).toBe(200);
    const saved = res.body.subCompetences.find((sc: { catalogId?: string }) => sc.catalogId === entry.id);
    expect(saved).toBeTruthy();
    expect(saved.label).toBe(entry.label);
  });

  it("V02-T02: Eigene Unterkompetenz hinzufügen funktioniert weiterhin (ohne Katalogeintrag)", async () => {
    const record = await createBaseCase();
    const res = await request(app)
      .post(`/api/cases/${record.id}/sub-competences`)
      .send({
        area: "digitale_kompetenzen",
        label: "Ganz eigene Unterkompetenz",
        rating: "nicht_erhoben",
        observationNotes: "",
        evidenceIds: [],
        relevantForLuv: true
      });
    expect(res.status).toBe(200);
    const saved = res.body.subCompetences.find((sc: { label: string }) => sc.label === "Ganz eigene Unterkompetenz");
    expect(saved).toBeTruthy();
    expect(saved.catalogId).toBeUndefined();
  });

  it('V02-T03: "Mara ist faul." löst den Konkretisierungsassistenten aus', () => {
    const result = checkForClarification("Mara ist faul.");
    expect(result.needsClarification).toBe(true);
    expect(result.matchedTerms).toContain("faul");
    expect(result.questions.length).toBeGreaterThan(0);
    // Keine automatische Umformulierung ("wenig motiviert" o.ae.) - nur Rueckfragen.
    expect(result.message).not.toMatch(/motiviert/i);
  });

  it("V02-T04: Aussage geht über einmalige Beobachtung hinaus -> nicht/teilweise gedeckt", async () => {
    const record = await createBaseCase();
    const payload = {
      case_ref: "CASE_TEST",
      section_key: "personal_competences",
      text: "Mara arbeitet durchgehend zuverlässig.[FORCE_PARTIAL:OBS_001]",
      available_evidence_ids: ["OBS_001"],
      available_evidence: [{ id: "OBS_001", note: "War am 3. März einmalig pünktlich." }]
    };
    const { runSemanticFactCheck } = await import("../validation/semanticFactCheck.js");
    const result = await runSemanticFactCheck(record.id, "personal_competences", payload.text, [
      { id: "OBS_001", source: "beobachtung", note: "War am 3. März einmalig pünktlich.", createdAt: new Date().toISOString() }
    ], []);
    expect(result.status).not.toBe("covered");
    expect(["partially_covered", "unsupported"]).toContain(result.status);
  });

  it("V02-T05: KI-Satz mit erfundener Evidence-ID wird blockiert", async () => {
    const record = await createBaseCase();
    const { runSemanticFactCheck } = await import("../validation/semanticFactCheck.js");
    const realEvidence = { id: "OBS_001", source: "beobachtung" as const, note: "Reale Beobachtung.", createdAt: new Date().toISOString() };
    const result = await runSemanticFactCheck(
      record.id,
      "personal_competences",
      "Ein Satz mit erfundenem Beleg.[FORCE_FAKE_ID:OBS_999]",
      [realEvidence],
      []
    );
    // OBS_999 existiert nicht -> darf nicht in den Claims als gueltige Evidenz auftauchen,
    // und die Aussage darf nicht als "covered" durchgehen.
    const claim = result.claims?.[0];
    expect(claim?.evidenceIds).not.toContain("OBS_999");
    expect(claim?.status).not.toBe("covered");
  });

  it("V02-T06: fehlende methodische Kompetenz -> Qualitätswarnung, keine automatische Bewertung", async () => {
    const record = await createBaseCase();
    await request(app).post(`/api/cases/${record.id}/sub-competences`).send({
      area: "schulische_grundkompetenzen",
      label: "Grundrechenarten",
      rating: "ueberwiegend_sicher",
      observationNotes: "x",
      evidenceIds: [],
      relevantForLuv: true
    });
    const fresh = await request(app).get(`/api/cases/${record.id}`);
    const qc = runQualityCheck(fresh.body);
    const item = qc.items.find((i) => i.key === "area_methodische_kompetenzen");
    expect(item?.ok).toBe(false);
    // Keine automatische Bewertung: es darf keine Unterkompetenz fuer diesen Bereich entstanden sein.
    expect(fresh.body.subCompetences.some((sc: { area: string }) => sc.area === "methodische_kompetenzen")).toBe(false);
  });

  it("V02-T07: keine Stärke vorhanden -> Hinweis, keine erfundene Ressource", async () => {
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
    const qc = runQualityCheck(fresh.body);
    const item = qc.items.find((i) => i.key === "resource");
    expect(item?.ok).toBe(false);
    expect(item?.hint).toBe("Es wurde bisher keine fachlich belegte Stärke oder Ressource erfasst.");
    // Keine erfundene Ressource: keine Unterkompetenz mit Bewertung "staerke" vorhanden.
    expect(fresh.body.subCompetences.some((sc: { rating: string }) => sc.rating === "staerke")).toBe(false);
  });

  it("V02-T08: acht bestätigte Förderziele -> Priorisierungswarnung", () => {
    expect(checkGoalCountWarning(GOAL_COUNT_WARNING_THRESHOLD).warn).toBe(false);
    const result = checkGoalCountWarning(8);
    expect(result.warn).toBe(true);
    expect(result.message).toContain("8 Förderziele");
  });

  it("V02-T09: Maßnahme aus Bibliothek nur als Vorschlagssprache, nie als bereits durchgeführt", () => {
    expect(measuresPromptV2.system).toMatch(/Vorschlagssprache/i);
    expect(measuresPromptV2.system).toMatch(/NIEMALS behaupten/i);
  });

  it("V02-T10: rote unbelegte Aussage blockiert die Freigabe, manuelle Bearbeitung hebt die Blockade auf", async () => {
    const record = await createBaseCase();

    // Abschnitt mit einer KI-generierten (nicht manuell bearbeiteten) unbelegten Aussage simulieren:
    // ueber die AI-Route "sections/:key/generate" laeuft formulate_section + anschliessende
    // semantische Faktenpruefung automatisch. Wir erzwingen "unsupported" ueber das
    // previousLuv-unabhaengige [FORCE_UNSUPPORTED]-Test-Hook, indem wir den Abschnitt danach
    // direkt inspizieren und - falls das Mock-Setup nicht unsupported liefert - den Fall
    // stattdessen ueber eine direkte Sektionstext-Injektion nachstellen, um den Freigabecheck
    // selbst (nicht die KI-Generierung) zu pruefen.
    const getRes1 = await request(app).get(`/api/cases/${record.id}`);
    const sections = getRes1.body.sections;
    const target = sections.find((s: { key: string }) => s.key === "initial_situation");
    expect(target).toBeTruthy();

    // Freigabecheck direkt gegen ein CaseRecord mit einer roten, nicht manuell bearbeiteten
    // Sektion pruefen (deterministischer Kern der Regel, unabhaengig vom KI-Mock):
    const { runReleaseCheck } = await import("../domain/releaseCheck.js");
    const caseWithRedSection = {
      ...getRes1.body,
      sections: sections.map((s: { key: string }) =>
        s.key === "initial_situation"
          ? { ...s, text: "Eine nicht belegte Aussage.", manualOverride: false, factCheck: { status: "unsupported", details: [], method: "semantic" } }
          : s
      )
    };
    const blockedCheck = runReleaseCheck(caseWithRedSection);
    expect(blockedCheck.blocked).toBe(true);
    expect(blockedCheck.blockingSections.map((b) => b.key)).toContain("initial_situation");

    const manuallyEdited = {
      ...caseWithRedSection,
      sections: caseWithRedSection.sections.map((s: { key: string }) =>
        s.key === "initial_situation" ? { ...s, manualOverride: true } : s
      )
    };
    const unblockedCheck = runReleaseCheck(manuallyEdited);
    expect(unblockedCheck.blocked).toBe(false);

    // Serverseitige Durchsetzung am /approve-Endpunkt selbst (MUSS, PH-15 §43): eine rote,
    // nicht manuell bearbeitete Sektion muss die Freigabe technisch verweigern (409).
    const stored = getCase(record.id);
    if (!stored) throw new Error("case not found in store");
    stored.sections = stored.sections.map((s) =>
      s.key === "initial_situation"
        ? { ...s, text: "Eine unbelegte Aussage.", manualOverride: false, factCheck: { status: "unsupported" as const, details: [], method: "semantic" as const } }
        : s
    );
    putCase(stored);

    const blockedApprove = await request(app)
      .post(`/api/cases/${record.id}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    expect(blockedApprove.status).toBe(409);
    expect(blockedApprove.body.error.code).toBe("release_check_blocked");

    // Aktive fachliche Bearbeitung (manueller Edit) hebt die Blockade auf.
    const editRes = await request(app)
      .put(`/api/cases/${record.id}/sections/initial_situation`)
      .send({ text: "Von der Koordination geprüfter und überarbeiteter Text." });
    expect(editRes.status).toBe(200);

    const approveAfterEdit = await request(app)
      .post(`/api/cases/${record.id}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    expect(approveAfterEdit.status).toBe(200);
    expect(approveAfterEdit.body.approvedForExport).toBe(true);
  });
});
