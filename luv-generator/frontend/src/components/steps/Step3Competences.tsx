import { useState } from "react";
import { api } from "../../api/client.js";
import {
  AREA_LABELS,
  CaseRecord,
  CompetenceArea,
  CompetenceRating,
  EvidenceItem,
  EvidenceSource,
  RATING_LABELS,
  SOURCE_LABELS,
  SubCompetence
} from "../../types.js";

const AREAS = Object.keys(AREA_LABELS) as CompetenceArea[];
const RATINGS = Object.keys(RATING_LABELS) as CompetenceRating[];
const SOURCES = Object.keys(SOURCE_LABELS) as EvidenceSource[];

type StructureResult =
  | { kind: "ok"; text: string; evidenceIds: string[]; warnings: string[] }
  | { kind: "insufficient_data"; questions: string[] }
  | { kind: "conflict"; conflicts: string[] }
  | { kind: "blocked_privacy"; reason: string }
  | { kind: "invalid_schema"; message: string }
  | { kind: "unavailable"; message: string };

const emptyForm = () => ({
  id: undefined as string | undefined,
  label: "",
  rating: "nicht_erhoben" as CompetenceRating,
  observationNotes: "",
  source: "beobachtung" as EvidenceSource,
  evidenceIds: [] as string[]
});

export function Step3Competences({
  record,
  onUpdated,
  onNext,
  onBack
}: {
  record: CaseRecord;
  onUpdated: (r: CaseRecord) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [activeArea, setActiveArea] = useState<CompetenceArea>(AREAS[0]);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [structureResult, setStructureResult] = useState<StructureResult | null>(null);
  const [structuring, setStructuring] = useState(false);

  const areaEntries = record.subCompetences.filter((sc) => sc.area === activeArea);

  function startEdit(sc: SubCompetence) {
    setForm({
      id: sc.id,
      label: sc.label,
      rating: sc.rating,
      observationNotes: sc.observationNotes,
      source: "beobachtung",
      evidenceIds: sc.evidenceIds
    });
    setStructureResult(null);
  }

  async function handleStructure() {
    if (!form.observationNotes.trim()) return;
    setStructuring(true);
    setStructureResult(null);
    try {
      const result = await api.post<StructureResult>(`/api/cases/${record.id}/ai/structure-notes`, {
        areaLabel: AREA_LABELS[activeArea],
        rawNotes: form.observationNotes,
        sourceTypes: [form.source]
      });
      setStructureResult(result);
    } finally {
      setStructuring(false);
    }
  }

  async function handleSave() {
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      let evidenceIds = form.evidenceIds;
      if (form.observationNotes.trim()) {
        const evidence = await api.post<EvidenceItem>(`/api/cases/${record.id}/evidence`, {
          source: form.source,
          note: form.observationNotes,
          area: activeArea
        });
        evidenceIds = [...new Set([...evidenceIds, evidence.id])];
      }
      const updated = await api.post<CaseRecord>(`/api/cases/${record.id}/sub-competences`, {
        id: form.id,
        area: activeArea,
        label: form.label,
        rating: form.rating,
        observationNotes: form.observationNotes,
        evidenceIds
      });
      onUpdated(updated);
      setForm(emptyForm());
      setStructureResult(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Schritt 3 – Kompetenzen</h2>
      <div className="step-nav">
        {AREAS.map((area) => (
          <button
            key={area}
            type="button"
            className={`step-pill ${area === activeArea ? "active" : ""}`}
            onClick={() => {
              setActiveArea(area);
              setForm(emptyForm());
              setStructureResult(null);
            }}
          >
            {AREA_LABELS[area]}
          </button>
        ))}
      </div>

      <h3>{AREA_LABELS[activeArea]}</h3>
      {areaEntries.length === 0 && <p className="muted">Noch keine Unterkompetenzen erfasst.</p>}
      {areaEntries.map((sc) => (
        <div key={sc.id} className="competence-row">
          <strong>{sc.label}</strong> <span className="badge">{RATING_LABELS[sc.rating]}</span>
          <p className="muted">{sc.observationNotes || "(keine Stichpunkte)"}</p>
          <button type="button" onClick={() => startEdit(sc)}>
            Bearbeiten
          </button>
        </div>
      ))}

      <div className="section-block">
        <h3>{form.id ? "Unterkompetenz bearbeiten" : "Unterkompetenz hinzufügen"}</h3>
        <div className="field">
          <label>Bezeichnung der Unterkompetenz</label>
          <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Bewertung</label>
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value as CompetenceRating }))}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {RATING_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Quelle</label>
            <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as EvidenceSource }))}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Beobachtungsstichpunkte</label>
          <textarea
            value={form.observationNotes}
            onChange={(e) => setForm((f) => ({ ...f, observationNotes: e.target.value }))}
            placeholder="Konkrete, kurze Stichpunkte - z.B. '8 von 10 Aufgaben schriftlich korrekt gelöst'"
          />
        </div>

        <div className="button-row">
          <button type="button" onClick={handleStructure} disabled={structuring || !form.observationNotes.trim()}>
            {structuring ? "Wird strukturiert…" : "KI: Stichpunkte strukturieren"}
          </button>
        </div>

        {structureResult && (
          <div className="ai-box">
            {structureResult.kind === "ok" && (
              <>
                <div>{structureResult.text}</div>
                <div className="button-row">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, observationNotes: structureResult.text }));
                      setStructureResult(null);
                    }}
                  >
                    Übernehmen
                  </button>
                </div>
              </>
            )}
            {structureResult.kind === "insufficient_data" && (
              <div className="notice warning">
                Angaben reichen nicht aus. {structureResult.questions.join(" ")}
              </div>
            )}
            {structureResult.kind === "blocked_privacy" && (
              <div className="notice error">Datenschutzprüfung erforderlich: {structureResult.reason}</div>
            )}
            {(structureResult.kind === "invalid_schema" || structureResult.kind === "unavailable") && (
              <div className="notice error">{structureResult.message}</div>
            )}
          </div>
        )}

        <div className="button-row">
          <button type="button" className="primary" disabled={saving} onClick={handleSave}>
            {form.id ? "Aktualisieren" : "Hinzufügen"}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm())}>
              Abbrechen
            </button>
          )}
        </div>
      </div>

      <div className="button-row">
        <button type="button" onClick={onBack}>
          Zurück
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Weiter
        </button>
      </div>
    </div>
  );
}
