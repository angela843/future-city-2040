import { useState } from "react";
import { api, downloadDocx, fetchText } from "../../api/client.js";
import { CaseRecord, LuvSection } from "../../types.js";

type GenerateResult =
  | { kind: "ok"; text: string; evidenceIds: string[]; warnings: string[] }
  | { kind: "insufficient_data"; questions: string[] }
  | { kind: "conflict"; conflicts: string[] }
  | { kind: "blocked_privacy"; reason: string }
  | { kind: "invalid_schema"; message: string }
  | { kind: "unavailable"; message: string };

interface RedundancyWarning {
  sectionKeyA: string;
  sectionKeyB: string;
  sentenceA: string;
  sentenceB: string;
}

const CONFIRMATION_TEXT = "Ich habe den Inhalt fachlich geprüft.";

export function Step7Preview({
  record,
  onUpdated,
  onBack
}: {
  record: CaseRecord;
  onUpdated: (r: CaseRecord) => void;
  onBack: () => void;
}) {
  const [busySection, setBusySection] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<Record<string, GenerateResult>>({});
  const [redundancy, setRedundancy] = useState<{ withinLuv: RedundancyWarning[] } | null>(null);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [redacting, setRedacting] = useState(false);

  const visibleSections = record.sections.filter((s) => s.text.trim().length > 0 || true);

  async function refresh() {
    const updated = await api.get<CaseRecord>(`/api/cases/${record.id}`);
    onUpdated(updated);
  }

  async function generateSection(key: string) {
    setBusySection(key);
    setGenResult((r) => ({ ...r, [key]: undefined as never }));
    try {
      const result = await api.post<GenerateResult>(`/api/cases/${record.id}/ai/sections/${key}/generate`, {});
      setGenResult((r) => ({ ...r, [key]: result }));
      await refresh();
    } finally {
      setBusySection(null);
    }
  }

  async function saveManualEdit(key: string, text: string) {
    const updated = await api.put<LuvSection[]>(`/api/cases/${record.id}/sections/${key}`, { text });
    onUpdated({ ...record, sections: updated });
  }

  async function runRedundancyCheck() {
    const result = await api.get<{ withinLuv: RedundancyWarning[] }>(`/api/cases/${record.id}/redundancy-check`);
    setRedundancy(result);
  }

  async function runOverallRedaction() {
    setRedacting(true);
    try {
      await api.post(`/api/cases/${record.id}/ai/overall-redaction`, {});
      await refresh();
    } finally {
      setRedacting(false);
    }
  }

  async function copySection(key: string) {
    const text = await fetchText(`/api/cases/${record.id}/copy/section/${key}`);
    await navigator.clipboard.writeText(text);
  }

  async function copyFull() {
    const text = await fetchText(`/api/cases/${record.id}/copy/full`);
    await navigator.clipboard.writeText(text);
  }

  async function approve() {
    setApproving(true);
    setApproveError(null);
    try {
      const res = await api.post<{ approvedForExport: boolean; approvalTimestamp: string }>(
        `/api/cases/${record.id}/approve`,
        { confirmationText: CONFIRMATION_TEXT }
      );
      onUpdated({ ...record, approvedForExport: res.approvedForExport, approvalTimestamp: res.approvalTimestamp });
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Freigabe fehlgeschlagen.");
    } finally {
      setApproving(false);
    }
  }

  async function exportDocx() {
    await downloadDocx(record.id);
  }

  return (
    <div className="card">
      <h2>Schritt 7 – LUV-Vorschau</h2>
      {!record.approvedForExport && <div className="draft-banner">ENTWURF – fachliche Prüfung erforderlich</div>}

      <div className="button-row">
        <button type="button" onClick={runRedundancyCheck}>
          Redundanzprüfung
        </button>
        <button type="button" onClick={runOverallRedaction} disabled={redacting}>
          {redacting ? "Überarbeite…" : "KI: Gesamtredaktion (sprachlich, keine neuen Inhalte)"}
        </button>
        <button type="button" onClick={copyFull}>
          Gesamten LUV kopieren
        </button>
      </div>

      {redundancy && redundancy.withinLuv.length > 0 && (
        <div className="notice warning">
          {redundancy.withinLuv.length} mögliche Redundanz(en) zwischen Abschnitten gefunden. Bitte prüfen und ggf.
          verdichten.
        </div>
      )}

      {visibleSections.map((section) => (
        <div key={section.key} className="section-block">
          <h3>
            <span>
              {section.title}
              {section.manualOverride && <span className="badge manual">manuell bearbeitet – geschützt</span>}
              {section.factCheck && (
                <span className={`badge ${section.factCheck.status}`}>
                  {section.factCheck.status === "covered"
                    ? "Belege gedeckt"
                    : section.factCheck.status === "partially_covered"
                    ? "teilweise gedeckt"
                    : "nicht ausreichend belegt"}
                </span>
              )}
            </span>
            <span className="button-row">
              <button type="button" onClick={() => generateSection(section.key)} disabled={busySection === section.key}>
                {busySection === section.key ? "…" : "KI-Vorschlag"}
              </button>
              <button type="button" onClick={() => copySection(section.key)}>
                Kopieren
              </button>
            </span>
          </h3>

          <textarea
            value={section.text}
            rows={5}
            onChange={(e) => {
              const text = e.target.value;
              onUpdated({
                ...record,
                sections: record.sections.map((s) => (s.key === section.key ? { ...s, text } : s))
              });
            }}
            onBlur={(e) => saveManualEdit(section.key, e.target.value)}
          />

          {section.warnings.length > 0 && (
            <div className="notice warning">{section.warnings.join(" ")}</div>
          )}

          {genResult[section.key]?.kind === "insufficient_data" && (
            <div className="notice warning">
              Angaben reichen nicht aus. {(genResult[section.key] as { questions: string[] }).questions.join(" ")}
            </div>
          )}
          {genResult[section.key]?.kind === "conflict" && (
            <div className="notice error">
              Widersprüchliche Angaben: {(genResult[section.key] as { conflicts: string[] }).conflicts.join(" ")}
            </div>
          )}
          {genResult[section.key]?.kind === "blocked_privacy" && (
            <div className="notice error">
              Datenschutzprüfung erforderlich: {(genResult[section.key] as { reason: string }).reason}
            </div>
          )}
        </div>
      ))}

      <div className="section-block">
        <h3>Freigabe</h3>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={checkboxChecked || record.approvedForExport}
            disabled={record.approvedForExport}
            onChange={(e) => setCheckboxChecked(e.target.checked)}
          />
          <span>{CONFIRMATION_TEXT}</span>
        </label>
        {approveError && <div className="notice error">{approveError}</div>}
        <div className="button-row">
          <button
            type="button"
            className="primary"
            disabled={!checkboxChecked || record.approvedForExport || approving}
            onClick={approve}
          >
            {record.approvedForExport ? "Bereits freigegeben" : approving ? "Wird freigegeben…" : "Fachlich freigeben"}
          </button>
          <button type="button" onClick={exportDocx} disabled={!record.approvedForExport}>
            Als DOCX exportieren
          </button>
        </div>
        {!record.approvedForExport && (
          <p className="muted">Export ist erst nach aktiver fachlicher Freigabe möglich.</p>
        )}
      </div>

      <div className="button-row">
        <button type="button" onClick={onBack}>
          Zurück
        </button>
      </div>
    </div>
  );
}
