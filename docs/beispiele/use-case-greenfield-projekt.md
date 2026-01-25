# Use Case: Neues Projekt von Null aufsetzen

Ein Greenfield-Projekt mit der Claude Workflow Engine starten -- von der Produktvision bis zum ersten implementierten Feature.

## Szenario

Du startest ein neues SaaS-Projekt: eine Zeiterfassungs-App für Freelancer. Noch existiert kein Code, kein Repository, keine Infrastruktur. Du willst von Anfang an strukturiert arbeiten und die Claude Workflow Engine als Entwicklungs-Framework nutzen.

**Ausgangslage:**

- Leeres Projektverzeichnis
- Node.js 20 LTS installiert
- Idee im Kopf, aber noch nicht dokumentiert
- Team: 1 Entwickler (du), später sollen 2-3 Leute dazukommen

---

## Durchlauf

### Schritt 1: CLI installieren und Projekt initialisieren

```bash
# Neues Projektverzeichnis erstellen
mkdir timetrack-app && cd timetrack-app
git init

# Claude Workflow Engine CLI einrichten
# (Angenommen das CLI ist global installiert oder als lokale Dependency verfügbar)
workflow install . --dry-run
```

**Dry-Run Output:**

```
[DRY RUN] Would create the following structure:

  .claude/
    agents/
      architect.md
      explainer.md
      builder.md
      devops.md
      guide.md
      innovator.md
      quality.md
      researcher.md
      security.md
    settings.local.json
    CLAUDE.md

  workflow/
    config.yml
    orchestration.yml
    product/          (empty, filled by plan-product)
    specs/            (empty, filled by shape-spec)
    standards/
      index.yml
      global/
        tech-stack.md
        naming.md
      api/
        response-format.md
        error-handling.md
      database/
        migrations.md
      devops/
        ci-cd.md
        containerization.md
        infrastructure.md
      frontend/
        components.md
      testing/
        coverage.md

No conflicts detected.
Proceed with installation? (--dry-run mode, no changes made)
```

Alles sieht gut aus. Jetzt die echte Installation:

```bash
workflow install .
```

```
Installation complete.
  Created: .claude/ (9 agents, settings, CLAUDE.md)
  Created: workflow/ (config, standards, product/, specs/)
  Run 'workflow health .' to verify the installation.
```

**Health Check:**

```bash
workflow health .
```

```
Health Check Results:
  [OK] .claude/agents/ - 9 agent files present
  [OK] .claude/CLAUDE.md - Project instructions present
  [OK] workflow/config.yml - Valid configuration
  [OK] workflow/standards/index.yml - 11 standards registered
  [OK] workflow/product/ - Directory exists (empty, run plan-product)
  [OK] workflow/specs/ - Directory exists (empty, run shape-spec)

Status: HEALTHY (6/6 checks passed)
```

---

### Schritt 2: Produktvision definieren (Phase 1)

```
> /workflow/plan-product
```

**Interaktion mit Claude:**

```
Claude: Welches Problem loest dieses Produkt?

Du:     Freelancer verlieren Zeit durch manuelle Zeiterfassung.
        Sie vergessen Eintraege, schaetzen statt zu messen, und haben
        am Monatsende Chaos bei der Rechnungsstellung.

Claude: Fuer wen ist dieses Produkt?

Du:     Solo-Freelancer und kleine Agenturen (2-5 Personen) im
        DACH-Raum. Technisch affin, aber keine Entwickler.

Claude: Was ist die einzigartige Lösung?

Du:     Automatische Zeiterkennung basierend auf Kalender-Events und
        Projekt-Zuordnung. Ein-Klick-Export für Rechnungen.
        Privacy-first: Alle Daten lokal oder in EU-Cloud.
```

**Ergebnis in `workflow/product/`:**

`workflow/product/mission.md`:

