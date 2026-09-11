/**
 * Deterministisches Rendering des Abschluss-Moduls (offizieller BA-Abschluss-LuV
 * 10/2025, Migrationsplan 0.1->0.2 Abschnitt 3.4). Keine KI-Beteiligung - reine
 * Zusammenfuehrung bereits erfasster bzw. HUMAN_CONFIRMED-bestaetigter Angaben.
 *
 * Direkte Identifikatoren (Felder 4-6, 8-12) erscheinen hier bewusst NICHT - sie
 * gehoeren zur Pruefansicht/zum DOCX-Export, nicht zum fliessenden LUV-Fachtext
 * (gleiche Behandlung wie teilnehmerName/geburtsdatum in baseData).
 *
 * Felder 14, 15, 19 (HUMAN_CONFIRMED) erscheinen erst im Text, sobald sie aktiv
 * durch die Koordination bestaetigt wurden - Claude leitet diese Entscheidungen
 * nie selbst ab und der Composer erfindet sie auch nicht durch Weglassen der Pruefung.
 */
import { AbschlussErgebnis, BaseData, Teilnehmerbesprechung } from "../domain/types.js";
import {
  JA_NEIN_LABELS,
  JA_NEIN_NICHT_RELEVANT_LABELS,
  MASSNAHMEZIEL_LABELS,
  UEBERMITTLUNGSANLASS_LABELS,
  VORZEITIGE_BEENDIGUNG_ART_LABELS
} from "../domain/labels.js";

export function renderAbschlussErgebnisSectionText(
  abschluss: AbschlussErgebnis,
  baseData: Pick<BaseData, "massnahmeziel" | "begruendungKeineAusbildung">,
  teilnehmerbesprechung: Teilnehmerbesprechung
): string {
  const lines: string[] = [];

  if (abschluss.uebermittlungsanlass) {
    const anlassLine =
      abschluss.uebermittlungsanlass === "vorzeitige_beendigung" && abschluss.vorzeitigeBeendigungArt
        ? `${UEBERMITTLUNGSANLASS_LABELS[abschluss.uebermittlungsanlass]} (${VORZEITIGE_BEENDIGUNG_ART_LABELS[abschluss.vorzeitigeBeendigungArt]})`
        : UEBERMITTLUNGSANLASS_LABELS[abschluss.uebermittlungsanlass];
    lines.push(`Übermittlungsanlass: ${anlassLine}`);
  }

  if (baseData.massnahmeziel) {
    const zielLine =
      baseData.massnahmeziel === "sv_beschaeftigung" && baseData.begruendungKeineAusbildung.trim()
        ? `${MASSNAHMEZIEL_LABELS[baseData.massnahmeziel]} (Begründung: ${baseData.begruendungKeineAusbildung.trim()})`
        : MASSNAHMEZIEL_LABELS[baseData.massnahmeziel];
    lines.push(`Ursprüngliches Maßnahmeziel: ${zielLine}`);
  }

  if (abschluss.hauptschulabschlussErreicht) {
    lines.push(`Hauptschulabschluss erreicht: ${JA_NEIN_NICHT_RELEVANT_LABELS[abschluss.hauptschulabschlussErreicht]}`);
  }

  if (abschluss.ausbildungsreifeErreicht.humanConfirmed && abschluss.ausbildungsreifeErreicht.value) {
    lines.push(`Allgemeine Ausbildungsreife erreicht: ${JA_NEIN_LABELS[abschluss.ausbildungsreifeErreicht.value]}`);
  }

  if (abschluss.berufseignung.humanConfirmed && abschluss.berufseignung.value.trim()) {
    lines.push(`Berufseignung (Berufe/Qualifikationsniveau): ${abschluss.berufseignung.value.trim()}`);
  }

  if (abschluss.qualifizierungsAusbildungsbausteine.trim()) {
    lines.push(`Qualifizierungs-/Ausbildungsbausteine: ${abschluss.qualifizierungsAusbildungsbausteine.trim()}`);
  }

  if (abschluss.vermittlungsfaehigkeit.trim()) {
    lines.push(`Vermittlungsfähigkeit: ${abschluss.vermittlungsfaehigkeit.trim()}`);
  }

  if (abschluss.eingliederungsergebnis.trim()) {
    lines.push(`Eingliederungsergebnis: ${abschluss.eingliederungsergebnis.trim()}`);
  }

  if (abschluss.unterstuetzungsbedarf.humanConfirmed && abschluss.unterstuetzungsbedarf.value) {
    lines.push(`Unterstützungsbedarf: ${JA_NEIN_LABELS[abschluss.unterstuetzungsbedarf.value]}`);
    if (abschluss.unterstuetzungsbedarf.value === "ja" && abschluss.unterstuetzungsbedarfBeschreibungEmpfehlung.trim()) {
      lines.push(`Beschreibung Unterstützungsbedarf und Empfehlung: ${abschluss.unterstuetzungsbedarfBeschreibungEmpfehlung.trim()}`);
    }
  }

  if (abschluss.stabilisierungFestigung.trim()) {
    lines.push(`Absprachen zur Stabilisierung/Festigung: ${abschluss.stabilisierungFestigung.trim()}`);
  }

  if (teilnehmerbesprechung.datum) {
    lines.push(`Datum der Besprechung mit der teilnehmenden Person: ${teilnehmerbesprechung.datum}`);
  }

  return lines.join("\n");
}
