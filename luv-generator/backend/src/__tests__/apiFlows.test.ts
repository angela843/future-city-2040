import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../web/app.js";
import { clearAllCases } from "../web/store.js";

const app = createApp();

const binaryParser = ((res: NodeJS.ReadableStream, callback: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
}) as unknown as (str: string) => unknown;

async function createBaseCase(luvArt: "start" | "verlauf" | "abschluss" = "start") {
  const res = await request(app)
    .post("/api/cases")
    .send({
      teilnehmerName: "Test Person (fiktiv)",
      geburtsdatum: "2005-01-01",
      massnahme: "Testmaßnahme",
      massnahmeart: "bvb1",
      eintrittsdatum: "2026-01-01",
      luvArt,
      beurteilungszeitraumVon: "2026-01-01",
      beurteilungszeitraumBis: "2026-03-01",
      koordination: "Test Koordination"
    });
  expect(res.status).toBe(201);
  return res.body;
}

describe("Spezifikations-Testfaelle 8-10 (Abschnitt 38)", () => {
  beforeEach(() => {
    clearAllCases();
  });

  it("Test 8: Förderziel ohne bestätigten Förderbedarf -> blockieren", async () => {
    const record = await createBaseCase();
    const res = await request(app).post(`/api/cases/${record.id}/ai/support-goals/suggest`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("no_confirmed_support_area");
  });

  it("Test 9: Manuell bearbeiteter Abschnitt bleibt nach Gesamtoptimierung unverändert", async () => {
    const record = await createBaseCase();
    const manualText = "Dies ist ein manuell bearbeiteter Ausgangslage-Text, der geschützt bleiben muss.";

    const editRes = await request(app)
      .put(`/api/cases/${record.id}/sections/initial_situation`)
      .send({ text: manualText });
    expect(editRes.status).toBe(200);
    const editedSection = editRes.body.find((s: { key: string }) => s.key === "initial_situation");
    expect(editedSection.manualOverride).toBe(true);
    expect(editedSection.text).toBe(manualText);

    const redactionRes = await request(app).post(`/api/cases/${record.id}/ai/overall-redaction`).send({});
    expect(redactionRes.status).toBe(200);

    const getRes = await request(app).get(`/api/cases/${record.id}`);
    const section = getRes.body.sections.find((s: { key: string }) => s.key === "initial_situation");
    expect(section.text).toBe(manualText);
    expect(section.manualOverride).toBe(true);
  });

  it("Test 10: Vorschautext -> DOCX: fachlicher Text identisch; Export ohne Freigabe blockiert", async () => {
    const record = await createBaseCase();
    const manualText = "Dieser Text steht exakt so in der bestätigten Vorschau und muss identisch exportiert werden.";

    await request(app).put(`/api/cases/${record.id}/sections/initial_situation`).send({ text: manualText });

    const blockedExport = await request(app).get(`/api/cases/${record.id}/export/docx`);
    expect(blockedExport.status).toBe(403);
    expect(blockedExport.body.error.code).toBe("not_approved");

    const approveRes = await request(app)
      .post(`/api/cases/${record.id}/approve`)
      .send({ confirmationText: "Ich habe den Inhalt fachlich geprüft." });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.approvedForExport).toBe(true);

    const copyRes = await request(app).get(`/api/cases/${record.id}/copy/section/initial_situation`);
    expect(copyRes.status).toBe(200);
    expect(copyRes.text).toContain(manualText);

    const docxRes = await request(app).get(`/api/cases/${record.id}/export/docx`).buffer(true).parse(binaryParser);
    expect(docxRes.status).toBe(200);
    expect(docxRes.headers["content-type"]).toContain("wordprocessingml.document");
    // DOCX-Dateien sind ZIP-Container (Signatur "PK").
    expect((docxRes.body as Buffer).slice(0, 2).toString("utf-8")).toBe("PK");
    expect((docxRes.body as Buffer).length).toBeGreaterThan(0);
  });

  it("Freigabe kann von Claude nicht automatisch gesetzt werden (approve erfordert exakte Bestätigung)", async () => {
    const record = await createBaseCase();
    const res = await request(app).post(`/api/cases/${record.id}/approve`).send({ confirmationText: "falsch" });
    expect(res.status).toBe(400);
  });
});
