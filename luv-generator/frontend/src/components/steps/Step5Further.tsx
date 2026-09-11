import { useState } from "react";
import { api } from "../../api/client.js";
import { CaseRecord, FurtherFindings } from "../../types.js";

export function Step5Further({
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
  const [form, setForm] = useState<FurtherFindings>(record.further);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FurtherFindings>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(andNext: boolean) {
    setSaving(true);
    try {
      const updated = await api.put<CaseRecord>(`/api/cases/${record.id}/further`, form);
      onUpdated(updated);
      if (andNext) onNext();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Schritt 5 – Weitere Erkenntnisse</h2>
      <div className="field">
        <label>Selbsteinschätzung der teilnehmenden Person</label>
        <textarea
          value={form.selbsteinschaetzung}
          onChange={(e) => set("selbsteinschaetzung", e.target.value)}
          placeholder="Wird im LUV ausdrücklich als Selbsteinschätzung gekennzeichnet, nicht als objektive Bewertung."
        />
      </div>
      <div className="field">
        <label>Weitere fachlich relevante Beobachtungen</label>
        <textarea value={form.weitereBeobachtungen} onChange={(e) => set("weitereBeobachtungen", e.target.value)} />
      </div>
      <div className="field">
        <label>Freitext</label>
        <textarea value={form.freitext} onChange={(e) => set("freitext", e.target.value)} />
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
