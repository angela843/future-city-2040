/**
 * Kompetenzkatalog (Version 0.2, PH-15 Abschnitt 3-11).
 *
 * Vordefinierte Unterkompetenzen je Hauptbereich, damit die Koordination nicht jedes
 * Mal neu formulieren muss. Der Katalog ist eine fachliche Arbeitshilfe, KEINE
 * verbindliche BA-Feldliste - er ergänzt, ersetzt aber nicht die Möglichkeit, über
 * "+ eigene Unterkompetenz hinzufügen" abweichende Eintraege zu erfassen (PH-15 §10).
 *
 * TODO: fachlich abgleichen - dieser Katalog basiert auf den in PH-15 "vorgeschlagenen"
 * Unterkompetenzen (Abschnitt 4-9) und ist ausdruecklich nicht mit der aktuellen
 * Leistungsbeschreibung BvB/BvB Reha oder dem offiziellen LUV-Vordruck abgeglichen.
 *
 * TODO: fachlich abgleichen (PH-15 v1.1 Abschnitt 16) - die "zusaetzlichen
 * Schluesselkompetenzen" (lebenspraktische Fertigkeiten, interkulturelle Kompetenzen,
 * gruene Kompetenzen, Diversitaetskompetenzen, Selbstlernkompetenzen) sind im
 * Anforderungskatalog NICHT eindeutig einem der sechs Hauptbereiche zugeordnet. Die
 * Zuordnung unten ist eine plausible Arbeitsannahme und noch fachlich zu bestaetigen.
 */
import { CompetenceArea } from "./types.js";

export interface CatalogEntry {
  id: string;
  label: string;
  /** Optionale fachliche Untergruppe (z.B. "Deutsch"/"Mathematik" innerhalb der schulischen Grundkompetenzen). */
  group?: string;
}

