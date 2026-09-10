import { Router } from "express";
import { z } from "zod";
import { ApiError, asyncHandler, notFoundCase } from "../asyncHandler.js";
import { getCase, putCase } from "../store.js";
import { logEvent } from "../logger.js";
import { runAiTask, AiServiceResult } from "../../ai/aiService.js";
import {
  developmentComparisonPayload,
  formulateSectionPayload,
  measuresPayload,
  structureNotesPayload,
  supportGoalsPayload
} from "../../ai/payloadBuilders.js";
import { setSectionText } from "../../luv_composer/composer.js";
import { applyOverallRedaction } from "../../luv_composer/overallRedaction.js";
import { runSemanticFactCheck } from "../../validation/semanticFactCheck.js";
import { areaLabelForSection, sourceNotesForSection } from "../../domain/sectionSourceNotes.js";
import { isConfirmedComparableDevelopment } from "../../domain/comparisonLogic.js";
import { LuvSection, SupportGoal } from "../../domain/types.js";
import { MEASURE_LIBRARY } from "../../domain/measureLibrary.js";
import { nanoid } from "nanoid";

export const aiRouter = Router();

function resultToHttp(result: AiServiceResult) {
  switch (result.kind) {
    case "ok":
      return { status: 200, body: { kind: "ok", text: result.text, evidenceIds: result.evidenceIds, warnings: result.warnings } };
    case "insufficient_data":
      return { status: 200, body: { kind: "insufficient_data", questions: result.questions } };
    case "conflict":
      return { status: 200, body: { kind: "conflict", conflicts: result.conflicts } };
    case "blocked_privacy":
      return { status: 200, body: { kind: "blocked_privacy", reason: result.reason, matchedTerms: result.matchedTerms } };
    case "invalid_schema":
      return { status: 502, body: { kind: "invalid_schema", message: result.message } };
    case "unavailable":
      return { status: 503, body: { kind: "unavailable", message: result.message } };
  }
}

const StructureNotesRequestSchema = z.object({
  areaLabel: z.string().min(1),
  rawNotes: z.string().min(1),
  sourceTypes: z.array(z.string()).default([])
});

aiRouter.post(
  "/:id/ai/structure-notes",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = StructureNotesRequestSchema.parse(req.body);
    const payload = structureNotesPayload(input.areaLabel, input.rawNotes, input.sourceTypes);
    const evidenceIds = record.evidence.map((e) => e.id);
    const result = await runAiTask("structure_notes", record.id, payload, evidenceIds);
    logEvent("ai_structure_notes", { caseId: record.id, kind: result.kind });
    const { status, body } = resultToHttp(result);
    res.status(status).json(body);
  })
);

const SECTION_KEYS: LuvSection["key"][] = [
  "initial_situation",
  "school_competences",
  "digital_competences",
  "personal_competences",
  "social_competences",
  "methodical_competences",
  "practical_competences",
  "career_orientation",
  "support_needs",
  "perspective",
  "overall_assessment"
];

aiRouter.post(
  "/:id/ai/sections/:key/generate",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const key = req.params.key as LuvSection["key"];

    if (key === "development") {
      const confirmedClaims = record.comparisonClaims.filter((c) => isConfirmedComparableDevelopment(c.suggestedStatus, c.confirmed));
      if (confirmedClaims.length === 0) {
        res.json({ kind: "insufficient_data", questions: ["Es liegen noch keine bestätigten, vergleichbaren Zeitpunkte vor. Bitte zunächst Vergleichseinträge bestätigen."] });
        return;
      }
      const texts: string[] = [];
      const warnings: string[] = [];
      for (const claim of confirmedClaims) {
        const payload = developmentComparisonPayload(
          claim.areaLabel,
          claim.previousText,
          claim.currentText,
          claim.previousRating,
          claim.currentRating
        );
        const result = await runAiTask("development_comparison", record.id, payload, []);
        if (result.kind === "ok") {
          texts.push(result.text);
          warnings.push(...result.warnings);
        } else if (result.kind === "insufficient_data") {
          warnings.push(...result.questions);
        }
      }
      const text = texts.join(" ");
      const applyResult = setSectionText(record.sections, key, text, [], warnings, { manualEdit: false });
      if (!applyResult.applied) {
        res.json({ kind: "blocked_privacy", reason: applyResult.reason });
        return;
      }
      record.sections = applyResult.sections;
      putCase(record);
      logEvent("ai_section_generated", { caseId: record.id, sectionKey: key, kind: "ok" });
      res.json({ kind: "ok", text, evidenceIds: [], warnings });
      return;
    }

    if (!SECTION_KEYS.includes(key)) {
      throw new ApiError(400, "unsupported_section", "Für diesen Abschnitt ist keine automatische Generierung vorgesehen.");
    }

    const notes = sourceNotesForSection(record, key);
    if (notes.length === 0) {
      res.json({ kind: "insufficient_data", questions: ["Für diesen Abschnitt liegen noch keine Angaben vor."] });
      return;
    }

    const payload = formulateSectionPayload(record, key, areaLabelForSection(key), notes, record.evidence);
    const evidenceIds = record.evidence.map((e) => e.id);
    const result = await runAiTask("formulate_section", record.id, payload, evidenceIds);
    logEvent("ai_section_generated", { caseId: record.id, sectionKey: key, kind: result.kind });

    if (result.kind === "ok") {
      const factCheck = await runSemanticFactCheck(
        record.id,
        key,
        result.text,
        record.evidence,
        notes.map((n) => n.observationNotes)
      );
      const applyResult = setSectionText(record.sections, key, result.text, result.evidenceIds, result.warnings, { manualEdit: false });
      if (!applyResult.applied) {
        res.json({ kind: "blocked_privacy", reason: applyResult.reason });
        return;
      }
      record.sections = applyResult.sections.map((s) => (s.key === key ? { ...s, factCheck } : s));
      putCase(record);
    }

    const { status, body } = resultToHttp(result);
    res.status(status).json(body);
  })
);

