/**
 * Deterministisches Rendering der bestaetigten Foerderziele/Massnahmen in Klartext
 * (Spezifikation Abschnitt 18, 19 Punkt 9). Keine KI-Beteiligung - reine Zusammenfuehrung
 * bereits bestaetigter/uebernommener Daten.
 */
import { SupportGoal } from "../domain/types.js";
import { BA_FOERDERZIELBEREICH_LABELS } from "../domain/labels.js";

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
 * Version 0.2 (PH-15 Abschnitt 34): die interne Priorisierung (A/B/C) ist rein
 * organisatorisch und darf laut Spezifikation NICHT automatisch im LUV-Text
 * erscheinen - sie wird hier bewusst NICHT gerendert (Korrektur ggue. Version 0.1,
 * die die Priorität faelschlich in den Text uebernahm).
 *
 * Der Zielstatus (completionStatus) darf dagegen erscheinen, da er - anders als die
 * Priorität - eine fachlich bestaetigte Aussage der Koordination ueber den bisherigen
 * Verlauf ist (nur bei Verlaufs-/Abschluss-LUV gesetzt).
 *
 * Der BA-Foerderzielbereich (PH-15 v1.1 Abschnitt 47) ist - anders als die interne
 * Priorisierung - Teil der fachlichen Zielstruktur selbst und wird daher gerendert.
 */
export function renderSupportGoalsSectionText(goals: SupportGoal[]): string {
  const included = goals.filter((g) => INCLUDED_STATUSES.includes(g.status));
  if (included.length === 0) return "";

  return included
    .map((g) => {
      const statusLine = g.completionStatus ? `\nZielstatus: ${COMPLETION_STATUS_LABELS[g.completionStatus]}` : "";
      const bereichLine = g.foerderzielbereich ? `\nBA-Förderzielbereich: ${BA_FOERDERZIELBEREICH_LABELS[g.foerderzielbereich]}` : "";
      return [
        `Bereich: ${g.bereich}`,
        `Ausgangslage: ${g.ausgangslage}`,
        `Ziel: ${g.ziel}`,
        `Maßnahme: ${g.massnahme}`,
        `Überprüfungskriterium: ${g.ueberpruefungskriterium}${statusLine}${bereichLine}`
      ].join("\n");
    })
    .join("\n\n");
}
