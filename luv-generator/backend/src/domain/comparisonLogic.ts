/**
 * Deterministische Vergleichslogik fuer Verlaufs-/Abschluss-LUV
 * (Spezifikation Abschnitt 20-22).
 *
 * Wichtig: Diese Regel liegt vollstaendig im Code (nicht nur im KI-Prompt).
 * Claude darf im Rahmen des "Entwicklungsvergleich"-Prompts lediglich Formulierungsvorschlaege
 * liefern; der Vergleichsstatus selbst wird hier deterministisch berechnet und muss von der
 * Koordination bestaetigt werden, bevor er als Entwicklung in den LUV einfliessen darf.
 */
import { CompetenceRating, ComparisonStatus, RATING_INTERNAL_SCORE } from "./types.js";

/**
 * Vergleicht zwei Bewertungen und liefert einen VORSCHLAG fuer den Vergleichsstatus.
 * Keine automatische "Verschlechterung" - bei einem Rueckgang wird ausschliesslich
 * eine "moegliche negative Abweichung" vorgeschlagen, die die Koordination bestaetigen muss.
 */
export function compareRatings(
  previous: CompetenceRating | null,
  current: CompetenceRating | null
): ComparisonStatus {
  if (!current) return "nicht_vergleichbar";

  const currentScore = RATING_INTERNAL_SCORE[current];
  if (currentScore === null || currentScore === undefined) return "nicht_vergleichbar";

  if (!previous || previous === "nicht_erhoben") {
    // Beispiel Abschnitt 21: vorher "nicht erhoben", jetzt "ueberwiegend sicher"
    // -> aktueller Stand, KEINE Verbesserungsbehauptung.
    return "neu_erhoben";
  }

  const previousScore = RATING_INTERNAL_SCORE[previous];
  if (
    previousScore === null ||
    previousScore === undefined ||
    previous === "nicht_beurteilbar" ||
    previous === "nicht_relevant" ||
    current === "nicht_beurteilbar" ||
    current === "nicht_relevant"
  ) {
    return "nicht_vergleichbar";
  }

  if (currentScore > previousScore) return "positive_entwicklung";
  if (currentScore === previousScore) return "stabil";
  // currentScore < previousScore
  return "moegliche_negative_abweichung";
}

/**
 * Ein Vergleich zaehlt erst dann als "Entwicklung" im LUV, wenn zwei vergleichbare,
 * bestaetigte Zeitpunkte vorliegen (Abschnitt 20, 21). Ohne Bestaetigung darf kein
 * Entwicklungssatz erzeugt werden.
 */
export function isConfirmedComparableDevelopment(
  suggestedStatus: ComparisonStatus,
  confirmed: boolean
): boolean {
  if (!confirmed) return false;
  return suggestedStatus !== "nicht_vergleichbar";
}