export const COMPETENCE_CATALOG: Record<CompetenceArea, CatalogEntry[]> = {
  schulische_grundkompetenzen: [
    // Deutsch
    { id: "CAT_SCHOOL_LESEN", label: "Lesen", group: "Deutsch" },
    { id: "CAT_SCHOOL_TEXTVERSTAENDNIS", label: "Textverständnis", group: "Deutsch" },
    { id: "CAT_SCHOOL_ARBEITSANWEISUNGEN", label: "Arbeitsanweisungen verstehen", group: "Deutsch" },
    { id: "CAT_SCHOOL_SCHRIFTL_AUSDRUCK", label: "Schriftlicher Ausdruck", group: "Deutsch" },
    { id: "CAT_SCHOOL_RECHTSCHREIBUNG", label: "Rechtschreibung", group: "Deutsch" },
    { id: "CAT_SCHOOL_SATZBAU", label: "Satzbau", group: "Deutsch" },
    { id: "CAT_SCHOOL_MUENDL_AUSDRUCK", label: "Mündlicher Ausdruck", group: "Deutsch" },
    { id: "CAT_SCHOOL_GESPRAECHSVERSTAENDNIS", label: "Gesprächsverständnis", group: "Deutsch" },
    { id: "CAT_SCHOOL_INFO_ENTNEHMEN", label: "Informationen aus Texten entnehmen", group: "Deutsch" },
    // Mathematik
    { id: "CAT_SCHOOL_GRUNDRECHENARTEN", label: "Grundrechenarten", group: "Mathematik" },
    { id: "CAT_SCHOOL_DEZIMALZAHLEN", label: "Dezimalzahlen", group: "Mathematik" },
    { id: "CAT_SCHOOL_BRUCHRECHNUNG", label: "Bruchrechnung", group: "Mathematik" },
    { id: "CAT_SCHOOL_PROZENTRECHNUNG", label: "Prozentrechnung", group: "Mathematik" },
    { id: "CAT_SCHOOL_DREISATZ", label: "Dreisatz", group: "Mathematik" },
    { id: "CAT_SCHOOL_MASSE_EINHEITEN", label: "Maße und Einheiten", group: "Mathematik" },
    { id: "CAT_SCHOOL_ZEITBERECHNUNG", label: "Zeitberechnung", group: "Mathematik" },
    { id: "CAT_SCHOOL_GELDRECHNEN", label: "Geldrechnen", group: "Mathematik" },
    { id: "CAT_SCHOOL_SACHAUFGABEN", label: "Sachaufgaben", group: "Mathematik" },
    { id: "CAT_SCHOOL_PRAXISBEZ_BERECHNUNGEN", label: "Praxisbezogene Berechnungen", group: "Mathematik" }
  ],
  digitale_kompetenzen: [
    { id: "CAT_DIGI_PC_GRUNDBEDIENUNG", label: "PC-Grundbedienung" },
    { id: "CAT_DIGI_DATEIEN_ORDNER", label: "Dateien und Ordner" },
    { id: "CAT_DIGI_TEXTVERARBEITUNG", label: "Textverarbeitung" },
    { id: "CAT_DIGI_TABELLENKALKULATION", label: "Tabellenkalkulation" },
    { id: "CAT_DIGI_INTERNETRECHERCHE", label: "Internetrecherche" },
    { id: "CAT_DIGI_EMAIL", label: "E-Mail" },
    { id: "CAT_DIGI_KOMMUNIKATION", label: "Digitale Kommunikation" },
    { id: "CAT_DIGI_DATENEINGABE", label: "Dateneingabe" },
    { id: "CAT_DIGI_SPEICHERN", label: "Speichern und Wiederfinden von Dokumenten" },
    { id: "CAT_DIGI_ARBEITSAUFTRAEGE", label: "Digitale Arbeitsaufträge" },
    { id: "CAT_DIGI_MEDIENKOMPETENZ", label: "IT- und Medienkompetenz im beruflichen Kontext" }
  ],
  personale_kompetenzen: [
    { id: "CAT_PERS_ZUVERLAESSIGKEIT", label: "Zuverlässigkeit" },
    { id: "CAT_PERS_PUENKTLICHKEIT", label: "Pünktlichkeit" },
    { id: "CAT_PERS_SELBSTSTAENDIGKEIT", label: "Selbstständigkeit" },
    { id: "CAT_PERS_SORGFALT", label: "Sorgfalt" },
    { id: "CAT_PERS_AUSDAUER", label: "Ausdauer" },
    { id: "CAT_PERS_ARBEITSBEREITSCHAFT", label: "Arbeitsbereitschaft" },
    { id: "CAT_PERS_EIGENINITIATIVE", label: "Eigeninitiative" },
    { id: "CAT_PERS_FEEDBACK", label: "Umgang mit Feedback" },
    { id: "CAT_PERS_SELBSTEINSCHAETZUNG", label: "Selbsteinschätzung" },
    { id: "CAT_PERS_NEUE_AUFGABEN", label: "Umgang mit neuen Aufgaben" },
    { id: "CAT_PERS_VERANTWORTUNG", label: "Verantwortungsübernahme" },
    { id: "CAT_PERS_LEBENSPRAKTISCH", label: "Lebenspraktische Fertigkeiten", group: "Zusätzliche Schlüsselkompetenz" }
  ],
  sozial_kommunikative_kompetenzen: [
    { id: "CAT_SOC_TEAMARBEIT", label: "Teamarbeit" },
    { id: "CAT_SOC_KOOPERATION", label: "Kooperation" },
    { id: "CAT_SOC_KOMMUNIKATION", label: "Kommunikation" },
    { id: "CAT_SOC_GESPRAECHSVERHALTEN", label: "Gesprächsverhalten" },
    { id: "CAT_SOC_KONFLIKTVERHALTEN", label: "Konfliktverhalten" },
    { id: "CAT_SOC_REGELN", label: "Umgang mit Regeln" },
    { id: "CAT_SOC_KRITIK", label: "Umgang mit Kritik" },
    { id: "CAT_SOC_RUECKSICHTNAHME", label: "Rücksichtnahme" },
    { id: "CAT_SOC_UNTERSTUETZUNG", label: "Unterstützung anderer" },
    { id: "CAT_SOC_GRUPPENVERHALTEN", label: "Verhalten in Gruppen" },
    { id: "CAT_SOC_AUFTRETEN", label: "Angemessenes Auftreten" },
    { id: "CAT_SOC_INTERKULTURELL", label: "Interkulturelle Kompetenzen", group: "Zusätzliche Schlüsselkompetenz" },
    { id: "CAT_SOC_DIVERSITAET", label: "Diversitätskompetenzen", group: "Zusätzliche Schlüsselkompetenz" }
  ],
  methodische_kompetenzen: [
    { id: "CAT_METH_ARBEITSPLANUNG", label: "Arbeitsplanung" },
    { id: "CAT_METH_AUFGABENVERSTAENDNIS", label: "Aufgabenverständnis" },
    { id: "CAT_METH_STRUKTURIERUNG", label: "Strukturierung von Arbeitsschritten" },
    { id: "CAT_METH_PROBLEMLOESUNG", label: "Problemlösung" },
    { id: "CAT_METH_INFOBESCHAFFUNG", label: "Informationsbeschaffung" },
    { id: "CAT_METH_SELBSTKONTROLLE", label: "Selbstkontrolle" },
    { id: "CAT_METH_LERNSTRATEGIEN", label: "Lernstrategien" },
    { id: "CAT_METH_UEBERTRAGUNG", label: "Übertragung auf neue Aufgaben" },
    { id: "CAT_METH_PRIORISIERUNG", label: "Priorisierung" },
    { id: "CAT_METH_HILFSMITTEL", label: "Umgang mit Hilfsmitteln" },
    { id: "CAT_METH_SELBSTLERNKOMPETENZ", label: "Selbstlernkompetenz" }
  ],
  berufliche_orientierung_praxis: [
    { id: "CAT_PRACTICE_INTERESSE", label: "Berufliches Interesse" },
    { id: "CAT_PRACTICE_BERUFSWUNSCH", label: "Berufswunsch" },
    { id: "CAT_PRACTICE_ALTERNATIVEN", label: "Berufliche Alternativen" },
    { id: "CAT_PRACTICE_GESCHICKLICHKEIT", label: "Praktische Geschicklichkeit" },
    { id: "CAT_PRACTICE_ARBEITSQUALITAET", label: "Arbeitsqualität" },
    { id: "CAT_PRACTICE_ARBEITSTEMPO", label: "Arbeitstempo" },
    { id: "CAT_PRACTICE_ANWEISUNGEN", label: "Einhalten von Anweisungen" },
    { id: "CAT_PRACTICE_SELBSTSTAENDIG", label: "Selbstständiges Arbeiten in der Praxis" },
    { id: "CAT_PRACTICE_BETRIEBSVERHALTEN", label: "Verhalten im Betrieb" },
    { id: "CAT_PRACTICE_KUNDENKONTAKT", label: "Kundenkontakt" },
    { id: "CAT_PRACTICE_WERKZEUGE", label: "Umgang mit Werkzeugen/Arbeitsmitteln" },
    { id: "CAT_PRACTICE_ORIENTIERUNG", label: "Orientierung im Berufsfeld" },
    { id: "CAT_PRACTICE_REALISIERBARKEIT", label: "Realisierbarkeit des Berufswunsches" },
    { id: "CAT_PRACTICE_BESTAENDIGKEIT", label: "Beständigkeit des Berufswunsches" },
    { id: "CAT_PRACTICE_ERPROBUNGSERGEBNISSE", label: "Ergebnisse praktischer Berufsfelderprobungen" },
    { id: "CAT_PRACTICE_GRUEN", label: "Grüne Kompetenzen", group: "Zusätzliche Schlüsselkompetenz" }
  ]
};

export function findCatalogEntry(area: CompetenceArea, catalogId: string): CatalogEntry | undefined {
  return COMPETENCE_CATALOG[area]?.find((e) => e.id === catalogId);
}
