import { Router } from "express";
import { nanoid } from "nanoid";
import { ApiError, asyncHandler, notFoundCase } from "../asyncHandler.js";
import { getCase, createCase, putCase } from "../store.js";
import { emptyAbschlussErgebnis, emptyStammdaten } from "../../domain/types.js";
import { logEvent } from "../logger.js";
import {
  AbschlussErgebnisSchema,
  ApprovalSchema,
  BaseDataSchema,
  CareerInfoSchema,
  ClarificationCheckSchema,
  ComparisonClaimConfirmSchema,
  ComparisonClaimLinkSchema,
  EvidenceItemInputSchema,
  FoerderzielbereichTrackingUpdateSchema,
  FurtherFindingsSchema,
  PreviousLuvSchema,
  SectionManualEditSchema,
  StammdatenSchema,
  StartingSituationSchema,
  SubCompetenceInputSchema,
  SupportAreaStatusUpdateSchema,
  SupportGoalUpdateSchema,
  TeilnehmerbesprechungSchema
} from "../../validation/requestSchemas.js";
import { evidencePrefix, nextEvidenceId } from "../../domain/evidence.js";
import { deriveSupportAreaCandidates } from "../../domain/supportLogic.js";
import { compareRatings } from "../../domain/comparisonLogic.js";
import { ensureSectionSkeleton, setSectionText } from "../../luv_composer/composer.js";
import { findRedundancies, checkSimilarityToPreviousText } from "../../luv_composer/redundancyCheck.js";
import { renderSupportGoalsSectionText } from "../../luv_composer/renderGoals.js";
import { renderAbschlussErgebnisSectionText } from "../../luv_composer/renderAbschlussErgebnis.js";
import { runQualityCheck } from "../../domain/qualityCheck.js";
import { runReleaseCheck } from "../../domain/releaseCheck.js";
import {
  checkAbschlussHumanConfirmed,
  checkFoerderbedarfBeleg,
  checkGeneralPreValidation,
  checkUnterstuetzungsbedarfBeschreibung
} from "../../domain/preValidation.js";
import { checkForClarification } from "../../domain/clarificationAssistant.js";
import { checkKompetenzanalyseDauer, computeFristen } from "../../domain/fristenLogic.js";

export const casesRouter = Router();

casesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const baseData = BaseDataSchema.parse(req.body);
    const record = createCase({
      baseData: {
        ...baseData,
        geburtsdatum: baseData.geburtsdatum ?? null,
        kompetenzanalyseEnde: baseData.kompetenzanalyseEnde ?? null,
        massnahmeEndeGeplant: baseData.massnahmeEndeGeplant ?? null,
        tatsaechlicherLetzterTeilnahmetag: baseData.tatsaechlicherLetzterTeilnahmetag ?? null,
        verlaufAnlass: baseData.verlaufAnlass ?? null,
        verlaengerungstermin: baseData.verlaengerungstermin ?? null,
        massnahmeziel: baseData.massnahmeziel ?? null
      },
      startingSituation: { schulabschluss: "nicht_bekannt", beruflicheVorerfahrung: [], bisherigePraktika: "", ausgangssituation: "" },
      subCompetences: [],
      evidence: [],
      career: {
        berufswunsch: "",
        berufswunschVorhanden: null,
        berufswunschGefestigt: null,
        berufswunschPraktischErprobt: null,
        alternativen: "",
        orientierungsstatus: "",
        weitereOrientierungErforderlich: false,
        berufsfelder: [],
        praktikumserkenntnisse: ""
      },
      further: { selbsteinschaetzung: "", weitereBeobachtungen: "", freitext: "" },
      supportAreaCandidates: [],
      supportGoals: [],
      previousLuv: null,
      comparisonClaims: [],
      sections: [],
      foerderzielbereichTracking: [],
      teilnehmerbesprechung: {
        besprochen: null,
        datum: null,
        mehrfertigungAusgehaendigt: null,
        besprechungNichtMoeglich: false,
        hinweisGrund: ""
      },
      stammdaten: emptyStammdaten(),
      abschlussErgebnis: emptyAbschlussErgebnis(),
      approvedForExport: false,
      approvalTimestamp: null
    });
    record.sections = ensureSectionSkeleton(record);
    putCase(record);
    logEvent("case_created", { caseId: record.id, luvArt: record.baseData.luvArt });
    res.status(201).json(record);
  })
);

casesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    res.json(record);
  })
);

casesRouter.put(
  "/:id/base-data",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const baseData = BaseDataSchema.parse(req.body);
    record.baseData = {
      ...baseData,
      geburtsdatum: baseData.geburtsdatum ?? null,
      kompetenzanalyseEnde: baseData.kompetenzanalyseEnde ?? null,
      massnahmeEndeGeplant: baseData.massnahmeEndeGeplant ?? null,
      tatsaechlicherLetzterTeilnahmetag: baseData.tatsaechlicherLetzterTeilnahmetag ?? null,
      verlaufAnlass: baseData.verlaufAnlass ?? null,
      verlaengerungstermin: baseData.verlaengerungstermin ?? null,
      massnahmeziel: baseData.massnahmeziel ?? null
    };
    record.sections = ensureSectionSkeleton(record);
    putCase(record);
    logEvent("base_data_updated", { caseId: record.id });
    res.json(record);
  })
);

casesRouter.put(
  "/:id/starting-situation",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    record.startingSituation = StartingSituationSchema.parse(req.body);
    putCase(record);
    logEvent("starting_situation_updated", { caseId: record.id });
    res.json(record);
  })
);

casesRouter.put(
  "/:id/career",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    record.career = CareerInfoSchema.parse(req.body);
    putCase(record);
    logEvent("career_updated", { caseId: record.id });
    res.json(record);
  })
);

casesRouter.put(
  "/:id/further",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    record.further = FurtherFindingsSchema.parse(req.body);
    putCase(record);
    logEvent("further_findings_updated", { caseId: record.id });
    res.json(record);
  })
);

casesRouter.post(
  "/:id/sub-competences",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = SubCompetenceInputSchema.parse(req.body);
    const id = input.id ?? `SC_${nanoid(8)}`;
    const existingIndex = record.subCompetences.findIndex((sc) => sc.id === id);
    const entry = { ...input, id };
    if (existingIndex >= 0) {
      record.subCompetences[existingIndex] = entry;
    } else {
      record.subCompetences.push(entry);
    }
    record.supportAreaCandidates = deriveSupportAreaCandidates(record.subCompetences, record.supportAreaCandidates);
    putCase(record);
    logEvent("sub_competence_upserted", { caseId: record.id, subCompetenceId: id, rating: input.rating });
    res.json(record);
  })
);

casesRouter.post(
  "/:id/evidence",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = EvidenceItemInputSchema.parse(req.body);
    const prefix = evidencePrefix(input.area ?? null, input.source);
    const id = nextEvidenceId(prefix, record.evidence.map((e) => e.id));
    const item = { id, source: input.source, note: input.note, createdAt: new Date().toISOString() };
    record.evidence.push(item);
    putCase(record);
    logEvent("evidence_added", { caseId: record.id, evidenceId: id, source: input.source });
    res.status(201).json(item);
  })
);

casesRouter.post(
  "/:id/support-areas/derive",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    record.supportAreaCandidates = deriveSupportAreaCandidates(record.subCompetences, record.supportAreaCandidates);
    putCase(record);
    res.json(record.supportAreaCandidates);
  })
);

casesRouter.put(
  "/:id/support-areas/:areaId",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const { status } = SupportAreaStatusUpdateSchema.parse(req.body);
    const area = record.supportAreaCandidates.find((a) => a.id === req.params.areaId);
    if (!area) throw new ApiError(404, "support_area_not_found", "Förderbereich nicht gefunden.");
    area.status = status;
    putCase(record);
    logEvent("support_area_status_updated", { caseId: record.id, areaId: area.id, status });
    res.json(area);
  })
);

