/**
 * Konkretisierungsassistent (Version 0.2, PH-15 Abschnitt 23-26).
 *
 * Erkennt pauschale, wertende oder fachlich nicht ausreichend beobachtbare Begriffe
 * DETERMINISTISCH (kein KI-Aufruf noetig) und liefert konkrete Hilfsfragen, BEVOR ein
 * Text an Claude geschickt wird. Dies ergaenzt (ersetzt nicht) die reaktive
 * "insufficient_data"-Antwort von Claude - die Erkennung liegt bewusst im Code, nicht
 * nur im Prompt (Systemprinzip 3 des Master-Arbeitsstands).
 *
 * WICHTIG: Der Assistent darf aus den Antworten der Koordination keine Diagnose oder
 * Persoenlichkeitseigenschaft ableiten (PH-15 Abschnitt 26) - er stellt ausschliesslich
 * Rueckfragen, interpretiert aber niemals die Antwort.
 */

/** PH-15 Abschnitt 24. TODO: fachlich abgleichen - Liste ist eine Arbeitsversion, kein
 *  abschliessender Katalog kritischer Begriffe. */
export const CRITICAL_TERMS = [
  "faul",
  "unmotiviert",
  "schwierig",
  "aggressiv",
  "unselbstständig",
  "unselbststaendig",
  "unzuverlässig",
  "unzuverlaessig",
  "wenig belastbar",
  "ängstlich",
  "aengstlich",
  "sozial auffällig",
  "sozial auffaellig",
  "respektlos",
  "uninteressiert",
  "überfordert",
  "ueberfordert",
  "unkonzentriert"
];

/** PH-15 Abschnitt 25: allgemeine Hilfsfragen fuer den Konkretisierungsdialog. */
export const CLARIFICATION_QUESTIONS = [
  "Beginnt die Person Aufgaben selbstständig?",
  "Sind wiederholte Aufforderungen erforderlich?",
  "Werden Aufgaben abgebrochen?",
  "Bei welchen Tätigkeiten tritt dies auf?",
  "Wie häufig wurde dies beobachtet?",
  "Welche Unterstützung ist erforderlich?"
];

export interface ClarificationCheckResult {
  needsClarification: boolean;
  matchedTerms: string[];
  message?: string;
  questions: string[];
}

/**
 * Prueft einen rohen Beobachtungstext auf kritische pauschale Begriffe. Rein
 * lexikalisch/deterministisch - keine Interpretation des Inhalts.
 */
export function checkForClarification(rawText: string): ClarificationCheckResult {
  const lower = (rawText || "").toLowerCase();
  const matched = CRITICAL_TERMS.filter((term) => lower.includes(term));

  if (matched.length === 0) {
    return { needsClarification: false, matchedTerms: [], questions: [] };
  }

  return {
    needsClarification: true,
    matchedTerms: [...new Set(matched)],
    message: "Diese Aussage ist für eine LUV zu pauschal. Bitte beschreiben Sie das beobachtbare Verhalten.",
    questions: CLARIFICATION_QUESTIONS
  };
}
