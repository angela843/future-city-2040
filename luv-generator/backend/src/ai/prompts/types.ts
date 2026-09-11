export interface PromptTemplate {
  taskName: string;
  version: string;
  system: string;
  buildUserPrompt(payload: Record<string, unknown>): string;
}
