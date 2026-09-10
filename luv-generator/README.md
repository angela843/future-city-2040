# LUV-Generator BvB / BvB Reha – Version 0.2

> **TESTSYSTEM – Keine echten personenbezogenen Daten eingeben.**
> Dieses System verwendet ausschließlich fiktive Testdaten. Es ist kein
> Produktivsystem, keine Teilnehmerverwaltung und keine digitale Teilnehmerakte.

Ein browserbasiertes Unterstützungswerkzeug für Koordinatorinnen und
Koordinatoren zur Erstellung von **Start-LUV**, **Verlaufs-LUV** und
**Abschluss-LUV** (Lern- und Entwicklungsdokumentation) in berufsvorbereitenden
Bildungsmaßnahmen (BvB / BvB Reha).

---

## Inhaltsverzeichnis

1. [Architektur](#architektur)
2. [Voraussetzungen](#voraussetzungen)
3. [Installation](#installation)
4. [Umgebungsvariablen](#umgebungsvariablen)
5. [Start (Backend & Frontend)](#start-backend--frontend)
6. [Claude-Konfiguration](#claude-konfiguration)
7. [Testmodus (ohne API-Key)](#testmodus-ohne-api-key)
8. [DOCX-Template](#docx-template)
9. [Tests ausführen](#tests-ausführen)
10. [Projektstruktur](#projektstruktur)
11. [Implementierte Sicherheits-/Datenschutzregeln](#implementierte-sicherheits--datenschutzregeln)
12. [Version 0.1 → 0.2 – Änderungsübersicht](#version-01--02--änderungsübersicht)
13. [Bekannte offene Punkte](#bekannte-offene-punkte)
14. [Vorschläge für Version 0.3](#vorschläge-für-version-03)

---

## Architektur

```
Browser UI (React)
   ↓
Backend (Express/TypeScript)
   ↓
Domain-/Regellogik (deterministisch)
   ↓
Privacy Gateway (Allowlist, Identifikator-Entfernung, Sensitive-Content-Scan)
   ↓
Prompt Builder (versionierte Prompt-Templates)
   ↓
Claude API
   ↓
Validation Layer (Schema-, Evidenz-, Faktenabdeckungsprüfung)
   ↓
LUV Composer (deterministische Abschnittsauswahl/-reihenfolge)
   ↓
Review durch Koordination (manueller Schutz, Freigabe)
   ↓
Export Service (DOCX, Klartext-Kopie)
```

Keine kritische Fach-, Datenschutz- oder Freigaberegel liegt ausschließlich im
KI-Prompt – alle in der Spezifikation geforderten Regeln (Förderlogik,
Vergleichslogik, Privacy Gateway, Freigabe, Evidenzprüfung) sind in
TypeScript-Code implementiert und werden serverseitig durchgesetzt.

## Voraussetzungen

- Node.js ≥ 20 (empfohlen: aktuelle LTS-Version)
- npm ≥ 10
- Optional: ein Anthropic-API-Key für echte Claude-Aufrufe (sonst Testmodus, siehe unten)

## Installation

```bash
# Repository-Wurzel
cd luv-generator

# Backend
cd backend
npm install
cp .env.example .env
# .env ggf. anpassen (siehe unten)

# Frontend (neues Terminal)
cd ../frontend
npm install
cp .env.example .env
```

## Umgebungsvariablen

### Backend (`backend/.env`)

| Variable | Beschreibung | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude-API-Schlüssel (**nur serverseitig**) | – |
| `ANTHROPIC_MODEL` | Claude-Modell-ID | `claude-sonnet-5` |
| `PORT` | Backend-Port | `4000` |
| `LUV_TEST_MODE` | `true` = deterministischer Mock statt echtem Claude-Aufruf | `false` |
| `FRONTEND_ORIGIN` | Erlaubte CORS-Origin | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Beschreibung | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Basis-URL des Backends | `http://localhost:4000` |

## Start (Backend & Frontend)

**Backend** (Terminal 1):

```bash
cd luv-generator/backend
npm run dev
```

Startet den Server per `tsx watch` auf `http://localhost:4000`.

**Frontend** (Terminal 2):

```bash
cd luv-generator/frontend
npm run dev
```

Startet Vite auf `http://localhost:5173`. Browser öffnen und den geführten
Wizard durchlaufen (oder einen der drei fiktiven Demo-Fälle laden).

## Claude-Konfiguration

1. Einen Anthropic-API-Key besorgen und in `backend/.env` als
   `ANTHROPIC_API_KEY` eintragen.
2. `LUV_TEST_MODE=false` setzen (oder die Zeile entfernen).
3. Optional `ANTHROPIC_MODEL` anpassen.

Der API-Key wird **ausschließlich serverseitig** verwendet
(`backend/src/ai/claudeClient.ts`). Das Frontend hat keinerlei Zugriff auf
Claude und kann Claude auch nicht direkt aus dem Browser aufrufen.

## Testmodus (ohne API-Key)

Für Entwicklung, Demo und automatisierte Tests kann `LUV_TEST_MODE=true`
gesetzt werden. In diesem Modus antwortet ein deterministischer Mock
(`backend/src/ai/testModeMock.ts`) anstelle des echten Claude-Aufrufs – inkl.
Nachbildung der Kernregeln (unzureichende Angaben, pauschale Wertungen,
Selbsteinschätzungen). So lässt sich das komplette System ohne API-Key
demonstrieren und testen. Die automatisierten Tests laufen immer im
Testmodus (`backend/src/__tests__/setup.ts`).

## DOCX-Template

Der DOCX-Export (`backend/src/export/docxExport.ts`) rendert serverseitig
über die Bibliothek [`docx`](https://www.npmjs.com/package/docx) auf Basis
des neutralen internen Datenmodells (`backend/src/domain/types.ts`,
Abschnitt „Template-Abstraktion“). Es gibt keine feste `.docx`-Vorlagendatei
zum Befüllen – der Renderer erzeugt das Dokument programmatisch aus Titel,
LUV-Art, Teilnehmername, Maßnahme, Beurteilungszeitraum, Erstellungsdatum und
den fachlichen Abschnitten. Beim Export findet **keine neue
Claude-Generierung** statt; exportiert wird exakt der zuvor fachlich
bestätigte Vorschau-Text.

## Tests ausführen

```bash
cd luv-generator/backend
npm test
```

Führt die Vitest-Suite aus (`backend/src/__tests__/`). Enthalten sind u. a.
alle zehn in der Spezifikation geforderten Testfälle (Abschnitt 38):

| Test | Datei | Inhalt |
|---|---|---|
| 1 | `aiMock.test.ts` | „Mathe schlecht.“ → `insufficient_data` |
| 2 | `aiMock.test.ts` | „Ist faul.“ → Konkretisierung statt Motivationsdiagnose |
| 3 | `aiMock.test.ts` | Nur Selbsteinschätzung → als solche gekennzeichnet |
| 4 | `privacyGateway.test.ts` | Diagnose im Freitext → Übertragung blockiert |
| 5 | `privacyGateway.test.ts` | Name/Geburtsdatum fehlen im Claude-Payload |
| 6 | `comparisonLogic.test.ts` | „nicht erhoben“ → Wert: keine Verbesserungsbehauptung |
| 7 | `comparisonLogic.test.ts` | Förderbedarf → teilweise sicher: mögliche positive Entwicklung |
| 8 | `apiFlows.test.ts` | Förderziel ohne bestätigten Förderbedarf: blockiert |
| 9 | `apiFlows.test.ts` | Manuell bearbeiteter Abschnitt bleibt nach Gesamtoptimierung unverändert |
| 10 | `apiFlows.test.ts` | Vorschautext → DOCX-Export: Text identisch, Export ohne Freigabe blockiert |

Zusätzlich: `domainRules.test.ts` für Förderlogik, Evidence-ID-Vergabe und
Evidenzprüfung.

Seit Version 0.2 zusätzlich `v02.test.ts` mit den in PH-15 (Abschnitt 59)
geforderten Testfällen:

| Test | Inhalt |
|---|---|
| V02-T01 | Unterkompetenz aus Kompetenzkatalog auswählen – kein manuelles Neueintippen nötig |
| V02-T02 | Eigene Unterkompetenz hinzufügen funktioniert weiterhin (ohne Katalogeintrag) |
| V02-T03 | „Mara ist faul.“ → Konkretisierungsassistent (Rückfragen statt Umformulierung) |
| V02-T04 | Aussage geht über die Beleglage hinaus → nicht/teilweise gedeckt |
| V02-T05 | KI-Satz mit erfundener Evidence-ID wird technisch blockiert |
| V02-T06 | Fehlende methodische Kompetenz → Qualitätswarnung, keine automatische Bewertung |
| V02-T07 | Keine Stärke vorhanden → Hinweis, keine erfundene Ressource |
| V02-T08 | Acht bestätigte Förderziele → Priorisierungswarnung |
| V02-T09 | Maßnahme aus Bibliothek nur als Vorschlagssprache, nie als bereits durchgeführt |
| V02-T10 | Rote unbelegte Aussage blockiert die Freigabe; manuelle Bearbeitung hebt die Blockade auf |

Alle 19 Testfälle aus Version 0.1 bleiben unverändert Teil der Suite
(Regressionsschutz) – insgesamt 29 Tests, alle grün.

Frontend-Build/Typecheck:

```bash
cd luv-generator/frontend
npm run build
```

## Projektstruktur

```
luv-generator/
├── README.md
├── backend/
│   ├── src/
│   │   ├── domain/            # Neutrales Datenmodell, deterministische Fachlogik, Kompetenzkatalog,
│   │   │                      # Maßnahmenbibliothek, Konkretisierungsassistent, Qualitäts-/Freigabecheck
│   │   ├── privacy/           # Privacy Gateway (Allowlist, Identifikatoren, Sensitive-Scan)
│   │   ├── ai/                # Prompt Builder, Prompt-Templates (versioniert, u. a. fact_check v2, measures v2), Claude-Client, Testmodus-Mock
│   │   ├── validation/        # Schema-, Evidenz-, Faktenabdeckungsprüfung (heuristisch + semantisch), Request-Validierung
│   │   ├── luv_composer/      # Abschnittsauswahl/-reihenfolge, Redundanzprüfung, Gesamtredaktion, manueller Schutz
│   │   ├── export/            # DOCX-Export, Kopiertext
│   │   ├── demo/              # 5 fiktive Demo-Fälle A-E (Start ×3, Verlauf, Abschluss)
│   │   ├── web/                # Express-App, Routen (inkl. Katalog-/Qualitäts-/Freigabecheck-Routen), Session-Speicher, Logging
│   │   └── __tests__/         # Vitest-Suite (Testfälle 1-10 + V02-T01..T10)
│   ├── package.json / tsconfig.json / vitest.config.ts / .env.example
└── frontend/
    ├── src/
    │   ├── components/steps/  # 7-Schritt-Wizard (Grunddaten … Vorschau)
    │   ├── components/        # TestBanner, StepNav, ComparisonPanel (Verlaufs-/Abschluss-LUV)
    │   ├── api/                # Backend-API-Client
    │   ├── types.ts            # Frontend-seitiges Domänenmodell
    │   └── App.tsx / main.tsx
    └── package.json / tsconfig.json / vite.config.ts / .env.example
```

## Implementierte Sicherheits-/Datenschutzregeln

- **Privacy Gateway vor jedem Claude-Aufruf** (`backend/src/privacy/gateway.ts`):
  Allowlist erlaubter Felder je KI-Aufgabe, rekursive Entfernung direkter
  Identifikatoren (Name, Geburtsdatum, Adresse, Telefon, E-Mail,
  Teilnehmernummer, …) auf allen Verschachtelungsebenen, Pseudonymisierung als
  `CASE_<ID>` statt Klarname.
- **Sensitive-Content-Scan** (`backend/src/privacy/sensitiveDetection.ts`):
  konservative Keyword-Erkennung für Diagnosen/Gesundheitsdaten; im
  Zweifel wird die Übertragung blockiert („Datenschutzprüfung erforderlich“),
  nicht durchgelassen.
- **Minimal Context**: jede KI-Aufgabe erhält nur die für sie nötigen Felder
  (`backend/src/ai/payloadBuilders.ts`), nie den gesamten Fall.
- **API-Key ausschließlich serverseitig**, kein direkter Browser-zu-Claude-Aufruf.
- **Strukturiertes Antwortschema** (`ok` / `insufficient_data` / `conflict`)
  wird serverseitig per Zod validiert (`backend/src/validation/schema.ts`);
  ungültige Antworten werden verworfen („Antwort konnte nicht sicher
  verarbeitet werden.“), keine unsicheren Teiltexte übernommen.
- **Faktenvalidierung**: Existenzprüfung referenzierter Evidence-IDs
  (`evidenceValidation.ts`) sowie ein Faktenabdeckungscheck mit vier Status
  (`covered` / `partially_covered` / `unsupported` / `needs_review`).
  Seit Version 0.2 primär als **semantische, aussagebasierte Prüfung**
  (`validation/semanticFactCheck.ts`, PH-15 §12-17): der Text wird in
  einzelne Claims zerlegt und jede Aussage einzeln gegen die Belege geprüft;
  erfundene Evidence-IDs werden unabhängig vom Claude-Ergebnis technisch
  entfernt. Die alte Wortüberlappungs-Heuristik dient nur noch als Fallback,
  falls die KI nicht verfügbar ist.
- **Freigabecheck mit technischer Durchsetzung** (`domain/releaseCheck.ts`,
  Version 0.2, PH-15 §43): Abschnitte mit Status `unsupported`/`needs_review`,
  die noch nicht manuell bearbeitet wurden, blockieren `POST /approve`
  serverseitig (409), nicht nur als UI-Warnung. Eine manuelle Bearbeitung
  gilt als aktive fachliche Prüfung und hebt die Blockade auf.
- **Konkretisierungsassistent** (`domain/clarificationAssistant.ts`, Version
  0.2, PH-15 §23-26): erkennt pauschale/wertende Begriffe rein deterministisch
  im Code (nicht nur reaktiv im KI-Prompt) und fordert konkrete Rückfragen,
  ohne die Antworten zu interpretieren.
- **Deterministische Förderlogik**: Bewertungen lösen lediglich Kandidaten
  aus (`domain/supportLogic.ts`); Förderziele erfordern zwingend eine aktive
  Bestätigung (`status = "confirmed"`) durch die Koordination – serverseitig
  erzwungen (Testfall 8), nicht nur im Prompt.
- **Deterministische Vergleichslogik** für Verlaufs-/Abschluss-LUV
  (`domain/comparisonLogic.ts`): keine automatische Verbesserungs- oder
  Verschlechterungsbehauptung; nur bestätigte, vergleichbare Zeitpunkte
  zählen als Entwicklung.
- **Manueller Textschutz**: sobald ein Abschnitt manuell bearbeitet wurde
  (`manualOverride = true`), überschreibt eine spätere Gesamtredaktion diesen
  Abschnitt nicht mehr (`luv_composer/composer.ts`, Testfall 9).
- **Freigabe ausschließlich durch aktive Nutzerbestätigung**: `POST
  /approve` erfordert exakt den Bestätigungstext „Ich habe den Inhalt
  fachlich geprüft.“; Claude kann `approvedForExport` niemals setzen. Export
  ist ohne Freigabe serverseitig blockiert (403).
- **Kein neuer Claude-Aufruf beim Export**: DOCX wird exakt aus dem zuvor
  bestätigten Vorschau-Text gerendert.
- **Kopierfunktion** liefert sauberen Klartext ohne Markdown, Evidence-IDs
  oder interne Warnungen (`export/copyText.ts`).
- **Logging ohne sensible Inhalte**: es werden nur technische IDs und
  Statusinformationen geloggt, keine vollständigen Namen, LUV-Texte oder
  Freitexte (`web/logger.ts`).
- **Serverseitige Eingabevalidierung** aller Wizard-Endpunkte per Zod
  (`validation/requestSchemas.ts`).
- **Interne 0–4-Bewertungsskala** ausschließlich technisch für die
  Förderlogik verwendet, erscheint nie im fertigen LUV-Text.

## Version 0.1 → 0.2 – Änderungsübersicht

Version 0.2 setzt den Anforderungskatalog **PH-15** auf Basis des
**Master-Arbeitsstands V1.0** um – gezielt erweitert, nicht neu gebaut. Alle
Sicherheits-, Datenschutz- und Freigabemechanismen aus Version 0.1 bleiben
unverändert bestehen (siehe [Implementierte Sicherheits-/Datenschutzregeln](#implementierte-sicherheits--datenschutzregeln)).

**Neu implementierte Funktionen** (in der von PH-15 vorgegebenen Reihenfolge):

1. **Kompetenzkatalog** (`domain/competenceCatalog.ts`) – vordefinierte
   Unterkompetenzen je Hauptbereich zur Schnellauswahl; „+ eigene
   Unterkompetenz hinzufügen“ bleibt möglich. Neues Feld `relevantForLuv`
   („Für aktuellen LUV relevant? Ja/Nein“) – nicht relevante Einträge lösen
   keinen Förderbereich aus und verlängern den LUV-Text nicht automatisch.
2. **Qualitäts- und Vollständigkeitscheck** (`domain/qualityCheck.ts`,
   `GET /:id/quality-check`) – Übersicht vor der Erstellung, je LUV-Art
   unterschiedlich; warnt, blockiert aber nichts und ergänzt nie automatisch.
3. **Konkretisierungsassistent** (`domain/clarificationAssistant.ts`) –
   deterministische Erkennung pauschaler Begriffe mit konkreten Hilfsfragen.
4. **Evidenzmodell V2** – vier Evidenzstatus (`covered` / `partially_covered`
   / `unsupported` / `needs_review`), Claim/Evidence-Trennung
   (`domain/types.ts: FactClaim`).
5. **Semantische Faktenprüfung** (`validation/semanticFactCheck.ts`,
   `ai/prompts/factCheck.v2.ts`) – aussagebasierte Prüfung durch Claude statt
   nur Wortüberlappung; diese bleibt als technischer Fallback erhalten.
6. **Funktion „Grundlage anzeigen“** – pro Abschnitt einblendbar (Beobachtung,
   Quelle, Evidence-ID, Bewertung), Vorschau bleibt standardmäßig aufgeräumt.
7. **Förderbedarfstransparenz** – „Warum wurde dieser Bereich vorgeschlagen?“
   je Förderbereich einsehbar.
8. **Förderzielpriorisierung** – A/B/C-Skala (`GoalPriority`) statt
   hoch/mittel/niedrig, Warnung bei vielen parallelen Zielen (Schwellenwert
   als technischer Arbeitswert, keine starre Obergrenze). **Bugfix:** in
   Version 0.1 erschien die Priorität fälschlich im gerenderten LUV-Text
   (`luv_composer/renderGoals.ts`) – PH-15 §34 verbietet das ausdrücklich;
   in Version 0.2 korrigiert. Neu zusätzlich: Zielstatus
   (`GoalCompletionStatus`) für Verlaufs-/Abschluss-LUV, von Claude
   vorschlagbar, aber nie verbindlich gesetzt.
9. **Maßnahmenbibliothek** (`domain/measureLibrary.ts`,
   `GET /:id/../catalog/measures`) – Konfigurationsdatei mit Beispiel­
   maßnahmen je Bereich; `SupportGoal.measureSource` unterscheidet
   Bibliothek/KI-Vorschlag/manuell. Die Maßnahmen-KI-Prompts (`measures.v2.ts`)
   verlangen jetzt ausdrücklich Vorschlagssprache.
10. **Vorschau- und Freigabecheck** (`domain/releaseCheck.ts`) – MUSS-Regel
    aus PH-15 §43: rote (`unsupported`/`needs_review`) Abschnitte, die noch
    nicht manuell bearbeitet wurden, blockieren `POST /approve` serverseitig
    (409 `release_check_blocked`), nicht nur als Anzeige.
11. **Tests**: 10 neue Testfälle V02-T01–T10 plus vollständige
    Regressionssuite aus Version 0.1 (insgesamt 29 Tests).

Zusätzlich wurden die **Demo-Fälle** von A–C (Start/Verlauf/Abschluss) auf
**A–E** erweitert (PH-15 §58): Demo A (ausgewogen), Demo B (sehr wenige
Daten – zeigt den Qualitätscheck), Demo C (pauschale Formulierungen – zeigt
den Konkretisierungsassistenten), Demo D (Verlauf), Demo E (Abschluss mit
Zielstatus).

Version 0.2 wurde sowohl in der Vollversion (dieses Verzeichnis) als auch in
der separat ausgelieferten Einzeldatei-Artifact-Version umgesetzt.

## Bekannte offene Punkte

Alle mit `TODO: fachlich abgleichen` im Code markierten Stellen sind bewusst
konservativ/vereinfacht gelöst und sollten vor produktivem Einsatz fachlich
abgestimmt werden. Insbesondere:

- **Faktenabdeckungscheck (heuristischer Fallback)**
  (`validation/evidenceValidation.ts`) ist weiterhin eine einfache
  Wortüberlappungs-Heuristik; sie kommt nur noch zum Einsatz, wenn die
  semantische Prüfung nicht verfügbar ist.
- **Sensitive-Content-Erkennung** (`privacy/sensitiveDetection.ts`) ist eine
  Keyword-Liste; sie ist bewusst konservativ (lieber zu viele False
  Positives als ein Datenschutzverstoß), sollte aber fachlich/juristisch
  geprüft und ggf. erweitert werden.
- **Satzsegmentierung des vorherigen LUV-Texts** (`web/routes/cases.ts`,
  `POST /previous-luv`) ist eine einfache Regex-basierte Aufteilung ohne
  inhaltliche Vorauswahl.
- **Maßnahmen** werden weiterhin primär als Teil des Förderziel-Objekts
  behandelt (`SupportGoal.massnahme`/`measureSource`); ein vollständig
  eigenständiger Bestätigungs-Workflow je Maßnahme (mit eigenem Status,
  analog zu Förderzielen – PH-15 §21 "Dasselbe Prinzip gilt für Maßnahmen")
  ist auch in Version 0.2 nicht umgesetzt (siehe Kommentar in
  `web/routes/ai.ts` vor der `/measures/suggest`-Route).
- **Kompetenzkatalog, Maßnahmenbibliothek und kritische-Begriffe-Liste** sind
  ausdrücklich unverbindliche Arbeitsvorschläge aus PH-15, keine
  offizielle/vertraglich hinterlegte Liste (mehrfach als
  `TODO: fachlich abgleichen` markiert).
- **Förderzielanzahl-Schwellenwert** (5, `GOAL_COUNT_WARNING_THRESHOLD`) ist
  ein technischer Arbeitswert, keine fachlich vorgegebene Obergrenze
  (PH-15 §35 verbietet ausdrücklich eine starre Obergrenze).
- **Gesamtredaktion**: die Zuordnung des von Claude zurückgegebenen
  Gesamttexts zu einzelnen Abschnitten erfolgt über Abschnittstitel als
  Trennmarker; bei stark abweichender Formatierung durch Claude kann die
  Zuordnung fehlschlagen (in diesem Fall bleibt der Originaltext erhalten).
- **Freigabecheck deckt keine dauerhaft gespeicherten Konflikte ab**: KI-
  Antworten vom Typ `conflict` werden nur transient an die Oberfläche
  zurückgegeben, nicht persistent je Abschnitt gespeichert – der
  Freigabecheck kann daher aktuell nur zuletzt sichtbare Warnungen und den
  Faktenstatus auswerten, keine historischen Konflikte (siehe Kommentar in
  `domain/releaseCheck.ts`).
- **Session-Speicherung** ist rein in-memory (Abschnitt 34); bei Neustart des
  Backends gehen alle Fälle verloren (in einem TESTSYSTEM gewollt).

## Vorschläge für Version 0.3

*(Getrennt vom aktuellen Code, nicht automatisch umgesetzt – Version 0.2
erweitert sich nicht eigenständig über PH-15 hinaus.)*

- Eigenständiger Bestätigungs-Workflow für Maßnahmen mit eigenem Status pro
  Maßnahme (statt Teil des Förderziel-Objekts).
- Datei-Upload für vorherige LUV-Dokumente (PDF/DOCX) statt Copy-Paste, inkl.
  serverseitiger Textextraktion (weiterhin als nicht vertrauenswürdige Daten
  behandelt, keine Systemanweisungen).
- Persistente Speicherung von KI-`conflict`-Antworten je Abschnitt, damit der
  Freigabecheck auch historische, ungelöste Widersprüche erfassen kann.
- Persistente, verschlüsselte Speicherung (bei echtem, nicht-fiktivem
  Einsatz) mit klarer Datenschutzfreigabe, Rollen-/Rechtekonzept und
  Protokollierung von Zugriffen.
- Konfigurierbare Kompetenzkatalog-/Maßnahmenbibliothek-/Sensitive-Content-
  Listen (statt Code-Konstanten), pflegbar durch Fachverantwortliche bzw.
  Datenschutzbeauftragte, sobald offizielle Leistungsbeschreibung und
  LUV-Vordruck vorliegen.
- Mehrsprachige Oberfläche / Formulierungshilfen für unterschiedliche
  Zielgruppen.
- Feingranulareres Prompt-Versionierungs- und A/B-Test-Konzept inkl.
  Änderungsprotokoll pro Prompt-Version.
- Barrierefreiheits-Audit (WCAG) der Wizard-Oberfläche.
