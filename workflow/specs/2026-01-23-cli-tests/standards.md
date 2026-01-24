# CLI Tests - Testing Standards

## Conventions
- Pattern: AAA (Arrange, Act, Assert)
- Naming: `{module}.test.ts`
- Coverage: 70% minimum
- Isolation: Each test uses its own temp directory
- Cleanup: afterEach/after hooks remove temp dirs

## Structure
```
cli/src/tests/
  helpers.ts          - Shared utilities
  fs-utils.test.ts    - Filesystem utilities tests
  state-manager.test.ts
  conflict-detector.test.ts
  gdpr-validator.test.ts
  settings-merger.test.ts
  preflight.test.ts
  install.test.ts     - Integration
  commands.test.ts    - Integration
```

## Rules
- No mocking of filesystem for unit tests (use real temp dirs)
- Logger is mocked (silent) to avoid noisy output
- Each describe block tests one class or function group
- Each it/test block tests one behavior
