# Use Case: Team-Standards etablieren und durchsetzen

Einheitliche Coding-Standards fuer ein 4-koepfiges Team definieren, registrieren und in den Workflow integrieren.

## Szenario

Dein Team (4 Entwickler) arbeitet an einer SaaS-Plattform. Aktuell hat jeder seinen eigenen Stil: unterschiedliche Error-Handling-Patterns, inkonsistente Componenten-Benennung, variable Testabdeckung. Code Reviews dauern ewig, weil staendig Stil-Diskussionen aufflammen.

**Ziel:** Verbindliche Standards definieren, die von den Agenten bei der Code-Generierung automatisch befolgt werden. Keine Stil-Diskussionen mehr in Reviews -- die Standards sind die Single Source of Truth.

**Team:**

- Anna (Tech Lead, Backend)
- Ben (Fullstack)
- Clara (Frontend)
- David (Backend, DevOps)

---

## Durchlauf

### Schritt 1: Bestehende Standards verstehen

Die Workflow Engine liefert Standard-Templates in 7 Domaenen:

```bash
workflow status . --standards
```

```
Standards Registry (workflow/standards/index.yml):

  global/tech-stack.md       - Framework versions and tooling
  global/naming.md           - Naming conventions
  api/response-format.md     - API response envelope
  api/error-handling.md      - Error codes and format
  database/migrations.md     - Migration patterns
  devops/ci-cd.md            - Pipeline conventions
  devops/containerization.md - Docker patterns
  devops/infrastructure.md   - IaC conventions
  frontend/components.md     - Component structure
  testing/coverage.md        - Coverage targets
  agents/agent-conventions.md - Agent definition format

Total: 11 standards in 7 domains
Custom: 0 (all defaults)
```

### Schritt 2: Team-Bedarf identifizieren

In einem Team-Meeting definiert ihr drei Bereiche, die am dringendsten Standards brauchen:

1. **API Error Handling** -- Jeder macht es anders, Clients koennen sich auf kein Format verlassen
2. **Component Naming** -- Frontend-Komponenten heissen mal `UserCard`, mal `cardUser`, mal `user-card-component`
3. **Test Coverage** -- Reicht von 20% bis 90%, kein einheitliches Minimum

Die ersten zwei erfordern Anpassungen bestehender Standards. Fuer spezifische Team-Regeln erstellt ihr eine neue Domain.

### Schritt 3: Eigene Domain erstellen

Fuer team-spezifische Standards, die ueber die Templates hinausgehen:

**Verzeichnis erstellen:**

```
workflow/standards/
  team/                    # Neue Domain
    code-review.md         # Review-Richtlinien
    git-workflow.md        # Branch-/Commit-Konventionen
```

**`workflow/standards/team/code-review.md`:**

```markdown
# Code Review Standard

## Review-Pflichten
- Jeder PR braucht mindestens 1 Approval
- PRs ueber 400 Zeilen muessen aufgeteilt werden
- Self-Review vor PR-Erstellung (Checkliste durchgehen)

## Review-Fokus (in dieser Reihenfolge)
1. Korrektheit: Tut der Code was er soll?
2. Sicherheit: Gibt es offensichtliche Vulnerabilities?
3. Tests: Sind die kritischen Pfade abgedeckt?
4. Lesbarkeit: Versteht man den Code ohne Erklaerung?
5. Performance: Nur bei offensichtlichen Problemen

## Was NICHT in Reviews diskutiert wird
- Formatierung (wird vom Formatter geregelt)
- Naming-Stil (wird vom Naming-Standard geregelt)
- Import-Reihenfolge (wird vom Linter geregelt)

## Antwortzeiten
- PRs unter 100 Zeilen: Review innerhalb 4 Stunden
- PRs 100-400 Zeilen: Review innerhalb 1 Arbeitstag
- Dringende Fixes (Label: hotfix): Review innerhalb 1 Stunde
```

**`workflow/standards/team/git-workflow.md`:**

```markdown
# Git Workflow Standard

## Branch-Naming
- Feature: feature/TICKET-123-kurze-beschreibung
- Bugfix: fix/TICKET-456-was-gefixt-wird
- Hotfix: hotfix/TICKET-789-kritischer-fix
- Release: release/v1.2.0

## Commit Messages
Format: type(scope): description

Types: feat, fix, refactor, test, docs, chore, ci
Scope: api, frontend, db, infra, auth (optional)

Beispiele:
- feat(api): add pagination to /users endpoint
- fix(auth): handle expired refresh tokens
- test(api): add integration tests for orders

## Branch-Regeln
- main: Immer deploybar, nur via PR
- develop: Integration-Branch, PRs von Feature-Branches
- Feature-Branches: Kurzlebig (max 3 Tage), dann PR oder Split
```

### Schritt 4: Bestehende Standards anpassen

