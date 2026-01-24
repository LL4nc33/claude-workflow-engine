# CLI Tests - Implementation Plan

## Overview
Automatisierte Tests für die Claude Workflow Engine CLI mit Node.js built-in test runner.

## Scope
- Unit Tests für 6 Libs: fs-utils, state-manager, conflict-detector, gdpr-validator, settings-merger, preflight
- Integration Tests für 5 Commands: install, health, status, check, resolve

## Framework
- `node:test` + `node:assert` (Node.js >= 18 built-in)
- AAA-Pattern (Arrange, Act, Assert)
- Naming: `{module}.test.ts`
- Coverage Target: 70%+

## Tasks
1. Test Infrastructure Setup (helpers.ts, package.json, tsconfig.json)
2. Unit Tests für jede Lib
3. Integration Tests für Commands
4. Build & Run Verification