```markdown
# Mission

## Problem
Freelancer und kleine Teams verlieren produktive Zeit durch manuelle
Zeiterfassung. Fehlende oder ungenaue Eintraege fuehren zu
Einnahmeverlusten bei der Rechnungsstellung.

## Zielnutzer
- Solo-Freelancer im DACH-Raum
- Kleine Agenturen (2-5 Personen)
- Technisch affin, aber keine Entwickler

## Einzigartige Lösung
Automatische Zeiterkennung basierend auf Kalender-Integration
mit Privacy-first-Ansatz (EU-Datenresidenz, lokale Verarbeitung).
```

`workflow/product/roadmap.md`:

```markdown
# Roadmap

## MVP (Phase 1)
- Manuelle Zeiterfassung (Start/Stop Timer)
- Projekt- und Kundenverwaltung
- Tages-/Wochen-/Monatsansicht
- CSV-Export für Rechnungen

## Post-Launch (Phase 2)
- Kalender-Integration (Google Calendar, Outlook)
- Automatische Projekt-Zuordnung
- PDF-Rechnungsgenerierung
- Team-Funktionalitaet (Einladungen, gemeinsame Projekte)

## Zukunft (Phase 3)
- KI-basierte Zeitschaetzung für neue Projekte
- Integrations-API (Zapier, Make)
- Mobile App (React Native)
```

`workflow/product/tech-stack.md`:

```markdown
# Tech Stack

## Backend
- Runtime: Node.js 20 LTS
- Framework: Fastify 4.x
- ORM: Prisma 5.x
- Datenbank: PostgreSQL 16
- Auth: Lucia Auth (Session-based)
- Validierung: Zod

## Frontend
- Framework: SvelteKit 2.x
- Styling: Tailwind CSS 3.x
- Charts: Chart.js
- Forms: Superforms

## Infrastruktur
- Hosting: Hetzner Cloud (EU)
- Container: Docker + Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Grafana + Loki

## Development
- Package Manager: pnpm
- Monorepo: Turborepo
- Testing: Vitest + Playwright
- Linting: ESLint + Prettier
```

---

### Schritt 3: Standards anpassen

Die Workflow Engine bringt Standard-Templates mit. Fuer dein Projekt passt du sie an:

**`workflow/standards/global/tech-stack.md` anpassen:**

```markdown
# Tech Stack Standard

## Verpflichtende Versionen
- Node.js: 20.x LTS (keine ungeraden Major-Versionen)
- TypeScript: 5.x (strict mode aktiviert)
- pnpm: 8.x (kein npm oder yarn)

## Package-Richtlinien
- Neue Dependencies: Immer exakte Version pinnen
- Peer Dependencies: Range erlaubt
- Dev Dependencies: Caret (^) erlaubt
- Keine Dependencies mit weniger als 1000 Weekly Downloads
  (Ausnahmen dokumentieren)

## Monorepo-Struktur
packages/
  backend/        # Fastify API
  frontend/       # SvelteKit App
  shared/         # Gemeinsame Types, Utils
  db/             # Prisma Schema + Migrations
```

**`workflow/standards/api/error-handling.md` anpassen (Auszug):**

```markdown
# Error Handling Standard

## HTTP Status Codes
- 200: Erfolgreiche Operation
- 201: Ressource erstellt
- 204: Erfolgreich, kein Content (DELETE)
- 400: Validierungsfehler
- 401: Nicht authentifiziert
- 403: Nicht autorisiert
- 404: Ressource nicht gefunden
- 409: Konflikt (z.B. doppelter Timer)
- 422: Semantisch ungueltig (z.B. End vor Start)
- 500: Interner Fehler

## Error Response Format
{
  "success": false,
  "error": {
    "code": "TIMER_ALREADY_RUNNING",
    "message": "Es laeuft bereits ein Timer für dieses Projekt",
    "details": {}  // Optional, nur bei Validierungsfehlern
  }
}

## Logging
- 4xx Fehler: Level WARN (kein Alerting)
- 5xx Fehler: Level ERROR (Alerting aktiv)
- Keine PII in Logs (DSGVO)
- Request-ID in jedem Log-Eintrag
```

