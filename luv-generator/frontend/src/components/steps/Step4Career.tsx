import { useState } from "react";
import { api } from "../../api/client.js";
import { CareerInfo, CaseRecord } from "../../types.js";

export function Step4Career({
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
  const [form, setForm] = useState<CareerInfo>(record.career);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CareerInfo>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(andNext: boolean) {
    setSaving(true);
    try {
      const updated = await api.put<CaseRecord>(`/api/cases/${record.id}/career`, form);
      onUpdated(updated);
      if (andNext) onNext();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Schritt 4 – Beruf & Praxis</h2>
      <div className="field">
        <label>Berufswunsch</label>
        <input value={form.berufswunsch} onChange={(e) => set("berufswunsch", e.target.value)} />
      </div>
      <div className="field">
        <label>Alternativen</label>
        <input value={form.alternativen} onChange={(e) => set("alternativen", e.target.value)} />
      </div>
      <div className="field">
        <label>Beruflicher Orientierungsstatus</label>
        <textarea value={form.orientierungsstatus} onChange={(e) => set("orientierungsstatus", e.target.value)} />
      </div>
      <div className="field">
        <label>Erprobte Berufsfelder</label>
        <input value={form.erprobteBerufsfelder} onChange={(e) => set("erprobteBerufsfelder", e.target.value)} />
      </div>
      <div className="field">
        <label>Praktikumserkenntnisse</label>
        <textarea value={form.praktikumserkenntnisse} onChange={(e) => set("praktikumserkenntnisse", e.target.value)} />
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