casesRouter.put(
  "/:id/support-goals/:goalId",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = SupportGoalUpdateSchema.parse(req.body);
    const goal = record.supportGoals.find((g) => g.id === req.params.goalId);
    if (!goal) throw new ApiError(404, "support_goal_not_found", "Förderziel nicht gefunden.");
    Object.assign(goal, input);
    goal.manualOverride = input.status === "bearbeitet" || input.status === "neu_formuliert" ? true : goal.manualOverride;

    const renderedText = renderSupportGoalsSectionText(record.supportGoals, record.foerderzielbereichTracking);
    const applyResult = setSectionText(record.sections, "support_goals", renderedText, [], [], { manualEdit: false });
    if (applyResult.applied) {
      record.sections = applyResult.sections;
    }

    putCase(record);
    logEvent("support_goal_updated", { caseId: record.id, goalId: goal.id, status: goal.status });
    res.json({ goal, sections: record.sections });
  })
);

casesRouter.post(
  "/:id/previous-luv",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const { rawText } = PreviousLuvSchema.parse(req.body);

    // TODO: fachlich abgleichen - einfache Satzsegmentierung fuer Version 0.1. Eine
    // inhaltliche Vorauswahl/Kategorisierung relevanter Vergleichssaetze (z.B. je
    // Kompetenzbereich) waere fachlich wuenschenswert, erfordert aber Abstimmung,
    // welche Heuristik/welcher Claude-Task dafuer zulaessig ist.
    const sentences = rawText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 12);

    const claims = sentences.map((sentence) => ({
      id: `CMP_${nanoid(8)}`,
      subCompetenceId: null,
      areaLabel: "(bitte zuordnen)",
      previousText: sentence,
      currentText: "",
      previousRating: null,
      currentRating: null,
      suggestedStatus: "nicht_vergleichbar" as const,
      confirmed: false
    }));

    record.previousLuv = { rawText, extractedClaims: claims };
    record.comparisonClaims = claims;
    putCase(record);
    logEvent("previous_luv_analyzed", { caseId: record.id, claimCount: claims.length });
    res.json(record.comparisonClaims);
  })
);

casesRouter.put(
  "/:id/comparison-claims/:claimId/link",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = ComparisonClaimLinkSchema.parse(req.body);
    const claim = record.comparisonClaims.find((c) => c.id === req.params.claimId);
    if (!claim) throw new ApiError(404, "comparison_claim_not_found", "Vergleichseintrag nicht gefunden.");

    if (input.previousRating !== undefined) claim.previousRating = input.previousRating;
    if (input.currentText !== undefined) claim.currentText = input.currentText;

    if (input.subCompetenceId !== undefined) {
      claim.subCompetenceId = input.subCompetenceId;
      if (input.subCompetenceId) {
        const sub = record.subCompetences.find((sc) => sc.id === input.subCompetenceId);
        if (sub) {
          claim.currentRating = sub.rating;
          claim.areaLabel = sub.label;
          if (input.currentText === undefined) claim.currentText = sub.observationNotes;
        }
      } else {
        claim.currentRating = null;
      }
    }

    claim.suggestedStatus = compareRatings(claim.previousRating, claim.currentRating);
    claim.confirmed = false;
    claim.confirmedStatus = undefined;
    putCase(record);
    logEvent("comparison_claim_linked", { caseId: record.id, claimId: claim.id, suggestedStatus: claim.suggestedStatus });
    res.json(claim);
  })
);

casesRouter.put(
  "/:id/comparison-claims/:claimId/confirm",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const { confirmed } = ComparisonClaimConfirmSchema.parse(req.body);
    const claim = record.comparisonClaims.find((c) => c.id === req.params.claimId);
    if (!claim) throw new ApiError(404, "comparison_claim_not_found", "Vergleichseintrag nicht gefunden.");
    claim.confirmed = confirmed;
    // Der bestaetigte Status ist IMMER der deterministisch berechnete Vorschlag - die
    // Koordination bestaetigt oder verwirft, kann aber keinen abweichenden Status erfinden.
    claim.confirmedStatus = confirmed ? claim.suggestedStatus : undefined;
    putCase(record);
    logEvent("comparison_claim_confirmed", { caseId: record.id, claimId: claim.id, confirmed });
    res.json(claim);
  })
);

