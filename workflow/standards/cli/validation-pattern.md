# Validation Pattern

## CheckResult Format

Every check returns a `CheckResult`:

```typescript
{ name: 'check_name', status: 'pass'|'fail'|'warn'|'skip',
  severity: 'error'|'warning'|'info', message: 'Human-readable',
  fix?: 'suggested command', autoFixable?: true }
```

Status-Severity mapping:
- `fail` + `error` = blocks execution
- `warn` + `warning` = proceeds with notice
- `pass` + `info` = all good
- `skip` + `info` = intentionally skipped

## Validator Class Pattern

```typescript
export class XValidator {
  private targetPath: string;
  private log: Logger;
  constructor(targetPath: string, verbose?: boolean) { ... }
  runChecks(preInstall?: boolean): CheckResult[] { ... }
  autoFix(): { fixed: string[], manual: string[] } { ... }
}
```

## Rules

- Constructor takes `targetPath` + optional `verbose`
- `runChecks()` returns `CheckResult[]` (pure checks, no side effects)
- `autoFix()` modifies files, returns what was fixed vs needs manual review
- `preInstall` flag makes autoFixable issues warnings instead of errors
- Group checks by section (`log.section()` before each group)
- Name checks with snake_case: `node_version`, `git_repo`, `gdpr_gitignore`

## Report Pattern

For aggregated results use a Report interface:

```typescript
{ timestamp: string, checks: CheckResult[],
  canProceed: boolean, warnings: number, errors: number }
```

- `canProceed` = no checks with status `fail`
- Always include `timestamp` (`new Date().toISOString()`)
- Summary via `log.summary(passed, warnings, errors)`
