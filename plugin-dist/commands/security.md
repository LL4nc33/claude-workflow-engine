---
description: Delegate to security agent - audits, vulnerability assessment, OWASP
allowed-tools: ["Task"]
---

# Security

Delegate to the **security** agent for security work.

**Usage:** `/cwe:security <task>`

## Examples

- `/cwe:security audit the API endpoints`
- `/cwe:security check for vulnerabilities`
- `/cwe:security review authentication flow`

## Process

Delegate using the Task tool:

```
subagent_type: security
prompt: [user's task]
```

The security agent has:
- Restricted access (read + specific audit commands)
- OWASP Top 10 expertise
- Dependency scanning (trivy, grype, semgrep)
- GDPR compliance checking
