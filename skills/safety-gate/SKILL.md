---
name: safety-gate
description: >
  Use PROACTIVELY before any git commit, push, or publish operation.
  Scans for secrets, credentials, PII, and validates .gitignore.
  Blocks dangerous commits with actionable remediation guidance.
---

# Safety Gate

Pre-commit safety scanning for secrets, credentials, and sensitive data.

## When This Activates

Automatically via PreToolUse hook on:
- `git commit` — scans staged files
- `git push` — scans files since last push
- `git add -A` / `git add --all` — scans all untracked/modified files

## What Gets Scanned

### Secrets & API Keys

| Category | Patterns |
|----------|----------|
| AI API Keys | `sk-*`, `pk-*`, `ANTHROPIC_API_KEY=`, `OPENAI_API_KEY=` |
| AWS | `AKIA*` (access key IDs) |
| GitHub | `ghp_*`, `gho_*`, `github_pat_*` |
| Slack | `xoxb-*`, `xoxp-*` |
| Private Keys | `-----BEGIN.*PRIVATE KEY-----` |
| Passwords | `password=`, `passwd=`, `secret=` with literal values |
| Database URLs | `postgres://user:pass@`, `mongodb://user:pass@`, `mysql://user:pass@` |

### Dangerous File Types

| File Type | Action |
|-----------|--------|
| `.env`, `.env.*` | BLOCK — must be in .gitignore |
| `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.crt` | BLOCK — certificates/keys |
| `id_rsa*`, `id_ed25519*` | BLOCK — SSH keys |

### .gitignore Validation

Required entries:
- `.env` — environment files
- `*.pem`, `*.key` — certificates
- `node_modules/` — dependencies
- `.DS_Store` — OS files

## Remediation

### If a secret is found

1. **Remove the secret** from the file
2. **Use environment variables** instead: `process.env.API_KEY`
3. **Rotate the secret** — any committed secret is compromised
4. If already committed, use `git filter-branch` or BFG Repo-Cleaner

### If .gitignore is incomplete

1. Add the missing entries to `.gitignore`
2. Run `git rm --cached <file>` for files already tracked
3. Consider using a `.gitignore` generator for your tech stack

### False Positives

If the gate blocks a legitimate commit:
- Use `git commit --no-verify` to bypass (logged)
- Consider adding the pattern to a `.safety-gate-ignore` file (future)

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Safe — no issues found |
| 2 | BLOCKED — issues found, commit prevented |
