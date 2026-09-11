import { useState } from "react";
import { api } from "../../api/client.js";
import {
  BerufsfeldEintrag,
  CareerInfo,
  CaseRecord,
  EvidenceSource,
  ORIENTIERUNGSSTATUS_LABELS,
  ORIENTIERUNGSSTATUS_OPTIONS,
  Orientierungsstatus,
  SOURCE_LABELS
} from "../../types.js";

const SOURCES = Object.keys(SOURCE_LABELS) as EvidenceSource[];

function emptyBerufsfeld(): BerufsfeldEintrag {
  return { berufsfeld: "", orientierungspraktikum: false, zentraleErkenntnis: "", quelle: "" };
}

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

  function setText<K extends "berufswunsch" | "alternativen" | "praktikumserkenntnisse">(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setBerufsfeld(index: number, patch: Partial<BerufsfeldEintrag>) {
    setForm((f) => ({
      ...f,
      berufsfelder: f.berufsfelder.map((b, i) => (i === index ? { ...b, ...patch } : b))
    }));
  }

  function addBerufsfeld() {
    setForm((f) => ({ ...f, berufsfelder: [...f.berufsfelder, emptyBerufsfeld()] }));
  }

  function removeBerufsfeld(index: number) {
    setForm((f) => ({ ...f, berufsfelder: f.berufsfelder.filter((_, i) => i !== index) }));
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
        <input value={form.berufswunsch} onChange={(e) => setText("berufswunsch", e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.berufswunschVorhanden === true}
              onChange={(e) => setForm((f) => ({ ...f, berufswunschVorhanden: e.target.checked }))}
            />
            Berufswunsch vorhanden
          </label>
        </div>
        <div className="field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.berufswunschGefestigt === true}
              onChange={(e) => setForm((f) => ({ ...f, berufswunschGefestigt: e.target.checked }))}
            />
            Berufswunsch gefestigt
          </label>
        </div>
      </div>
      <div className="field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.berufswunschPraktischErprobt === true}
            onChange={(e) => setForm((f) => ({ ...f, berufswunschPraktischErprobt: e.target.checked }))}
          />
          Berufswunsch praktisch erprobt
        </label>
      </div>
      <div className="field">
        <label>Alternativen</label>
        <input value={form.alternativen} onChange={(e) => setText("alternativen", e.target.value)} />
      </div>
      <div className="field">
        <label>Beruflicher Orientierungsstatus</label>
        <select
          value={form.orientierungsstatus}
          onChange={(e) => setForm((f) => ({ ...f, orientierungsstatus: e.target.value as Orientierungsstatus | "" }))}
        >
          <option value="">(nicht gesetzt)</option>
          {ORIENTIERUNGSSTATUS_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {ORIENTIERUNGSSTATUS_LABELS[o]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.weitereOrientierungErforderlich}
            onChange={(e) => setForm((f) => ({ ...f, weitereOrientierungErforderlich: e.target.checked }))}
          />
          Weitere Orientierung erforderlich
        </label>
      </div>

      <div className="section-block">
        <h3>Erprobte Berufsfelder</h3>
        <p className="muted">Berufsfeld 1–3 + ggf. weitere – flexibel, da Losvorgaben je Maßnahme variieren.</p>
        {form.berufsfelder.map((b, i) => (
          <div key={i} className="competence-row">
            <div className="grid-2">
              <div className="field">
                <label>Berufsfeld</label>
                <input value={b.berufsfeld} onChange={(e) => setBerufsfeld(i, { berufsfeld: e.target.value })} />
              </div>
              <div className="field">
                <label>Quelle</label>
                <select value={b.quelle} onChange={(e) => setBerufsfeld(i, { quelle: e.target.value as EvidenceSource | "" })}>
                  <option value="">(nicht gesetzt)</option>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Zentrale Erkenntnis</label>
              <input value={b.zentraleErkenntnis} onChange={(e) => setBerufsfeld(i, { zentraleErkenntnis: e.target.value })} />
            </div>
            <label className="checkbox-label">
              <input type="checkbox" checked={b.orientierungspraktikum} onChange={(e) => setBerufsfeld(i, { orientierungspraktikum: e.target.checked })} />
              Im Rahmen eines Orientierungspraktikums erprobt
            </label>
            <div className="button-row">
              <button type="button" onClick={() => removeBerufsfeld(i)}>
                Entfernen
              </button>
            </div>
          </div>
        ))}
        <div className="button-row">
          <button type="button" onClick={addBerufsfeld}>
            + Berufsfeld hinzufügen
          </button>
        </div>
      </div>

      <div className="field">
        <label>Praktikumserkenntnisse</label>
        <textarea value={form.praktikumserkenntnisse} onChange={(e) => setText("praktikumserkenntnisse", e.target.value)} />
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
