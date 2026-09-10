import { describe, expect, it } from "vitest";
import { runAiTask } from "../ai/aiService.js";

describe("Spezifikations-Testfaelle 1-3 (Abschnitt 38)", () => {
  it("Test 1: 'Mathe schlecht.' -> insufficient_data", async () => {
    const payload = {
      luv_art: "start",
      section_key: "school_competences",
      area_label: "Schulische Grundkompetenzen",
      sub_competences: [
        { label: "Mathematik", rating: "nicht_erhoben", observationNotes: "Mathe schlecht.", evidenceIds: [] }
      ],
      evidence: []
    };
    const result = await runAiTask("formulate_section", "case-test-1", payload, []);
    expect(result.kind).toBe("insufficient_data");
    if (result.kind === "insufficient_data") {
      expect(result.questions.length).toBeGreaterThan(0);
    }
  });

  it("Test 2: 'Ist faul.' -> Konkretisierungsanforderung, keine Motivationsdiagnose", async () => {
    const payload = {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        { label: "Motivation", rating: "nicht_erhoben", observationNotes: "Ist faul.", evidenceIds: [] }
      ],
      evidence: []
    };
    const result = await runAiTask("formulate_section", "case-test-2", payload, []);
    expect(result.kind).toBe("insufficient_data");
    if (result.kind === "insufficient_data") {
      expect(result.questions.join(" ")).toMatch(/beobachtbare[s]? Verhalten/i);
      // Es darf keine pauschale Formulierung wie "wenig motiviert" auftauchen.
      expect(result.questions.join(" ").toLowerCase()).not.toContain("motiviert");
    }
  });

  it("Test 3: Nur Selbsteinschätzung Teamfähigkeit -> als Selbsteinschätzung gekennzeichnet", async () => {
    const payload = {
      luv_art: "start",
      section_key: "social_competences",
      area_label: "Sozial-kommunikative Kompetenzen",
      sub_competences: [
        {
          label: "Teamfähigkeit",
          rating: "nicht_erhoben",
          observationNotes: "Ich bin gut im Team.",
          evidenceIds: [],
          onlySelfAssessment: true
        }
      ],
      evidence: []
    };
    const result = await runAiTask("formulate_section", "case-test-3", payload, []);
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.text).toMatch(/schätzt.*selbst/i);
      // Keine objektive Bewertung "Die teilnehmende Person ist teamfähig."
      expect(result.text).not.toMatch(/^Die teilnehmende Person ist teamfähig/i);
    }
  });
});
