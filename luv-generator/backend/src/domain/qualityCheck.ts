/**
 * Qualitaets- und Vollstaendigkeitscheck (Version 0.2, PH-15 Abschnitt 18-22).
 *
 * Reine Warnung, kein Zwang (PH-15 Abschnitt 20): fehlende Inhalte blockieren die
 * LUV-Erstellung nicht, solange sie zulaessig als "nicht erhoben"/"nicht relevant"/
 * "nicht beurteilbar" gekennzeichnet wurden. Das System ergaenzt fehlende Daten NIE
 * automatisch per KI.
 */
import { CaseRecord, QualityCheckItem, QualityCheckResult, RATING_INTERNAL_SCORE } from "./types.js";
import { AREA_LABELS } from "./labels.js";
import { CompetenceArea } from "./types.js";

export function runQualityCheck(c: CaseRecord): QualityCheckResult {
  const items: QualityCheckItem[] = [];

  const baseDataComplete =
    !!c.baseData.teilnehmerName.trim() &&
    !!c.baseData.massnahme.trim() &&
    !!c.baseData.massnahmeart &&
    !!c.baseData.eintrittsdatum &&
    !!c.baseData.koordination.trim() &&
    !!c.baseData.beurteilungszeitraumVon &&
    !!c.baseData.beurteilungszeitraumBis;
  items.push({ key: "base_data", label: "Grunddaten vollständig (inkl. Maßnahmeart)", ok: baseDataComplete });

  if (c.baseData.luvArt === "start") {
    items.push({
      key: "initial_situation",
      label: "Ausgangslage vorhanden",
      ok: !!c.startingSituation.ausgangssituation.trim()
    });
  }

  const relevantSubs = c.subCompetences.filter((sc) => sc.relevantForLuv);
  const areasWithData = new Set(relevantSubs.map((sc) => sc.area));
  const AREA_ORDER: CompetenceArea[] = [
    "schulische_grundkompetenzen",
    "digitale_kompetenzen",
    "personale_kompetenzen",
    "sozial_kommunikative_kompetenzen",
    "methodische_kompetenzen",
    "berufliche_orientierung_praxis"
  ];
  for (const area of AREA_ORDER) {
    items.push({
      key: `area_${area}`,
      label: `${AREA_LABELS[area]} erfasst`,
      ok: areasWithData.has(area),
      hint: areasWithData.has(area) ? undefined : `${AREA_LABELS[area]} nicht erhoben`
    });
  }

  // Ressourcencheck (PH-15 Abschnitt 22): mindestens eine bestaetigte Staerke.
  const hasResource = relevantSubs.some((sc) => RATING_INTERNAL_SCORE[sc.rating] === 4);
  items.push({
    key: "resource",
    label: "Mindestens eine Ressource dokumentiert",
    ok: hasResource,
    hint: hasResource ? undefined : "Es wurde bisher keine fachlich belegte Stärke oder Ressource erfasst."
  });

  items.push({
    key: "career_orientation",
    label: "Berufliche Orientierung erfasst",
    ok: !!c.career.berufswunsch.trim() || !!c.career.orientierungsstatus
  });

  items.push({
    key: "support_areas_reviewed",
    label: "Förderbereiche geprüft",
    ok: c.supportAreaCandidates.length === 0 || c.supportAreaCandidates.every((a) => a.status !== "pending")
  });

  items.push({
    key: "self_assessment",
    label: "Selbsteinschätzung vorhanden",
    ok: !!c.further.selbsteinschaetzung.trim()
  });

  const hasConfirmedGoals = c.supportGoals.some((g) => ["uebernommen", "bearbeitet", "neu_formuliert"].includes(g.status));
  const hasConfirmedSupportAreas = c.supportAreaCandidates.some((a) => a.status === "confirmed");
  items.push({
    key: "support_goals",
    label: "Förderziele bestätigt",
    // Nur relevant, wenn ueberhaupt Foerderbereiche bestaetigt wurden - sonst kein Warnsignal.
    ok: !hasConfirmedSupportAreas || hasConfirmedGoals
  });

  // PH-15 v1.1 Abschnitt 48 (MUSS): Foerderziel ohne zugeordneten BA-Foerderzielbereich -> Warnung.
  const confirmedGoals = c.supportGoals.filter((g) => ["uebernommen", "bearbeitet", "neu_formuliert"].includes(g.status));
  items.push({
    key: "goal_foerderzielbereich",
    label: "Bestätigte Förderziele einem BA-Förderzielbereich zugeordnet",
    ok: confirmedGoals.every((g) => !!g.foerderzielbereich),
    hint:
      confirmedGoals.every((g) => !!g.foerderzielbereich) || confirmedGoals.length === 0
        ? undefined
        : "Mindestens ein bestätigtes Förderziel ist keinem BA-Förderzielbereich zugeordnet."
  });

  // PH-15 v1.1 Abschnitt 26, 64: offene, noch nicht ausgeraeumte Warnungen/Konflikte je Abschnitt.
  const openWarnings = c.sections.some((s) => s.warnings.length > 0 && !s.manualOverride);
  items.push({
    key: "open_conflicts",
    label: "Keine offenen Konflikte/Warnungen in KI-Abschnitten",
    ok: !openWarnings,
    hint: openWarnings ? "Es gibt Abschnitte mit offenen Warnungen, die noch nicht fachlich bearbeitet wurden." : undefined
  });

  // PH-15 v1.1 Abschnitt 65 (MUSS): Teilnehmerbesprechung/Bekanntgabe.
  const tb = c.teilnehmerbesprechung;
  const teilnehmerbesprechungOk = tb.besprechungNichtMoeglich ? !!tb.hinweisGrund.trim() : tb.besprochen === true;
  items.push({
    key: "teilnehmerbesprechung",
    label: "Teilnehmerbesprechung/Bekanntgabe dokumentiert",
    ok: teilnehmerbesprechungOk,
    hint: teilnehmerbesprechungOk
      ? undefined
      : "Noch nicht dokumentiert, ob die LUV mit dem/der Teilnehmenden besprochen wurde."
  });

  if (c.baseData.luvArt !== "start") {
    items.push({
      key: "previous_comparison_data",
      label: "Vorherige Vergleichsdaten vorhanden",
      ok: !!c.previousLuv && c.previousLuv.rawText.trim().length > 0
    });
    items.push({
      key: "confirmed_development",
      label: "Bestätigte Entwicklung vorhanden",
      ok: c.comparisonClaims.some((claim) => claim.confirmed)
    });
    // PH-15 v1.1 Abschnitt 27: Stand der BA-Foerderzielbereiche fuer Verlaufs-/Abschluss-LUV.
    items.push({
      key: "foerderzielbereich_status",
      label: "Stand der BA-Förderzielbereiche erfasst",
      ok: c.foerderzielbereichTracking.length > 0
    });
  }

  if (c.baseData.luvArt === "abschluss") {
    items.push({
      key: "goal_completion_status",
      label: "Zielstatus gesetzt",
      ok: c.supportGoals.length === 0 || c.supportGoals.some((g) => !!g.completionStatus)
    });
    items.push({
      key: "perspective",
      label: "Aktuelle Perspektive erfasst",
      ok: !!c.career.orientierungsstatus || !!c.further.freitext.trim()
    });
  }

  const warningCount = items.filter((i) => !i.ok).length;
  return { items, warningCount };
}
