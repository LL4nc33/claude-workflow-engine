# Exit Codes

| Code | Meaning | When |
|------|---------|------|
| 0 | Success | Command completed without errors |
| 1 | Error | Fatal error, command cannot complete |
| 2 | Warnings | Command completed but with warnings |
| 3 | Not installed | Engine not found at target path |

## Rules

- `process.exit(1)` only for unrecoverable errors
- `process.exit(2)` when checks pass but warnings exist
- `process.exit(3)` when StateManager reports no installation
- Implicit exit 0 (no explicit call needed)
- Always log reason before calling `process.exit()`
- Never exit silently - user must see why