---

### Schritt 4: Erstes Feature spezifizieren (Phase 2-3)

Jetzt spezifizierst du das erste MVP-Feature: den Timer.

```
> /workflow/shape-spec
```

```
Du: Ich brauche einen Timer. User klickt Start, waehlt ein Projekt,
    Timer laeuft. User klickt Stop, Zeiteintrag wird gespeichert.
    Nur ein Timer pro User gleichzeitig.
```

**Ergebnis in `workflow/specs/timer/references.md`:**

```markdown
## Anforderungen Timer

### User Stories
- Als Freelancer will ich einen Timer starten, damit meine Arbeitszeit erfasst wird
- Als Freelancer will ich den Timer stoppen und einen Zeiteintrag erhalten
- Als Freelancer will ich sehen, wie lange der aktuelle Timer laeuft
- Als Freelancer will ich den laufenden Timer einem Projekt zuordnen

### Regeln
- Maximal ein laufender Timer pro User
- Minimale Dauer: 1 Minute (kuerzere Eintraege werden verworfen)
- Timer laeuft auch bei geschlossenem Browser (Server-side)
- Timer kann nachtraeglich editiert werden (Start-/Endzeit)

### Offene Fragen
- Soll der Timer bei Inaktivitaet (> 8h) automatisch pausiert werden?
- Sollen Timer-Eintraege unter 1 Minute still verworfen oder als Fehlermeldung gezeigt werden?
```

```
> /workflow/write-spec
```

**Ergebnis in `workflow/specs/timer/spec.md`** (gekuerzt):

```markdown
# Spec: Timer Feature

## API Endpoints

### POST /api/timer/start
Body: { "project_id": UUID }
Response (201): { "success": true, "data": RunningTimer }
Error (409): Timer laeuft bereits

### POST /api/timer/stop
Response (200): { "success": true, "data": TimeEntry }
Error (404): Kein laufender Timer

### GET /api/timer/current
Response (200): { "success": true, "data": RunningTimer | null }

## Datenmodell

TimeEntry:
  id: UUID
  user_id: UUID (FK)
  project_id: UUID (FK)
  started_at: timestamp
  stopped_at: timestamp
  duration_minutes: integer (computed)
  note: string | null
  created_at: timestamp

RunningTimer:
  id: UUID
  user_id: UUID (FK)
  project_id: UUID (FK)
  started_at: timestamp
  elapsed_seconds: integer (computed, nicht persistiert)
```

---

### Schritt 5: Tasks erstellen und orchestrieren (Phase 4-5)

```
> /workflow/create-tasks
```

```markdown
# Tasks: Timer Feature

## Task 1: Datenbank-Schema
Agent: builder
- TimeEntry Model in Prisma
- Migration erstellen
- Unique Constraint: max 1 aktiver Timer pro User

## Task 2: Timer Service
Agent: builder
- start(userId, projectId): Timer starten
- stop(userId): Timer stoppen, TimeEntry erstellen
- current(userId): Laufenden Timer abfragen
- Validierung: Kein doppelter Timer

## Task 3: Timer Router
Agent: builder
- POST /api/timer/start
- POST /api/timer/stop
- GET /api/timer/current
- Auth Middleware

## Task 4: Frontend Timer-Komponente
Agent: builder
- Timer-Display mit Echtzeit-Counter
- Start/Stop Button
- Projekt-Auswahl Dropdown
- WebSocket oder Polling für Timer-Sync

## Task 5: Tests
Agent: builder
- Unit Tests für Timer Service
- Integration Tests für API
- E2E Test: Timer starten, warten, stoppen
```

```
> /workflow/orchestrate-tasks
```

