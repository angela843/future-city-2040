import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import { createCase, putCase } from "../store.js";
import { logEvent } from "../logger.js";
import { DEMO_CASES, DemoKey } from "../../demo/demoCases.js";
import { ApiError } from "../asyncHandler.js";

export const demoRouter = Router();

demoRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(Object.values(DEMO_CASES).map((d) => ({ key: d.key, label: d.label })));
  })
);

demoRouter.post(
  "/:key/load",
  asyncHandler(async (req, res) => {
    const key = req.params.key as DemoKey;
    const demo = DEMO_CASES[key];
    if (!demo) throw new ApiError(404, "demo_not_found", "Demo-Fall nicht gefunden.");
    const record = createCase(demo.build());
    putCase(record);
    logEvent("demo_case_loaded", { caseId: record.id, demoKey: key });
    res.status(201).json(record);
  })
);
