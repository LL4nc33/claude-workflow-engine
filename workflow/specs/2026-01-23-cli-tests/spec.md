# Technical Specification: CLI Unit & Integration Tests

## Overview

**Status:** Implemented
**Created:** 2026-01-23
**Spec Folder:** workflow/specs/2026-01-23-cli-tests/
**Shape Reference:** ./shape.md

## Summary

Automatisierte Unit- und Integration-Tests für alle 6 Lib-Module und 5 Command-Module der Claude Workflow Engine CLI, implementiert mit dem Node.js built-in test runner (`node:test` + `node:assert`).

## Technical Design

### Test Infrastructure

```typescript
// cli/src/tests/helpers.ts — Shared test utilities

export function createTempDir(): string
// Creates isolated temp dir via fs.mkdtempSync in os.tmpdir()
// Tracks created dirs for cleanup

export function cleanupTempDir(dir: string): void
// Removes temp dir recursively, removes from tracking

export function cleanupAllTempDirs(): void
// Cleans all tracked temp dirs (for global afterAll)

export function createMockLogger(): Logger
// Returns Logger instance with all output methods replaced by noop

export function setupTestProject(dir: string): void
// Creates minimal project structure:
//   workflow/standards/global/, workflow/product/, workflow/specs/
//   .claude/agents/, .claude/commands/workflow/, .claude/skills/workflow/
//   workflow/config.yml (with local_only: true)
//   .claude/CLAUDE.md, .claude/settings.local.json
//   .gitignore, .git/

export function writeTestFile(filePath: string, content: string): void
// Writes file with recursive parent directory creation
```

### Test File Structure

```
cli/src/tests/
├── helpers.ts                 — Shared utilities (no tests)
├── fs-utils.test.ts           — 32 tests, 14 functions
├── state-manager.test.ts      — 22 tests, StateManager class
├── conflict-detector.test.ts  — 14 tests, ConflictDetector class
├── gdpr-validator.test.ts     — 22 tests, GDPRValidator class
├── settings-merger.test.ts    — 20 tests, SettingsMerger class
├── preflight.test.ts          — 14 tests, PreFlightChecker class
├── install.test.ts            — 10 tests, install command integration
└── commands.test.ts           — 40 tests, health/status/check/resolve integration
```

### Interface Design

Alle Tests folgen dem AAA-Pattern (Arrange, Act, Assert):

```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';

describe('ModuleName', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('methodName', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = ...;
      // Act
      const result = module.method(input);
      // Assert
      assert.strictEqual(result, expected);
    });
  });
});
```

### Implementation Details

#### Unit Tests — fs-utils (32 Tests)

| Function | Test Cases |
|----------|-----------|
| `pathExists` | existing file, existing dir, non-existing |
| `isDirectory` | dir, file, non-existing |
| `isFile` | file, dir, non-existing |
| `readFileSafe` | existing, non-existing, empty |
| `writeFileSafe` | basic write, parent creation, overwrite |
| `fileChecksum` | consistent, different content, non-existing |
| `stringChecksum` | deterministic, hex format, different inputs |
| `createBackup` | file backup, dir backup, auto-create dir, non-existing source |
| `copyDirRecursive` | flat copy, nested copy |
| `listFilesRecursive` | relative paths, empty dir, relativeTo param |
| `normalizePath` | relative, backslashes, absolute |
| `findWorkflowRoot` | found, not found |
| `matchesGitignorePattern` | prefix wildcard, suffix wildcard, exact match, no match, regex |
| `parseGitignore` | patterns, comments/empty, non-existing |
| `ensureGitignorePatterns` | add missing, skip existing, create new file |

#### Unit Tests — state-manager (22 Tests)

| Method | Test Cases |
|--------|-----------|
| `isInstalled` | false when no state, true when initialized |
| `initialize` | correct structure, persist to disk, checksums calculated |
| `getState` | null when empty, returns state, null for corrupted |
| `getVersion` | null when uninstalled, version string |
| `recordUpdate` | append history, record errors, update timestamp |
| `createBackup` | backup workflow dir, null when nothing to backup |
| `checkIntegrity` | intact, modified, missing, empty when uninstalled |
| `listBackups` | empty, lists entries |
| `cleanBackups` | removes old, keeps when under limit |
| `rollback` | fails without backup, fails with bad path |

#### Unit Tests — conflict-detector (14 Tests)

| Method | Test Cases |
|--------|-----------|
| `detect` | empty report, file conflicts, no conflict for matching, command conflicts |
| `runChecks` | pass for clean, existing installation, write permissions, file/command conflict results |
| `detectFileConflicts` | modified in dirs, exists-only-in-target |
| `detectCommandConflicts` | no conflicts, multiple conflicts |

#### Unit Tests — gdpr-validator (22 Tests)

| Method | Test Cases |
|--------|-----------|
| `validate` | compliant, non-compliant (no gitignore), issues with gaps, recommendations |
| `checkGitignore` | missing file, missing patterns, all present |
| `scanForPII` | email, credit card, credentials, skip examples, skip comments, only md/yml |
| `checkLocalOnlyConfig` | missing setting, present setting |
| `autoFix` | add patterns, report manual, skip existing |
| `patternCovers` | *.ext covers specific.ext, prefix* covers prefix.suffix |
| `runChecks` | returns CheckResult[], pre-install mode warnings |

