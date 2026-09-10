import { useState } from "react";
import { api } from "../../api/client.js";
import { CaseRecord, StartingSituation } from "../../types.js";

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

  function set<K extends keyof StartingSituation>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
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
        <label>Schulabschluss</label>
        <input value={form.schulabschluss} onChange={(e) => set("schulabschluss", e.target.value)} />
      </div>
      <div className="field">
        <label>Berufliche Vorerfahrung</label>
        <textarea value={form.beruflicheVorerfahrung} onChange={(e) => set("beruflicheVorerfahrung", e.target.value)} />
      </div>
      <div className="field">
        <label>Bisherige Praktika</label>
        <textarea value={form.bisherigePraktika} onChange={(e) => set("bisherigePraktika", e.target.value)} />
      </div>
      <div className="field">
        <label>Kurze Ausgangssituation</label>
        <textarea value={form.ausgangssituation} onChange={(e) => set("ausgangssituation", e.target.value)} />
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
