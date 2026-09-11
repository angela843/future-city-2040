import { describe, expect, it } from "vitest";
import { triggerLevelForRating } from "../domain/supportLogic.js";
import { nextEvidenceId } from "../domain/evidence.js";
import { checkEvidenceIdsExist } from "../validation/evidenceValidation.js";

describe("Deterministische Förderlogik (Abschnitt 17)", () => {
  it("teilweise_sicher (Bewertung 2) löst möglichen Entwicklungsbereich aus", () => {
    expect(triggerLevelForRating("teilweise_sicher")).toBe("development");
  });
  it("foerderbedarf (Bewertung 1) löst möglichen Förderbereich aus", () => {
    expect(triggerLevelForRating("foerderbedarf")).toBe("support");
  });
  it("deutlicher_foerderbedarf (Bewertung 0) löst prioritären Prüfhinweis aus", () => {
    expect(triggerLevelForRating("deutlicher_foerderbedarf")).toBe("priority");
  });
  it("staerke löst keinen Förderbereich aus", () => {
    expect(triggerLevelForRating("staerke")).toBeNull();
  });
});

describe("Evidence-ID-Vergabe (Abschnitt 7)", () => {
  it("vergibt fortlaufende IDs je Präfix", () => {
    expect(nextEvidenceId("MATH", [])).toBe("MATH_001");
    expect(nextEvidenceId("MATH", ["MATH_001", "MATH_002"])).toBe("MATH_003");
    expect(nextEvidenceId("OBS", ["MATH_001"])).toBe("OBS_001");
  });
});

describe("Faktenvalidierung: Evidence-ID-Existenzprüfung (Abschnitt 25)", () => {
  it("erkennt nicht existierende Evidence-IDs", () => {
    const result = checkEvidenceIdsExist(["MATH_001", "OBS_999"], ["MATH_001"]);
    expect(result.valid).toBe(false);
    expect(result.unknownIds).toEqual(["OBS_999"]);
  });
  it("bestätigt existierende Evidence-IDs", () => {
    const result = checkEvidenceIdsExist(["MATH_001"], ["MATH_001", "OBS_001"]);
    expect(result.valid).toBe(true);
  });
});