Main Chat fuehrt die Tasks der Reihe nach aus und delegiert an den Builder-Agent.

---

### Bonus: DevOps-Agent für CI/CD

Sobald das erste Feature implementiert ist, setzt du CI/CD auf:

```markdown
## Task (manuell delegiert): CI/CD Pipeline
Agent: devops
Standards: devops/ci-cd, devops/containerization

Anforderungen:
- GitHub Actions Workflow
- Steps: Lint, Type-Check, Test, Build
- Docker-Image bauen und pushen (nur auf main)
- Deployment auf Hetzner Cloud (Docker Compose)
```

**Ergebnis vom DevOps-Agent:**

`.github/workflows/ci.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  build:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker Image
        run: docker build -t timetrack-app:${{ github.sha }} .
      - name: Push to Registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push timetrack-app:${{ github.sha }}
```

---

## Ergebnis

Nach diesem Durchlauf hast du:

| Was | Wo |
|-----|-----|
| Git Repository | Initialisiert mit .gitignore |
| Workflow Engine | `.claude/` und `workflow/` vollstaendig |
| Produktvision | `workflow/product/mission.md`, `roadmap.md`, `tech-stack.md` |
| Angepasste Standards | `workflow/standards/` (für dein Projekt konfiguriert) |
| Erste Feature-Spec | `workflow/specs/timer/spec.md` |
| Implementiertes Feature | Timer-API mit Tests |
| CI/CD Pipeline | `.github/workflows/ci.yml` |

**Projektstruktur:**

```
timetrack-app/
  .claude/
    agents/ (9 Agenten)
    CLAUDE.md
    settings.local.json
  .github/
    workflows/
      ci.yml
  workflow/
    config.yml
    orchestration.yml
    product/
      mission.md
      roadmap.md
      tech-stack.md
    specs/
      timer/
        references.md
        spec.md
        tasks.md
    standards/
      index.yml
      global/
      api/
      database/
      devops/
      frontend/
      testing/
  packages/
    backend/
      src/
        services/timer.service.ts
        routes/timer.router.ts
      tests/
    frontend/
      src/
        components/Timer.svelte
    shared/
    db/
      prisma/schema.prisma
  Dockerfile
  docker-compose.yml
  package.json
  pnpm-workspace.yaml
```

---

## Variationen

### Solo-Entwickler vs. Team

Als Solo-Entwickler kannst du die Product-Phase schlanker halten -- eine kurze Mission-Datei reicht oft. Sobald ein zweites Teammitglied dazukommt, werden die Standards und die dokumentierte Produktvision deutlich wertvoller.

### Anderer Tech Stack

Die Workflow Engine ist Stack-agnostisch. Statt Fastify/SvelteKit koenntest du genauso mit Django/React oder Go/HTMX arbeiten. Die `tech-stack.md` in den Standards definiert, was für dein Projekt gilt.

### Bestehendes Team übernehmen

Wenn du ein Projekt von einem anderen Team übernimmst, starte trotzdem mit `plan-product`. Nutze den Researcher-Agent um die bestehende Codebase zu analysieren und die Product-Dateien daraus abzuleiten:

```
Researcher-Agent: Analysiere die Codebase und erstelle
eine mission.md basierend auf README, package.json und
der Verzeichnisstruktur.
```

### Microservices statt Monolith

Bei Microservices installierst du die Workflow Engine im Root-Repository. Jeder Service kann eigene Standards haben (als Subdomain), aber die Produktvision und die Orchestration bleiben zentral.

---

## Verwandte Dokumentation

- [Workflow-Phasen im Detail](../workflow.md)
- [CLI-Referenz](../cli.md) -- install, health, status
- [Standards konfigurieren](../standards.md)
- [Konfigurationsdatei](../konfiguration.md) -- config.yml Optionen
- [How-To: Standards erweitern](../how-to/standards-erweitern.md) -- Eigene Standards erstellen
