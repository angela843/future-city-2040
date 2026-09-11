/**
 * Vorvalidierung (PH-17 V1.0 Abschnitt 7 / Entwicklungsauftrag Abschnitt F, MUSS).
 *
 * Harte, rein deterministische Blocker, die VOR jedem Claude-Aufruf und vor der
 * finalen Freigabe greifen. Anders als der Qualitaetscheck (`qualityCheck.ts`, der
 * fuer alle anderen Punkte weiterhin "Warnung statt Zwang" bleibt) verweigern diese
 * beiden Pruefungen aktiv die Generierung/Freigabe (Migrationsplan 0.1->0.2,
 * Entscheidungen 2 und 3 - PH-17 hat hier ausdruecklich Vorrang vor PH-15).
 */
import { CaseRecord, SupportAreaCandidate } from "./types.js";

export interface PreValidationBlock {
  blocked: boolean;
  reason?: string;
}

/**
 * Migrationsplan Entscheidung 3: ein bestaetigter Foerderbereich ohne belegende
 * Beobachtung/Quelle (weder Beobachtungsstichpunkte noch verknuepfte Evidenz) blockiert
 * die KI-Generierung des betreffenden Inhalts. Das System fordert gezielt zur Ergaenzung
 * der Grundlage auf; Claude darf einen Foerderbedarf nie selbst begruenden.
 */
export function checkFoerderbedarfBeleg(c: CaseRecord): PreValidationBlock {
  const ohneBeleg: SupportAreaCandidate[] = c.supportAreaCandidates.filter((a) => {
    if (a.status !== "confirmed") return false;
    const sub = c.subCompetences.find((sc) => sc.id === a.subCompetenceId);
    if (!sub) return true;
    const hatBeleg = sub.observationNotes.trim().length > 0 || sub.evidenceIds.length > 0;
    return !hatBeleg;
  });
  if (ohneBeleg.length === 0) return { blocked: false };
  return {
    blocked: true,
    reason: `Folgende bestätigte Förderbereiche haben keine ausreichende Beobachtung/Quelle: ${ohneBeleg
      .map((a) => a.label)
      .join(", ")}. Bitte zunächst die Grundlage (Beobachtungsstichpunkte oder Beleg) ergänzen, bevor dieser Inhalt erzeugt wird.`
  };
}

/**
 * Migrationsplan Entscheidung 2: bei Massnahmeziel "sv_beschaeftigung" ist die
 * Begruendung, weshalb Berufsausbildung voraussichtlich nicht erreicht werden kann,
 * ein Pflichtfeld. Ohne ausgefuellte Begruendung wird jede KI-Generierung sowie die
 * finale Freigabe blockiert. Claude erzeugt/ergaenzt diesen Text nie.
 */
export function checkMassnahmezielBegruendung(c: CaseRecord): PreValidationBlock {
  if (c.baseData.massnahmeziel === "sv_beschaeftigung" && !c.baseData.begruendungKeineAusbildung.trim()) {
    return {
      blocked: true,
      reason:
        'Bei Maßnahmeziel "sozialversicherungspflichtige Beschäftigung" fehlt die Pflichtbegründung, weshalb das Ziel Berufsausbildung voraussichtlich nicht erreicht werden kann.'
    };
  }
  return { blocked: false };
}

/** Fasst alle vor JEDEM Claude-Aufruf geltenden harten Blocker zusammen. */
export function checkGeneralPreValidation(c: CaseRecord): PreValidationBlock {
  const begruendung = checkMassnahmezielBegruendung(c);
  if (begruendung.blocked) return begruendung;
  return { blocked: false };
}

/**
 * Abschluss-Modul (Migrationsplan 0.1->0.2, Entscheidung 9): Ausbildungsreife (14),
 * Berufseignung (15) und Unterstützungsbedarf (19) sind HUMAN_CONFIRMED-pflichtig.
 * Ohne aktive Bestaetigung durch die Koordination darf ein Abschluss-Fall nicht
 * freigegeben werden - Claude darf diese Entscheidungen nie selbst ableiten.
 */
export function checkAbschlussHumanConfirmed(c: CaseRecord): PreValidationBlock {
  if (c.baseData.luvArt !== "abschluss") return { blocked: false };
  const missing: string[] = [];
  if (!c.abschlussErgebnis.ausbildungsreifeErreicht.humanConfirmed) missing.push("Allgemeine Ausbildungsreife erreicht");
  if (!c.abschlussErgebnis.berufseignung.humanConfirmed) missing.push("Berufseignung");
  if (!c.abschlussErgebnis.unterstuetzungsbedarf.humanConfirmed) missing.push("Unterstützungsbedarf");
  if (missing.length === 0) return { blocked: false };
  return {
    blocked: true,
    reason: `Folgende Entscheidungen im Abschluss-Modul sind noch nicht durch die Koordination bestätigt (HUMAN_CONFIRMED): ${missing.join(
      ", "
    )}. Claude darf diese Entscheidungen nicht selbst ableiten - die Freigabe ist erst nach aktiver Bestätigung möglich.`
  };
}
