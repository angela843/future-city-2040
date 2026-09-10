import { CompetenceArea, LuvSection } from "./types.js";

export const AREA_LABELS: Record<CompetenceArea, string> = {
  schulische_grundkompetenzen: "Schulische Grundkompetenzen",
  digitale_kompetenzen: "Digitale Kompetenzen",
  personale_kompetenzen: "Personale Kompetenzen",
  sozial_kommunikative_kompetenzen: "Sozial-kommunikative Kompetenzen",
  methodische_kompetenzen: "Methodische Kompetenzen",
  berufliche_orientierung_praxis: "Berufliche Orientierung und Praxis"
};

export const AREA_TO_SECTION_KEY: Record<CompetenceArea, LuvSection["key"]> = {
  schulische_grundkompetenzen: "school_competences",
  digitale_kompetenzen: "digital_competences",
  personale_kompetenzen: "personal_competences",
  sozial_kommunikative_kompetenzen: "social_competences",
  methodische_kompetenzen: "methodical_competences",
  berufliche_orientierung_praxis: "practical_competences"
};
