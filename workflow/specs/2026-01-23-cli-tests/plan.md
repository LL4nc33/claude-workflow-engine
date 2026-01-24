# CLI Tests - Implementation Plan

## Overview
Automatisierte Tests fuer die Claude Workflow Engine CLI mit Node.js built-in test runner.

## Scope
- Unit Tests fuer 6 Libs: fs-utils, state-manager, conflict-detector, gdpr-validator, settings-merger, preflight
- Integration Tests fuer 5 Commands: install, health, status, check, resolve

## Framework
- `node:test` + `node:assert` (Node.js >= 18 built-in)
- AAA-Pattern (Arrange, Act, Assert)
- Naming: `{module}.test.ts`
- Coverage Target: 70%+

## Tasks
1. Test Infrastructure Setup (helpers.ts, package.json, tsconfig.json)
2. Unit Tests fuer jede Lib
3. Integration Tests fuer Commands
4. Build & Run Verification
