import { useState } from "react";
import { api } from "../../api/client.js";
import {
  BERUFLICHE_VORERFAHRUNG_LABELS,
  BERUFLICHE_VORERFAHRUNG_OPTIONS,
  BeruflicheVorerfahrung,
  CaseRecord,
  SCHULABSCHLUSS_LABELS,
  SCHULABSCHLUSS_OPTIONS,
  Schulabschluss,
  StartingSituation
} from "../../types.js";

export function Step2StartingSituation({
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
  const [form, setForm] = useState<StartingSituation>(record.startingSituation);
  const [saving, setSaving] = useState(false);

  function setText<K extends "bisherigePraktika" | "ausgangssituation">(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleVorerfahrung(value: BeruflicheVorerfahrung) {
    setForm((f) => ({
      ...f,
      beruflicheVorerfahrung: f.beruflicheVorerfahrung.includes(value)
        ? f.beruflicheVorerfahrung.filter((v) => v !== value)
        : [...f.beruflicheVorerfahrung, value]
    }));
  }

  async function save(andNext: boolean) {
    setSaving(true);
    try {
      const updated = await api.put<CaseRecord>(`/api/cases/${record.id}/starting-situation`, form);
      onUpdated(updated);
      if (andNext) onNext();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Schritt 2 – Ausgangslage</h2>
      <div className="field">
        <label htmlFor="schulabschluss">Schulabschluss</label>
        <select
          id="schulabschluss"
          value={form.schulabschluss}
          onChange={(e) => setForm((f) => ({ ...f, schulabschluss: e.target.value as Schulabschluss }))}
        >
          {SCHULABSCHLUSS_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {SCHULABSCHLUSS_LABELS[o]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Berufliche Vorerfahrung (Mehrfachauswahl)</label>
        <div className="checkbox-group">
          {BERUFLICHE_VORERFAHRUNG_OPTIONS.map((o) => (
            <label key={o} className="checkbox-label">
              <input type="checkbox" checked={form.beruflicheVorerfahrung.includes(o)} onChange={() => toggleVorerfahrung(o)} />
              {BERUFLICHE_VORERFAHRUNG_LABELS[o]}
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Bisherige Praktika</label>
        <textarea value={form.bisherigePraktika} onChange={(e) => setText("bisherigePraktika", e.target.value)} />
      </div>
      <div className="field">
        <label>Kurze Ausgangssituation</label>
        <textarea value={form.ausgangssituation} onChange={(e) => setText("ausgangssituation", e.target.value)} />
      </div>
      <div className="button-row">
        <button type="button" onClick={onBack}>
          Zurück
        </button>
        <button type="button" className="primary" disabled={saving} onClick={() => save(true)}>
          Speichern & weiter
        </button>
      </div>
    </div>
  );
}