casesRouter.put(
  "/:id/sections/:key",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const { text } = SectionManualEditSchema.parse(req.body);
    const result = setSectionText(record.sections, req.params.key as never, text, [], [], { manualEdit: true });
    if (!result.applied) throw new ApiError(400, "section_update_rejected", result.reason ?? "Abschnitt konnte nicht aktualisiert werden.");
    record.sections = result.sections;
    putCase(record);
    logEvent("section_manually_edited", { caseId: record.id, sectionKey: req.params.key });
    res.json(record.sections);
  })
);

casesRouter.get(
  "/:id/redundancy-check",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const warnings = findRedundancies(record.sections);
    const previousWarnings = record.previousLuv
      ? checkSimilarityToPreviousText(record.sections, record.previousLuv.rawText)
      : [];
    res.json({ withinLuv: warnings, vsPreviousLuv: previousWarnings });
  })
);

casesRouter.get(
  "/:id/quality-check",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    res.json(runQualityCheck(record));
  })
);

casesRouter.get(
  "/:id/release-check",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    res.json(runReleaseCheck(record));
  })
);

casesRouter.get(
  "/:id/fristen",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    res.json({
      fristen: computeFristen(record.baseData),
      kompetenzanalyseDauerHinweis: checkKompetenzanalyseDauer(record.baseData)
    });
  })
);

casesRouter.put(
  "/:id/teilnehmerbesprechung",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    record.teilnehmerbesprechung = TeilnehmerbesprechungSchema.parse(req.body);

    // Feld 22 des Abschluss-Moduls nutzt Teilnehmerbesprechung.datum weiter (keine
    // Duplizierung) - der Abschluss-Abschnitt wird deshalb hier mit re-gerendert.
    if (record.sections.some((s) => s.key === "abschluss_ergebnis")) {
      const renderedText = renderAbschlussErgebnisSectionText(record.abschlussErgebnis, record.baseData, record.teilnehmerbesprechung);
      const applyResult = setSectionText(record.sections, "abschluss_ergebnis", renderedText, [], [], { manualEdit: false });
      if (applyResult.applied) {
        record.sections = applyResult.sections;
      }
    }

    putCase(record);
    logEvent("teilnehmerbesprechung_updated", { caseId: record.id });
    res.json(record);
  })
);

casesRouter.put(
  "/:id/abschluss-ergebnis",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = AbschlussErgebnisSchema.parse(req.body);

    record.abschlussErgebnis = input;
    const renderedText = renderAbschlussErgebnisSectionText(record.abschlussErgebnis, record.baseData, record.teilnehmerbesprechung);
    const applyResult = setSectionText(record.sections, "abschluss_ergebnis", renderedText, [], [], { manualEdit: false });
    if (applyResult.applied) {
      record.sections = applyResult.sections;
    }

    putCase(record);
    logEvent("abschluss_ergebnis_updated", { caseId: record.id });
    res.json({ abschlussErgebnis: record.abschlussErgebnis, sections: record.sections });
  })
);

casesRouter.put(
  "/:id/stammdaten",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = StammdatenSchema.parse(req.body);

    // Korrekturauftrag V0.2.1, A4: das BvB-3-Sonderfeld "Lernort Wohnen/Internat" darf
    // ausserhalb von BvB 3 weder erfasst noch angenommen werden (vormals in A5 des
    // Migrationsplans 0.1->0.2 fuer das Abschluss-Modul, jetzt Teil des gemeinsamen
    // Stammdatenkerns und fuer alle LUV-Arten gleichermassen durchgesetzt).
    if (record.baseData.massnahmeart !== "bvb3" && input.lernortWohnenInternat !== null) {
      throw new ApiError(
        400,
        "bvb3_field_not_applicable",
        'Das Feld „Lernort Wohnen/Internat" ist ein BvB-3-Sonderfeld und darf bei dieser Maßnahmeart nicht gesetzt werden.'
      );
    }

    record.stammdaten = input;
    putCase(record);
    logEvent("stammdaten_updated", { caseId: record.id });
    res.json({ stammdaten: record.stammdaten });
  })
);

