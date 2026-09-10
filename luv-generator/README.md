# LUV-Generator BvB / BvB Reha – Version 0.1

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
12. [Bekannte offene Punkte](#bekannte-offene-punkte)
13. [Vorschläge für Version 0.2](#vorschläge-für-version-02)

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
│   │   ├── domain/            # Neutrales Datenmodell, deterministische Fachlogik
│   │   ├── privacy/           # Privacy Gateway (Allowlist, Identifikatoren, Sensitive-Scan)
│   │   ├── ai/                # Prompt Builder, Prompt-Templates (versioniert), Claude-Client, Testmodus-Mock
│   │   ├── validation/        # Schema-, Evidenz-, Faktenabdeckungsprüfung, Request-Validierung
│   │   ├── luv_composer/      # Abschnittsauswahl/-reihenfolge, Redundanzprüfung, Gesamtredaktion, manueller Schutz
│   │   ├── export/            # DOCX-Export, Kopiertext
│   │   ├── demo/              # 3 fiktive Demo-Fälle (Start/Verlauf/Abschluss)
│   │   ├── web/                # Express-App, Routen, Session-Speicher, Logging
│   │   └── __tests__/         # Vitest-Suite (u. a. Testfälle 1-10 der Spezifikation)
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
  (`evidenceValidation.ts`) sowie ein Faktenabdeckungscheck
  (`covered` / `partially_covered` / `unsupported`).
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

## Bekannte offene Punkte

Alle mit `TODO: fachlich abgleichen` im Code markierten Stellen sind bewusst
konservativ/vereinfacht gelöst und sollten vor produktivem Einsatz fachlich
abgestimmt werden. Insbesondere:

- **Faktenabdeckungscheck** (`validation/evidenceValidation.ts`) ist eine
  einfache Wortüberlappungs-Heuristik, keine echte NLP-Analyse.
- **Sensitive-Content-Erkennung** (`privacy/sensitiveDetection.ts`) ist eine
  Keyword-Liste; sie ist bewusst konservativ (lieber zu viele False
  Positives als ein Datenschutzverstoß), sollte aber fachlich/juristisch
  geprüft und ggf. erweitert werden.
- **Satzsegmentierung des vorherigen LUV-Texts** (`web/routes/cases.ts`,
  `POST /previous-luv`) ist eine einfache Regex-basierte Aufteilung ohne
  inhaltliche Vorauswahl.
- **Maßnahmen** werden aktuell als Teil des Förderziel-Objekts behandelt
  (gemeinsamer Bestätigungsstatus); ein vollständig eigenständiger
  Bestätigungs-Workflow für Maßnahmen (analog zu Förderzielen) ist in
  Version 0.1 nicht umgesetzt.
- **Gesamtredaktion**: die Zuordnung des von Claude zurückgegebenen
  Gesamttexts zu einzelnen Abschnitten erfolgt über Abschnittstitel als
  Trennmarker; bei stark abweichender Formatierung durch Claude kann die
  Zuordnung fehlschlagen (in diesem Fall bleibt der Originaltext erhalten,
  siehe Faktenabdeckungs-Rückfallprüfung in `luv_composer/overallRedaction.ts`).
- **Session-Speicherung** ist rein in-memory (Abschnitt 34); bei Neustart des
  Backends gehen alle Fälle verloren (in einem TESTSYSTEM gewollt).

## Vorschläge für Version 0.2

*(Getrennt vom aktuellen Code, nicht automatisch umgesetzt.)*

- Eigenständiger Bestätigungs-Workflow für Maßnahmen (analog Förderzielen),
  inkl. eigenem Status pro Maßnahme.
- Datei-Upload für vorherige LUV-Dokumente (PDF/DOCX) statt Copy-Paste, inkl.
  serverseitiger Textextraktion (weiterhin als nicht vertrauenswürdige Daten
  behandelt, keine Systemanweisungen).
- Präzisere, ggf. embedding-basierte Faktenabdeckungs- und
  Redundanzprüfung anstelle der Wortüberlappungs-Heuristik.
- Persistente, verschlüsselte Speicherung (bei echtem, nicht-fiktivem
  Einsatz) mit klarer Datenschutzfreigabe, Rollen-/Rechtekonzept und
  Protokollierung von Zugriffen.
- Mehrsprachige Oberfläche / Formulierungshilfen für unterschiedliche
  Zielgruppen.
- Feingranulareres Prompt-Versionierungs- und A/B-Test-Konzept inkl.
  Änderungsprotokoll pro Prompt-Version.
- Konfigurierbare Sensitive-Content-Liste (statt Code-Konstante), gepflegt
  durch Datenschutzbeauftragte.
- Barrierefreiheits-Audit (WCAG) der Wizard-Oberfläche.
