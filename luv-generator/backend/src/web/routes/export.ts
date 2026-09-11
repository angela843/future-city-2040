import { Router } from "express";
import { ApiError, asyncHandler, notFoundCase } from "../asyncHandler.js";
import { getCase } from "../store.js";
import { logEvent } from "../logger.js";
import { copyFullLuvText, copySectionText } from "../../export/copyText.js";
import { buildDocxBuffer } from "../../export/docxExport.js";
import { LuvSection } from "../../domain/types.js";

export const exportRouter = Router();

exportRouter.get(
  "/:id/copy/full",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    res.type("text/plain").send(copyFullLuvText(record));
  })
);

exportRouter.get(
  "/:id/copy/section/:key",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    const section = record.sections.find((s) => s.key === (req.params.key as LuvSection["key"]));
    if (!section) throw new ApiError(404, "section_not_found", "Abschnitt nicht gefunden.");
    res.type("text/plain").send(copySectionText(section));
  })
);

exportRouter.get(
  "/:id/export/docx",
  asyncHandler(async (req, res) => {
    const record = getCase(req.params.id);
    if (!record) throw notFoundCase();
    if (!record.approvedForExport) {
      throw new ApiError(
        403,
        "not_approved",
        "Export erst möglich, nachdem die fachliche Prüfung aktiv bestätigt wurde."
      );
    }
    // Kein neuer Claude-Aufruf beim Export (Abschnitt 32): es wird exakt der
    // bereits bestaetigte Text aus record.sections gerendert.
    const buffer = await buildDocxBuffer(record);
    logEvent("docx_exported", { caseId: record.id });
    res
      .status(200)
      .set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="LUV_TESTSYSTEM_${record.id}.docx"`
      })
      .send(buffer);
  })
);
