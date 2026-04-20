---
paths:
  - "**/migrations/**"
  - "**/db/**"
  - "**/*.sql"
  - "**/models/**"
  - "**/schema/**"
---

# Database Standards

## Migration Rules
- File naming: `{YYYYMMDD_HHMMSS}_{description}.{up|down}.sql`
- Every UP needs a DOWN (reversible migrations)
- One concern per migration file
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- No destructive changes in production without deprecation cycle

## Safe Schema Changes
- Adding columns: always with DEFAULT NULL initially
- Renaming: 4-step process (add new, copy, dual-read, drop old)
- Indexes: use CONCURRENTLY for zero-downtime
- Large tables (>100k rows): batch operations

## Environment Rules
- Development: auto-migrate, seed data OK
- Staging: auto-migrate, subset seed, destructive with approval
- Production: manual trigger, no seed, never destructive directly

## Data Privacy (configure per-project compliance regime)
- PII columns require review before merge
- Data deletion needs an audit trail
- Encryption-at-rest for sensitive columns
- For regulated workloads, add a project-specific `compliance-standards.md` covering residency (GDPR EU-only, HIPAA US-BA, etc.), retention windows, and access controls

