/**
 * Privacy Gateway (Spezifikation Abschnitt 8, 9, 10, 37).
 *
 * Diese Funktion MUSS serverseitig vor jedem Claude-Aufruf durchlaufen werden.
 * Sie ist die einzige Stelle, die Payloads fuer die KI freigibt. Keine der hier
 * umgesetzten Regeln liegt ausschliesslich im KI-Prompt.
 *
 * Ablauf:
 *  1. Allowlist-Filter: nur fuer die jeweilige Aufgabe erlaubte Top-Level-Felder bleiben erhalten.
 *  2. Rekursive Entfernung direkter Identifikatoren (Name, Geburtsdatum, ...) auf jeder Ebene.
 *  3. Pseudonymisierung: der Fall wird nur als CASE_<zufaellige ID> referenziert.
 *  4. Sensitive-Content-Scan: enthaelt ein Freitext ggf. Gesundheits-/sensible Daten,
 *     wird die Uebertragung blockiert ("Datenschutzpruefung erforderlich").
 */
import { AiTaskType, DIRECT_IDENTIFIER_KEYS, TASK_ALLOWED_FIELDS } from "./allowlist.js";
import { scanPayloadForSensitiveContent } from "./sensitiveDetection.js";

export interface PrivacyGatewayResult {
  ok: boolean;
  /** Bereinigter, freigegebener Payload - nur gesetzt wenn ok === true. */
  sanitizedPayload?: Record<string, unknown>;
  /** Grund einer Blockade, z.B. "sensitive_data_check_required". */
  blockedReason?: "sensitive_data_check_required" | "no_data";
  matchedSensitiveTerms?: string[];
  removedIdentifierKeys?: string[];
}

/** Erzeugt einen stabilen, nicht auf den Klarnamen rueckfuehrbaren Fall-Bezeichner. */
export function pseudonymCaseId(caseId: string): string {
  return `CASE_${caseId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function isDirectIdentifierKey(key: string): boolean {
  return DIRECT_IDENTIFIER_KEYS.includes(key.toLowerCase());
}

function stripDirectIdentifiers(value: unknown, removed: string[]): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => stripDirectIdentifiers(v, removed));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (isDirectIdentifierKey(key)) {
        removed.push(key);
        continue;
      }
      out[key] = stripDirectIdentifiers(val, removed);
    }
    return out;
  }
  return value;
}

/**
 * Fuehrt den vollstaendigen Privacy-Gateway-Check fuer einen an Claude zu sendenden
 * Payload aus. `rawPayload` sollte bereits nach dem "Minimal Context"-Prinzip
 * (Abschnitt 10) fuer die jeweilige Aufgabe zusammengestellt worden sein.
 */
export function runPrivacyGateway(
  task: AiTaskType,
  caseId: string,
  rawPayload: Record<string, unknown>
): PrivacyGatewayResult {
  const allowedFields = new Set(TASK_ALLOWED_FIELDS[task]);

  // 1. Allowlist-Filter auf Top-Level.
  const allowlisted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (allowedFields.has(key)) {
      allowlisted[key] = value;
    }
  }

  // 2. Rekursive Entfernung direkter Identifikatoren auf allen Ebenen.
  const removedIdentifierKeys: string[] = [];
  const withoutIdentifiers = stripDirectIdentifiers(allowlisted, removedIdentifierKeys) as Record<
    string,
    unknown
  >;

  // 3. Pseudonymisierung statt Klarname.
  withoutIdentifiers.case_ref = pseudonymCaseId(caseId);

  // 4. Sensitive-Content-Scan ueber alle verbleibenden Freitexte.
  const scan = scanPayloadForSensitiveContent(withoutIdentifiers);
  if (scan.sensitive) {
    return {
      ok: false,
      blockedReason: "sensitive_data_check_required",
      matchedSensitiveTerms: scan.matchedTerms,
      removedIdentifierKeys
    };
  }

  if (Object.keys(withoutIdentifiers).length <= 1) {
    // Nur case_ref vorhanden -> keine verwertbaren Daten.
    return { ok: false, blockedReason: "no_data", removedIdentifierKeys };
  }

  return { ok: true, sanitizedPayload: withoutIdentifiers, removedIdentifierKeys };
}
