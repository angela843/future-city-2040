/**
 * Prompt Builder (Spezifikation Abschnitt 11).
 * Waehlt anhand der Aufgabe das passende versionierte Prompt-Template und baut daraus
 * den finalen an Claude zu sendenden Prompt. Erhaelt ausschliesslich bereits durch den
 * Privacy Gateway freigegebene, minimale Payloads.
 */
import { AiTaskType } from "../privacy/allowlist.js";
import { developmentComparisonPromptV1 } from "./prompts/developmentComparison.v1.js";
import { factCheckPromptV1 } from "./prompts/factCheck.v1.js";
import { formulateSectionPromptV1 } from "./prompts/formulateSection.v1.js";
import { measuresPromptV1 } from "./prompts/measures.v1.js";
import { overallRedactionPromptV1 } from "./prompts/overallRedaction.v1.js";
import { structureNotesPromptV1 } from "./prompts/structureNotes.v1.js";
import { supportGoalsPromptV1 } from "./prompts/supportGoals.v1.js";
import { PromptTemplate } from "./prompts/types.js";

const TEMPLATES: Record<AiTaskType, PromptTemplate> = {
  structure_notes: structureNotesPromptV1,
  formulate_section: formulateSectionPromptV1,
  support_goal_suggestions: supportGoalsPromptV1,
  measure_suggestions: measuresPromptV1,
  development_comparison: developmentComparisonPromptV1,
  overall_redaction: overallRedactionPromptV1,
  fact_check: factCheckPromptV1
};

export interface BuiltPrompt {
  taskName: string;
  version: string;
  system: string;
  user: string;
}

export function buildPrompt(task: AiTaskType, sanitizedPayload: Record<string, unknown>): BuiltPrompt {
  const template = TEMPLATES[task];
  return {
    taskName: template.taskName,
    version: template.version,
    system: template.system,
    user: template.buildUserPrompt(sanitizedPayload)
  };
}
