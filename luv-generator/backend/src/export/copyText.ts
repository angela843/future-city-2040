/**
 * Kopierfunktion (Spezifikation Abschnitt 31).
 * Liefert sauberen Klartext ohne Markdown-Zeichen, technische IDs, Warnungen,
 * Evidence-IDs oder interne Bewertungen.
 */
import { CaseRecord, LuvSection } from "../domain/types.js";

const EVIDENCE_ID_PATTERN = /\b[A-Z]{2,12}_\d{3,}\b/g;
const MARKDOWN_CHARS = /[*_`#>]+/g;

export function toCleanSectionText(section: LuvSection): string {
  let text = section.text;
  text = text.replace(EVIDENCE_ID_PATTERN, "");
  text = text.replace(MARKDOWN_CHARS, "");
  text = text.replace(/\s{2,}/g, " ").trim();
  return text;
}

export function copySectionText(section: LuvSection): string {
  return `${section.title}\n\n${toCleanSectionText(section)}`;
}

export function copyFullLuvText(caseRecord: CaseRecord): string {
  const header = [
    `LUV (${luvArtLabel(caseRecord.baseData.luvArt)})`,
    `Teilnehmer/in: ${caseRecord.baseData.teilnehmerName || "-"}`,
    `Maßnahme: ${caseRecord.baseData.massnahme || "-"}`,
    `Beurteilungszeitraum: ${caseRecord.baseData.beurteilungszeitraumVon} - ${caseRecord.baseData.beurteilungszeitraumBis}`
  ].join("\n");

  const body = caseRecord.sections
    .filter((s) => s.text.trim().length > 0)
    .map((s) => copySectionText(s))
    .join("\n\n");

  return `${header}\n\n${body}`;
}

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
