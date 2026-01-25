# Security

Security audit and vulnerability expert.

**Usage:** `/security <aufgabe>` - Delegiert an Security-Agent

## Process

Delegiere die Aufgabe an den **security** Agent mit dem Task-Tool:

```
subagent_type: security
prompt: $ARGUMENTS
```

Der Security-Agent hat:
- RESTRICTED access (Audit-Tools, keine Code-Aenderungen)
- OWASP Top 10 Checklisten
- Vulnerability Scanner (trivy, grype, semgrep)
- Auth/AuthZ Review

## Beispiele

- `/security audit die API-Endpoints`
- `/security pruefe Auth-Implementation`
- `/security scanne Dependencies auf CVEs`
- `/security review Input-Validierung`
