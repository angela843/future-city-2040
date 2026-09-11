import { useEffect, useState } from "react";
import { api, downloadDocx, fetchText } from "../../api/client.js";
import {
  AbschlussErgebnis,
  CaseRecord,
  EVIDENCE_STATUS_LABELS,
  JA_NEIN_LABELS,
  JA_NEIN_NICHT_RELEVANT_LABELS,
  JaNein,
  JaNeinNichtRelevant,
  LuvSection,
  QualityCheckResult,
  ReleaseCheckResult,
  Teilnehmerbesprechung,
  UEBERMITTLUNGSANLASS_LABELS,
  UEBERMITTLUNGSANLASS_VALUES,
  Uebermittlungsanlass,
  VORZEITIGE_BEENDIGUNG_ART_LABELS,
  VORZEITIGE_BEENDIGUNG_ART_VALUES,
  VorzeitigeBeendigungArt
} from "../../types.js";

type GenerateResult =
  | { kind: "ok"; text: string; evidenceIds: string[]; warnings: string[] }
  | { kind: "insufficient_data"; questions: string[] }
  | { kind: "conflict"; conflicts: string[] }
  | { kind: "blocked_privacy"; reason: string }
  | { kind: "blocked_pre_validation"; reason: string }
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
  const [qualityCheck, setQualityCheck] = useState<QualityCheckResult | null>(null);
  const [releaseCheck, setReleaseCheck] = useState<ReleaseCheckResult | null>(null);
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const [groundingOpenFor, setGroundingOpenFor] = useState<string | null>(null);
  const [tbForm, setTbForm] = useState<Teilnehmerbesprechung>(record.teilnehmerbesprechung);
  const [tbSaving, setTbSaving] = useState(false);
  const [abForm, setAbForm] = useState<AbschlussErgebnis>(record.abschlussErgebnis);
  const [abSaving, setAbSaving] = useState(false);
  const [abError, setAbError] = useState<string | null>(null);

  const visibleSections = record.sections.filter((s) => s.text.trim().length > 0 || true);

  async function loadChecks() {
    const [qc, rc] = await Promise.all([
      api.get<QualityCheckResult>(`/api/cases/${record.id}/quality-check`),
      api.get<ReleaseCheckResult>(`/api/cases/${record.id}/release-check`)
    ]);
    setQualityCheck(qc);
    setReleaseCheck(rc);
  }

  useEffect(() => {
    loadChecks().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, record.sections, record.supportGoals, record.supportAreaCandidates]);

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
      await loadChecks();
    } finally {
      setApproving(false);
    }
  }

  async function exportDocx() {
    await downloadDocx(record.id);
  }

  async function saveTeilnehmerbesprechung(next: Teilnehmerbesprechung) {
    setTbForm(next);
    setTbSaving(true);
    try {
      const updated = await api.put<CaseRecord>(`/api/cases/${record.id}/teilnehmerbesprechung`, next);
      onUpdated(updated);
    } finally {
      setTbSaving(false);
    }
  }

  async function saveAbschlussErgebnis(next: AbschlussErgebnis) {
    setAbForm(next);
    setAbSaving(true);
    setAbError(null);
    try {
      const res = await api.put<{ abschlussErgebnis: AbschlussErgebnis; sections: LuvSection[] }>(
        `/api/cases/${record.id}/abschluss-ergebnis`,
        next
      );
      onUpdated({ ...record, abschlussErgebnis: res.abschlussErgebnis, sections: res.sections });
    } catch (err) {
      setAbError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setAbSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Schritt 7 – LUV-Vorschau</h2>
      {!record.approvedForExport && <div className="draft-banner">ENTWURF – fachliche Prüfung erforderlich</div>}

      {qualityCheck && (
        <div className="section-block">
          <div className="row" style={{ justifyContent: "space-between", marginTop: 0 }}>
            <h3 style={{ margin: 0 }}>Qualitäts- und Vollständigkeitscheck</h3>
            <button type="button" onClick={() => setShowQualityDetails((v) => !v)}>
              {showQualityDetails ? "Ausblenden" : `Anzeigen (${qualityCheck.warningCount} Hinweis(e))`}
            </button>
          </div>
          <p className="muted" style={{ marginTop: 4 }}>
            Fehlende Angaben blockieren die Erstellung nicht. Nichts wird automatisch durch KI ergänzt.
          </p>
          {showQualityDetails && (
            <div className="quality-check">
              {qualityCheck.items.map((item) => (
                <div key={item.key} className={`item ${item.ok ? "ok" : "warn"}`}>
                  <span className="mark">{item.ok ? "✓" : "⚠"}</span>
                  <span>{item.hint ?? item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {visibleSections.map((section) => {
        const groundingOpen = groundingOpenFor === section.key;
        const sectionEvidence = record.evidence.filter((e) => section.evidenceIds.includes(e.id));
        return (
          <div key={section.key} className="section-block">
            <h3>
              <span>
                {section.title}
                {section.manualOverride && <span className="badge manual">manuell bearbeitet – geschützt</span>}
                {section.factCheck && (
                  <span className={`badge ${section.factCheck.status}`}>{EVIDENCE_STATUS_LABELS[section.factCheck.status]}</span>
                )}
              </span>
              <span className="button-row">
                <button type="button" onClick={() => generateSection(section.key)} disabled={busySection === section.key}>
                  {busySection === section.key ? "…" : "KI-Vorschlag"}
                </button>
                <button type="button" onClick={() => copySection(section.key)}>
                  Kopieren
                </button>
                {section.factCheck && (
                  <button type="button" onClick={() => setGroundingOpenFor(groundingOpen ? null : section.key)}>
                    {groundingOpen ? "Grundlage ausblenden" : "Grundlage anzeigen"}
                  </button>
                )}
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

            {groundingOpen && section.factCheck && (
              <div className="ai-box">
                <div>
                  Prüfmethode: {section.factCheck.method === "semantic" ? "semantische KI-Prüfung" : "technische Zusatzprüfung (Wortabgleich)"}
                </div>
                {section.factCheck.claims && section.factCheck.claims.length > 0 ? (
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {section.factCheck.claims.map((claim, idx) => (
                      <li key={idx}>
                        <span className={`badge ${claim.status}`}>{EVIDENCE_STATUS_LABELS[claim.status]}</span> „{claim.text}“
                        {claim.evidenceIds.length > 0 && (
                          <>
                            {" "}
                            (
                            {claim.evidenceIds.map((id) => (
                              <code key={id} className="idmono">
                                {id}
                              </code>
                            ))}
                            )
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">Keine aussagebasierte Aufschlüsselung verfügbar.</div>
                )}
                {sectionEvidence.length > 0 && (
                  <>
                    <div style={{ marginTop: 8 }}>Verwendete Belege:</div>
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                      {sectionEvidence.map((e) => (
                        <li key={e.id}>
                          <code className="idmono">{e.id}</code> – {e.note}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {section.warnings.length > 0 && <div className="notice warning">{section.warnings.join(" ")}</div>}

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
            {genResult[section.key]?.kind === "blocked_pre_validation" && (
              <div className="notice error">
                Vorvalidierung blockiert die Generierung: {(genResult[section.key] as { reason: string }).reason}
              </div>
            )}
          </div>
        );
      })}

      <div className="section-block">
        <h3>Teilnehmerbesprechung / Bekanntgabe</h3>
        <p className="muted">
          TODO: fachlich abgleichen – welche dieser Angaben ins offizielle Muster-LUV gehören und welche nur
          interne Prozessdokumentation sind.
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={tbForm.besprochen === true}
            onChange={(e) => saveTeilnehmerbesprechung({ ...tbForm, besprochen: e.target.checked })}
          />
          Mit dem/der Teilnehmenden besprochen
        </label>
        {tbForm.besprochen && (
          <div className="grid-2">
            <div className="field">
              <label>Datum der Besprechung</label>
              <input
                type="date"
                value={tbForm.datum ?? ""}
                onChange={(e) => saveTeilnehmerbesprechung({ ...tbForm, datum: e.target.value || null })}
              />
            </div>
            <div className="field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tbForm.mehrfertigungAusgehaendigt === true}
                  onChange={(e) => saveTeilnehmerbesprechung({ ...tbForm, mehrfertigungAusgehaendigt: e.target.checked })}
                />
                Mehrfertigung ausgehändigt
              </label>
            </div>
          </div>
        )}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={tbForm.besprechungNichtMoeglich}
            onChange={(e) => saveTeilnehmerbesprechung({ ...tbForm, besprechungNichtMoeglich: e.target.checked })}
          />
          Besprechung nicht möglich
        </label>
        {tbForm.besprechungNichtMoeglich && (
          <div className="field">
            <label>Kurzer Hinweis/Grund</label>
            <input
              value={tbForm.hinweisGrund}
              onChange={(e) => setTbForm({ ...tbForm, hinweisGrund: e.target.value })}
              onBlur={(e) => saveTeilnehmerbesprechung({ ...tbForm, hinweisGrund: e.target.value })}
            />
          </div>
        )}
        {tbSaving && <p className="muted">Speichere…</p>}
      </div>

      {record.baseData.luvArt === "abschluss" && (
        <div className="section-block">
          <h3>Abschluss-Modul (offizieller BA-Abschluss-LuV 10/2025)</h3>
          <p className="muted">
            Vorname, Nachname, Kundennummer, Träger/Einrichtung, Ansprechperson, Telefon und E-Mail sind direkte
            Identifikatoren und verbleiben ausschließlich lokal - sie werden niemals an Claude übermittelt.
          </p>

          <div className="grid-2">
            <div className="field">
              <label>Abschluss-LuV vom</label>
              <input
                type="date"
                value={abForm.abschlussLuvVom ?? ""}
                onChange={(e) => saveAbschlussErgebnis({ ...abForm, abschlussLuvVom: e.target.value || null })}
              />
            </div>
            <div className="field">
              <label>Übermittlungsanlass</label>
              <select
                value={abForm.uebermittlungsanlass ?? ""}
                onChange={(e) =>
                  saveAbschlussErgebnis({ ...abForm, uebermittlungsanlass: (e.target.value || null) as Uebermittlungsanlass | null })
                }
              >
                <option value="">(nicht gesetzt)</option>
                {UEBERMITTLUNGSANLASS_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {UEBERMITTLUNGSANLASS_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {abForm.uebermittlungsanlass === "vorzeitige_beendigung" && (
            <div className="field">
              <label>Art der vorzeitigen Beendigung</label>
              <select
                value={abForm.vorzeitigeBeendigungArt ?? ""}
                onChange={(e) =>
                  saveAbschlussErgebnis({ ...abForm, vorzeitigeBeendigungArt: (e.target.value || null) as VorzeitigeBeendigungArt | null })
                }
              >
                <option value="">(nicht gesetzt)</option>
                {VORZEITIGE_BEENDIGUNG_ART_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {VORZEITIGE_BEENDIGUNG_ART_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid-2">
            <div className="field">
              <label>Vorname (nur lokal)</label>
              <input value={abForm.vorname} onChange={(e) => setAbForm({ ...abForm, vorname: e.target.value })} onBlur={() => saveAbschlussErgebnis(abForm)} />
            </div>
            <div className="field">
              <label>Nachname (nur lokal)</label>
              <input value={abForm.nachname} onChange={(e) => setAbForm({ ...abForm, nachname: e.target.value })} onBlur={() => saveAbschlussErgebnis(abForm)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Kundennummer (nur lokal)</label>
              <input value={abForm.kundennummer} onChange={(e) => setAbForm({ ...abForm, kundennummer: e.target.value })} onBlur={() => saveAbschlussErgebnis(abForm)} />
            </div>
            <div className="field">
              <label>Träger/Einrichtung (nur lokal)</label>
              <input value={abForm.traegerEinrichtung} onChange={(e) => setAbForm({ ...abForm, traegerEinrichtung: e.target.value })} onBlur={() => saveAbschlussErgebnis(abForm)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Ansprechperson – Vorname (nur lokal)</label>
              <input
                value={abForm.ansprechpersonVorname}
                onChange={(e) => setAbForm({ ...abForm, ansprechpersonVorname: e.target.value })}
                onBlur={() => saveAbschlussErgebnis(abForm)}
              />
            </div>
            <div className="field">
              <label>Ansprechperson – Nachname (nur lokal)</label>
              <input
                value={abForm.ansprechpersonNachname}
                onChange={(e) => setAbForm({ ...abForm, ansprechpersonNachname: e.target.value })}
                onBlur={() => saveAbschlussErgebnis(abForm)}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Telefon (nur lokal)</label>
              <input value={abForm.telefon} onChange={(e) => setAbForm({ ...abForm, telefon: e.target.value })} onBlur={() => saveAbschlussErgebnis(abForm)} />
            </div>
            <div className="field">
              <label>E-Mail (nur lokal)</label>
              <input value={abForm.email} onChange={(e) => setAbForm({ ...abForm, email: e.target.value })} onBlur={() => saveAbschlussErgebnis(abForm)} />
            </div>
          </div>

          {record.baseData.massnahmeart === "bvb3" && (
            <div className="field">
              <label>Lernort Wohnen/Internat (BvB-3-Sonderfeld)</label>
              <select
                value={abForm.lernortWohnenInternat ?? ""}
                onChange={(e) => saveAbschlussErgebnis({ ...abForm, lernortWohnenInternat: (e.target.value || null) as JaNein | null })}
              >
                <option value="">(nicht gesetzt)</option>
                <option value="ja">{JA_NEIN_LABELS.ja}</option>
                <option value="nein">{JA_NEIN_LABELS.nein}</option>
              </select>
            </div>
          )}

          <div className="field">
            <label>Hauptschulabschluss erreicht</label>
            <select
              value={abForm.hauptschulabschlussErreicht ?? ""}
              onChange={(e) =>
                saveAbschlussErgebnis({ ...abForm, hauptschulabschlussErreicht: (e.target.value || null) as JaNeinNichtRelevant | null })
              }
            >
              <option value="">(nicht gesetzt)</option>
              {(["ja", "nein", "nicht_relevant"] as JaNeinNichtRelevant[]).map((v) => (
                <option key={v} value={v}>
                  {JA_NEIN_NICHT_RELEVANT_LABELS[v]}
                </option>
              ))}
            </select>
          </div>

          <div className="notice info">
            Ausbildungsreife, Berufseignung und Unterstützungsbedarf erfordern HUMAN_CONFIRMED: Claude darf diese
            Entscheidungen nie selbst ableiten - erst die aktive Bestätigung hier hebt die Freigabeblockade auf.
          </div>

          <div className="field">
            <label>Allgemeine Ausbildungsreife erreicht</label>
            <div className="button-row">
              <select
                value={abForm.ausbildungsreifeErreicht.value ?? ""}
                onChange={(e) =>
                  setAbForm({
                    ...abForm,
                    ausbildungsreifeErreicht: { value: (e.target.value || null) as JaNein | null, humanConfirmed: false }
                  })
                }
              >
                <option value="">(nicht gesetzt)</option>
                <option value="ja">{JA_NEIN_LABELS.ja}</option>
                <option value="nein">{JA_NEIN_LABELS.nein}</option>
              </select>
              <button
                type="button"
                disabled={!abForm.ausbildungsreifeErreicht.value || abForm.ausbildungsreifeErreicht.humanConfirmed}
                onClick={() =>
                  saveAbschlussErgebnis({ ...abForm, ausbildungsreifeErreicht: { ...abForm.ausbildungsreifeErreicht, humanConfirmed: true } })
                }
              >
                {abForm.ausbildungsreifeErreicht.humanConfirmed ? "✓ Bestätigt (HUMAN_CONFIRMED)" : "Aktiv bestätigen"}
              </button>
            </div>
          </div>

          <div className="field">
            <label>Berufseignung (Berufe/Qualifikationsniveau)</label>
            <div className="button-row" style={{ alignItems: "flex-start" }}>
              <textarea
                value={abForm.berufseignung.value}
                onChange={(e) => setAbForm({ ...abForm, berufseignung: { value: e.target.value, humanConfirmed: false } })}
              />
              <button
                type="button"
                disabled={!abForm.berufseignung.value.trim() || abForm.berufseignung.humanConfirmed}
                onClick={() => saveAbschlussErgebnis({ ...abForm, berufseignung: { ...abForm.berufseignung, humanConfirmed: true } })}
              >
                {abForm.berufseignung.humanConfirmed ? "✓ Bestätigt (HUMAN_CONFIRMED)" : "Aktiv bestätigen"}
              </button>
            </div>
          </div>

          <div className="field">
            <label>Qualifizierungs-/Ausbildungsbausteine (optional)</label>
            <textarea
              value={abForm.qualifizierungsAusbildungsbausteine}
              onChange={(e) => setAbForm({ ...abForm, qualifizierungsAusbildungsbausteine: e.target.value })}
              onBlur={() => saveAbschlussErgebnis(abForm)}
            />
          </div>
          <div className="field">
            <label>Vermittlungsfähigkeit</label>
            <textarea
              value={abForm.vermittlungsfaehigkeit}
              onChange={(e) => setAbForm({ ...abForm, vermittlungsfaehigkeit: e.target.value })}
              onBlur={() => saveAbschlussErgebnis(abForm)}
            />
          </div>
          <div className="field">
            <label>Eingliederungsergebnis (inkl. Begründung, falls keine Eingliederung)</label>
            <textarea
              value={abForm.eingliederungsergebnis}
              onChange={(e) => setAbForm({ ...abForm, eingliederungsergebnis: e.target.value })}
              onBlur={() => saveAbschlussErgebnis(abForm)}
            />
          </div>

          <div className="field">
            <label>Unterstützungsbedarf</label>
            <div className="button-row">
              <select
                value={abForm.unterstuetzungsbedarf.value ?? ""}
                onChange={(e) =>
                  setAbForm({
                    ...abForm,
                    unterstuetzungsbedarf: { value: (e.target.value || null) as JaNein | null, humanConfirmed: false }
                  })
                }
              >
                <option value="">(nicht gesetzt)</option>
                <option value="ja">{JA_NEIN_LABELS.ja}</option>
                <option value="nein">{JA_NEIN_LABELS.nein}</option>
              </select>
              <button
                type="button"
                disabled={!abForm.unterstuetzungsbedarf.value || abForm.unterstuetzungsbedarf.humanConfirmed}
                onClick={() =>
                  saveAbschlussErgebnis({ ...abForm, unterstuetzungsbedarf: { ...abForm.unterstuetzungsbedarf, humanConfirmed: true } })
                }
              >
                {abForm.unterstuetzungsbedarf.humanConfirmed ? "✓ Bestätigt (HUMAN_CONFIRMED)" : "Aktiv bestätigen"}
              </button>
            </div>
          </div>

          {abForm.unterstuetzungsbedarf.value === "ja" && (
            <div className="field">
              <label>Beschreibung Unterstützungsbedarf und Empfehlung</label>
              <textarea
                value={abForm.unterstuetzungsbedarfBeschreibungEmpfehlung}
                onChange={(e) => setAbForm({ ...abForm, unterstuetzungsbedarfBeschreibungEmpfehlung: e.target.value })}
                onBlur={() => saveAbschlussErgebnis(abForm)}
              />
            </div>
          )}

          <div className="field">
            <label>Absprachen zur Stabilisierung/Festigung (Kontaktformat, Häufigkeit)</label>
            <textarea
              value={abForm.stabilisierungFestigung}
              onChange={(e) => setAbForm({ ...abForm, stabilisierungFestigung: e.target.value })}
              onBlur={() => saveAbschlussErgebnis(abForm)}
            />
          </div>

          {abError && <div className="notice error">{abError}</div>}
          {abSaving && <p className="muted">Speichere…</p>}
        </div>
      )}

      <div className="section-block">
        <h3>Freigabecheck</h3>
        {releaseCheck && releaseCheck.blocked ? (
          <div className="notice error">
            Freigabe aktuell blockiert: {releaseCheck.blockingSections.length} Abschnitt(e) sind noch nicht
            ausreichend belegt und wurden noch nicht manuell geprüft.
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {releaseCheck.blockingSections.map((s) => (
                <li key={s.key}>
                  {s.title}: {s.reason}
                </li>
              ))}
            </ul>
            Bearbeiten Sie den Abschnitt manuell (dies hebt die rote Kennzeichnung auf) oder lassen Sie ihn erneut
            prüfen.
          </div>
        ) : (
          releaseCheck && (
            <div className="notice info">
              Keine offenen roten Abschnitte. {releaseCheck.unresolvedSupportAreas > 0 && `${releaseCheck.unresolvedSupportAreas} Förderbereich(e) noch nicht geprüft. `}
              {releaseCheck.unresolvedSupportGoals > 0 && `${releaseCheck.unresolvedSupportGoals} Förderzielvorschlag/-vorschläge noch nicht bearbeitet. `}
            </div>
          )
        )}
        {releaseCheck && releaseCheck.openQualityWarnings > 0 && (
          <div className="notice warning">
            {releaseCheck.openQualityWarnings} weitere Hinweis(e) aus dem Qualitätscheck offen (Maßnahmeart,
            Teilnehmerbesprechung, Förderzielbereiche u.a. – siehe Qualitäts- und Vollständigkeitscheck oben). Diese
            blockieren die Freigabe nicht (Warnung statt Zwang).
          </div>
        )}
      </div>

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
            disabled={!checkboxChecked || record.approvedForExport || approving || !!releaseCheck?.blocked}
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