casesRouter.put(
  "/:id/foerderzielbereich-tracking",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const input = FoerderzielbereichTrackingUpdateSchema.parse(req.body);
    const existingIndex = record.foerderzielbereichTracking.findIndex((t) => t.bereich === input.bereich);
    const existing = existingIndex >= 0 ? record.foerderzielbereichTracking[existingIndex] : null;
    // Korrekturauftrag V0.2.1, A5: von/bis sind optional getrennt vom Status setzbar -
    // ein reines Status-Update darf einen bereits erfassten Zeitraum nicht loeschen.
    const entry = {
      bereich: input.bereich,
      status: input.status,
      von: input.von !== undefined ? input.von : (existing?.von ?? null),
      bis: input.bis !== undefined ? input.bis : (existing?.bis ?? null)
    };
    if (existingIndex >= 0) {
      record.foerderzielbereichTracking[existingIndex] = entry;
    } else {
      record.foerderzielbereichTracking.push(entry);
    }

    const renderedGoals = renderSupportGoalsSectionText(record.supportGoals, record.foerderzielbereichTracking);
    const applyResult = setSectionText(record.sections, "support_goals", renderedGoals, [], [], { manualEdit: false });
    if (applyResult.applied) {
      record.sections = applyResult.sections;
    }

    putCase(record);
    logEvent("foerderzielbereich_tracking_updated", { caseId: record.id, bereich: input.bereich, status: input.status });
    res.json(record.foerderzielbereichTracking);
  })
);

casesRouter.post(
  "/:id/clarification-check",
  asyncHandler(async (req, res) => {
    const { text } = ClarificationCheckSchema.parse(req.body);
    res.json(checkForClarification(text));
  })
);

casesRouter.post(
  "/:id/approve",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    ApprovalSchema.parse(req.body);

    // Migrationsplan 0.1->0.2 Abschnitt 2.3 (Entscheidungen 2, 3): harte
    // Vorvalidierungs-Blocker gelten auch vor der finalen Freigabe, nicht nur vor
    // einzelnen KI-Aufrufen.
    const generalPreValidation = checkGeneralPreValidation(record);
    if (generalPreValidation.blocked) {
      throw new ApiError(409, "pre_validation_blocked", generalPreValidation.reason ?? "Freigabe blockiert.");
    }
    const foerderbedarfPreValidation = checkFoerderbedarfBeleg(record);
    if (foerderbedarfPreValidation.blocked) {
      throw new ApiError(409, "pre_validation_blocked", foerderbedarfPreValidation.reason ?? "Freigabe blockiert.");
    }
    const abschlussHumanConfirmed = checkAbschlussHumanConfirmed(record);
    if (abschlussHumanConfirmed.blocked) {
      throw new ApiError(409, "pre_validation_blocked", abschlussHumanConfirmed.reason ?? "Freigabe blockiert.");
    }
    const unterstuetzungsbedarfBeschreibung = checkUnterstuetzungsbedarfBeschreibung(record);
    if (unterstuetzungsbedarfBeschreibung.blocked) {
      throw new ApiError(409, "pre_validation_blocked", unterstuetzungsbedarfBeschreibung.reason ?? "Freigabe blockiert.");
    }

    // Version 0.2 (PH-15 Abschnitt 43, MUSS): rote, nicht manuell geprüfte Abschnitte
    // duerfen nicht freigegeben werden. Diese Regel wird hier technisch durchgesetzt,
    // nicht nur im Frontend angezeigt.
    const releaseCheck = runReleaseCheck(record);
    if (releaseCheck.blocked) {
      throw new ApiError(
        409,
        "release_check_blocked",
        "Freigabe blockiert: es gibt Abschnitte mit unbelegten oder ungeprüften KI-Aussagen, die noch nicht fachlich bearbeitet wurden."
      );
    }

    record.approvedForExport = true;
    record.approvalTimestamp = new Date().toISOString();
    putCase(record);
    logEvent("case_approved", { caseId: record.id });
    res.json({ approvedForExport: true, approvalTimestamp: record.approvalTimestamp });
  })
);
