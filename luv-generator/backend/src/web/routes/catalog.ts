import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { COMPETENCE_CATALOG } from "../../domain/competenceCatalog.js";
import { MEASURE_LIBRARY } from "../../domain/measureLibrary.js";
import { BA_FOERDERZIELBEREICHE, MASSNAHMEART_VALUES } from "../../domain/types.js";
import { BA_FOERDERZIELBEREICH_LABELS, MASSNAHMEART_LABELS } from "../../domain/labels.js";

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

/** PH-15 v1.1 Abschnitt 3: Massnahmearten BvB/BvB-Reha. */
catalogRouter.get(
  "/massnahmearten",
  asyncHandler(async (_req, res) => {
    res.json(MASSNAHMEART_VALUES.map((id) => ({ id, label: MASSNAHMEART_LABELS[id] })));
  })
);
