/**
 * Vorschau- und Freigabecheck (Version 0.2, PH-15 Abschnitt 43-45).
 *
 * Prueft vor der finalen Freigabe:
 * - offene rote (nicht gedeckte) Abschnitte, die noch NICHT manuell bearbeitet wurden
 * - unbestaetigte Foerderziele (Status "vorschlag")
 * - unbestaetigte Foerderbereiche (Status "pending")
 * - unbelegte KI-Aussagen (Claims mit Status "unsupported" innerhalb eines Abschnitts)
 *
 * MUSS (PH-15 Abschnitt 43): Rot gekennzeichnete KI-Texte duerfen nicht ohne aktive
 * fachliche Bearbeitung in den finalen Export gelangen. Diese Regel wird NICHT nur
 * angezeigt, sondern serverseitig in web/routes/cases.ts (POST /approve) technisch
 * durchgesetzt - sie liegt damit nicht nur im Prompt oder im Frontend.
 *
 * TODO: fachlich abgleichen - "ungeloeste Widersprueche" (conflict-Antworten der KI)
 * werden aktuell nur transient an die Oberflaeche zurueckgegeben und nicht dauerhaft
 * je Abschnitt gespeichert; dieser Check kann daher nur die zuletzt sichtbaren
 * Abschnitts-Warnungen und Faktenstatus auswerten, keine historischen Konflikte.
 */
import { CaseRecord, LuvSection } from "./types.js";

export interface ReleaseCheckBlockingSection {
  key: LuvSection["key"];
  title: string;
  reason: string;
}

export interface ReleaseCheckResult {
  /** true, wenn eine Freigabe technisch verweigert werden muss. */
  blocked: boolean;
  blockingSections: ReleaseCheckBlockingSection[];
  unresolvedSupportGoals: number;
  unresolvedSupportAreas: number;
  openWarnings: number;
}

export function runReleaseCheck(c: CaseRecord): ReleaseCheckResult {
  const blockingSections: ReleaseCheckBlockingSection[] = [];

  for (const section of c.sections) {
    if (!section.text.trim()) continue;
    // Manuell bearbeitete Abschnitte gelten als aktiv fachlich geprueft (siehe
    // luv_composer/composer.ts: manuelle Bearbeitung loescht den alten Faktencheck).
    if (section.manualOverride) continue;
    if (section.factCheck && (section.factCheck.status === "unsupported" || section.factCheck.status === "needs_review")) {
      blockingSections.push({
        key: section.key,
        title: section.title,
        reason:
          section.factCheck.status === "unsupported"
            ? "Abschnitt enthält laut Faktenprüfung nicht belegte Aussagen."
            : "Abschnitt wurde noch nicht abschließend fachlich geprüft."
      });
    }
  }

  const unresolvedSupportGoals = c.supportGoals.filter((g) => g.status === "vorschlag").length;
  const unresolvedSupportAreas = c.supportAreaCandidates.filter((a) => a.status === "pending").length;
  const openWarnings = c.sections.reduce((sum, s) => sum + (s.manualOverride ? 0 : s.warnings.length), 0);

  return {
    blocked: blockingSections.length > 0,
    blockingSections,
    unresolvedSupportGoals,
    unresolvedSupportAreas,
    openWarnings
  };
}
