# LUV-Generator BvB 1/2/3 – Version 0.2.1 (Korrekturauftrag A1–A7)

> **TESTSYSTEM – Keine echten personenbezogenen Daten eingeben.**
> Dieses System verwendet ausschließlich fiktive Testdaten. Es ist kein
> Produktivsystem, keine Teilnehmerverwaltung und keine digitale Teilnehmerakte.

> **Status: Abnahme- und Teststand.** Version 0.2.1 ist **nicht** als produktiv
> freigegeben gekennzeichnet. Sie dient der fachlichen Abnahme/dem Testen und
> ist bewusst so lange als Entwurf zu behandeln, bis eine ausdrückliche
> produktive Freigabe erfolgt. Version 0.2.1 ist ein reiner **Korrekturstand**
> zu Version 0.2 (Abnahmeblocker A1–A7), keine neue Entwicklungsstufe.

Ein browserbasiertes Unterstützungswerkzeug für Koordinatorinnen und
Koordinatoren zur Erstellung von **Start-LUV**, **Verlaufs-LUV** und
**Abschluss-LUV** (Lern- und Entwicklungsdokumentation) in berufsvorbereitenden
Bildungsmaßnahmen (BvB 1, BvB-Reha BvB 2, BvB-Reha BvB 3) nach der
BA-LuV-Struktur 10/2025 (PH-17 V1.0).

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
14. [PH-17 V1.0 / Entwicklungsauftrag V0.2 – Ergänzungen](#ph-17-v10--entwicklungsauftrag-v02--ergänzungen)
15. [Korrekturauftrag V0.2.1 (A1–A7) – Änderungsübersicht](#korrekturauftrag-v021-a1a7--änderungsübersicht)
16. [Testbericht (PASS/FAIL) und 3×3-Testmatrix](#testbericht-passfail-und-3×3-testmatrix)
17. [Bekannte offene Punkte](#bekannte-offene-punkte)
18. [Vorschläge für Version 0.3](#vorschläge-für-version-03)

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
Teil der Suite (Regressionsschutz).

Seit PH-17 V1.0 / Entwicklungsauftrag V0.2 zusätzlich `v03_ph17.test.ts`: die
vollständige **3×3-Testmatrix** (START/VERLAUF/ABSCHLUSS × BvB 1/BvB 2/BvB 3,
9 End-to-End-Fälle) sowie die vereinbarten **Negativtests**. Details siehe
[Testbericht (PASS/FAIL) und 3×3-Testmatrix](#testbericht-passfail-und-3×3-testmatrix).

Insgesamt **54 Tests, alle grün** (38 aus Version 0.1/0.2/PH-15 v1.1 +
16 aus PH-17 V1.0).

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
│   │   │                      # Fristenlogik (fristenLogic.ts), BA-Förderzielbereiche,
│   │   │                      # Vorvalidierung/harte Blocker (preValidation.ts)
│   │   ├── privacy/           # Privacy Gateway (Allowlist, Identifikatoren, Sensitive-Scan,
│   │   │                      # Freitext-Identifikator-Härtung: knownIdentifiers.ts, A7)
│   │   ├── ai/                # Prompt Builder, Prompt-Templates (versioniert, u. a. fact_check v2, measures v2), Claude-Client, Testmodus-Mock
│   │   ├── validation/        # Schema-, Evidenz-, Faktenabdeckungsprüfung (heuristisch + semantisch), Request-Validierung
│   │   ├── luv_composer/      # Abschnittsauswahl/-reihenfolge, Redundanzprüfung, Gesamtredaktion, manueller Schutz,
│   │   │                      # Abschluss-Modul-Rendering (renderAbschlussErgebnis.ts), rollen-/zeitraumgruppiertes
│   │   │                      # Förderziel-Rendering (renderGoals.ts, A5/A6)
│   │   ├── export/            # DOCX-Export, Kopiertext
│   │   ├── demo/              # 7 fiktive Demo-Fälle A-G (Start, Verlauf, Abschluss)
│   │   ├── web/                # Express-App, Routen (inkl. Katalog-/Qualitäts-/Freigabecheck-/Fristen-/Abschluss-Modul-/Stammdaten-Routen), Session-Speicher, Logging
│   │   └── __tests__/         # Vitest-Suite (Testfälle 1-10 + V02-T01..T19 + V0.2/PH-17-Matrix/Negativtests + Korrekturauftrag A1-A7, 78 Tests)
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

## PH-17 V1.0 / Entwicklungsauftrag V0.2 – Ergänzungen

Grundlage: der bisherige Master-Arbeitsstand V1.0 (PH-15 Arbeitsfassung 1.1,
oben) plus **PH-17 V1.0** ("Anpassung LUV-Generator an die BA-LuV-Struktur
10/2025") und der **Claude-Entwicklungsauftrag Version 0.2**. PH-17 hat bei
Widersprüchen zur BA-LuV-Struktur 10/2025 ausdrücklich Vorrang vor PH-15.
Diese Ergänzungen wurden anhand eines vom Nutzer vor der Umsetzung
freigegebenen **Migrationsplans 0.1 → 0.2** implementiert (9 dokumentierte
fachliche Entscheidungen, keine eigenständigen Annahmen während der
Umsetzung). Umgesetzt in der im Migrationsplan festgelegten Reihenfolge:

1. **Maßnahmeart dreistufig, kein Default** (`Massnahmeart = "bvb1" |
   "bvb2" | "bvb3"`, vormals binär `bvb`/`bvb_reha`) – eine aktive Auswahl ist
   bei Fallanlage Pflicht, es gibt keine technische Vorbelegung mehr.
2. **Fristen-Engine erweitert** (`domain/fristenLogic.ts`): erste
   Verlaufs-LUV BvB 1/BvB 2 weiterhin 6 Monate, **BvB 3 7 Monate** nach
   Maßnahmebeginn; neuer Fristzweig **„Verlängerung"** (BvB 1/BvB 2 3 Wochen,
   BvB 3 4 Wochen vor dem erfassten Verlängerungstermin). Die
   Kompetenzanalyse-Dauer-Hinweislogik gilt seit PH-17 **nur noch für BvB 1**
   (3–5 Wochen) – die frühere „BvB-Reha 4–8 Wochen"-Regel wurde **nicht**
   ungeprüft auf BvB 2/BvB 3 übertragen (keine verbindliche Grundlage, daher
   für BvB 2/BvB 3 kein Hinweis mehr).
3. **Anlass-Feld im Verlauf** (`BaseData.verlaufAnlass`: regulär / vor
   Maßnahmeende / Verlängerung / sonstiger Anlass) steuert, welche Fristformel
   angezeigt wird; bei „Verlängerung" zusätzliches Datumsfeld
   `verlaengerungstermin`.
4. **Maßnahmeziel + Begründungspflicht** (`BaseData.massnahmeziel`:
   Berufsausbildung / sozialversicherungspflichtige Beschäftigung): bei
   SV-Beschäftigung ist die Begründung, weshalb eine Berufsausbildung
   voraussichtlich nicht erreicht werden kann, ein **Pflicht-Freitextfeld**,
   das **nie durch Claude erzeugt wird**. Fehlt sie, wird die Fallanlage
   bereits serverseitig per Schema abgelehnt (`validation_error`). Im
   Abschluss-Modul erscheint das Maßnahmeziel nur als Referenz, nicht als
   erneute Abfrage.
5. **Neue Vorvalidierungsschicht mit harten Blockern**
   (`domain/preValidation.ts`) – anders als der bestehende Qualitätscheck
   (der für alle übrigen Punkte weiterhin „Warnung statt Zwang" bleibt)
   **verweigert** diese Schicht aktiv die KI-Generierung bzw. die Freigabe:
   - Ein bestätigter Förderbereich **ohne ausreichenden Beleg** (weder
     Beobachtungsstichpunkte noch verknüpfte Evidenz) blockiert die
     KI-Generierung des betreffenden Inhalts und die finale Freigabe (PH-17
     vor PH-15).
   - Maßnahmeziel „SV-Beschäftigung" ohne ausgefüllte Begründung blockiert
     jede KI-Generierung und die Freigabe.
   - Ein Abschluss-Fall ohne die drei HUMAN_CONFIRMED-Entscheidungen (siehe
     Punkt 8) blockiert die Freigabe.
   Wird ein solcher Blocker vor einem KI-Aufruf ausgelöst, findet **kein**
   Claude-Aufruf statt; die API antwortet mit `{"kind":
   "blocked_pre_validation", "reason": "…"}`. Vor der finalen Freigabe wirft
   `POST /:id/approve` in diesem Fall `409 pre_validation_blocked`.
6. **„Digitale Kompetenzen" kein offizieller 6. BA-Bereich mehr**
   (Entscheidung 1): bleibt interner Erhebungsbereich (Schritt 3 /
   Kompetenzkatalog), erscheint aber **nicht mehr** als eigene automatisch
   erzeugte LUV-Ausgabesektion in Start-/Verlaufs-/Abschluss-LUV. Relevante
   Erkenntnisse müssen von der Koordination manuell einem passenden
   offiziellen Feld zugeordnet werden – das System führt hier **keine**
   automatische Zusammenführung durch, um keine Zuordnung zu erfinden.
7. **Rollenbezogene Zielvereinbarung** (`Rolle`, 9 vom Nutzer vorgegebene
   Werte, u. a. teilnehmende Person, Bildungsbegleitung/Case Management,
   Ausbilder/in, Lehrkraft, Sozialpädagogik, Psychologe/Psychologin,
   pädagogische Mitarbeitende Lernort Wohnen, gemeinsame Aufgaben). Jedes
   Förderziel kann optional einer Rolle zugeordnet werden
   (`GET /catalog/rollen?massnahmeart=…`, `SupportGoal.rolle`). „Pädagogische
   Mitarbeitende Lernort Wohnen" ist als **dokumentierte Annahme** nur bei
   BvB 3 wählbar (deckt sich mit dem BvB-3-Sonderfeld unten); alle übrigen
   Rollen sind massnahmeartunabhängig wählbar
   (`domain/supportLogic.ts: rollenForMassnahmeart`, `TODO: fachlich
   abgleichen` falls weitere Rollen tatsächlich massnahmeabhängig sind).
8. **Abschluss-Modul mit 22-Felder-Struktur** (`domain/types.ts:
   AbschlussErgebnis`), angelehnt an den vom Nutzer vorgegebenen offiziellen
   BA-Abschluss-LuV 10/2025 (keine eigene Interpretation der Feldstruktur):
   Übermittlungsanlass (reguläres Ende / vorzeitige Beendigung, bei
   Beendigung zusätzlich Übergang Ausbildung/Arbeit oder Abbruch),
   Hauptschulabschluss, Vermittlungsfähigkeit, Eingliederungsergebnis,
   Absprachen zur Stabilisierung/Festigung u. a. Drei Entscheidungen sind
   **HUMAN_CONFIRMED**-pflichtig – *allgemeine Ausbildungsreife erreicht*,
   *Berufseignung* und *Unterstützungsbedarf*: Claude darf diese Werte nie
   selbst ableiten; erst eine aktive Bestätigung durch die Koordination
   (`{ value, humanConfirmed: true }`) setzt sie frei und hebt den
   Freigabeblocker (Punkt 5) auf. Direkte Identifikatoren des Moduls
   (Vorname, Nachname, Kundennummer, Träger/Einrichtung, Ansprechperson,
   Telefon, E-Mail) werden exakt wie `teilnehmerName`/`geburtsdatum`
   behandelt: rein lokal, Teil von Prüfansicht/DOCX-Export, **niemals** Teil
   eines Claude-Payloads (`privacy/allowlist.ts`, ergänzte
   `DIRECT_IDENTIFIER_KEYS`). Ein deterministischer Renderer
   (`luv_composer/renderAbschlussErgebnis.ts`) erzeugt daraus die
   Ausgabesektion `abschluss_ergebnis` – ohne KI-Beteiligung, ausschließlich
   auf Basis bereits erfasster/bestätigter Angaben.
9. **BvB-3-Sonderfeld „Lernort Wohnen/Internat"**
   (`AbschlussErgebnis.lernortWohnenInternat`): nur bei `massnahmeart ===
   "bvb3"` erfassbar; `PUT /:id/abschluss-ergebnis` lehnt einen gesetzten
   Wert bei BvB 1/BvB 2 serverseitig ab (`400 bvb3_field_not_applicable`).
10. **Stabile Feld-IDs**: die 22 Felder des Abschluss-Moduls und ihre
    TypeScript-Bezeichner sind 1:1 im Migrationsplan (Abschnitt 3.4)
    dokumentiert, um eine spätere Zuordnung zu einem offiziellen BA-Vordruck
    zu erleichtern.
11. **Erweiterte Nachvalidierung**: die bestehende semantische
    Faktenprüfung (`validation/semanticFactCheck.ts`) sowie die
    Privacy-Gateway-Allowlist wurden um die neuen Abschluss-Modul-Felder
    ergänzt (siehe Punkt 8); die grundsätzliche Architektur der
    Nachvalidierung (Existenzprüfung referenzierter Evidence-IDs,
    Faktenabdeckung) bleibt unverändert bestehen.
12. **Tests**: 16 neue Testfälle in `v03_ph17.test.ts` – die vollständige
    3×3-Testmatrix sowie alle vereinbarten Negativtests (siehe nächster
    Abschnitt) – plus vollständige Regressionssuite aus Version 0.1/0.2/PH-15
    v1.1 (insgesamt 54 Tests).

**Nicht Teil dieser Ergänzung** (bewusst außerhalb des freigegebenen
Entwicklungsauftrags V0.2, keine eigenständige Umfangserweiterung): D-01,
D-11, D-12, D-13, KO-06, B-02 sind laut Nutzer interne JobB-Unterlagen und
wurden nicht als externe Testgrundlage herangezogen – stattdessen wurde die
in Entscheidung 5 vereinbarte eigene 3×3-Matrix aufgebaut.

**Frontend**: Maßnahmeart-Auswahl ohne Vorbelegung, Anlass-/
Verlängerungstermin-Felder, Maßnahmeziel/Begründung, Rollen-Zuordnung je
Förderziel und das vollständige Abschluss-Modul (inkl. HUMAN_CONFIRMED-
Bestätigungs-Buttons) sind in den React-Wizard integriert
(`frontend/src/components/steps/Step1BaseData.tsx`,
`Step6SupportNeeds.tsx`, `Step7Preview.tsx`).

**Einzeldatei-Artifact**: die Artifact-Version (separat unter
`https://claude.ai/code/artifact/7be240cc-a98f-4540-9044-0a2674347645`
veröffentlicht) wurde für PH-17 V1.0 / Entwicklungsauftrag V0.2 **noch nicht
aktualisiert** und bildet weiterhin den Stand PH-15 Arbeitsfassung 1.1 ab
(binäre Maßnahmeart, kein Anlass-/Maßnahmeziel-/Abschluss-Modul-Feld). Dies
ist eine bewusste, im Abschnitt [Bekannte offene
Punkte](#bekannte-offene-punkte) dokumentierte Priorisierungsentscheidung
(Umfang/Risiko einer rein clientseitigen, ungetesteten
Parallel-Implementierung ohne Type-Checker) und **kein** stillschweigend
weggelassener Teil des Auftrags.

## Korrekturauftrag V0.2.1 (A1–A7) – Änderungsübersicht

Version 0.2.1 ist ein **gezielter Korrekturstand** zu Version 0.2, nicht
eine neue Entwicklungsstufe: umgesetzt wurden ausschließlich die sieben im
Claude-Korrekturauftrag V0.2.1 benannten Abnahmeblocker A1–A7, auf Basis des
bestehenden, lauffähigen V0.2-Codes. Funktionierende, von A1–A7 nicht
betroffene Komponenten blieben unverändert; es wurden keine neuen
fachlichen Funktionen, Module oder Anforderungen ergänzt.

**A1 – Abschlussstruktur bereinigen.** Für `LUV_ART=ABSCHLUSS` wird jetzt
ausschließlich die eigenständige Abschlussstruktur gerendert
(`abschluss_ergebnis`) – keine automatisch mitgerenderten Start-/
Verlaufsabschnitte (Ausgangslage, Entwicklung, Kompetenzbereiche,
allgemeiner Förderbedarf, alte Gesamtbeurteilung/Perspektive) mehr. START
und VERLAUF sind unverändert. *Betroffen:* `backend/src/domain/composerRules.ts`
(`ABSCHLUSS_ORDER`), Test `v04_korrektur_a1a7.test.ts` (A1-Block).

**A2 – Tatsächlicher letzter Teilnahmetag.** Neues Datumsfeld
`BaseData.tatsaechlicherLetzterTeilnahmetag`. Die Abschluss-LUV-Frist wird
ausschließlich daraus bestimmt (regulär **und** vorzeitig) – das geplante
Maßnahmeende dient dafür nicht mehr als Ersatz. Fehlt das Datum, liefert
`computeFristen` `abschlussLuvFaellig: null` plus einen expliziten
`abschlussLuvFaelligHinweis`. *Betroffen:* `backend/src/domain/types.ts`,
`backend/src/domain/fristenLogic.ts`, `backend/src/validation/requestSchemas.ts`,
`backend/src/web/routes/cases.ts`, `frontend/src/types.ts`,
`frontend/src/components/steps/Step1BaseData.tsx` (neues Datumsfeld, nur bei
Abschluss-LUV sichtbar; Fristenbox zeigt den neuen Hinweis).

**A3 – Abschluss-Vollständigkeitsvalidierung gehärtet.** HUMAN_CONFIRMED
gilt jetzt nur noch als gültig, wenn `humanConfirmed=true` **und** ein
fachlich zulässiger, nicht-null/nicht-leerer Wert vorhanden ist (bislang
konnte `humanConfirmed=true` mit `value=null` formal durchgehen) – geprüft
für Ausbildungsreife, Berufseignung, Unterstützungsbedarf. Zusätzlich: bei
Unterstützungsbedarf „Ja" ist die Beschreibung/Empfehlung (Feld 20) vor der
Freigabe Pflicht, bei „Nein" wird sie nicht erzwungen. Die Sperre liegt
serverseitig in `POST /:id/approve` (`409 pre_validation_blocked`).
*Betroffen:* `backend/src/domain/preValidation.ts`
(`checkAbschlussHumanConfirmed` gehärtet, neu `checkUnterstuetzungsbedarfBeschreibung`),
`backend/src/web/routes/cases.ts`.

**A4 – Gemeinsamer Stammdatenkern für START/VERLAUF/ABSCHLUSS.** Neue,
geteilte `Stammdaten`-Struktur (LuV-Datum, Vorname, Nachname, Kundennummer,
Träger/Einrichtung, Ansprechperson, Telefon, E-Mail, BvB-3-Sonderfeld
Lernort Wohnen/Internat) auf Fallebene (`CaseRecord.stammdaten`), verfügbar
für alle drei LUV-Arten. Die zuvor nur im Abschluss-Modul geführten
Identifikator-Felder wurden dorthin migriert (`AbschlussErgebnis` enthält
sie nicht mehr) – keine doppelten konkurrierenden Stammdatenmodelle mehr.
Neue Route `PUT /:id/stammdaten` (inkl. BvB-3-Gating für „Lernort
Wohnen/Internat", vormals in `PUT /:id/abschluss-ergebnis`). Das
bestehende, bereits seit Version 0.1 für alle LUV-Arten gemeinsame Feld
`BaseData.teilnehmerName` bleibt bewusst unverändert (kein expliziter
Auftragsbestandteil, siehe „Offene Punkte" unten). *Betroffen:*
`backend/src/domain/types.ts` (`Stammdaten`, `emptyStammdaten`,
`AbschlussErgebnis` verkleinert), `backend/src/validation/requestSchemas.ts`
(`StammdatenSchema`), `backend/src/web/routes/cases.ts` (neue Route),
`backend/src/export/docxExport.ts` (Stammdaten-Block jetzt für alle
LUV-Arten statt nur Abschluss), `frontend/src/types.ts`,
`frontend/src/components/steps/Step1BaseData.tsx` (neuer Stammdaten-Block),
`frontend/src/components/steps/Step7Preview.tsx` (Abschluss-Modul-UI
entsprechend verkleinert), `backend/src/demo/demoCases.ts`.

**A5 – Förderzielbereiche mit Von/Bis-Zeiträumen.** `FoerderzielbereichTracking`
um `von`/`bis` (Datum) erweitert; ein reines Status-Update löscht einen
bereits erfassten Zeitraum nicht (Merge statt Überschreiben). Die
Förder-/Qualifizierungsplanung (Bereich, Zeitraum, Status) wird jetzt
deterministisch in den `support_goals`-Output gerendert; der interne
Verlaufs-Status „erneut geöffnet" erscheint dabei bewusst **nicht** wörtlich
als eigenständiges Feld (wird wie „aktiv" ausgegeben – eine wiedereröffnete
Förderung ist fachlich nichts anderes als eine aktuell wieder aktive).
*Betroffen:* `backend/src/domain/types.ts`,
`backend/src/validation/requestSchemas.ts`, `backend/src/web/routes/cases.ts`
(Merge-Logik + Re-Rendering), `backend/src/luv_composer/renderGoals.ts`,
`frontend/src/types.ts`, `frontend/src/components/steps/Step6SupportNeeds.tsx`
(Von/Bis-Eingabefelder je Bereich).

**A6 – Rollenbezogene Zielvereinbarung tatsächlich gerendert.** Die
bereits gespeicherte Rolle je Förderziel (`SupportGoal.rolle`) wird jetzt im
`support_goals`-Output nach Rolle gruppiert dargestellt; Rollen ohne
zugeordnetes Ziel erzeugen keine leere Überschrift (keine künstliche
KI-Füllung). Claude leitet nie selbst eine Rolle ab – sie stammt
ausschließlich aus strukturierter menschlicher Eingabe.
*Betroffen:* `backend/src/luv_composer/renderGoals.ts` (vollständig
überarbeitet, siehe auch A5 – beide Punkte teilen sich denselben Renderer).

**A7 – Privacy Gateway für Freitext gehärtet.** Vor jedem Claude-Aufruf
werden zusätzlich zu den bisherigen Schlüssel-basierten Regeln auch
**bekannte Identifikator-Werte** (Vorname, Nachname, Kundennummer, Telefon,
E-Mail, Geburtsdatum, Teilnehmername – aus dem lokalen Stammdatenkern/
BaseData) rekursiv aus jedem Freitextfeld entfernt, bevor der Claude-Payload
entsteht. Enthält ein Freitext danach noch ein E-Mail-Muster, das auf
keinen bekannten, bereits ersetzten Wert zurückgeht (also nicht sicher
behandelbar ist), wird die Generierung dieses Inhalts vollständig blockiert
statt den Text ungefiltert zu senden. Die bestehende Allowlist-/
Schlüssel-Filterung bleibt unverändert bestehen – die Freitext-Prüfung ist
eine zusätzliche Schicht. Keine Originalwerte werden geloggt (Logging
enthält ohnehin nur IDs/Status, nie Payload-Inhalte). *Betroffen:*
`backend/src/privacy/gateway.ts` (neuer Redaktionsschritt + E-Mail-Block),
neu `backend/src/privacy/knownIdentifiers.ts`, `backend/src/ai/aiService.ts`,
`backend/src/validation/semanticFactCheck.ts`,
`backend/src/luv_composer/overallRedaction.ts`,
`backend/src/web/routes/ai.ts` (alle sechs KI-Routen).

**Zwei technische Ableitungen ohne eigene fachliche Entscheidung** (zur
Transparenz explizit benannt, jeweils die konservativste, umfangschonendste
Auslegung des Korrekturauftrags):
- A3s Formulierung „Alle für den Abschluss fachlich erforderlichen
  strukturierten Felder vor Finalfreigabe prüfen" wurde als Zusammenfassung
  der bereits explizit benannten Pflichtfelder gelesen (die drei
  HUMAN_CONFIRMED-Felder plus die bedingte Unterstützungsbedarf-Beschreibung),
  nicht als zusätzlicher, unbenannter Pflichtfeldkatalog – es wurden keine
  neuen harten Blocker für weitere Freitextfelder (z. B. Vermittlungsfähigkeit,
  Eingliederungsergebnis) ergänzt, da der Auftrag dafür keine eindeutige,
  abschließende Liste nennt und „Erweitere den Umfang nicht" gilt.
- A4s Vorgabe „keine doppelten konkurrierenden Stammdatenmodelle" wurde auf
  das explizit benannte Problem bezogen (die Abschluss-Modul-eigene Kopie
  von Vorname/Nachname/etc.) und nicht auf das bereits seit Version 0.1
  bestehende, unabhängige Feld `BaseData.teilnehmerName` ausgeweitet – dessen
  Entfernung/Zusammenführung hätte praktisch jede Testdatei, jeden Demo-Fall
  und den DOCX-Export berührt, war im Auftrag nicht ausdrücklich verlangt und
  wurde daher bewusst nicht angetastet.

**Nicht Bestandteil von V0.2.1** (wie im Korrekturauftrag Abschnitt „Nicht
Bestandteil" gefordert, nicht bearbeitet): Mapping in den originalen
BA-PDF-/Word-Vordruck, neue Produktivfreigabe, neue Kompetenzmodelle oder
Förderzielbereiche, neue Dokumentationsfunktion/Teilnehmerakte, Erweiterung
des Claude-Einsatzes, Neugestaltung des gesamten Frontends, Portierung des
Einzeldatei-Artifacts (technisch nicht zwingend für A1–A7 erforderlich),
sowie alle sonstigen „gelben Punkte" des Abnahmeberichts außerhalb A1–A7.

## Testbericht (PASS/FAIL) und 3×3-Testmatrix

Stand: vollständiger Lauf der Backend-Vitest-Suite unmittelbar vor der
Auslieferung dieser Version. **Alle 78 Tests PASS**, keine bekannten
fehlschlagenden Tests.

```
Test Files  9 passed (9)
     Tests  78 passed (78)
```

| Datei | Tests | Status |
|---|---|---|
| `aiMock.test.ts` | 3 | ✅ PASS |
| `privacyGateway.test.ts` | 2 | ✅ PASS |
| `comparisonLogic.test.ts` | 3 | ✅ PASS |
| `apiFlows.test.ts` | 4 | ✅ PASS |
| `domainRules.test.ts` | 7 | ✅ PASS |
| `v02.test.ts` | 10 | ✅ PASS |
| `v02_ph15_v11.test.ts` | 9 | ✅ PASS |
| `v03_ph17.test.ts` | 16 | ✅ PASS |
| `v04_korrektur_a1a7.test.ts` | 24 | ✅ PASS |

### 3×3-Testmatrix (START/VERLAUF/ABSCHLUSS × BvB 1/BvB 2/BvB 3)

Alle 9 Kombinationen werden End-to-End über die REST-API angelegt und
geprüft: korrekt gesetzte Maßnahmeart, zur LUV-Art passendes
Abschnitts-Skelett **ohne** `digital_competences`, `abschluss_ergebnis` nur
bei Abschluss-LUV, sowie zur Maßnahmeart passende Fristenberechnung (BvB 3 =
7 statt 6 Monate bis zur ersten Verlaufs-LUV).

| # | LUV-Art | Maßnahmeart | Ergebnis |
|---|---|---|---|
| 1 | START | BvB 1 | ✅ PASS |
| 2 | VERLAUF | BvB 1 | ✅ PASS |
| 3 | ABSCHLUSS | BvB 1 | ✅ PASS |
| 4 | START | BvB 2 | ✅ PASS |
| 5 | VERLAUF | BvB 2 | ✅ PASS |
| 6 | ABSCHLUSS | BvB 2 | ✅ PASS |
| 7 | START | BvB 3 | ✅ PASS |
| 8 | VERLAUF | BvB 3 | ✅ PASS |
| 9 | ABSCHLUSS | BvB 3 | ✅ PASS |

### Negativtests

| # | Szenario | Erwartetes Verhalten | Ergebnis |
|---|---|---|---|
| 1 | Maßnahmeziel „SV-Beschäftigung" ohne Begründung | Fallanlage wird bereits per Schema abgelehnt (`400 validation_error`) | ✅ PASS |
| 1b | Dieselbe Konstellation **mit** ausgefüllter Begründung | Fallanlage und Freigabe funktionieren normal | ✅ PASS |
| 2 | Bestätigter Förderbereich ohne Beleg (weder Beobachtungsstichpunkte noch Evidenz) | Förderzielvorschläge (`kind: blocked_pre_validation`) **und** Freigabe (`409 pre_validation_blocked`) werden blockiert | ✅ PASS |
| 3 | Abschluss-LuV ohne HUMAN_CONFIRMED (Ausbildungsreife/Berufseignung/Unterstützungsbedarf) | Freigabe wird blockiert (`409`); nach aktiver Bestätigung aller drei Felder ist die Freigabe möglich | ✅ PASS |
| 4 | BvB-3-Sonderfeld „Lernort Wohnen/Internat" bei BvB 2 gesetzt | Wird abgelehnt (`400 bvb3_field_not_applicable`); bei BvB 3 wird derselbe Wert angenommen | ✅ PASS |
| 5 | Verlaufs-LUV ohne bestätigte, vergleichbare Vergleichszeitpunkte | Keine erfundene Entwicklung – `kind: insufficient_data` | ✅ PASS |
| 6 | Direkte Identifikatoren des Abschluss-Moduls (Ansprechperson, Träger/Einrichtung) in einem KI-Payload | Werden vom Privacy Gateway rekursiv entfernt, bevor der Payload Claude erreichen würde | ✅ PASS |
| 7 (Regression) | KI-Satz mit erfundener/nicht existenter Evidence-ID (`V02-T05`) | Wird unabhängig vom Claude-Ergebnis technisch als unbelegt erkannt | ✅ PASS |

Alle Negativtests laufen automatisiert in `v03_ph17.test.ts` bzw. (Test 7)
regressionsgeschützt in `v02.test.ts`; keiner davon erfordert einen echten
Anthropic-API-Key (Testmodus, siehe [Testmodus](#testmodus-ohne-api-key)).

**Die 3×3-Matrix wurde für Version 0.2.1 erneut vollständig ausgeführt**
(`v03_ph17.test.ts`, unverändert Teil der Suite) – alle 9 Kombinationen
weiterhin ✅ PASS, keine Regression durch A1–A7 (insbesondere: das durch A1
verkleinerte Abschluss-Abschnitts-Skelett wird von diesem Test dynamisch aus
`sectionOrderForLuvArt` abgeleitet und daher automatisch mitgeprüft).

### Negativ-/Regressionstests A1–A7 (`v04_korrektur_a1a7.test.ts`)

| # | Szenario | Erwartetes Verhalten | Ergebnis |
|---|---|---|---|
| A1-1 | Abschluss-LuV anlegen | Abschnitts-Skelett enthält ausschließlich `abschluss_ergebnis`, keinen Start-/Verlaufs-Kompetenzabschnitt | ✅ PASS |
| A1-2 | Start-/Verlaufs-LuV anlegen | Abschnitts-Skelett unverändert gegenüber V0.2 | ✅ PASS |
| A2-1 | Regulärer Abschluss mit gesetztem tatsächlichen Teilnahmetag | Abschlussfrist = dieses Datum, nicht das geplante Maßnahmeende | ✅ PASS |
| A2-2 | Vorzeitige Beendigung mit früherem tatsächlichen Austrittsdatum | Abschlussfrist = das frühere tatsächliche Datum | ✅ PASS |
| A2-3 | Tatsächlicher Teilnahmetag fehlt | Keine Abschlussfrist ausgegeben (`null`), stattdessen Validierungshinweis | ✅ PASS |
| A3-1 | `humanConfirmed=true` + `value=null` (Ausbildungsreife) | Freigabe blockiert (`409 pre_validation_blocked`) trotz gesetztem Flag | ✅ PASS |
| A3-2 | `humanConfirmed=true` + leerer Freitext (Berufseignung) | Freigabe blockiert | ✅ PASS |
| A3-3 | Unterstützungsbedarf=Ja ohne Beschreibung/Empfehlung | Freigabe blockiert; nach Ergänzung freigebbar | ✅ PASS |
| A3-4 | Unterstützungsbedarf=Nein ohne Beschreibung | Freigabe **nicht** blockiert (keine künstliche Pflicht) | ✅ PASS |
| A4-1/2/3 | Stammdaten setzen für START/VERLAUF/ABSCHLUSS | `PUT /:id/stammdaten` funktioniert für alle drei LUV-Arten | ✅ PASS |
| A4-4 | Struktur-Check nach Fallanlage | `AbschlussErgebnis` enthält keine Identifikator-/LuV-Datum-Felder mehr | ✅ PASS |
| A5-1 | Von/Bis für einen Förderzielbereich setzen | Wird gespeichert und im START-Output feldgerecht ausgegeben | ✅ PASS |
| A5-2 | Reines Status-Update nach gesetztem Zeitraum | Zeitraum bleibt erhalten (kein Datenverlust durch Merge-Logik) | ✅ PASS |
| A5-3 | VERLAUF: Status „abgeschlossen" | Erscheint im Output als „Maßnahme abgeschlossen" | ✅ PASS |
| A5-4 | Status „erneut geöffnet" | Erscheint **nicht** wörtlich im Output (nur als „aktiv") | ✅ PASS |
| A6-1 | Mehrere Ziele mit unterschiedlichen Rollen | Werden im Output korrekt nach Rolle gruppiert, keine leeren Rollenblöcke | ✅ PASS |
| A7-1 | Name im Beobachtungstext | Wird auch im Freitext ersetzt, erscheint nicht im Claude-Payload | ✅ PASS |
| A7-2 | Kundennummer im Freitext | Wird ersetzt | ✅ PASS |
| A7-3 | Telefonnummer im Freitext | Wird ersetzt | ✅ PASS |
| A7-4 | Bekannte E-Mail-Adresse im Freitext | Wird ersetzt | ✅ PASS |
| A7-5 | Unbekannte E-Mail-Adresse im Freitext (kein gespeicherter Wert) | Als nicht sicher behandelbar blockiert statt ungefiltert gesendet | ✅ PASS |
| A7-6 | Strukturierte direkte Identifikatoren (Schlüssel-basiert) | Bestehende Allowlist-/Schlüssel-Filterung bleibt zusätzlich bestehen | ✅ PASS |

Backend-Typecheck (`npx tsc --noEmit`) und Frontend-Build (`npm run build`)
wurden nach Abschluss von A1–A7 erneut fehlerfrei ausgeführt.

## Bekannte offene Punkte

### Offene Punkte innerhalb A1–A7

- **A3 „alle fachlich erforderlichen Felder"**: derzeit werden ausschließlich
  die drei explizit benannten HUMAN_CONFIRMED-Felder plus die bedingte
  Unterstützungsbedarf-Beschreibung hart geprüft (siehe technische Ableitung
  oben). Ob z. B. Vermittlungsfähigkeit oder Eingliederungsergebnis ebenfalls
  vor Finalfreigabe als Pflichtfeld gelten sollen, ist im Korrekturauftrag
  nicht eindeutig benannt und daher offen.
- **A7 Telefonnummern-Muster ohne bekannten Stammdatenwert**: anders als bei
  E-Mail-Adressen wird für Telefonnummern kein generisches
  Muster-basiertes Blocking ergänzt (nur der exakte, bereits gespeicherte
  Wert wird redigiert). Grund: eine generische Telefonnummern-Erkennung
  (Ziffern mit Trennzeichen) kollidiert regelmäßig mit harmlosen
  Datumsangaben (z. B. „2026-01-01") und hätte ein neues, nicht im Auftrag
  verlangtes Fehlerrisiko (Über-Blockierung legitimer Texte) eingeführt.
  Bereits lokal bekannte Telefonnummern werden weiterhin zuverlässig
  redigiert; ein unbekanntes, frei erfundenes Telefonnummern-Muster im
  Freitext würde aktuell nicht automatisch blockiert.

### Offene Punkte außerhalb des Umfangs von V0.2.1

Alle unten in diesem Abschnitt (bereits aus Version 0.2 übernommenen)
Punkte sowie alle „gelben Punkte" des Abnahmeberichts, die nicht A1–A7
zugeordnet sind, bleiben ausdrücklich außerhalb des Umfangs dieses
Korrekturstands.

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

### Neu seit PH-17 V1.0 / Entwicklungsauftrag V0.2

- **Einzeldatei-Artifact noch nicht auf PH-17/V0.2 portiert** (siehe
  [PH-17-Abschnitt](#ph-17-v10--entwicklungsauftrag-v02--ergänzungen)):
  bildet weiterhin den PH-15-v1.1-Stand ab. Die Vollversion
  (Backend+Frontend, dieses Repository) ist der maßgebliche, vollständig
  getestete Stand von Version 0.2.
- **Rollenzuordnung „Lernort Wohnen" nur bei BvB 3** (`domain/supportLogic.ts:
  rollenForMassnahmeart`) ist eine dokumentierte Annahme, da PH-17 die genaue
  Zuordnung der übrigen 8 Rollen zu einzelnen Maßnahmearten nicht
  spezifiziert – noch fachlich zu bestätigen.
- **Abschluss-Modul-Rendering** (`luv_composer/renderAbschlussErgebnis.ts`)
  ist eine erste deterministische Textzusammenführung der bestätigten Felder;
  die exakte Formulierungs-/Reihenfolgekonvention für den offiziellen
  BA-Abschluss-LuV-Vordruck (Layout, Feldbeschriftungen) ist noch nicht mit
  dem tatsächlichen Formular abgeglichen (kein Vordruck-PDF im Auftrag
  enthalten).
- **Feld 3 „Übermittlungsanlass" vs. Verlauf-„Anlass"**: bewusst als eigener,
  zweiwertiger Enum umgesetzt (regulär/vorzeitig), getrennt vom vierwertigen
  Verlauf-Anlass – eine technische Ableitung aus der bestehenden Architektur,
  keine im Auftrag ausdrücklich spezifizierte Eigenschaft; siehe
  Migrationsplan Abschnitt 3.4 „Umsetzungshinweise".
- **Kompetenzanalyse-Dauer-Hinweis für BvB 2/BvB 3**: seit PH-17 bewusst
  deaktiviert (kein Hinweis mehr), da keine verbindliche fachliche Grundlage
  vorliegt (Migrationsplan Entscheidung 7) – bis eine solche Grundlage
  vorliegt, bleibt dies technisch korrekt, aber fachlich „stumm".
- **Demo-Fälle (A–G)** verwenden nach der Migration technisch gültige
  Maßnahmeart-Werte (`bvb1`/`bvb2`), sind inhaltlich aber weiterhin an der
  PH-15-v1.1-Erzählung orientiert und decken die neuen PH-17-Felder
  (Anlass, Maßnahmeziel, Abschluss-Modul) nicht in der Demo-Erzählung ab; die
  fachliche Korrektheit der neuen Logik selbst ist vollständig über die
  automatisierte 3×3-Testmatrix (`v03_ph17.test.ts`) abgesichert, nicht über
  die Demo-Fälle.

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
- Portierung der Einzeldatei-Artifact-Version auf PH-17 V1.0 /
  Entwicklungsauftrag V0.2 (Maßnahmeart BvB 1/2/3, Anlass-/
  Maßnahmeziel-Felder, Abschluss-Modul mit HUMAN_CONFIRMED, Vorvalidierung).
- Erweiterung der Demo-Fälle um eine vollständige 3×3-Erzählmatrix
  (START/VERLAUF/ABSCHLUSS × BvB 1/BvB 2/BvB 3) analog zur automatisierten
  Testmatrix, inkl. Abschluss-Modul-Beispielangaben.
- Abgleich des Abschluss-Modul-Renderings mit dem tatsächlichen Layout des
  offiziellen BA-Abschluss-LuV-Vordrucks, sobald dieser als Datei vorliegt.
