import { useState } from "react";
import { api } from "../api/client.js";
import { CaseRecord, COMPARISON_STATUS_LABELS, CompetenceRating, RATING_LABELS } from "../types.js";

const RATINGS = Object.keys(RATING_LABELS) as CompetenceRating[];

export function ComparisonPanel({ record, onUpdated }: { record: CaseRecord; onUpdated: (r: CaseRecord) => void }) {
  const [rawText, setRawText] = useState(record.previousLuv?.rawText ?? "");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      await api.post(`/api/cases/${record.id}/previous-luv`, { rawText });
      const updated = await api.get<CaseRecord>(`/api/cases/${record.id}`);
      onUpdated(updated);
    } finally {
      setLoading(false);
    }
  }

  async function link(claimId: string, subCompetenceId: string | null, previousRating: CompetenceRating | null) {
    await api.put(`/api/cases/${record.id}/comparison-claims/${claimId}/link`, { subCompetenceId, previousRating });
    const updated = await api.get<CaseRecord>(`/api/cases/${record.id}`);
    onUpdated(updated);
  }

  async function confirm(claimId: string, confirmed: boolean) {
    await api.put(`/api/cases/${record.id}/comparison-claims/${claimId}/confirm`, { confirmed });
    const updated = await api.get<CaseRecord>(`/api/cases/${record.id}`);
    onUpdated(updated);
  }

  return (
    <div className="section-block">
      <h3>Vorheriger LUV-Text & Entwicklungsvergleich</h3>
      <p className="muted">
        Ein vorheriger LUV-Text ist keine unanfechtbare Wahrheit. Ordnen Sie die extrahierten Sätze bestätigten
        aktuellen Unterkompetenzen zu und bestätigen Sie den Vergleich aktiv - erst dann fließt eine Entwicklung in
        den LUV ein.
      </p>
      <div className="field">
        <label>Vorheriger LUV-Text einfügen (kein Datei-Upload in Version 0.1)</label>
        <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={5} />
      </div>
      <div className="button-row">
        <button type="button" onClick={analyze} disabled={loading}>
          {loading ? "Analysiere…" : "Alttext analysieren"}
        </button>
      </div>

      {record.comparisonClaims.length > 0 && (
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: "0.8rem", color: "var(--color-muted)" }}>
              <th>Frühere Aussage</th>
              <th>Zuordnung (aktuelle Unterkompetenz)</th>
              <th>Frühere Bewertung</th>
              <th>Status</th>
              <th>Bestätigung</th>
            </tr>
          </thead>
          <tbody>
            {record.comparisonClaims.map((claim) => (
              <tr key={claim.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                <td style={{ maxWidth: 220, fontSize: "0.85rem" }}>{claim.previousText}</td>
                <td>
                  <select
                    value={claim.subCompetenceId ?? ""}
                    onChange={(e) => link(claim.id, e.target.value || null, claim.previousRating)}
                  >
                    <option value="">(bitte wählen)</option>
                    {record.subCompetences.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={claim.previousRating ?? ""}
                    onChange={(e) => link(claim.id, claim.subCompetenceId, (e.target.value || null) as CompetenceRating | null)}
                  >
                    <option value="">(unbekannt)</option>
                    {RATINGS.map((r) => (
                      <option key={r} value={r}>
                        {RATING_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ fontSize: "0.85rem" }}>{COMPARISON_STATUS_LABELS[claim.suggestedStatus]}</td>
                <td>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}>
                    <input
                      type="checkbox"
                      checked={claim.confirmed}
                      onChange={(e) => confirm(claim.id, e.target.checked)}
                    />
                    bestätigt
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
