/**
 * Serverseitige Eingabevalidierung fuer die Wizard-API (Spezifikation Abschnitt 41).
 */
import { z } from "zod";
import { COMPETENCE_AREAS } from "../domain/types.js";

export const LuvArtSchema = z.enum(["start", "verlauf", "abschluss"]);

export const BaseDataSchema = z.object({
  teilnehmerName: z.string().min(1).max(200),
  geburtsdatum: z.string().max(20).nullable().optional(),
  massnahme: z.string().max(200),
  eintrittsdatum: z.string().max(20),
  luvArt: LuvArtSchema,
  beurteilungszeitraumVon: z.string().max(20),
  beurteilungszeitraumBis: z.string().max(20),
  koordination: z.string().max(200)
});

export const StartingSituationSchema = z.object({
  schulabschluss: z.string().max(500),
  beruflicheVorerfahrung: z.string().max(1000),
  bisherigePraktika: z.string().max(1000),
  ausgangssituation: z.string().max(3000)
});

export const CompetenceRatingSchema = z.enum([
  "staerke",
  "ueberwiegend_sicher",
  "teilweise_sicher",
  "foerderbedarf",
  "deutlicher_foerderbedarf",
  "nicht_erhoben",
  "nicht_beurteilbar",
  "nicht_relevant"
]);

export const EvidenceSourceSchema = z.enum([
  "kompetenzfeststellung",
  "unterricht",
  "praktische_aufgabe",
  "beobachtung",
  "praktikum",
  "betriebliche_erprobung",
  "gespraech",
  "selbsteinschaetzung",
  "rueckmeldung_dritter",
  "vorhandene_dokumentation"
]);

export const SubCompetenceInputSchema = z.object({
  id: z.string().optional(),
  area: z.enum(COMPETENCE_AREAS),
  label: z.string().min(1).max(200),
  rating: CompetenceRatingSchema,
  observationNotes: z.string().max(3000),
  evidenceIds: z.array(z.string()).default([])
});

export const EvidenceItemInputSchema = z.object({
  source: EvidenceSourceSchema,
  note: z.string().min(1).max(2000),
  area: z.enum(COMPETENCE_AREAS).nullable().optional()
});

export const CareerInfoSchema = z.object({
  berufswunsch: z.string().max(500),
  alternativen: z.string().max(500),
  orientierungsstatus: z.string().max(500),
  erprobteBerufsfelder: z.string().max(1000),
  praktikumserkenntnisse: z.string().max(2000)
});

export const FurtherFindingsSchema = z.object({
  selbsteinschaetzung: z.string().max(2000),
  weitereBeobachtungen: z.string().max(2000),
  freitext: z.string().max(2000)
});

export const SupportAreaStatusUpdateSchema = z.object({
  status: z.enum(["confirmed", "rejected", "pending"])
});

export const SupportGoalUpdateSchema = z.object({
  status: z.enum(["vorschlag", "uebernommen", "bearbeitet", "neu_formuliert", "verworfen"]),
  bereich: z.string().max(200).optional(),
  ausgangslage: z.string().max(1000).optional(),
  ziel: z.string().max(1000).optional(),
  massnahme: z.string().max(1000).optional(),
  ueberpruefungskriterium: z.string().max(1000).optional(),
  prioritaet: z.enum(["hoch", "mittel", "niedrig"]).optional()
});

export const SectionManualEditSchema = z.object({
  text: z.string().max(10000)
});

export const ApprovalSchema = z.object({
  confirmationText: z.literal("Ich habe den Inhalt fachlich geprüft.")
});

export const PreviousLuvSchema = z.object({
  rawText: z.string().max(20000)
});

export const ComparisonClaimLinkSchema = z.object({
  subCompetenceId: z.string().nullable().optional(),
  previousRating: CompetenceRatingSchema.nullable().optional(),
  currentText: z.string().max(2000).optional()
});

export const ComparisonClaimConfirmSchema = z.object({
  confirmed: z.boolean()
});
