import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { casesRouter } from "./routes/cases.js";
import { aiRouter } from "./routes/ai.js";
import { exportRouter } from "./routes/export.js";
import { demoRouter } from "./routes/demo.js";
import { ApiError } from "./asyncHandler.js";
import { logEvent } from "./logger.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      testSystem: true,
      testMode: process.env.LUV_TEST_MODE === "true",
      banner: "TESTSYSTEM – Keine echten personenbezogenen Daten eingeben."
    });
  });

  app.use("/api/cases", casesRouter);
  app.use("/api/cases", aiRouter);
  app.use("/api/cases", exportRouter);
  app.use("/api/demo", demoRouter);

  app.use((req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "Route nicht gefunden." } });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    if (err instanceof ZodError) {
      logEvent("validation_error", { issueCount: err.issues.length });
      res.status(400).json({
        error: {
          code: "validation_error",
          message: "Eingaben konnten nicht verarbeitet werden.",
          issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
        }
      });
      return;
    }
    logEvent("unhandled_error", { message: (err as Error)?.message });
    res.status(500).json({ error: { code: "internal_error", message: "Ein unerwarteter Fehler ist aufgetreten." } });
  };
  app.use(errorHandler);

  return app;
}
