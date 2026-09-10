# LUV-Generator BvB / BvB Reha – Version 0.2 (PH-15 Arbeitsfassung 1.1)

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
13. [PH-15 Arbeitsfassung 1.1 – Ergänzungen](#ph-15-arbeitsfassung-11--ergänzungen)
14. [Bekannte offene Punkte](#bekannte-offene-punkte)
15. [Vorschläge für Version 0.3](#vorschläge-für-version-03)

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

Seit PH-15 Arbeitsfassung 1.1 zusätzlich `v02_ph15_v11.test.ts` (Abschnitt 87):

| Test | Inhalt |
|---|---|
| V02-T11 | Fristenberechnung: Start-LUV 14 Tage nach Ende Kompetenzanalyse, nicht aus Maßnahmebeginn geraten |
| V02-T12 | Kompetenzanalyse-Plausibilität je Maßnahmeart – Hinweis statt Blockade |
| V02-T13 | Förderziel ohne BA-Förderzielbereich → Qualitätswarnung, keine Blockade |
| V02-T14 | Parallele BA-Förderzielbereiche gleichzeitig aktiv (nicht linear) |
| V02-T15 | Wiederöffnung eines BA-Förderzielbereichs (`erneut_geoeffnet`) |
| V02-T16 | Sensible Angabe (Diagnose/Medikamente) wird über die Privacy Gateway blockiert |
| V02-T17 | Maßnahmeart BvB-Reha selbst wird NICHT blockiert (nur die sensible Angabe) |
| V02-T18 | Teilnehmerbesprechung/Bekanntgabe wird dokumentiert und fließt in den Qualitätscheck ein |
| V02-T19 | Fremdrückmeldung bleibt als Fremdquelle gekennzeichnet |

Alle 29 Testfälle aus Version 0.1/0.2 (Arbeitsfassung 1.0) bleiben unverändert
Teil der Suite (Regressionsschutz) – insgesamt 38 Tests, alle grün.

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
│   │   │                      # Maßnahmenbibliothek, Konkretisierungsassistent, Qualitäts-/Freigabecheck,
│   │   │                      # Fristenlogik (fristenLogic.ts), BA-Förderzielbereiche
│   │   ├── privacy/           # Privacy Gateway (Allowlist, Identifikatoren, Sensitive-Scan)
│   │   ├── ai/                # Prompt Builder, Prompt-Templates (versioniert, u. a. fact_check v2, measures v2), Claude-Client, Testmodus-Mock
│   │   ├── validation/        # Schema-, Evidenz-, Faktenabdeckungsprüfung (heuristisch + semantisch), Request-Validierung
│   │   ├── luv_composer/      # Abschnittsauswahl/-reihenfolge, Redundanzprüfung, Gesamtredaktion, manueller Schutz
│   │   ├── export/            # DOCX-Export, Kopiertext
│   │   ├── demo/              # 7 fiktive Demo-Fälle A-G (Start ×5, Verlauf, Abschluss)
│   │   ├── web/                # Express-App, Routen (inkl. Katalog-/Qualitäts-/Freigabecheck-/Fristen-Routen), Session-Speicher, Logging
│   │   └── __tests__/         # Vitest-Suite (Testfälle 1-10 + V02-T01..T19)
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

## PH-15 Arbeitsfassung 1.1 – Ergänzungen

PH-15 wurde nach Version 0.2 (Arbeitsfassung 1.0) um die **Arbeitsfassung
1.1** aktualisiert (Grundlage: Master-Arbeitsstand V1.0, Praxistest,
PH-16-Doppelabgleich). Diese Fassung bleibt Teil von **Version 0.2** – es
handelt sich um eine fachliche Präzisierung/Erweiterung des bestehenden
PH-15-Katalogs, nicht um eine neue Versionsnummer. Umgesetzt in der von
PH-15 v1.1 (§91) vorgegebenen Reihenfolge, ebenfalls in Vollversion und
Artifact-Version:

1. **Maßnahmeart BvB/BvB-Reha** (`BaseData.massnahmeart`) – steuert
   ausschließlich fachlich belegte Unterschiede (Kompetenzanalyse-Dauer-
   Hinweise); keine künstliche Differenzierung ohne fachliche Grundlage.
2. **Verbindliche LUV-Fristenlogik** (`domain/fristenLogic.ts`,
   `GET /:id/fristen`) – Start-LUV 14 Tage nach *tatsächlichem* Ende der
   Kompetenzanalyse (nicht aus dem Maßnahmebeginn geraten), erste
   Verlaufs-LUV 6 Monate nach Maßnahmebeginn, weitere Verlaufs-LUV 6 Wochen
   vor Maßnahmeende, Abschluss-LUV am geplanten Maßnahmeende. Zusätzlich
   eine Kompetenzanalyse-Dauer-Plausibilität je Maßnahmeart (Hinweis, keine
   Blockade).
3. **BA-Förderzielbereiche** als eigene, von den sechs internen
   Kompetenzdomänen technisch getrennte Ebene (`BAFoerderzielbereich`,
   5 Bereiche) – Unterkompetenzen und Förderziele können ihnen zugeordnet
   werden; ein bestätigtes Ziel ohne Zuordnung löst eine Qualitätswarnung
   aus (PH-15 v1.1 §48), keine Blockade. Mehrere Bereiche können parallel
   aktiv sein (`foerderzielbereichTracking`, Status
   begonnen/aktiv/abgeschlossen/erneut geöffnet – PH-15 v1.1 §84).
4. **Zusätzliche Schlüsselkompetenzen** im Kompetenzkatalog ergänzt
   (lebenspraktische Fertigkeiten, interkulturelle Kompetenzen, grüne
   Kompetenzen, Diversitätskompetenzen, Selbstlernkompetenz) sowie fehlende
   Katalogeinträge aus PH-15 v1.1 §10-15 nachgezogen.
5. **Qualitätscheck erweitert**: Maßnahmeart, offene Warnungen/Widersprüche
   in KI-Abschnitten, Teilnehmerbesprechung, Stand der BA-Förderzielbereiche
   (Verlaufs-/Abschluss-LUV) als zusätzliche, nicht blockierende Prüfpunkte.
6. **Strukturierte Ausgangslage und berufliche Orientierung**: Schulabschluss
   und berufliche Vorerfahrung als feste Auswahllisten statt Freitext,
   strukturierter beruflicher Orientierungsstatus, Berufsfelder mit
   Orientierungspraktikum-Kennzeichnung, Quelle und zentraler Erkenntnis.
7. **Maßnahmenbibliothek**: zusätzliche (optionale) Zuordnung von Maßnahmen
   zu BA-Förderzielbereichen.
8. **Teilnehmerbesprechung/Bekanntgabe** (`Teilnehmerbesprechung`,
   `PUT /:id/teilnehmerbesprechung`) – besprochen Ja/Nein, Datum,
   Mehrfertigung ausgehändigt, „Besprechung nicht möglich" mit Grund.
9. **Freigabecheck erweitert** um `openQualityWarnings` (nicht blockierende
   Zusatzhinweise aus dem Qualitätscheck, inkl. Maßnahmeart/LUV-Art/
   Teilnehmerbesprechung) – die technische MUSS-Blockade roter Abschnitte
   selbst bleibt unverändert.
10. **Demo-Fälle erweitert** von A–E auf **A–G** (PH-15 v1.1 §86): Demo F
    (BvB, mehrere gleichzeitig aktive BA-Förderzielbereiche), Demo G
    (BvB-Reha mit sensibler Angabe, die über die bestehende Privacy Gateway
    blockiert wird, ohne dass die Maßnahmeart BvB-Reha selbst blockiert
    wird – PH-15 v1.1 §73).
11. **Tests**: 9 neue Testfälle V02-T11–T19 plus vollständige
    Regressionssuite aus Version 0.1/0.2 (insgesamt 38 Tests).

**Nicht umgesetzt** (PH-15 v1.1 §92, bewusst außerhalb des Umfangs):
Produktionsbackend, produktive JobB-Nutzerverwaltung, direkte BA-/EMAW-
Schnittstelle, offizielles LUV-PDF, XML-Übertragung, Teilnehmerhistorie,
Statistik/Dashboard, E-Mail, digitale Signatur, Langzeitarchiv,
vollständige Förderplanung, Förderziel-Zertifikatsmodul. Ebenso nicht
umgesetzt: ein eigenständiger, produktiver BvB-Förderzielnachweis (§85,
ausdrücklich "nicht in den Kern des LUV-Generators integrieren").

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
- **Fristenlogik** (`domain/fristenLogic.ts`): "letzter Tag der Teilnahme"
  für die Abschluss-LUV-Frist wird als geplantes Maßnahmeende abgebildet;
  bei einem tatsächlich abweichenden (z. B. vorzeitigen) Austritt muss dies
  derzeit manuell berücksichtigt werden (PH-15 v1.1 §5).
- **BA-Förderzielbereiche** (`domain/types.ts: BAFoerderzielbereich`,
  `domain/labels.ts: BA_FOERDERZIELBEREICH_LABELS`): Bezeichnungen sind
  Arbeitsformulierungen aus PH-15 v1.1 §8, keine offiziellen BA-Bezeichnungen
  oder Feldnummern.
- **Zuordnung der "zusätzlichen Schlüsselkompetenzen"** (lebenspraktische
  Fertigkeiten, interkulturelle/grüne/Diversitätskompetenzen) zu einem der
  sechs Hauptbereiche im Kompetenzkatalog ist eine plausible Arbeitsannahme
  (PH-15 v1.1 nennt sie nicht eindeutig einem Bereich zugeordnet) und noch
  fachlich zu bestätigen (`domain/competenceCatalog.ts`).
- **Kompetenzanalyse-Dauer-Regelwerte** (BvB 3–5 Wochen, BvB-Reha 4–8 Wochen,
  `domain/fristenLogic.ts: KOMPETENZANALYSE_REGELDAUER`) sind reine
  Hinweislogik gemäß PH-15 v1.1 §6, keine technische Blockade.
- **Teilnehmerbesprechung/Bekanntgabe** (§65): welche der erfassten Angaben
  in das offizielle Muster-LUV gehören und welche nur interne
  Prozessdokumentation sind, ist offen.

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