**`workflow/standards/api/error-handling.md` -- Team-spezifisch erweitert:**

```markdown
# Error Handling Standard

## Error Response Format (verbindlich)

Jede Fehlerantwort folgt diesem Schema:

{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Die angeforderte Ressource wurde nicht gefunden",
    "details": null,
    "request_id": "req_a1b2c3d4"
  }
}

### Felder

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| code | string | Ja | Maschinenlesbarer Error-Code (SCREAMING_SNAKE_CASE) |
| message | string | Ja | Menschenlesbare Beschreibung (Deutsch oder Englisch je nach Accept-Language) |
| details | object/null | Nein | Zusaetzliche Informationen (z.B. Validierungsfehler pro Feld) |
| request_id | string | Ja | Eindeutige Request-ID fuer Log-Korrelation |

### Error-Code-Namenskonvention

Format: DOMAIN_ACTION_REASON

Beispiele:
- AUTH_LOGIN_INVALID_CREDENTIALS
- USER_CREATE_EMAIL_EXISTS
- ORDER_PAYMENT_INSUFFICIENT_FUNDS
- VALIDATION_FIELD_REQUIRED

### Validierungsfehler (Details-Format)

{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Die Eingabedaten sind ungueltig",
    "details": {
      "fields": {
        "email": ["Muss eine gueltige E-Mail-Adresse sein"],
        "password": ["Mindestens 8 Zeichen", "Mindestens eine Zahl"]
      }
    },
    "request_id": "req_x9y8z7"
  }
}

### HTTP Status Mapping

| Status | Wann | Beispiel-Code |
|--------|------|---------------|
| 400 | Syntaktisch ungueltige Eingabe | VALIDATION_FAILED |
| 401 | Nicht authentifiziert | AUTH_TOKEN_MISSING |
| 403 | Authentifiziert aber nicht autorisiert | AUTH_INSUFFICIENT_PERMISSIONS |
| 404 | Ressource existiert nicht | RESOURCE_NOT_FOUND |
| 409 | Konfliktzustand | USER_EMAIL_ALREADY_EXISTS |
| 422 | Semantisch ungueltig | ORDER_AMOUNT_NEGATIVE |
| 429 | Rate Limit ueberschritten | RATE_LIMIT_EXCEEDED |
| 500 | Interner Fehler | INTERNAL_SERVER_ERROR |

### Implementierung (Express Middleware)

// src/middleware/error-handler.ts
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";

  // 5xx Fehler: Keine Details an Client leaken
  const message = statusCode >= 500
    ? "Ein interner Fehler ist aufgetreten"
    : err.message;

  const details = statusCode < 500 ? err.details : null;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      request_id: req.id,
    },
  });

  // Logging
  if (statusCode >= 500) {
    logger.error({ err, requestId: req.id }, "Internal server error");
  } else {
    logger.warn({ code, requestId: req.id }, "Client error");
  }
}

### Regeln
- NIEMALS Stack-Traces an den Client senden
- NIEMALS interne IDs oder Datenbank-Details in Error Messages
- Request-ID IMMER mitloggen (fuer Support-Anfragen)
- PII NIEMALS in Error Messages (DSGVO)
```

**`workflow/standards/frontend/components.md` -- Team-spezifisch erweitert:**

```markdown
# Component Naming Standard

## Datei-Naming

Alle Component-Dateien verwenden PascalCase:

  src/components/
    UserCard.tsx           (nicht: userCard.tsx, user-card.tsx)
    OrderList.tsx          (nicht: orderList.tsx, order_list.tsx)
    PaymentForm.tsx

## Component-Naming-Pattern

Format: [Domain][Element][Variante]

Beispiele:
- UserCard          (Domain: User, Element: Card)
- UserCardSkeleton  (Domain: User, Element: Card, Variante: Skeleton)
- OrderListItem     (Domain: Order, Element: ListItem)
- OrderListEmpty    (Domain: Order, Element: List, Variante: Empty)
- PaymentFormStep   (Domain: Payment, Element: Form, Variante: Step)

## Verzeichnisstruktur

Fuer einfache Components (1 Datei):
  src/components/UserCard.tsx

Fuer komplexe Components (mehrere Dateien):
  src/components/UserCard/
    index.tsx              # Re-export
    UserCard.tsx           # Hauptkomponente
    UserCard.test.tsx      # Tests
    UserCard.stories.tsx   # Storybook (optional)
    useUserCard.ts         # Component-spezifischer Hook (optional)

## Prop-Naming

- Boolean Props: is/has/can/should Prefix
    isLoading, hasError, canEdit, shouldAutoFocus

- Handler Props: on + Verb
    onClick, onSubmit, onChange, onUserSelect

- Render Props: render + Element
    renderHeader, renderFooter, renderEmptyState

- Daten Props: Substantiv (kein Prefix)
    user, orders, selectedItem

## Export-Regeln

- Named Exports (kein Default Export)
- Re-Export via index.ts pro Feature-Verzeichnis
- Types separat exportieren: export type { UserCardProps }

## Beispiel

// src/components/UserCard/UserCard.tsx
import type { User } from "@/types";

export interface UserCardProps {
  user: User;
  isCompact?: boolean;
  onSelect?: (userId: string) => void;
}

export function UserCard({ user, isCompact = false, onSelect }: UserCardProps) {
  return (
    <div className={isCompact ? "p-2" : "p-4"}>
      <h3>{user.name}</h3>
      {onSelect && (
        <button onClick={() => onSelect(user.id)}>
          Auswaehlen
        </button>
      )}
    </div>
  );
}

// src/components/UserCard/index.ts
export { UserCard } from "./UserCard";
export type { UserCardProps } from "./UserCard";
```

