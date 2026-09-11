/**
 * Redundanzkontrolle vor der Gesamtvorschau (Spezifikation Abschnitt 24).
 * Erkennt inhaltlich stark ueberlappende Saetze zwischen Abschnitten und markiert sie
 * als Warnung. Es findet KEINE automatische Umformulierung/Loeschung statt - die
 * Koordination entscheidet, wie mit der Redundanz umgegangen wird.
 *
 * Fuer Verlaufs-LUVs wird zusaetzlich eine Textaehnlichkeitswarnung zum vorherigen
 * LUV-Text ermoeglicht (optional, siehe checkSimilarityToPreviousText).
 */
import { LuvSection } from "../domain/types.js";

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9äöüß\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalize(a).split(" "));
  const setB = new Set(normalize(b).split(" "));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

const SIMILARITY_THRESHOLD = 0.65;

export interface RedundancyWarning {
  sectionKeyA: string;
  sectionKeyB: string;
  sentenceA: string;
  sentenceB: string;
  similarity: number;
}

/** Prueft alle Abschnittspaare auf stark aehnliche Saetze. */
export function findRedundancies(sections: LuvSection[]): RedundancyWarning[] {
  const warnings: RedundancyWarning[] = [];
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const sentencesA = splitSentences(sections[i].text);
      const sentencesB = splitSentences(sections[j].text);
      for (const sentenceA of sentencesA) {
        for (const sentenceB of sentencesB) {
          const similarity = jaccardSimilarity(sentenceA, sentenceB);
          if (similarity >= SIMILARITY_THRESHOLD) {
            warnings.push({
              sectionKeyA: sections[i].key,
              sectionKeyB: sections[j].key,
              sentenceA,
              sentenceB,
              similarity: Math.round(similarity * 100) / 100
            });
          }
        }
      }
    }
  }
  return warnings;
}

/** Optionale Textaehnlichkeitswarnung fuer Verlaufs-LUVs gegenueber dem vorherigen LUV-Text. */
export function checkSimilarityToPreviousText(sections: LuvSection[], previousText: string): RedundancyWarning[] {
  if (!previousText.trim()) return [];
  const previousSentences = splitSentences(previousText);
  const warnings: RedundancyWarning[] = [];
  for (const section of sections) {
    for (const sentence of splitSentences(section.text)) {
      for (const prevSentence of previousSentences) {
        const similarity = jaccardSimilarity(sentence, prevSentence);
        if (similarity >= SIMILARITY_THRESHOLD) {
          warnings.push({
            sectionKeyA: section.key,
            sectionKeyB: "previous_luv",
            sentenceA: sentence,
            sentenceB: prevSentence,
            similarity: Math.round(similarity * 100) / 100
          });
        }
      }
    }
  }
  return warnings;
}
