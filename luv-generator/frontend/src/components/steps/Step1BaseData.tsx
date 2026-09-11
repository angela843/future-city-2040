import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import {
  BaseData,
  CaseRecord,
  FristenResult,
  KompetenzanalyseDauerHinweis,
  LuvArt,
  MASSNAHMEART_LABELS,
  MASSNAHMEART_VALUES,
  MASSNAHMEZIEL_LABELS,
  MASSNAHMEZIEL_VALUES,
  Massnahmeart,
  Massnahmeziel,
  VERLAUF_ANLASS_LABELS,
  VERLAUF_ANLASS_VALUES,
  VerlaufAnlass
} from "../../types.js";

interface DemoInfo {
  key: string;
  label: string;
}

/**
 * Massnahmeart/Anlass/Massnahmeziel sind zunaechst "" (kein Default) - eine aktive
 * Auswahl ist Pflicht (Migrationsplan 0.1->0.2, Entscheidung 6). Die HTML-Validierung
 * (required) verhindert ein Absenden ohne Auswahl.
 */
type FormState = Omit<BaseData, "massnahmeart" | "verlaufAnlass" | "massnahmeziel"> & {
  massnahmeart: Massnahmeart | "";
  verlaufAnlass: VerlaufAnlass | "";
  massnahmeziel: Massnahmeziel | "";
};

const EMPTY: FormState = {
  teilnehmerName: "",
  geburtsdatum: "",
  massnahme: "",
  massnahmeart: "",
  eintrittsdatum: "",
  kompetenzanalyseEnde: "",
  massnahmeEndeGeplant: "",
  verlaufAnlass: "",
  verlaengerungstermin: "",
  massnahmeziel: "",
  begruendungKeineAusbildung: "",
  luvArt: "start",
  beurteilungszeitraumVon: "",
  beurteilungszeitraumBis: "",
  koordination: ""
};