aiRouter.post(
  "/:id/ai/support-goals/suggest",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const confirmedAreas = record.supportAreaCandidates.filter((a) => a.status === "confirmed");
    if (confirmedAreas.length === 0) {
      // Test 8: Förderziel ohne bestätigten Förderbedarf -> blockieren.
      throw new ApiError(400, "no_confirmed_support_area", "Förderzielvorschläge erfordern mindestens einen bestätigten Förderbereich.");
    }

    const areasWithoutGoals = confirmedAreas.filter(
      (a) => !record.supportGoals.some((g) => g.supportAreaId === a.id)
    );
    if (areasWithoutGoals.length === 0) {
      res.json({ kind: "ok", goals: [] });
      return;
    }

    const payload = supportGoalsPayload(record, areasWithoutGoals);
    const result = await runAiTask("support_goal_suggestions", record.id, payload, []);
    logEvent("ai_support_goals_suggested", { caseId: record.id, kind: result.kind });

    if (result.kind !== "ok") {
      const { status, body } = resultToHttp(result);
      res.status(status).json(body);
      return;
    }

    let parsedGoals: Array<Record<string, string>>;
    try {
      parsedGoals = JSON.parse(result.text);
    } catch {
      res.status(502).json({ kind: "invalid_schema", message: "Antwort konnte nicht sicher verarbeitet werden." });
      return;
    }

    const newGoals: SupportGoal[] = [];
    for (let i = 0; i < areasWithoutGoals.length; i++) {
      const area = areasWithoutGoals[i];
      const suggestion = parsedGoals[i];
      if (!suggestion) continue;
      newGoals.push({
        id: `GOAL_${nanoid(8)}`,
        supportAreaId: area.id,
        bereich: suggestion.bereich ?? area.label,
        ausgangslage: suggestion.ausgangslage ?? "",
        ziel: suggestion.ziel ?? "",
        massnahme: suggestion.massnahme ?? "",
        ueberpruefungskriterium: suggestion.ueberpruefungskriterium ?? "",
        status: "vorschlag",
        measureSource: "ki_vorschlag",
        manualOverride: false
      });
    }

    record.supportGoals.push(...newGoals);
    putCase(record);
    res.json({ kind: "ok", goals: newGoals });
  })
);

// TODO: fachlich abgleichen - Massnahmen werden aktuell primaer als Teil des
// Foerderziel-Objekts (SupportGoal.massnahme) behandelt und mit dem Ziel gemeinsam
// bestaetigt/bearbeitet/verworfen. Dieser Endpunkt liefert dennoch eigenstaendige
// Massnahmenvorschlaege (Abschnitt 11, Prompt-Funktion 4) fuer bereits bestaetigte
// Ziele. Falls fachlich ein eigener Bestaetigungsschritt je Massnahme gefordert ist
// (Abschnitt 18: "Dasselbe Prinzip gilt fuer Massnahmen"), sollte dies in Version 0.2
// als getrennte Entitaet mit eigenem Status umgesetzt werden.
aiRouter.post(
  "/:id/ai/measures/suggest",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const confirmedGoals = record.supportGoals.filter((g) =>
      ["uebernommen", "bearbeitet", "neu_formuliert"].includes(g.status)
    );
    if (confirmedGoals.length === 0) {
      throw new ApiError(400, "no_confirmed_goals", "Maßnahmenvorschläge erfordern mindestens ein bestätigtes Förderziel.");
    }
    // Version 0.2 (PH-15 Abschnitt 30-33): passende Bibliotheksmassnahmen als Kontext mitgeben.
    const relevantAreas = new Set(
      confirmedGoals
        .map((g) => record.supportAreaCandidates.find((a) => a.id === g.supportAreaId)?.area)
        .filter((a): a is (typeof record.supportAreaCandidates)[number]["area"] => !!a)
    );
    const libraryMeasures = MEASURE_LIBRARY.filter((m) => relevantAreas.has(m.area)).map((m) => ({
      text: m.text,
      group: m.group
    }));
    const payload = measuresPayload(record, confirmedGoals, libraryMeasures);
    const result = await runAiTask("measure_suggestions", record.id, payload, []);
    logEvent("ai_measures_suggested", { caseId: record.id, kind: result.kind });
    const { status, body } = resultToHttp(result);
    res.status(status).json(body);
  })
);

aiRouter.post(
  "/:id/ai/overall-redaction",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const outcome = await applyOverallRedaction(record);
    record.sections = outcome.sections;
    putCase(record);
    logEvent("ai_overall_redaction", {
      caseId: record.id,
      appliedCount: outcome.appliedKeys.length,
      rejectedCount: outcome.rejectedKeys.length
    });
    res.json(outcome);
  })
);
