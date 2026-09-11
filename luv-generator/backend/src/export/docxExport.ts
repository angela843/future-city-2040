/**
 * DOCX-Export (Spezifikation Abschnitt 32, 33).
 * Rendert serverseitig ueber die "docx"-Template-Engine auf Basis des neutralen
 * internen Datenmodells (domain/types.ts). Es findet KEINE neue Claude-Generierung
 * beim Export statt - exportiert wird exakt der in der fachlich bestaetigten
 * Vorschau sichtbare Text (toCleanSectionText).
 */
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { CaseRecord } from "../domain/types.js";
import { toCleanSectionText } from "./copyText.js";
import { JA_NEIN_LABELS } from "../domain/labels.js";

function luvArtLabel(luvArt: CaseRecord["baseData"]["luvArt"]): string {
  switch (luvArt) {
    case "start":
      return "Start-LUV";
    case "verlauf":
      return "Verlaufs-LUV";
    case "abschluss":
      return "Abschluss-LUV";
  }
}

export async function buildDocxBuffer(caseRecord: CaseRecord): Promise<Buffer> {
  const creationDate = new Date().toLocaleDateString("de-DE");

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "TESTSYSTEM – Keine echten personenbezogenen Daten.", bold: true, color: "B00000" })]
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: `Lern- und Entwicklungsdokumentation (${luvArtLabel(caseRecord.baseData.luvArt)})` })]
    }),
    new Paragraph({ text: `Teilnehmer/in: ${caseRecord.baseData.teilnehmerName || "-"}` }),
    new Paragraph({ text: `Maßnahme: ${caseRecord.baseData.massnahme || "-"}` }),
    new Paragraph({
      text: `Beurteilungszeitraum: ${caseRecord.baseData.beurteilungszeitraumVon || "-"} bis ${
        caseRecord.baseData.beurteilungszeitraumBis || "-"
      }`
    }),
    new Paragraph({ text: `Koordination: ${caseRecord.baseData.koordination || "-"}` }),
    new Paragraph({ text: `Erstellungsdatum: ${creationDate}` }),
    new Paragraph({ text: "" })
  ];

  // Gemeinsamer Stammdatenkern (Korrekturauftrag V0.2.1, A4): direkte Identifikatoren
  // erscheinen nur im lokalen DOCX-Export, nie im Claude-Payload. Fuer START/VERLAUF/
  // ABSCHLUSS gleichermassen, da die Felder jetzt gemeinsam gefuehrt werden.
  const s = caseRecord.stammdaten;
  const hatStammdaten =
    s.luvDatum || s.vorname || s.nachname || s.kundennummer || s.traegerEinrichtung || s.ansprechpersonVorname || s.ansprechpersonNachname || s.telefon || s.email || s.lernortWohnenInternat;
  if (hatStammdaten) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Stammdaten" })] }));
    if (s.luvDatum) children.push(new Paragraph({ text: `LuV-Datum: ${s.luvDatum}` }));
    if (s.vorname || s.nachname) children.push(new Paragraph({ text: `Name: ${s.vorname} ${s.nachname}`.trim() }));
    if (s.kundennummer) children.push(new Paragraph({ text: `Kundennummer: ${s.kundennummer}` }));
    if (caseRecord.baseData.massnahmeart === "bvb3" && s.lernortWohnenInternat) {
      children.push(new Paragraph({ text: `Lernort Wohnen/Internat: ${JA_NEIN_LABELS[s.lernortWohnenInternat]}` }));
    }
    if (s.traegerEinrichtung) children.push(new Paragraph({ text: `Träger/Einrichtung: ${s.traegerEinrichtung}` }));
    if (s.ansprechpersonVorname || s.ansprechpersonNachname) {
      children.push(new Paragraph({ text: `Ansprechperson: ${s.ansprechpersonVorname} ${s.ansprechpersonNachname}`.trim() }));
    }
    if (s.telefon) children.push(new Paragraph({ text: `Telefon: ${s.telefon}` }));
    if (s.email) children.push(new Paragraph({ text: `E-Mail: ${s.email}` }));
    children.push(new Paragraph({ text: "" }));
  }

  for (const section of caseRecord.sections) {
    const cleanText = toCleanSectionText(section);
    if (!cleanText) continue;
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: section.title })] })
    );
    for (const paragraphText of cleanText.split(/\n+/).filter(Boolean)) {
      children.push(new Paragraph({ children: [new TextRun({ text: paragraphText })] }));
    }
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
