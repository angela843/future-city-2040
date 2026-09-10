/**
 * Serverseitige Validierung des strukturierten Claude-Antwortschemas
 * (Spezifikation Abschnitt 13, 36).
 */
import { z } from "zod";

export const ClaudeOkResponseSchema = z.object({
  status: z.literal("ok"),
  text: z.string(),
  evidence_ids: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([])
});

export const ClaudeInsufficientDataResponseSchema = z.object({
  status: z.literal("insufficient_data"),
  text: z.literal(""),
  questions: z.array(z.string()).min(1)
});

export const ClaudeConflictResponseSchema = z.object({
  status: z.literal("conflict"),
  text: z.literal(""),
  conflicts: z.array(z.string()).min(1)
});

export const ClaudeResponseSchema = z.discriminatedUnion("status", [
  ClaudeOkResponseSchema,
  ClaudeInsufficientDataResponseSchema,
  ClaudeConflictResponseSchema
]);

export type ClaudeOkResponse = z.infer<typeof ClaudeOkResponseSchema>;
export type ClaudeInsufficientDataResponse = z.infer<typeof ClaudeInsufficientDataResponseSchema>;
export type ClaudeConflictResponse = z.infer<typeof ClaudeConflictResponseSchema>;
export type ClaudeResponse = z.infer<typeof ClaudeResponseSchema>;

export interface SchemaValidationResult {
  valid: boolean;
  data?: ClaudeResponse;
  error?: string;
}

/**
 * Versucht, den rohen (bereits als JSON geparsten) Claude-Output gegen das Schema
 * zu validieren. Bei Fehlschlag: keine unsicheren Teiltexte uebernehmen (Abschnitt 36).
 */
export function validateClaudeResponse(raw: unknown): SchemaValidationResult {
  const parsed = ClaudeResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { valid: false, error: "Antwort konnte nicht sicher verarbeitet werden." };
  }
  return { valid: true, data: parsed.data };
}
