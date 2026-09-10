/**
 * Vergabe eindeutiger Evidence-IDs (Spezifikation Abschnitt 7).
 * Beispiele: MATH_001, OBS_012, PRACTICE_004
 */
import { CompetenceArea, EvidenceSource } from "./types.js";

const AREA_PREFIX: Record<CompetenceArea, string> = {
  schulische_grundkompetenzen: "SCHOOL",
  digitale_kompetenzen: "DIGI",
  personale_kompetenzen: "PERS",
  sozial_kommunikative_kompetenzen: "SOC",
  methodische_kompetenzen: "METH",
  berufliche_orientierung_praxis: "PRACTICE"
};

const SOURCE_PREFIX: Record<EvidenceSource, string> = {
  kompetenzfeststellung: "TEST",
  unterricht: "CLASS",
  praktische_aufgabe: "TASK",
  beobachtung: "OBS",
  praktikum: "PRACTICE",
  betriebliche_erprobung: "TRIAL",
  gespraech: "TALK",
  selbsteinschaetzung: "SELF",
  rueckmeldung_dritter: "EXT",
  vorhandene_dokumentation: "DOC"
};

export function evidencePrefix(area: CompetenceArea | null, source: EvidenceSource): string {
  if (area && area !== "berufliche_orientierung_praxis") return AREA_PREFIX[area];
  return SOURCE_PREFIX[source];
}

export function nextEvidenceId(prefix: string, existingIds: string[]): string {
  const pattern = new RegExp(`^${prefix}_(\\d{3,})$`);
  let max = 0;
  for (const id of existingIds) {
    const match = pattern.exec(id);
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }
  const next = (max + 1).toString().padStart(3, "0");
  return `${prefix}_${next}`;
}