**`workflow/standards/testing/coverage.md` -- Team-spezifisch erweitert:**

```markdown
# Test Coverage Standard

## Mindest-Coverage

| Bereich | Line Coverage | Branch Coverage | Ausnahmen |
|---------|--------------|----------------|-----------|
| Services (Business Logic) | 90% | 85% | - |
| Controllers/Routes | 80% | 75% | - |
| Utils/Helpers | 95% | 90% | - |
| Frontend Components | 70% | 60% | Rein visuelle Components |
| E2E Critical Paths | - | - | Alle Happy Paths abgedeckt |

## Test-Benennung

Format: [Unit unter Test] + [Szenario] + [erwartetes Ergebnis]

Beispiele:
- "UserService.create erstellt User mit gueltigen Daten"
- "UserService.create wirft Fehler bei doppelter Email"
- "OrderController.getById gibt 404 fuer unbekannte ID"

## Test-Struktur

describe("[Klasse/Modul]", () => {
  describe("[Methode]", () => {
    it("[Szenario] -> [erwartetes Ergebnis]", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});

## Was MUSS getestet werden

- Jeder API Endpoint (Happy Path + wichtigste Error Cases)
- Jede Business-Logic-Methode
- Jede Validierungsregel
- Auth/Authz-Logik (positiv und negativ)
- Edge Cases: Leere Listen, Null-Werte, Grenzwerte

## Was KANN uebersprungen werden

- Rein dekorative Frontend-Components (nur Styling, keine Logik)
- Auto-generierter Code (Prisma Client, GraphQL Types)
- Konfigurationsdateien
- One-off Scripts (Migrationen, Seeds)

## Test-Arten und Verantwortlichkeit

| Art | Wer schreibt | Wann | Wo |
|-----|-------------|------|-----|
| Unit Tests | Feature-Entwickler | Mit dem Feature | tests/unit/ |
| Integration Tests | Feature-Entwickler | Mit dem Feature | tests/integration/ |
| E2E Tests | Team (rotierend) | Pro Sprint 2-3 neue | tests/e2e/ |
| Performance Tests | David (DevOps) | Vor Major Releases | tests/performance/ |

## CI-Integration

- Tests laufen bei jedem Push
- Coverage-Report wird als PR-Kommentar gepostet
- PR wird blockiert wenn Coverage unter Minimum sinkt
- Coverage-Trend wird woechentlich im Team-Meeting besprochen

## Konfiguration (vitest.config.ts)

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "**/generated/**",
        "**/node_modules/**",
      ],
    },
  },
});
```

### Schritt 5: Standards in der Registry registrieren

Erweitere `workflow/standards/index.yml` um die neue Domain:

```yaml
# workflow/standards/index.yml
version: "1.0"
domains:
  global:
    standards:
      - name: tech-stack
        file: global/tech-stack.md
        description: Framework versions and tooling
      - name: naming
        file: global/naming.md
        description: Naming conventions

  api:
    standards:
      - name: response-format
        file: api/response-format.md
        description: API response envelope
      - name: error-handling
        file: api/error-handling.md
        description: Error codes and format

  database:
    standards:
      - name: migrations
        file: database/migrations.md
        description: Migration patterns

  devops:
    standards:
      - name: ci-cd
        file: devops/ci-cd.md
        description: Pipeline conventions
      - name: containerization
        file: devops/containerization.md
        description: Docker patterns
      - name: infrastructure
        file: devops/infrastructure.md
        description: IaC conventions

  frontend:
    standards:
      - name: components
        file: frontend/components.md
        description: Component structure and naming

  testing:
    standards:
      - name: coverage
        file: testing/coverage.md
        description: Coverage targets and test structure

  agents:
    standards:
      - name: agent-conventions
        file: agents/agent-conventions.md
        description: Agent definition format

  # Neue Team-Domain
  team:
    standards:
      - name: code-review
        file: team/code-review.md
        description: Review process and guidelines
      - name: git-workflow
        file: team/git-workflow.md
        description: Branch and commit conventions
```