#### Unit Tests — settings-merger (20 Tests)

| Method | Test Cases |
|--------|-----------|
| `generate` | default, node, python, rust, devops, security, no extras, dedup, includes base bash |
| `merge` | create new, preserve existing, no duplicates, dry-run, filePath, preserve fields |
| `validateExisting` | valid, missing perms, extra perms, missing file, corrupted file |

#### Unit Tests — preflight (14 Tests)

| Method | Test Cases |
|--------|-----------|
| `run` | report structure, node version, git, platform, target path, non-existing path, non-git-repo, git repo, force=true, force=false |
| `checkEnvironment` | nodeVersion, platform |
| `checkPlatform` | disk space |
| `checkTargetPath` | file-not-dir |

#### Integration Tests — install (10 Tests)

- Module export verification
- Directory structure creation
- Dry-run no-modification
- `.gitignore` GDPR pattern creation
- `.gitignore` append without duplication
- `StateManager` integration (`.installation-state.json`)
- `SettingsMerger` integration (`settings.local.json`)
- `GDPRValidator` auto-fix integration
- Full install flow simulation
- Skip without `--force` / overwrite with `--force`

#### Integration Tests — commands (40 Tests)

**Health:** core file check, missing files, integrity, settings validation, GDPR pass/fail, directory structure

**Status:** not-installed, correct info, integrity stats, backup listing

**Check:** no conflicts, file conflicts, command conflicts, missing patterns, auto-fix, permissions

**Resolve:** backup before resolution, overwrite with template, GDPR auto-fix

### Error Handling

| Error Case | Handling | Test Strategy |
|------------|----------|---------------|
| Non-existing path | Functions return null/false/[] | Assert null/false/empty return |
| Corrupted JSON | getState returns null | Write invalid JSON, assert null |
| Permission denied | writeFileSafe returns false | Not tested (would need root) |
| process.exit calls | Not testable directly | Test conditions that lead to exit |
| Console output noise | Mock logger suppresses | silenceConsole/restoreConsole pattern |

### Console Suppression Strategy

Integration tests that exercise code with console output use:

```typescript
const originalLog = console.log;
const originalError = console.error;

function silenceConsole() {
  console.log = () => {};
  console.error = () => {};
}

function restoreConsole() {
  console.log = originalLog;
  console.error = originalError;
}
```

## Standards Compliance

- **testing/coverage**: 174 Tests, 70%+ funktionale Coverage aller öffentlichen APIs
- **global/naming**: `{module}.test.ts` Namenskonvention
- **global/tech-stack**: Node.js built-in test runner, keine externen Test-Dependencies

## Dependencies

- `node:test` — Built-in test runner (Node.js >= 18)
- `node:assert` — Built-in assertion library
- `node:fs` — Filesystem operations in tests
- `node:path` — Path manipulation
- `node:os` — Temp directory creation

Keine externen Dependencies erforderlich.

## Testing Strategy

### Unit Tests (6 Module)
- Jede exportierte Funktion/Methode wird getestet
- Positive und negative Fälle (happy path + error cases)
- Randfälle (leere Eingaben, fehlende Dateien, korrupte Daten)

### Integration Tests (5 Commands)
- End-to-End Flows in isolierten temp directories
- Komponenten-Interaktion (StateManager + SettingsMerger + GDPRValidator)
- Simulated install/health/status/check/resolve Workflows

### Isolation
- Jeder Test nutzt eigenes temp dir via `createTempDir()`
- `afterEach` räumt auf via `cleanupTempDir()`
- Keine Modifikation echter Projektdateien
- Kein Netzwerk-Zugriff

## Build & Run

```bash
# Kompilieren
cd cli && npm run build

# Tests ausführen
npm test

# Watch-Modus (Entwicklung)
npm run test:watch
```

### package.json Scripts

```json
{
  "test": "node --test dist/tests/*.test.js",
  "test:watch": "tsc --watch & node --test --watch dist/tests/*.test.js"
}
```

## Performance Considerations

- Tests laufen in ~1.2 Sekunden (174 Tests)
- Temp-Dir-Erstellung ist der Hauptkostenfaktor
- Keine Parallelisierung nötig bei dieser Testanzahl

## Migration / Rollout

- Tests kompilieren mit dem Hauptprojekt (gleiche tsconfig)
- Kein separater Test-Build-Step nötig
- `dist/tests/*.test.js` wird automatisch vom `tsc` Build erzeugt

## Verification Results

```
# tests 174
# suites 71
# pass 174
# fail 0
# cancelled 0
# skipped 0
# duration_ms ~1150
```

## Open Questions

- [x] Test-Framework: Node.js built-in (entschieden)
- [x] Filesystem-Mocking: Nein, echte temp dirs (entschieden)
- [x] Coverage-Tool: Noch nicht konfiguriert (c8 oder --experimental-test-coverage)
- [ ] CI-Integration: GitHub Actions Workflow für automatische Test-Ausfuehrung
