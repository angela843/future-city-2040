import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import {
  CaseRecord,
  COMPLETION_STATUS_LABELS,
  GoalCompletionStatus,
  GoalPriority,
  MeasureLibraryEntry,
  RATING_LABELS,
  SOURCE_LABELS,
  SupportGoal
} from "../../types.js";
import { ComparisonPanel } from "../ComparisonPanel.js";

const TRIGGER_LABELS: Record<string, string> = {
  development: "Möglicher Entwicklungsbereich",
  support: "Möglicher Förderbereich",
  priority: "Prioritärer Prüfhinweis"
};

const PRIORITY_LABELS: Record<GoalPriority, string> = { A: "A – aktuell zentral", B: "B – relevant", C: "C – beobachten" };

// TODO: fachlich abgleichen - kein verbindlicher Schwellenwert vorgegeben (PH-15 §35:
// "Keine starre maximale Anzahl"). 5 ist ein technischer Arbeitswert für die Warnung.
const GOAL_COUNT_WARNING_THRESHOLD = 5;

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
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [measureLibrary, setMeasureLibrary] = useState<MeasureLibraryEntry[]>([]);

  useEffect(() => {
    api
      .get<MeasureLibraryEntry[]>("/api/catalog/measures")
      .then(setMeasureLibrary)
      .catch(() => setMeasureLibrary([]));
  }, []);

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
    await api.put(`/api/cases/${record.id}/support-goals/${goal.id}`, { ...goal, ...patch });
    const updated = await api.get<CaseRecord>(`/api/cases/${record.id}`);
    onUpdated(updated);
  }

  const confirmedAreas = record.supportAreaCandidates.filter((a) => a.status === "confirmed");
  const confirmedGoalCount = record.supportGoals.filter((g) =>
    ["uebernommen", "bearbeitet", "neu_formuliert"].includes(g.status)
  ).length;

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

        {record.supportAreaCandidates.map((area) => {
          const sub = record.subCompetences.find((sc) => sc.id === area.subCompetenceId);
          const evidence = sub ? record.evidence.filter((e) => sub.evidenceIds.includes(e.id)) : [];
          const expanded = expandedAreaId === area.id;
          return (
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
                <button type="button" onClick={() => setExpandedAreaId(expanded ? null : area.id)}>
                  {expanded ? "Begründung ausblenden" : "Warum wurde dieser Bereich vorgeschlagen?"}
                </button>
              </div>
              {expanded && (
                <div className="ai-box">
                  <div>Bewertung: {sub ? RATING_LABELS[sub.rating] : "unbekannt"}</div>
                  {sub?.observationNotes && <div>Beobachtung: „{sub.observationNotes}“</div>}
                  {evidence.map((e) => (
                    <div key={e.id}>
                      Quelle: {SOURCE_LABELS[e.source]} <code className="idmono">{e.id}</code>
                    </div>
                  ))}
                  {evidence.length === 0 && <div className="muted">Keine verknüpften Belege.</div>}
                </div>
              )}
            </div>
          );
        })}

        <div className="button-row">
          <button type="button" onClick={suggestGoals} disabled={suggesting || confirmedAreas.length === 0}>
            {suggesting ? "Erzeuge Vorschläge…" : "KI: Förderzielvorschläge generieren"}
          </button>
        </div>
        {confirmedAreas.length === 0 && (
          <p className="muted">Bitte zunächst mindestens einen Förderbereich bestätigen.</p>
        )}
        {error && <div className="notice error">{error}</div>}

        {confirmedGoalCount > GOAL_COUNT_WARNING_THRESHOLD && (
          <div className="notice warning">
            Es wurden {confirmedGoalCount} Förderziele ausgewählt. Prüfen Sie, welche Ziele für den aktuellen
            Beurteilungszeitraum tatsächlich zentral sind.
          </div>
        )}

        {record.supportGoals.map((goal) => {
          const libraryOptions = measureLibrary.filter(
            (m) => m.area === record.supportAreaCandidates.find((a) => a.id === goal.supportAreaId)?.area
          );
          return (
            <div key={goal.id} className="section-block">
              <h3>
                {goal.bereich} <span className="badge">{goal.status}</span>
                {goal.measureSource && <span className="badge">Maßnahme: {goal.measureSource}</span>}
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
                <textarea
                  value={goal.massnahme}
                  onChange={(e) => updateGoal(goal, { massnahme: e.target.value, status: "bearbeitet", measureSource: "manuell" })}
                />
                {libraryOptions.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      const entry = libraryOptions.find((m) => m.id === e.target.value);
                      if (entry) updateGoal(goal, { massnahme: entry.text, measureSource: "bibliothek", status: "bearbeitet" });
                    }}
                  >
                    <option value="">Aus Maßnahmenbibliothek übernehmen…</option>
                    {libraryOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.group ? `${m.group}: ` : ""}
                        {m.text}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="field">
                <label>Überprüfungskriterium</label>
                <textarea
                  value={goal.ueberpruefungskriterium}
                  onChange={(e) => updateGoal(goal, { ueberpruefungskriterium: e.target.value, status: "bearbeitet" })}
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Priorität (intern, erscheint nicht im LUV-Text)</label>
                  <select
                    value={goal.prioritaet ?? ""}
                    onChange={(e) => updateGoal(goal, { prioritaet: (e.target.value || undefined) as GoalPriority | undefined })}
                  >
                    <option value="">(keine)</option>
                    {(Object.entries(PRIORITY_LABELS) as [GoalPriority, string][]).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {record.baseData.luvArt !== "start" && (
                  <div className="field">
                    <label>Zielstatus</label>
                    <select
                      value={goal.completionStatus ?? ""}
                      onChange={(e) =>
                        updateGoal(goal, { completionStatus: (e.target.value || undefined) as GoalCompletionStatus | undefined })
                      }
                    >
                      <option value="">(nicht gesetzt)</option>
                      {(Object.entries(COMPLETION_STATUS_LABELS) as [GoalCompletionStatus, string][]).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
          );
        })}
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
