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
