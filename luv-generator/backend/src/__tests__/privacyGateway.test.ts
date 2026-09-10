import { describe, expect, it } from "vitest";
import { runPrivacyGateway } from "../privacy/gateway.js";
import { runAiTask } from "../ai/aiService.js";

describe("Spezifikations-Testfaelle 4-5 (Abschnitt 38)", () => {
  it("Test 4: Diagnose im Freitext -> Privacy-Warnung / Übertragung blockieren", async () => {
    const payload = {
      luv_art: "start",
      section_key: "personal_competences",
      area_label: "Personale Kompetenzen",
      sub_competences: [
        {
          label: "Auffälligkeiten",
          rating: "nicht_erhoben",
          observationNotes: "Diagnose ADHS liegt laut Elterngespräch vor.",
          evidenceIds: []
        }
      ],
      evidence: []
    };
    const result = await runAiTask("formulate_section", "case-test-4", payload, []);
    expect(result.kind).toBe("blocked_privacy");
  });

  it("Test 5: Name + Geburtsdatum + Kompetenzwert -> Name/Geburtsdatum fehlen im Claude-Payload", () => {
    const rawPayload = {
      luv_art: "start",
      section_key: "school_competences",
      area_label: "Mathematik",
      // Direkte Identifikatoren auf Top-Level (duerfen bereits durch die Allowlist fallen):
      teilnehmerName: "Max Mustermann",
      geburtsdatum: "2005-01-01",
      sub_competences: [
        {
          label: "Grundrechenarten",
          rating: "ueberwiegend_sicher",
          observationNotes: "8 von 10 Aufgaben korrekt.",
          evidenceIds: ["MATH_001"],
          // Zusaetzlich verschachtelt "eingeschmuggelt", um die rekursive
          // Identifikator-Entfernung (defense in depth) zu pruefen:
          teilnehmerName: "Max Mustermann",
          geburtsdatum: "2005-01-01"
        }
      ],
      evidence: []
    };

    const result = runPrivacyGateway("formulate_section", "case-test-5", rawPayload);
    expect(result.ok).toBe(true);
    const json = JSON.stringify(result.sanitizedPayload);
    expect(json).not.toContain("Max Mustermann");
    expect(json).not.toContain("2005-01-01");
    expect(json).not.toMatch(/teilnehmerName/i);
    expect(json).not.toMatch(/geburtsdatum/i);
    expect(result.sanitizedPayload?.case_ref).toMatch(/^CASE_/);
  });
});
