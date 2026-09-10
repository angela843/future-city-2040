/**
 * Deterministisches Rendering der bestaetigten Foerderziele/Massnahmen in Klartext
 * (Spezifikation Abschnitt 18, 19 Punkt 9). Keine KI-Beteiligung - reine Zusammenfuehrung
 * bereits bestaetigter/uebernommener Daten.
 */
import { SupportGoal } from "../domain/types.js";

const INCLUDED_STATUSES: SupportGoal["status"][] = ["uebernommen", "bearbeitet", "neu_formuliert"];

export function renderSupportGoalsSectionText(goals: SupportGoal[]): string {
  const included = goals.filter((g) => INCLUDED_STATUSES.includes(g.status));
  if (included.length === 0) return "";

  return included
    .map((g) => {
      const priorityLine = g.prioritaet ? ` (Priorität: ${g.prioritaet})` : "";
      return [
        `Bereich: ${g.bereich}${priorityLine}`,
        `Ausgangslage: ${g.ausgangslage}`,
        `Ziel: ${g.ziel}`,
        `Maßnahme: ${g.massnahme}`,
        `Überprüfungskriterium: ${g.ueberpruefungskriterium}`
      ].join("\n");
    })
    .join("\n\n");
}
