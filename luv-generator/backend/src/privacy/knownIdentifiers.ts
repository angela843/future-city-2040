/**
 * Korrekturauftrag V0.2.1, A7: sammelt die bereits lokal bekannten direkten
 * Identifikator-WERTE eines Falls (nicht die Feldschluessel), damit sie auch
 * innerhalb von Freitext vor jedem Claude-Aufruf ersetzt werden koennen
 * (`privacy/gateway.ts: runPrivacyGateway`). Werte stammen ausschliesslich aus dem
 * lokalen Stammdatenkern/BaseData - niemals aus dem an Claude zu sendenden Payload
 * selbst abgeleitet.
 */
import { CaseRecord } from "../domain/types.js";

export function directIdentifierValuesForCase(c: CaseRecord): string[] {
  const values = [
    c.baseData.teilnehmerName,
    c.baseData.geburtsdatum,
    c.stammdaten.vorname,
    c.stammdaten.nachname,
    c.stammdaten.kundennummer,
    c.stammdaten.traegerEinrichtung,
    c.stammdaten.ansprechpersonVorname,
    c.stammdaten.ansprechpersonNachname,
    c.stammdaten.telefon,
    c.stammdaten.email
  ];
  return values.filter((v): v is string => !!v && v.trim().length > 0);
}
