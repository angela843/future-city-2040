import { FormEvent, useState } from "react";
import { api } from "../../api/client.js";
import { BaseData, CaseRecord, LuvArt } from "../../types.js";

interface DemoInfo {
  key: string;
  label: string;
}

const EMPTY: BaseData = {
  teilnehmerName: "",
  geburtsdatum: "",
  massnahme: "",
  eintrittsdatum: "",
  luvArt: "start",
  beurteilungszeitraumVon: "",
  beurteilungszeitraumBis: "",
  koordination: ""
};

export function Step1BaseData({
  record,
  demos,
  onCreated,
  onUpdated,
  onLoadDemo,
  onNext
}: {
  record: CaseRecord | null;
  demos: DemoInfo[];
  onCreated: (record: CaseRecord) => void;
  onUpdated: (record: CaseRecord) => void;
  onLoadDemo: (key: string) => void;
  onNext: () => void;
}) {
  const [form, setForm] = useState<BaseData>(record?.baseData ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof BaseData>(key: K, value: BaseData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (record) {
        const updated = await api.put<CaseRecord>(`/api/cases/${record.id}/base-data`, form);
        onUpdated(updated);
      } else {
        const created = await api.post<CaseRecord>("/api/cases", form);
        onCreated(created);
      }
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {!record && demos.length > 0 && (
        <div className="card">
          <h2>Demo-Fall laden</h2>
          <p className="muted">
            Fiktive Demo-Fälle zum schnellen Ausprobieren des Generators (Abschnitt 39 der Spezifikation).
          </p>
          <div className="demo-grid">
            {demos.map((d) => (
              <div key={d.key} className="demo-card">
                <strong>{d.label}</strong>
                <div className="button-row">
                  <button type="button" onClick={() => onLoadDemo(d.key)}>
                    Laden
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="card" onSubmit={handleSubmit}>
        <h2>Schritt 1 – Grunddaten</h2>
        <p className="muted">
          Teilnehmername und Geburtsdatum verbleiben ausschließlich lokal in diesem Fall und werden niemals
          automatisch an die KI übermittelt.
        </p>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="teilnehmerName">Teilnehmername (nur lokal)</label>
            <input
              id="teilnehmerName"
              required
              value={form.teilnehmerName}
              onChange={(e) => set("teilnehmerName", e.target.value)}
              placeholder="z.B. Alex Fiktiv"
            />
          </div>
          <div className="field">
            <label htmlFor="geburtsdatum">Geburtsdatum (optional, nur lokal)</label>
            <input
              id="geburtsdatum"
              type="date"
              value={form.geburtsdatum ?? ""}
              onChange={(e) => set("geburtsdatum", e.target.value)}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="massnahme">Maßnahme</label>
            <input id="massnahme" required value={form.massnahme} onChange={(e) => set("massnahme", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="eintrittsdatum">Eintrittsdatum</label>
            <input
              id="eintrittsdatum"
              type="date"
              required
              value={form.eintrittsdatum}
              onChange={(e) => set("eintrittsdatum", e.target.value)}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="luvArt">LUV-Art</label>
            <select id="luvArt" value={form.luvArt} onChange={(e) => set("luvArt", e.target.value as LuvArt)}>
              <option value="start">Start-LUV</option>
              <option value="verlauf">Verlaufs-LUV</option>
              <option value="abschluss">Abschluss-LUV</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="koordination">Koordination</label>
            <input
              id="koordination"
              required
              value={form.koordination}
              onChange={(e) => set("koordination", e.target.value)}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="von">Beurteilungszeitraum – von</label>
            <input
              id="von"
              type="date"
              required
              value={form.beurteilungszeitraumVon}
              onChange={(e) => set("beurteilungszeitraumVon", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="bis">Beurteilungszeitraum – bis</label>
            <input
              id="bis"
              type="date"
              required
              value={form.beurteilungszeitraumBis}
              onChange={(e) => set("beurteilungszeitraumBis", e.target.value)}
            />
          </div>
        </div>

        {error && <div className="notice error">{error}</div>}

        <div className="button-row">
          <button type="submit" className="primary" disabled={saving}>
            {record ? "Speichern & weiter" : "Fall anlegen & weiter"}
          </button>
        </div>
      </form>
    </div>
  );
}
