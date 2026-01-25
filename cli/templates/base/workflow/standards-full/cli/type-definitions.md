# Type Definitions

All types live in `src/lib/types.ts`. No exceptions.

## Naming

- Interfaces: PascalCase, noun-based (`CheckResult`, `PreFlightReport`)
- Type aliases: PascalCase (`InstallMode`, `Severity`)
- Options interfaces: `{Command}Options` (`HealthOptions`, `InstallOptions`)
- Union types for finite states: `type X = 'a' | 'b' | 'c'`

## Structure in types.ts

1. Type aliases (simple unions)
2. Interfaces grouped by domain (comments as separators)
3. No implementation - only shape definitions

## Patterns

- Options interfaces: always include `path: string` and `verbose: boolean`
- Check results: always include `name`, `status`, `severity`, `message`
- Reports: always include `timestamp` and summary counts
- Use `fix?: string` and `autoFixable?: boolean` for actionable checks
