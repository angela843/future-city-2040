/**
 * Verbindliche LUV-Fristenlogik (PH-15 v1.1 Abschnitt 5-6, MUSS).
 *
 * Regelbasiert, KEINE KI beteiligt. Die Fristen werden ausschliesslich aus den vom
 * Menschen eingegebenen Datumsfeldern berechnet - es wird NICHTS aus dem
 * Massnahmebeginn plus einer pauschalen Kompetenzanalyse-Dauer geraten
 * (PH-15 v1.1 Abschnitt 5: "muss das tatsaechliche Ende der Kompetenzanalyse
 * beruecksichtigen").
 *
 * TODO: fachlich abgleichen - "letzter Tag der Teilnahme" (Abschnitt 5, Abschluss-LUV)
 * kann vom geplanten Massnahmeende abweichen (z.B. vorzeitiger Austritt). Version 0.2
 * bildet nur das geplante Massnahmeende ab; der tatsaechliche Austrittstag muesste bei
 * Abweichung manuell beruecksichtigt werden.
 */
import { BaseData, Massnahmeart } from "./types.js";

export interface FristenResult {
  /** Start-LUV: spaetestens 14 Kalendertage nach Ende der Kompetenzanalyse. */
  startLuvFaellig: string | null;
  /** Erste Verlaufs-LUV: spaetestens 6 Monate nach Massnahmebeginn. */
  ersteVerlaufsLuvFaellig: string | null;
  /** Weitere Verlaufs-LUV vor Massnahmeende: 6 Wochen vor Massnahmeende. */
  weitereVerlaufsLuvFaellig: string | null;
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

export function computeFristen(baseData: BaseData): FristenResult {
  return {
    startLuvFaellig: baseData.kompetenzanalyseEnde ? addDays(baseData.kompetenzanalyseEnde, 14) : null,
    ersteVerlaufsLuvFaellig: baseData.eintrittsdatum ? addMonths(baseData.eintrittsdatum, 6) : null,
    weitereVerlaufsLuvFaellig: baseData.massnahmeEndeGeplant ? addDays(baseData.massnahmeEndeGeplant, -42) : null,
    abschlussLuvFaellig: baseData.massnahmeEndeGeplant ?? null
  };
}

/**
 * Kompetenzanalyse-Dauer-Plausibilitaet (PH-15 v1.1 Abschnitt 6, SOLL/MUSS: "dienen
 * nur als Hinweislogik, nicht als starre technische Blockade").
 */
export interface KompetenzanalyseDauerHinweis {
  ok: boolean;
  wochenGerundet?: number;
  hinweis?: string;
}

const REGELDAUER: Record<Massnahmeart, { minWochen: number; maxWochen: number; label: string }> = {
  bvb: { minWochen: 3, maxWochen: 5, label: "BvB: Regelfall bis zu 5 Wochen, grundsätzlich nicht unter 3 Wochen" },
  bvb_reha: {
    minWochen: 4,
    maxWochen: 8,
    label: "BvB-Reha: Regelfall bis zu 6 Wochen, in begründeten Ausnahmefällen bis zu 8 Wochen, grundsätzlich nicht unter 4 Wochen"
  }
};

export function checkKompetenzanalyseDauer(baseData: BaseData): KompetenzanalyseDauerHinweis {
  if (!baseData.eintrittsdatum || !baseData.kompetenzanalyseEnde) return { ok: true };
  const start = new Date(baseData.eintrittsdatum);
  const end = new Date(baseData.kompetenzanalyseEnde);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { ok: true };
  const wochen = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7);
  const regel = REGELDAUER[baseData.massnahmeart];
  const wochenGerundet = Math.round(wochen * 10) / 10;
  if (wochen < 0) {
    return { ok: false, wochenGerundet, hinweis: "Ende der Kompetenzanalyse liegt vor dem Maßnahmebeginn." };
  }
  if (wochen < regel.minWochen || wochen > regel.maxWochen) {
    return {
      ok: false,
      wochenGerundet,
      hinweis: `Die Kompetenzanalyse dauerte rechnerisch ca. ${wochenGerundet} Wochen und liegt damit außerhalb des Regelfalls (${regel.label}). Dies ist ein Hinweis, keine technische Blockade – in begründeten Fällen fachlich zulässig.`
    };
  }
  return { ok: true, wochenGerundet };
}