### Schritt 6: Standards-Injection in Workflows verifizieren

Wenn du jetzt einen Task erstellst, werden die relevanten Standards automatisch injiziert:

```
> /workflow/create-tasks
```

```markdown
## Task: Neuer API Endpoint POST /api/orders
Agent: debug
Standards:
  - api/response-format    # Response-Envelope beachten
  - api/error-handling     # Error-Codes nach Konvention
  - testing/coverage       # Mindestabdeckung einhalten
  - team/git-workflow      # Branch nach Konvention benennen
```

Der Debug-Agent erhaelt diese Standards als Kontext und implementiert entsprechend:

- Error Responses im definierten Format
- Error-Codes nach dem DOMAIN_ACTION_REASON Pattern
- Tests mit der definierten Mindestabdeckung
- Commit Messages im type(scope): description Format

---

## Wie Standards durchgesetzt werden

### Automatisch (durch Agenten)

Wenn Agenten Code generieren, befolgen sie die injizierten Standards. Der Architect-Agent prueft bei Reviews die Einhaltung.

### Manuell (durch Team-Prozesse)

Standards ersetzen nicht CI-Checks. Ergaenze deine Pipeline:

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: pnpm lint  # ESLint-Regeln ergaenzen die Standards

- name: Type Check
  run: pnpm typecheck

- name: Test with Coverage
  run: pnpm test -- --coverage
  # Vitest-Thresholds aus dem Coverage-Standard

- name: Workflow Health
  run: workflow health . --exit-code
```

### Bei Konflikten

Wenn ein Teammitglied von einem Standard abweichen will:

1. Im Team besprechen (nicht im PR diskutieren)
2. Wenn begruendet: Standard aktualisieren (nicht Ausnahme machen)
3. Aenderung committen, damit alle den neuen Stand haben

---

## Ergebnis

| Artefakt | Pfad | Inhalt |
|----------|------|--------|
| Error Handling Standard | `workflow/standards/api/error-handling.md` | Error-Codes, Format, Middleware |
| Component Standard | `workflow/standards/frontend/components.md` | Naming, Struktur, Props |
| Coverage Standard | `workflow/standards/testing/coverage.md` | Mindest-Coverage, Test-Struktur |
| Code Review Standard | `workflow/standards/team/code-review.md` | Review-Prozess |
| Git Workflow Standard | `workflow/standards/team/git-workflow.md` | Branch-/Commit-Konventionen |
| Registry | `workflow/standards/index.yml` | Alle Standards registriert |

**Effekt im Alltag:**

- Code Reviews fokussieren auf Logik statt Stil
- Neue Teammitglieder verstehen die Konventionen sofort
- Agenten generieren konsistenten Code
- Weniger "das machen wir aber anders"-Diskussionen

---

## Variationen

### Standards schrittweise einfuehren

Du musst nicht alle Standards auf einmal definieren. Starte mit dem groessten Schmerzpunkt (z.B. Error Handling) und fuege weitere Standards hinzu, wenn das Team sie braucht.

### Standards aus bestehendem Code ableiten

Nutze den Researcher-Agent um Patterns im bestehenden Code zu erkennen:

```
Researcher-Agent: Analysiere die bestehenden API-Endpoints und
identifiziere das haeufigste Error-Handling-Pattern. Erstelle
daraus einen Standard-Vorschlag.
```

### Standards fuer mehrere Projekte teilen

Wenn dein Team mehrere Projekte hat, kannst du Standards als Git-Submodul oder Package teilen:

```bash
# Gemeinsame Standards als eigenes Repository
git submodule add git@github.com:team/shared-standards.git workflow/standards/shared
```

Oder als npm-Package:

```json
{
  "devDependencies": {
    "@team/workflow-standards": "^1.0.0"
  }
}
```

### Widerstand im Team

Falls Teammitglieder Standards als "Buerokratie" empfinden:

- Standards sollen Entscheidungen dokumentieren, nicht erfinden
- Wenn ein Standard keinen Konsens hat, ist er noch nicht reif
- Standards koennen jederzeit geaendert werden (sie sind Code, kein Gesetz)
- Der Nutzen zeigt sich besonders bei Onboarding neuer Teammitglieder

---

## Verwandte Dokumentation

- [Standards im Detail](../standards.md) -- Registry, Domaenen, Format
- [Konfiguration](../konfiguration.md) -- Standards in config.yml referenzieren
- [Agenten und Standards-Injection](../agenten.md) -- Wie Agenten Standards nutzen
- [How-To: Standards erweitern](../how-to/standards-erweitern.md) -- Schritt-fuer-Schritt-Anleitung
