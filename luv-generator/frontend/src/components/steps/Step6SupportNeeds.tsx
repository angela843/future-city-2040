import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import {
  BAFoerderzielbereich,
  BA_FOERDERZIELBEREICHE,
  BA_FOERDERZIELBEREICH_LABELS,
  CaseRecord,
  COMPLETION_STATUS_LABELS,
  FOERDERZIELBEREICH_STATUS_LABELS,
  FoerderzielbereichStatus,
  GoalCompletionStatus,
  GoalPriority,
  MeasureLibraryEntry,
  RATING_LABELS,
  Rolle,
  ROLLE_LABELS,
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
  const [rollen, setRollen] = useState<{ id: Rolle; label: string }[]>([]);

  useEffect(() => {
    api
      .get<MeasureLibraryEntry[]>("/api/catalog/measures")
      .then(setMeasureLibrary)
      .catch(() => setMeasureLibrary([]));
  }, []);

  useEffect(() => {
    api
      .get<{ id: Rolle; label: string }[]>(`/api/catalog/rollen?massnahmeart=${record.baseData.massnahmeart}`)
      .then(setRollen)
      .catch(() => setRollen([]));
  }, [record.baseData.massnahmeart]);

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
      const result = await api.post<{ kind: string; reason?: string }>(`/api/cases/${record.id}/ai/support-goals/suggest`, {});
      if (result.kind === "blocked_pre_validation") {
        // Migrationsplan 0.1->0.2 Entscheidung 3: Förderbedarf ohne Beleg = harter Blocker.
        setError(result.reason ?? "Generierung durch Vorvalidierung blockiert.");
        return;
      }
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

  async function setTrackingStatus(bereich: BAFoerderzielbereich, status: FoerderzielbereichStatus) {
    const updated = await api
      .put(`/api/cases/${record.id}/foerderzielbereich-tracking`, { bereich, status })
      .then(() => api.get<CaseRecord>(`/api/cases/${record.id}`));
    onUpdated(updated);
  }

  async function setTrackingZeitraum(bereich: BAFoerderzielbereich, status: FoerderzielbereichStatus, von: string | null, bis: string | null) {
    const updated = await api
      .put(`/api/cases/${record.id}/foerderzielbereich-tracking`, { bereich, status, von, bis })
      .then(() => api.get<CaseRecord>(`/api/cases/${record.id}`));
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
                  <label>BA-Förderzielbereich</label>
                  <select
                    value={goal.foerderzielbereich ?? ""}
                    onChange={(e) =>
                      updateGoal(goal, { foerderzielbereich: (e.target.value || undefined) as BAFoerderzielbereich | undefined })
                    }
                  >
                    <option value="">(nicht zugeordnet)</option>
                    {BA_FOERDERZIELBEREICHE.map((b) => (
                      <option key={b} value={b}>
                        {BA_FOERDERZIELBEREICH_LABELS[b]}
                      </option>
                    ))}
                  </select>
                  {!goal.foerderzielbereich && ["uebernommen", "bearbeitet", "neu_formuliert"].includes(goal.status) && (
                    <span className="hint">Ohne Förderzielbereich erscheint dieses Ziel im Qualitätscheck als offener Hinweis.</span>
                  )}
                </div>
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
                <div className="field">
                  <label>Rolle (rollenbezogene Zielvereinbarung)</label>
                  <select value={goal.rolle ?? ""} onChange={(e) => updateGoal(goal, { rolle: (e.target.value || undefined) as Rolle | undefined })}>
                    <option value="">(nicht zugeordnet)</option>
                    {rollen.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
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

      <div className="card">
        <h2>Stand der BA-Förderzielbereiche</h2>
        <p className="muted">
          Mehrere Förderzielbereiche können gleichzeitig aktiv sein (nicht linear modelliert). Der Status wird nur
          organisatorisch gepflegt und ist keine automatische Ableitung.
        </p>
        {BA_FOERDERZIELBEREICHE.map((b) => {
          const tracking = record.foerderzielbereichTracking.find((t) => t.bereich === b);
          return (
            <div key={b} className="competence-row">
              <strong>{BA_FOERDERZIELBEREICH_LABELS[b]}</strong>{" "}
              {tracking && <span className="badge">{FOERDERZIELBEREICH_STATUS_LABELS[tracking.status]}</span>}
              <div className="button-row">
                {(Object.keys(FOERDERZIELBEREICH_STATUS_LABELS) as FoerderzielbereichStatus[]).map((s) => (
                  <button key={s} type="button" disabled={tracking?.status === s} onClick={() => setTrackingStatus(b, s)}>
                    {FOERDERZIELBEREICH_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Voraussichtlich von</label>
                  <input
                    type="date"
                    value={tracking?.von ?? ""}
                    onChange={(e) =>
                      setTrackingZeitraum(b, tracking?.status ?? "begonnen", e.target.value || null, tracking?.bis ?? null)
                    }
                  />
                </div>
                <div className="field">
                  <label>Voraussichtlich bis</label>
                  <input
                    type="date"
                    value={tracking?.bis ?? ""}
                    onChange={(e) =>
                      setTrackingZeitraum(b, tracking?.status ?? "begonnen", tracking?.von ?? null, e.target.value || null)
                    }
                  />
                </div>
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
