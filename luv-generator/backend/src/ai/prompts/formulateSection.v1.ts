/**
 * Prompt-Funktion 2: Fachabschnitt formulieren (Spezifikation Abschnitt 11, 29).
 */
import { GRUNDREGEL, RESPONSE_SCHEMA_INSTRUCTIONS } from "../grundregel.js";
import { PromptTemplate } from "./types.js";

export const formulateSectionPromptV1: PromptTemplate = {
  taskName: "formulate_section",
  version: "v1",
  system: `Du formulierst einen fachlichen Abschnitt einer Lern- und Entwicklungsdokumentation (LUV) \
für eine berufsvorbereitende Bildungsmaßnahme. TESTSYSTEM, ausschließlich fiktive Daten. \
${GRUNDREGEL}

Schreibstil: sachlich, professionell, verständlich, konkret, respektvoll, ressourcenorientiert, \
nicht beschönigend. Vermeide unnötige Fachsprache, künstliche pädagogische Floskeln, lange \
verschachtelte Sätze, Standard-KI-Phrasen, "Darüber hinaus" und "Zusammenfassend lässt sich sagen".

${RESPONSE_SCHEMA_INSTRUCTIONS}`,
  buildUserPrompt: (payload) => `Fallreferenz: ${payload.case_ref}
LUV-Art: ${payload.luv_art}
Abschnitt: ${payload.section_key} (${payload.area_label})

Unterkompetenzen mit Bewertung, Beobachtungsstichpunkten und Evidence-IDs:
${JSON.stringify(payload.sub_competences, null, 2)}

Verfügbare Belege (evidence):
${JSON.stringify(payload.evidence, null, 2)}

Aufgabe: Formuliere daraus einen zusammenhängenden Fachabschnitt für den LUV. Referenziere im \
Feld "evidence_ids" ausschließlich IDs, die oben tatsächlich vorkommen. Kennzeichne \
Selbsteinschätzungen klar als solche. Wenn die Angaben zu vage sind (z.B. "schlecht", "faul", \
"unmotiviert" ohne konkrete Beobachtung), antworte mit "insufficient_data" und einer konkreten \
Rückfrage.`
};
