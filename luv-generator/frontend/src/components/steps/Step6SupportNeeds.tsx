import { useState } from "react";
import { api } from "../../api/client.js";
import { CaseRecord, SupportGoal } from "../../types.js";
import { ComparisonPanel } from "../ComparisonPanel.js";

const TRIGGER_LABELS: Record<string, string> = {
  development: "Möglicher Entwicklungsbereich",
  support: "Möglicher Förderbereich",
  priority: "Prioritärer Prüfhinweis"
};

export function Step6SupportNeeds({
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
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setAreaStatus(areaId: string, status: "confirmed" | "rejected" | "pending") {
    const updated = await api.put<CaseRecord>(`/api/cases/${record.id}/support-areas/${areaId}`, { status }).then(
      () => api.get<CaseRecord>(`/api/cases/${record.id}`)
    );
    onUpdated(updated);
  }

  async function suggestGoals() {
    setSuggesting(true);
    setError(null);
    try {
      await api.post(`/api/cases/${record.id}/ai/support-goals/suggest`, {});
      const updated = await api.get<CaseRecord>(`/api/cases/${record.id}`);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vorschläge konnten nicht erzeugt werden.");
    } finally {
      setSuggesting(false);
    }
  }

  async function updateGoal(goal: SupportGoal, patch: Partial<SupportGoal>) {
    const res = await api.put<{ sections: unknown }>(`/api/cases/${record.id}/support-goals/${goal.id}`, {
      ...goal,
      ...patch
    });
    void res;
    const updated = await api.get<CaseRecord>(`/api/cases/${record.id}`);
    onUpdated(updated);
  }

  const confirmedAreas = record.supportAreaCandidates.filter((a) => a.status === "confirmed");

  return (
    <div>
      {record.baseData.luvArt !== "start" && <ComparisonPanel record={record} onUpdated={onUpdated} />}

      <div className="card">
        <h2>Schritt 6 – Förderbedarf & Ziele</h2>
        <p className="muted">
          Aus den Bewertungen in Schritt 3 wurden folgende möglichen Förderbereiche automatisch ermittelt. Nur
          bestätigte Förderbereiche können Förderzielvorschläge erzeugen.
        </p>

        {record.supportAreaCandidates.length === 0 && <p className="muted">Keine Förderbereiche erkannt.</p>}

        {record.supportAreaCandidates.map((area) => (
          <div key={area.id} className="competence-row">
            <strong>{area.label}</strong>{" "}
            <span className={`badge ${area.triggerLevel === "priority" ? "unsupported" : "warning"}`}>
              {TRIGGER_LABELS[area.triggerLevel]}
            </span>
            <span className="badge">{area.status}</span>
            <div className="button-row">
              <button type="button" disabled={area.status === "confirmed"} onClick={() => setAreaStatus(area.id, "confirmed")}>
                Bestätigen
              </button>
              <button type="button" disabled={area.status === "rejected"} onClick={() => setAreaStatus(area.id, "rejected")}>
                Ablehnen
              </button>
            </div>
          </div>
        ))}

        <div className="button-row">
          <button type="button" onClick={suggestGoals} disabled={suggesting || confirmedAreas.length === 0}>
            {suggesting ? "Erzeuge Vorschläge…" : "KI: Förderzielvorschläge generieren"}
          </button>
        </div>
        {confirmedAreas.length === 0 && (
          <p className="muted">Bitte zunächst mindestens einen Förderbereich bestätigen.</p>
        )}
        {error && <div className="notice error">{error}</div>}

        {record.supportGoals.map((goal) => (
          <div key={goal.id} className="section-block">
            <h3>
              {goal.bereich} <span className="badge">{goal.status}</span>
            </h3>
            <div className="field">
              <label>Ausgangslage</label>
              <textarea value={goal.ausgangslage} onChange={(e) => updateGoal(goal, { ausgangslage: e.target.value, status: "bearbeitet" })} />
            </div>
            <div className="field">
              <label>Ziel</label>
              <textarea value={goal.ziel} onChange={(e) => updateGoal(goal, { ziel: e.target.value, status: "bearbeitet" })} />
            </div>
            <div className="field">
              <label>Maßnahme</label>
              <textarea value={goal.massnahme} onChange={(e) => updateGoal(goal, { massnahme: e.target.value, status: "bearbeitet" })} />
            </div>
            <div className="field">
              <label>Überprüfungskriterium</label>
              <textarea
                value={goal.ueberpruefungskriterium}
                onChange={(e) => updateGoal(goal, { ueberpruefungskriterium: e.target.value, status: "bearbeitet" })}
              />
            </div>
            <div className="button-row">
              <button type="button" onClick={() => updateGoal(goal, { status: "uebernommen" })}>
                Übernehmen
              </button>
              <button type="button" onClick={() => updateGoal(goal, { status: "neu_formuliert" })}>
                Als neu formuliert markieren
              </button>
              <button type="button" className="danger" onClick={() => updateGoal(goal, { status: "verworfen" })}>
                Verwerfen
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="button-row">
        <button type="button" onClick={onBack}>
          Zurück
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Weiter zur Vorschau
        </button>
      </div>
    </div>
  );
}
