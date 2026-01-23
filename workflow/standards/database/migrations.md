# Database Migration Standards

## Migration File Naming

```
{YYYYMMDD_HHMMSS}_{description}.{up|down}.sql
```

Example: `20260123_143000_add_users_table.up.sql`

## Migration Rules

1. **Every UP needs a DOWN** - All migrations must be reversible
2. **One concern per migration** - Don't mix table creation with data migration
3. **Idempotent when possible** - Use `IF NOT EXISTS`, `IF EXISTS`
4. **No destructive changes in production** - Use deprecation cycle instead
5. **Test both directions** - Run up AND down before merging

## Schema Change Patterns

### Adding a Column
```sql
-- UP
ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL;

-- DOWN
ALTER TABLE users DROP COLUMN phone;
```

### Renaming (Safe Pattern)
```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
-- Step 2: Copy data (separate migration)
UPDATE users SET full_name = name;
-- Step 3: Application reads from both, writes to new
-- Step 4: Drop old column (after deployment confirmed)
ALTER TABLE users DROP COLUMN name;
```

### Adding an Index
```sql
-- UP (use CONCURRENTLY for zero-downtime on PostgreSQL)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- DOWN
DROP INDEX CONCURRENTLY idx_users_email;
```

## Data Migrations

- Separate from schema migrations
- Must be idempotent (safe to re-run)
- Include progress logging for large datasets
- Consider batching for tables > 100k rows
- Always backup before data migration in production

## Environment Rules

| Environment | Auto-migrate | Seed Data | Destructive OK |
|-------------|--------------|-----------|----------------|
| Development | Yes | Yes | Yes |
| Staging | Yes | Subset | With approval |
| Production | Manual trigger | Never | Never directly |

## GDPR Considerations

- Migrations involving PII columns must be reviewed
- Data deletion migrations require audit trail
- Encryption-at-rest for sensitive columns
- Consider data residency (EU-only) for new tables

## TODO: Additional Sections

- [ ] ORM-specific patterns (Prisma, TypeORM, SQLAlchemy)
- [ ] Migration testing in CI pipeline
- [ ] Rollback automation
- [ ] Performance impact assessment template
