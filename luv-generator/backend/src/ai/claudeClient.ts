/**
 * Claude API Client (Spezifikation Abschnitt 37).
 * API-Schluessel ausschliesslich serverseitig, kein direkter Browser-zu-Claude-Aufruf.
 * Bei Ausfall: verstaendliche Fehlermeldung, Eingaben bleiben erhalten (siehe web/routes/ai.ts).
 */
import Anthropic from "@anthropic-ai/sdk";
import { AiTaskType } from "../privacy/allowlist.js";
import { BuiltPrompt } from "./promptBuilder.js";
import { generateMockResponse } from "./testModeMock.js";

export class ClaudeUnavailableError extends Error {}

const isTestMode = () => process.env.LUV_TEST_MODE === "true";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ClaudeUnavailableError("ANTHROPIC_API_KEY ist nicht konfiguriert.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface RawClaudeCallResult {
  raw: unknown;
  rawText: string;
}

/**
 * Ruft Claude auf (oder liefert im Testmodus einen deterministischen Mock) und gibt den
 * rohen, noch NICHT validierten geparsten JSON-Inhalt zurueck. Die Validierung erfolgt
 * separat in validation/schema.ts.
 */
export async function callClaude(
  task: AiTaskType,
  prompt: BuiltPrompt,
  sanitizedPayload: Record<string, unknown>
): Promise<RawClaudeCallResult> {
  if (isTestMode()) {
    const raw = generateMockResponse(task, sanitizedPayload);
    return { raw, rawText: JSON.stringify(raw) };
  }

  try {
    const anthropic = getClient();
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1500,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }]
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";
    let raw: unknown;
    try {
      raw = JSON.parse(extractJson(rawText));
    } catch {
      raw = null;
    }
    return { raw, rawText };
  } catch (error) {
    if (error instanceof ClaudeUnavailableError) throw error;
    throw new ClaudeUnavailableError(
      "Die KI-Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut."
    );
  }
}

/** Entfernt ggf. umschliessende Markdown-Codeblock-Marker, falls Claude trotz Anweisung welche liefert. */
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return fenceMatch ? fenceMatch[1] : trimmed;
}
