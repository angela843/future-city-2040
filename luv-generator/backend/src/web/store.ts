/**
 * Session-Speicherung (Spezifikation Abschnitt 34).
 * Version 0.1 ist bewusst eine reine In-Memory-Session-Anwendung: keine Datenbank,
 * keine persistente Teilnehmerhistorie. Beim Neustart des Servers gehen alle Faelle
 * verloren - das ist fuer ein TESTSYSTEM mit ausschliesslich fiktiven Daten gewollt.
 */
import { nanoid } from "nanoid";
import { CaseRecord } from "../domain/types.js";

const cases = new Map<string, CaseRecord>();

export function createCase(record: Omit<CaseRecord, "id" | "createdAt">): CaseRecord {
  const id = nanoid();
  const full: CaseRecord = { ...record, id, createdAt: new Date().toISOString() };
  cases.set(id, full);
  return full;
}

export function putCase(record: CaseRecord): CaseRecord {
  cases.set(record.id, record);
  return record;
}

export function getCase(id: string): CaseRecord | undefined {
  return cases.get(id);
}

export function deleteCase(id: string): void {
  cases.delete(id);
}

export function listCaseIds(): string[] {
  return Array.from(cases.keys());
}

/** Nur fuer Tests: Speicher vollstaendig leeren. */
export function clearAllCases(): void {
  cases.clear();
}
