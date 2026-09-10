/**
 * Deterministische Foerderlogik (Spezifikation Abschnitt 17).
 *
 * Bewertung 2 (teilweise_sicher)         -> moeglicher Entwicklungsbereich ("development")
 * Bewertung 1 (foerderbedarf)            -> moeglicher Foerderbereich ("support")
 * Bewertung 0 (deutlicher_foerderbedarf) -> prioritaerer Pruefhinweis ("priority")
 *
 * Diese Logik setzt KEINEN Foerderbedarf automatisch verbindlich.
 * Erst eine aktive Bestaetigung durch die Koordination (confirmed_support_need = true,
 * hier abgebildet als SupportAreaStatus "confirmed") erlaubt Zielvorschlaege.
 */
import { RATING_INTERNAL_SCORE, SubCompetence, SupportAreaCandidate } from "./types.js";

export type TriggerLevel = "development" | "support" | "priority";

export function triggerLevelForRating(rating: SubCompetence["rating"]): TriggerLevel | null {
  const score = RATING_INTERNAL_SCORE[rating];
  if (score === null || score === undefined) return null;
  if (score === 2) return "development";
  if (score === 1) return "support";
  if (score === 0) return "priority";
  return null;
}

/**
 * Ermittelt aus allen Unterkompetenzen die moeglichen Foerderbereich-Kandidaten.
 * Rein deterministisch, keine KI beteiligt.
 */
export function deriveSupportAreaCandidates(
  subCompetences: SubCompetence[],
  existing: SupportAreaCandidate[]
): SupportAreaCandidate[] {
  const existingBySubCompetence = new Map(existing.map((c) => [c.subCompetenceId, c]));
  const result: SupportAreaCandidate[] = [];

  for (const sub of subCompetences) {
    const level = triggerLevelForRating(sub.rating);
    if (!level) continue;

    const prior = existingBySubCompetence.get(sub.id);
    result.push(
      prior
        ? { ...prior, triggerLevel: level, label: sub.label, area: sub.area }
        : {
            id: `SUPPORT_${sub.id}`,
            subCompetenceId: sub.id,
            area: sub.area,
            label: sub.label,
            triggerLevel: level,
            status: "pending"
          }
    );
  }

  return result;
}

/** Nur bestaetigte Foerderbereiche duerfen Zielvorschlaege erzeugen. */
export function confirmedSupportAreas(candidates: SupportAreaCandidate[]): SupportAreaCandidate[] {
  return candidates.filter((c) => c.status === "confirmed");
}
