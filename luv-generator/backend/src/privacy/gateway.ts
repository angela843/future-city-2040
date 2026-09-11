/**
 * Privacy Gateway (Spezifikation Abschnitt 8, 9, 10, 37).
 *
 * Diese Funktion MUSS serverseitig vor jedem Claude-Aufruf durchlaufen werden.
 * Sie ist die einzige Stelle, die Payloads fuer die KI freigibt. Keine der hier
 * umgesetzten Regeln liegt ausschliesslich im KI-Prompt.
 *
 * Ablauf:
 *  1. Allowlist-Filter: nur fuer die jeweilige Aufgabe erlaubte Top-Level-Felder bleiben erhalten.
 *  2. Rekursive Entfernung direkter Identifikatoren (Name, Geburtsdatum, ...) auf jeder Ebene
 *     anhand bekannter Feldschluessel.
 *  3. Korrekturauftrag V0.2.1 (A7): rekursive Ersetzung bekannter Identifikator-WERTE
 *     (Vorname, Nachname, Kundennummer, Telefon, E-Mail, weitere Stammdaten) auch
 *     INNERHALB von Freitext - nicht nur anhand von Feldschluesseln. Enthaelt ein
 *     Freitext danach noch ein E-Mail-Muster, das nicht auf einen bekannten,
 *     bereits ersetzten Wert zurueckgeht (also nicht sicher behandelbar ist), wird die
 *     Generierung dieses Inhalts blockiert statt den Text ungefiltert zu senden.
 *  4. Pseudonymisierung: der Fall wird nur als CASE_<zufaellige ID> referenziert.
 *  5. Sensitive-Content-Scan: enthaelt ein Freitext ggf. Gesundheits-/sensible Daten,
 *     wird die Uebertragung blockiert ("Datenschutzpruefung erforderlich").
 */
import { AiTaskType, DIRECT_IDENTIFIER_KEYS, TASK_ALLOWED_FIELDS } from "./allowlist.js";
import { scanPayloadForSensitiveContent } from "./sensitiveDetection.js";

export interface PrivacyGatewayResult {
  ok: boolean;
  /** Bereinigter, freigegebener Payload - nur gesetzt wenn ok === true. */
  sanitizedPayload?: Record<string, unknown>;
  /** Grund einer Blockade, z.B. "sensitive_data_check_required". */
  blockedReason?: "sensitive_data_check_required" | "no_data" | "unresolved_identifier_in_freetext";
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Korrekturauftrag V0.2.1, A7: ersetzt bekannte, bereits lokal erfasste Identifikator-
 * Werte (nicht nur -Schluessel) rekursiv in jedem String des Payloads durch einen
 * neutralen Platzhalter, bevor der Claude-Payload erstellt wird. `knownValues` sind
 * die tatsaechlichen Werte (z.B. "Alex", "Fiktiv", "K-0001") aus dem lokalen
 * Stammdatenkern/BaseData des jeweiligen Falls - niemals aus dem Payload selbst
 * abgeleitet.
 */
function redactKnownIdentifierValues(value: unknown, knownValues: string[]): unknown {
  if (knownValues.length === 0) return value;
  if (typeof value === "string") {
    let out = value;
    for (const known of knownValues) {
      const pattern = new RegExp(escapeRegExp(known), "gi");
      out = out.replace(pattern, "[ENTFERNT]");
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactKnownIdentifierValues(v, knownValues));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactKnownIdentifierValues(v, knownValues);
    }
    return out;
  }
  return value;
}

/**
 * Erkennt ein E-Mail-Muster, das nach der Ersetzung bekannter Werte noch im Payload
 * verbleibt - ein solcher Rest ist per Definition NICHT auf einen bereits lokal
 * bekannten, sicher ersetzbaren Identifikator zurueckzufuehren und daher "nicht sicher
 * behandelbar" im Sinne von A7.
 */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function containsUnresolvedEmailPattern(value: unknown): boolean {
  if (typeof value === "string") return EMAIL_PATTERN.test(value);
  if (Array.isArray(value)) return value.some(containsUnresolvedEmailPattern);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).some(containsUnresolvedEmailPattern);
  return false;
}

/**
 * Fuehrt den vollstaendigen Privacy-Gateway-Check fuer einen an Claude zu sendenden
 * Payload aus. `rawPayload` sollte bereits nach dem "Minimal Context"-Prinzip
 * (Abschnitt 10) fuer die jeweilige Aufgabe zusammengestellt worden sein.
 *
 * @param knownIdentifierValues Korrekturauftrag V0.2.1 (A7): bereits lokal erfasste
 *   Identifikator-Werte des Falls (Vorname, Nachname, Kundennummer, Telefon, E-Mail,
 *   weitere Stammdaten), die auch innerhalb von Freitext ersetzt werden muessen.
 */
export function runPrivacyGateway(
  task: AiTaskType,
  caseId: string,
  rawPayload: Record<string, unknown>,
  knownIdentifierValues: string[] = []
): PrivacyGatewayResult {
  const allowedFields = new Set(TASK_ALLOWED_FIELDS[task]);

  // 1. Allowlist-Filter auf Top-Level.
  const allowlisted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (allowedFields.has(key)) {
      allowlisted[key] = value;
    }
  }

  // 2. Rekursive Entfernung direkter Identifikatoren auf allen Ebenen (Schluessel-basiert).
  const removedIdentifierKeys: string[] = [];
  const withoutIdentifierKeys = stripDirectIdentifiers(allowlisted, removedIdentifierKeys) as Record<
    string,
    unknown
  >;

  // 3. A7: bekannte Identifikator-WERTE auch innerhalb von Freitext ersetzen.
  const knownValues = knownIdentifierValues.filter((v) => v.trim().length >= 2);
  const withoutIdentifiers = redactKnownIdentifierValues(withoutIdentifierKeys, knownValues) as Record<
    string,
    unknown
  >;

  // A7: ein danach noch vorhandenes E-Mail-Muster ist nicht sicher behandelbar - die
  // Generierung dieses Inhalts wird blockiert statt ungefiltert zu senden.
  if (containsUnresolvedEmailPattern(withoutIdentifiers)) {
    return {
      ok: false,
      blockedReason: "unresolved_identifier_in_freetext",
      removedIdentifierKeys
    };
  }

  // 4. Pseudonymisierung statt Klarname.
  withoutIdentifiers.case_ref = pseudonymCaseId(caseId);

  // 5. Sensitive-Content-Scan ueber alle verbleibenden Freitexte.
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
