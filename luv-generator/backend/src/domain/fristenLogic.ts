/**
 * Verbindliche LUV-Fristenlogik (PH-17 V1.0 Abschnitt 6, MUSS).
 *
 * Regelbasiert, KEINE KI beteiligt. Die Fristen werden ausschliesslich aus den vom
 * Menschen eingegebenen Datumsfeldern berechnet - es wird NICHTS aus dem
 * Massnahmebeginn plus einer pauschalen Kompetenzanalyse-Dauer geraten
 * (PH-17 V1.0 Abschnitt 6: "muss das tatsaechliche Ende der Kompetenzanalyse
 * beruecksichtigen").
 *
 * TODO: fachlich abgleichen - "letzter Tag der Teilnahme" (Abschluss-LUV) kann vom
 * geplanten Massnahmeende abweichen (z.B. vorzeitiger Austritt). Version 0.2 bildet
 * nur das geplante Massnahmeende ab; der tatsaechliche Austrittstag muesste bei
 * Abweichung manuell beruecksichtigt werden.
 */
import { BaseData, Massnahmeart } from "./types.js";

export interface FristenResult {
  /** Start-LUV: spaetestens 14 Kalendertage nach Ende der Kompetenzanalyse. */
  startLuvFaellig: string | null;
  /** Erste Verlaufs-LUV: BvB 1/BvB 2 spaetestens 6 Monate, BvB 3 spaetestens 7 Monate nach Massnahmebeginn. */
  ersteVerlaufsLuvFaellig: string | null;
  /** Verlauf vor Massnahmeende: 6 Wochen vor individuellem Massnahmeende. */
  weitereVerlaufsLuvFaellig: string | null;
  /** Verlauf vor Verlaengerung: BvB 1/BvB 2 spaetestens 3 Wochen, BvB 3 spaetestens 4 Wochen vorher. */
  verlaengerungsVerlaufsLuvFaellig: string | null;
  /** Abschluss-LUV: spaetestens am letzten Tag der Teilnahme. */
  abschlussLuvFaellig: string | null;
}

function addDays(iso: string, days: number): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** PH-17 V1.0 Abschnitt 6: BvB 3 hat abweichende Fristen gegenueber BvB 1/BvB 2. */
function isBvb3(massnahmeart: Massnahmeart): boolean {
  return massnahmeart === "bvb3";
}

export function computeFristen(baseData: BaseData): FristenResult {
  const ersteVerlaufsMonate = isBvb3(baseData.massnahmeart) ? 7 : 6;
  const verlaengerungsTage = isBvb3(baseData.massnahmeart) ? -28 : -21;
  return {
    startLuvFaellig: baseData.kompetenzanalyseEnde ? addDays(baseData.kompetenzanalyseEnde, 14) : null,
    ersteVerlaufsLuvFaellig: baseData.eintrittsdatum ? addMonths(baseData.eintrittsdatum, ersteVerlaufsMonate) : null,
    weitereVerlaufsLuvFaellig: baseData.massnahmeEndeGeplant ? addDays(baseData.massnahmeEndeGeplant, -42) : null,
    verlaengerungsVerlaufsLuvFaellig: baseData.verlaengerungstermin
      ? addDays(baseData.verlaengerungstermin, verlaengerungsTage)
      : null,
    abschlussLuvFaellig: baseData.massnahmeEndeGeplant ?? null
  };
}

/**
 * Kompetenzanalyse-Dauer-Plausibilitaet (PH-17 V1.0 Abschnitt 6 / Migrationsplan
 * 0.1->0.2 Entscheidung 7: "dient nur als Hinweislogik, nicht als starre technische
 * Blockade"). Gilt NUR fuer BvB 1 (PH-15-Wert, unveraendert). Fuer BvB 2/BvB 3 gibt es
 * keine verbindliche Grundlage fuer einen Regelwert - die bisherige "BvB-Reha =
 * 4-8 Wochen"-Annahme wird NICHT ungeprueft auf BvB 2/BvB 3 uebertragen (Entscheidung
 * 7). Solange keine verbindliche Grundlage vorliegt, wird fuer BvB 2/BvB 3 kein
 * Hinweis ausgegeben.
 */
export interface KompetenzanalyseDauerHinweis {
  ok: boolean;
  wochenGerundet?: number;
  hinweis?: string;
}

const BVB1_REGELDAUER = {
  minWochen: 3,
  maxWochen: 5,
  label: "BvB 1: Regelfall bis zu 5 Wochen, grundsätzlich nicht unter 3 Wochen"
};

export function checkKompetenzanalyseDauer(baseData: BaseData): KompetenzanalyseDauerHinweis {
  if (baseData.massnahmeart !== "bvb1") return { ok: true };
  if (!baseData.eintrittsdatum || !baseData.kompetenzanalyseEnde) return { ok: true };
  const start = new Date(baseData.eintrittsdatum);
  const end = new Date(baseData.kompetenzanalyseEnde);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { ok: true };
  const wochen = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7);
  const wochenGerundet = Math.round(wochen * 10) / 10;
  if (wochen < 0) {
    return { ok: false, wochenGerundet, hinweis: "Ende der Kompetenzanalyse liegt vor dem Maßnahmebeginn." };
  }
  if (wochen < BVB1_REGELDAUER.minWochen || wochen > BVB1_REGELDAUER.maxWochen) {
    return {
      ok: false,
      wochenGerundet,
      hinweis: `Die Kompetenzanalyse dauerte rechnerisch ca. ${wochenGerundet} Wochen und liegt damit außerhalb des Regelfalls (${BVB1_REGELDAUER.label}). Dies ist ein Hinweis, keine technische Blockade – in begründeten Fällen fachlich zulässig.`
    };
  }
  return { ok: true, wochenGerundet };
}
