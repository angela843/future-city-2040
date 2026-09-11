import { describe, expect, it } from "vitest";
import { compareRatings } from "../domain/comparisonLogic.js";

describe("Spezifikations-Testfaelle 6-7 (Abschnitt 38)", () => {
  it("Test 6: vorher kein EDV-Wert (nicht_erhoben), aktuell überwiegend_sicher -> keine Verbesserungsbehauptung", () => {
    const status = compareRatings("nicht_erhoben", "ueberwiegend_sicher");
    expect(status).toBe("neu_erhoben");
    expect(status).not.toBe("positive_entwicklung");
  });

  it("Test 7: vorher Förderbedarf Dreisatz, aktuell teilweise_sicher -> mögliche positive Entwicklung", () => {
    const status = compareRatings("foerderbedarf", "teilweise_sicher");
    expect(status).toBe("positive_entwicklung");
  });

  it("Beispiel Abschnitt 21: überwiegend_sicher -> teilweise_sicher ergibt Warnung, keine automatische Verschlechterung", () => {
    const status = compareRatings("ueberwiegend_sicher", "teilweise_sicher");
    expect(status).toBe("moegliche_negative_abweichung");
  });
});
