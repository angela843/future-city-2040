import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { COMPETENCE_CATALOG } from "../../domain/competenceCatalog.js";
import { MEASURE_LIBRARY } from "../../domain/measureLibrary.js";

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
