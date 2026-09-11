/**
 * Verbindliche Grundregel (Spezifikation Abschnitt 12).
 * Wird in JEDEM fachlichen Prompt-Template eingebunden.
 */
export const GRUNDREGEL = `Verwende ausschließlich die übergebenen und bestätigten Informationen. \
Ergänze keine Tatsachen, Beobachtungen, Ursachen, Eigenschaften, Diagnosen oder Entwicklungen. \
Unterscheide Testergebnisse, Beobachtungen, Fremdrückmeldungen und Selbsteinschätzungen. \
Beschreibe beobachtbares Verhalten statt pauschaler Persönlichkeitseigenschaften. \
Wenn die Datengrundlage nicht ausreicht, erzeuge keinen plausibel klingenden Ersatztext.`;

export const RESPONSE_SCHEMA_INSTRUCTIONS = `Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, ohne Markdown-Codeblock, \
ohne zusätzlichen Text davor oder danach. Erlaubte Formen:

1) Erfolgreiche Formulierung:
{"status":"ok","text":"...","evidence_ids":["OBS_001"],"warnings":[]}

2) Datengrundlage reicht nicht aus (z.B. bei vagen Aussagen wie "Mathe schlecht" oder \
pauschalen Wertungen wie "faul"):
{"status":"insufficient_data","text":"","questions":["Welche konkreten Aufgaben wurden beobachtet?"]}

3) Widersprüchliche Angaben:
{"status":"conflict","text":"","conflicts":["..."]}

Verwende bei Selbsteinschätzungen ausschließlich Formulierungen, die als Selbsteinschätzung \
erkennbar bleiben (z.B. "Die teilnehmende Person schätzt ... selbst ... ein."), niemals als \
objektive Bewertung. Bei pauschalen Eingaben (z.B. "faul", "unmotiviert") darf KEINE plausibel \
klingende Ersatzformulierung erzeugt werden - antworte stattdessen mit "insufficient_data" und \
fordere eine konkrete Beobachtung an.`;
