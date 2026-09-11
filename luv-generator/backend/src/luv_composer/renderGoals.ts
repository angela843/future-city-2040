/**
 * Deterministisches Rendering der bestaetigten Foerderziele/Massnahmen in Klartext
 * (Spezifikation Abschnitt 18, 19 Punkt 9). Keine KI-Beteiligung - reine Zusammenfuehrung
 * bereits bestaetigter/uebernommener Daten.
 *
 * Korrekturauftrag V0.2.1:
 *  - A6: Ziele werden im Output nach der zugeordneten Rolle gruppiert. Leere
 *    Rollenblöcke werden nicht künstlich erzeugt - eine Rollen-Überschrift erscheint
 *    nur, wenn tatsächlich mindestens ein Ziel dieser Rolle zugeordnet ist. Claude
 *    leitet nie selbst eine Rolle ab; die Rolle stammt ausschliesslich aus
 *    strukturierter menschlicher Eingabe (SupportGoal.rolle).
 *  - A5: im Anschluss werden die erfassten BA-Foerderzielbereiche mit ihrem
 *    voraussichtlichen Zeitraum (von/bis) und Status feldgerecht ausgegeben.
 */
import { FoerderzielbereichTracking, Rolle, SupportGoal } from "../domain/types.js";
import { BA_FOERDERZIELBEREICH_LABELS, ROLLE_LABELS } from "../domain/labels.js";

const INCLUDED_STATUSES: SupportGoal["status"][] = ["uebernommen", "bearbeitet", "neu_formuliert"];

const COMPLETION_STATUS_LABELS: Record<NonNullable<SupportGoal["completionStatus"]>, string> = {
  erreicht: "erreicht",
  teilweise_erreicht: "teilweise erreicht",
  weiterhin_aktuell: "weiterhin aktuell",
  angepasst: "angepasst bzw. weiterentwickelt",
  nicht_erreicht: "nicht erreicht",
  nicht_mehr_relevant: "nicht mehr relevant"
};

/**
 * Anzeigelabel des Foerderzielbereich-Status im offiziellen Output (Korrekturauftrag
 * V0.2.1, A5). "erneut_geoeffnet" ist eine interne Steuerungsinformation und darf
 * nicht als eigenstaendiges offizielles BA-Feld erscheinen - ein wiedereroeffneter
 * Bereich wird im Text daher wie ein aktiver Bereich ausgegeben (technische
 * Ableitung, keine neue fachliche Aussage: "wieder geoeffnet" bedeutet fachlich
 * nichts anderes als "aktuell wieder aktiv").
 */
const FOERDERZIELBEREICH_OUTPUT_STATUS_LABELS: Record<FoerderzielbereichTracking["status"], string> = {
  begonnen: "begonnen",
  aktiv: "aktiv",
  abgeschlossen: "Maßnahme abgeschlossen",
  erneut_geoeffnet: "aktiv"
};

function renderGoalEntry(g: SupportGoal): string {
  const statusLine = g.completionStatus ? `\nZielstatus: ${COMPLETION_STATUS_LABELS[g.completionStatus]}` : "";
  const bereichLine = g.foerderzielbereich ? `\nBA-Förderzielbereich: ${BA_FOERDERZIELBEREICH_LABELS[g.foerderzielbereich]}` : "";
  // Version 0.2 (PH-15 Abschnitt 34): die interne Priorisierung (A/B/C) ist rein
  // organisatorisch und darf NICHT automatisch im LUV-Text erscheinen.
  return [
    `Bereich: ${g.bereich}`,
    `Ausgangslage: ${g.ausgangslage}`,
    `Ziel: ${g.ziel}`,
    `Maßnahme: ${g.massnahme}`,
    `Überprüfungskriterium: ${g.ueberpruefungskriterium}${statusLine}${bereichLine}`
  ].join("\n");
}

function renderFoerderzielbereichPlanung(tracking: FoerderzielbereichTracking[]): string {
  if (tracking.length === 0) return "";
  const lines = tracking.map((t) => {
    const zeitraum =
      t.von || t.bis ? ` (${t.von ?? "offen"} bis ${t.bis ?? "offen"})` : "";
    return `- ${BA_FOERDERZIELBEREICH_LABELS[t.bereich]}${zeitraum}: ${FOERDERZIELBEREICH_OUTPUT_STATUS_LABELS[t.status]}`;
  });
  return `Förder- und Qualifizierungsplanung (Zeiträume):\n${lines.join("\n")}`;
}

/**
 * @param goals Alle Foerderziele des Falls.
 * @param tracking BA-Foerderzielbereich-Tracking (Bereich, Status, Zeitraum) -
 *   optional, da diese Funktion auch fuer Faelle ohne Tracking-Daten aufrufbar bleibt.
 */
export function renderSupportGoalsSectionText(goals: SupportGoal[], tracking: FoerderzielbereichTracking[] = []): string {
  const included = goals.filter((g) => INCLUDED_STATUSES.includes(g.status));
  if (included.length === 0 && tracking.length === 0) return "";

  const ohneRolle = included.filter((g) => !g.rolle);
  const rollenMitZielen = Array.from(new Set(included.map((g) => g.rolle).filter((r): r is Rolle => !!r)));

  const blocks: string[] = [];

  if (ohneRolle.length > 0) {
    blocks.push(ohneRolle.map(renderGoalEntry).join("\n\n"));
  }

  for (const rolle of rollenMitZielen) {
    const goalsForRolle = included.filter((g) => g.rolle === rolle);
    blocks.push(`${ROLLE_LABELS[rolle]}:\n` + goalsForRolle.map(renderGoalEntry).join("\n\n"));
  }

  const planung = renderFoerderzielbereichPlanung(tracking);
  if (planung) blocks.push(planung);

  return blocks.join("\n\n");
}
