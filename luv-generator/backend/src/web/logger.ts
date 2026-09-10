/**
 * Logging (Spezifikation Abschnitt 35).
 * Logs enthalten NIEMALS vollstaendige Teilnehmernamen, LUV-Texte, Prompts oder
 * sensible Freitexte - nur technische IDs und Statusinformationen.
 */
export function logEvent(event: string, meta: Record<string, string | number | boolean | undefined> = {}): void {
  const safeMeta = Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...safeMeta }));
}