function toFormState(baseData: BaseData): FormState {
  return { ...baseData, verlaufAnlass: baseData.verlaufAnlass ?? "", massnahmeziel: baseData.massnahmeziel ?? "" };
}

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
  const [form, setForm] = useState<FormState>(record ? toFormState(record.baseData) : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fristen, setFristen] = useState<FristenResult | null>(null);
  const [dauerHinweis, setDauerHinweis] = useState<KompetenzanalyseDauerHinweis | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (!record) return;
    let cancelled = false;
    api
      .get<{ fristen: FristenResult; kompetenzanalyseDauerHinweis: KompetenzanalyseDauerHinweis }>(`/api/cases/${record.id}/fristen`)
      .then((res) => {
        if (cancelled) return;
        setFristen(res.fristen);
        setDauerHinweis(res.kompetenzanalyseDauerHinweis);
      })
      .catch(() => {
        // Fristenanzeige ist informativ - bei Fehler einfach nicht anzeigen.
      });
    return () => {
      cancelled = true;
    };
  }, [record, record?.baseData]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.massnahmeart) {
      setError("Bitte eine Maßnahmeart auswählen (BvB 1 / BvB 2 / BvB 3) - keine Vorbelegung möglich.");
      return;
    }
    if (form.massnahmeziel === "sv_beschaeftigung" && !form.begruendungKeineAusbildung.trim()) {
      setError(
        'Bei Maßnahmeziel „sozialversicherungspflichtige Beschäftigung" ist die Begründung, weshalb Berufsausbildung voraussichtlich nicht erreicht werden kann, ein Pflichtfeld.'
      );
      return;
    }
    setSaving(true);
    setError(null);
    const payload: BaseData = {
      ...form,
      massnahmeart: form.massnahmeart,
      verlaufAnlass: form.verlaufAnlass || null,
      massnahmeziel: form.massnahmeziel || null
    };
    try {
      if (record) {
        const updated = await api.put<CaseRecord>(`/api/cases/${record.id}/base-data`, payload);
        onUpdated(updated);
      } else {
        const created = await api.post<CaseRecord>("/api/cases", payload);
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
            <label htmlFor="massnahmeart">Maßnahmeart</label>
            <select
              id="massnahmeart"
              required
              value={form.massnahmeart}
              onChange={(e) => set("massnahmeart", e.target.value as Massnahmeart)}
            >
              <option value="" disabled>
                Bitte wählen …
              </option>
              {MASSNAHMEART_VALUES.map((m) => (
                <option key={m} value={m}>
                  {MASSNAHMEART_LABELS[m]}
                </option>
              ))}
            </select>
            <p className="muted">Keine Vorbelegung (PH-17 V1.0): eine aktive Auswahl ist Pflicht.</p>
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="massnahmeziel">Maßnahmeziel</label>
            <select
              id="massnahmeziel"
              required
              value={form.massnahmeziel}
              onChange={(e) => set("massnahmeziel", e.target.value as Massnahmeziel)}
            >
              <option value="" disabled>
                Bitte wählen …
              </option>
              {MASSNAHMEZIEL_VALUES.map((m) => (
                <option key={m} value={m}>
                  {MASSNAHMEZIEL_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          {form.massnahmeziel === "sv_beschaeftigung" && (
            <div className="field">
              <label htmlFor="begruendungKeineAusbildung">
                Begründung, weshalb Berufsausbildung voraussichtlich nicht erreicht werden kann (Pflichtfeld)
              </label>
              <textarea
                id="begruendungKeineAusbildung"
                required
                value={form.begruendungKeineAusbildung}
                onChange={(e) => set("begruendungKeineAusbildung", e.target.value)}
              />
              <p className="muted">Wird nie durch Claude erzeugt oder ergänzt - reine fachliche Eingabe.</p>
            </div>
          )}
        </div>

        {form.luvArt === "verlauf" && (
          <div className="grid-2">
            <div className="field">
              <label htmlFor="verlaufAnlass">Anlass des Verlaufs-LUV</label>
              <select
                id="verlaufAnlass"
                value={form.verlaufAnlass}
                onChange={(e) => set("verlaufAnlass", e.target.value as VerlaufAnlass)}
              >
                <option value="">Bitte wählen …</option>
                {VERLAUF_ANLASS_VALUES.map((a) => (
                  <option key={a} value={a}>
                    {VERLAUF_ANLASS_LABELS[a]}
                  </option>
                ))}
              </select>
              <p className="muted">Steuert die Fristformel (PH-17 V1.0 Abschnitt 6) - Claude berechnet keine Fristen.</p>
            </div>
            {form.verlaufAnlass === "verlaengerung" && (
              <div className="field">
                <label htmlFor="verlaengerungstermin">Verlängerungstermin</label>
                <input
                  id="verlaengerungstermin"
                  type="date"
                  value={form.verlaengerungstermin ?? ""}
                  onChange={(e) => set("verlaengerungstermin", e.target.value || null)}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid-2">
          <div className="field">
            <label htmlFor="eintrittsdatum">Eintrittsdatum (Maßnahmebeginn)</label>
            <input
              id="eintrittsdatum"
              type="date"
              required
              value={form.eintrittsdatum}
              onChange={(e) => set("eintrittsdatum", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="kompetenzanalyseEnde">Ende der Kompetenzanalyse</label>
            <input
              id="kompetenzanalyseEnde"
              type="date"
              value={form.kompetenzanalyseEnde ?? ""}
              onChange={(e) => set("kompetenzanalyseEnde", e.target.value || null)}
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

        <div className="field">
          <label htmlFor="massnahmeEndeGeplant">Geplantes Maßnahmeende</label>
          <input
            id="massnahmeEndeGeplant"
            type="date"
            value={form.massnahmeEndeGeplant ?? ""}
            onChange={(e) => set("massnahmeEndeGeplant", e.target.value || null)}
          />
          <p className="muted">
            Grundlage für die Fristen der weiteren Verlaufs-LUV (6 Wochen vorher) und der Abschluss-LUV.
            TODO: fachlich abgleichen – bei abweichendem tatsächlichen Austritt gilt der tatsächliche letzte
            Teilnahmetag.
          </p>
        </div>

        {fristen && (
          <div className="card" style={{ background: "var(--card-bg-muted, #f4f4f4)" }}>
            <h3>LUV-Fristen (berechnet)</h3>
            <ul>
              <li>Start-LUV fällig: {fristen.startLuvFaellig ?? "– (Ende Kompetenzanalyse fehlt)"}</li>
              <li>Erste Verlaufs-LUV fällig: {fristen.ersteVerlaufsLuvFaellig ?? "–"}</li>
              <li>Weitere Verlaufs-LUV fällig: {fristen.weitereVerlaufsLuvFaellig ?? "– (geplantes Maßnahmeende fehlt)"}</li>
              <li>Verlängerungs-Verlaufs-LUV fällig: {fristen.verlaengerungsVerlaufsLuvFaellig ?? "– (Verlängerungstermin fehlt)"}</li>
              <li>Abschluss-LUV fällig: {fristen.abschlussLuvFaellig ?? "– (geplantes Maßnahmeende fehlt)"}</li>
            </ul>
            {dauerHinweis && !dauerHinweis.ok && <div className="notice warn">{dauerHinweis.hinweis}</div>}
          </div>
        )}

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
