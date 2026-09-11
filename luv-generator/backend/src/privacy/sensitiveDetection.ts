/**
 * Erkennung potenziell sensibler / medizinischer / unnoetig identifizierender
 * Angaben in Freitext (Spezifikation Abschnitt 9).
 *
 * Fuer Version 0.1 bewusst konservativ (Keyword-/Musterbasiert). Im Zweifel wird
 * blockiert statt uebertragen. TODO: fachlich abgleichen - ggf. Liste mit
 * Datenschutzbeauftragten/Fachdienst abstimmen und erweitern.
 */

const SENSITIVE_PATTERNS: RegExp[] = [
  /diagnos\w*/i,
  /adhs/i,
  /add\b/i,
  /autis\w*/i,
  /asperger/i,
  /depressi\w*/i,
  /angststör\w*/i,
  /borderline/i,
  /psychiatr\w*/i,
  /psychisch\w*\s*(erkrank|störung|belast)/i,
  /trauma\w*/i,
  /suizid\w*/i,
  /selbstverletz\w*/i,
  /sucht\w*/i,
  /alkoholabhäng\w*/i,
  /drogen\w*/i,
  /medikament\w*/i,
  /therapie\w*/i,
  /epilepsi\w*/i,
  /schwanger\w*/i,
  /behinderung\w*/i,
  /schwerbehindert\w*/i,
  /hiv\b/i,
  /krebs\w*/i,
  /chronisch\w*\s*erkrank\w*/i,
  /essstör\w*/i,
  /missbrauch\w*/i,
  /misshandlung\w*/i,
  /religionszugehörigkeit/i,
  /migrationshintergrund/i,
  /staatsangehörigkeit/i,
  /sexuelle\s*orientierung/i
];

export interface SensitiveScanResult {
  sensitive: boolean;
  matchedTerms: string[];
}

export function scanTextForSensitiveContent(text: string): SensitiveScanResult {
  const matched: string[] = [];
  for (const pattern of SENSITIVE_PATTERNS) {
    const match = pattern.exec(text);
    if (match) matched.push(match[0]);
  }
  return { sensitive: matched.length > 0, matchedTerms: matched };
}

/** Rekursiv alle String-Werte eines Objekts auf sensible Inhalte pruefen. */
export function scanPayloadForSensitiveContent(payload: unknown): SensitiveScanResult {
  const matched: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      const result = scanTextForSensitiveContent(value);
      matched.push(...result.matchedTerms);
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(visit);
    }
  };
  visit(payload);
  return { sensitive: matched.length > 0, matchedTerms: matched };
}
