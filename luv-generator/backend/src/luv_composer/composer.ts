/**
 * LUV Composer (Spezifikation Abschnitt 27, 28).
 * Arbeitet weitgehend deterministisch: entscheidet anhand der LUV-Art, welche Abschnitte
 * enthalten sind und in welcher Reihenfolge. Schuetzt manuell bearbeitete Abschnitte
 * (manual_override) vor ueberschreibender KI-Ueberarbeitung.
 */
import { sectionOrderForLuvArt, SECTION_TITLES } from "../domain/composerRules.js";
import { CaseRecord, LuvSection } from "../domain/types.js";

/** Erstellt/aktualisiert das Abschnitts-Skelett fuer die aktuelle LUV-Art des Falls. */
export function ensureSectionSkeleton(caseRecord: CaseRecord): LuvSection[] {
  const order = sectionOrderForLuvArt(caseRecord.baseData.luvArt);
  const existingByKey = new Map(caseRecord.sections.map((s) => [s.key, s]));

  return order.map(
    (key) =>
      existingByKey.get(key) ?? {
        key,
        title: SECTION_TITLES[key],
        text: "",
        evidenceIds: [],
        warnings: [],
        manualOverride: false
      }
  );
}

export interface SetSectionTextOptions {
  /** true, wenn dies eine manuelle Bearbeitung durch die Koordination ist. */
  manualEdit: boolean;
}

export interface SetSectionTextResult {
  applied: boolean;
  sections: LuvSection[];
  reason?: string;
}

/**
 * Setzt den Text eines Abschnitts. KI-generierte Ueberschreibungen werden verweigert,
 * sobald der Abschnitt manuell bearbeitet wurde (manual_override = true) - Abschnitt 26.
 * Eine erneute manuelle Bearbeitung ist immer erlaubt.
 */
export function setSectionText(
  sections: LuvSection[],
  key: LuvSection["key"],
  text: string,
  evidenceIds: string[],
  warnings: string[],
  options: SetSectionTextOptions
): SetSectionTextResult {
  const index = sections.findIndex((s) => s.key === key);
  if (index === -1) {
    return { applied: false, sections, reason: "Abschnitt existiert nicht in dieser LUV-Art." };
  }

  const current = sections[index];
  if (current.manualOverride && !options.manualEdit) {
    return {
      applied: false,
      sections,
      reason: "Abschnitt wurde manuell bearbeitet und ist vor KI-Überschreibung geschützt."
    };
  }

  const updated: LuvSection = {
    ...current,
    text,
    evidenceIds,
    warnings,
    manualOverride: options.manualEdit ? true : current.manualOverride,
    // Version 0.2 (PH-15 Abschnitt 43): eine manuelle Bearbeitung ist die "aktive
    // fachliche Bearbeitung", die eine rote (nicht gedeckte) Kennzeichnung aufhebt -
    // der vorherige (jetzt veraltete) Faktencheck bezog sich auf den KI-Text, nicht
    // auf den neuen, von der Koordination verantworteten Text.
    factCheck: options.manualEdit ? undefined : current.factCheck
  };

  const next = [...sections];
  next[index] = updated;
  return { applied: true, sections: next };
}
