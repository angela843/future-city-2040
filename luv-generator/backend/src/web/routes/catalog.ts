import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { COMPETENCE_CATALOG } from "../../domain/competenceCatalog.js";
import { MEASURE_LIBRARY } from "../../domain/measureLibrary.js";
import { BA_FOERDERZIELBEREICHE, MASSNAHMEART_VALUES, Massnahmeart } from "../../domain/types.js";
import { BA_FOERDERZIELBEREICH_LABELS, MASSNAHMEART_LABELS, ROLLE_LABELS } from "../../domain/labels.js";
import { rollenForMassnahmeart } from "../../domain/supportLogic.js";
import { MassnahmeartSchema } from "../../validation/requestSchemas.js";

export const catalogRouter = Router();

/** Version 0.2 (PH-15 Abschnitt 3-11): vordefinierter Kompetenzkatalog. */
catalogRouter.get(
  "/competences",
  asyncHandler(async (_req, res) => {
    res.json(COMPETENCE_CATALOG);
  })
);

/** Version 0.2 (PH-15 Abschnitt 30-33): Massnahmenbibliothek. */
catalogRouter.get(
  "/measures",
  asyncHandler(async (_req, res) => {
    res.json(MEASURE_LIBRARY);
  })
);

/** PH-15 v1.1 Abschnitt 8: offizielle BA-Förderzielbereiche (Arbeitsformulierungen, TODO: fachlich abgleichen). */
catalogRouter.get(
  "/foerderzielbereiche",
  asyncHandler(async (_req, res) => {
    res.json(BA_FOERDERZIELBEREICHE.map((id) => ({ id, label: BA_FOERDERZIELBEREICH_LABELS[id] })));
  })
);

/** PH-17 V1.0: Massnahmearten BvB 1/BvB 2/BvB 3 - keine technische Vorbelegung/Default. */
catalogRouter.get(
  "/massnahmearten",
  asyncHandler(async (_req, res) => {
    res.json(MASSNAHMEART_VALUES.map((id) => ({ id, label: MASSNAHMEART_LABELS[id] })));
  })
);

/**
 * Migrationsplan 0.1->0.2 Entscheidung 8: rollenbezogene Zielvereinbarung mit
 * massnahmeabhaengiger Sichtbarkeit (Rollenliste je Massnahmeart).
 */
catalogRouter.get(
  "/rollen",
  asyncHandler(async (req, res) => {
    const parsed = MassnahmeartSchema.safeParse(req.query.massnahmeart);
    const massnahmeart: Massnahmeart = parsed.success ? parsed.data : "bvb1";
    res.json(rollenForMassnahmeart(massnahmeart).map((id) => ({ id, label: ROLLE_LABELS[id] })));
  })
);
