---
description: NaNo Evolution-Candidates interaktiv reviewen
interactive: true
---

# Review Evolution Candidates

Interaktives Review von erkannten Patterns, die zu neuen Standards promoted werden koennten.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **One candidate at a time** — present each candidate individually for review
- **Explain impact** — show what would change if promoted
- **Reversible** — all promotions can be undone

## Process

### Step 1: Load Candidates

Read all `.yml` files from `workflow/nano/evolution/candidates/`.

If no candidates exist, inform the user:
"Keine Evolution-Candidates vorhanden. Das System braucht mehr Beobachtungsdaten."

### Step 2: Present Each Candidate

For each candidate file, read it and present:

```
Evolution Candidate: [type]
==========================

Source: [which pattern file generated this]
Confidence: [high/medium/low]
Generated: [date]

Pattern:
[describe the observed pattern in plain language]

Proposed Change:
[describe what would change in orchestration.yml or standards/]

Impact:
- Affected agents: [list]
- Affected task groups: [list]
- Expected improvement: [describe]
```

### Step 3: User Decision

Use AskUserQuestion with options:
1. **Approve** — Promote to standard/orchestration rule
2. **Defer** — Keep for later review
3. **Reject** — Delete candidate (pattern not useful)
4. **Modify** — Adjust the proposed change before promoting

### Step 4: Execute Decision

**On Approve:**
1. Apply the proposed change to the target file (orchestration.yml, standards/index.yml, or new standard file)
2. Log the promotion in `workflow/nano/evolution/evolution-log.md`
3. Delete the candidate file
4. Inform the user of the change

**On Reject:**
1. Delete the candidate file
2. Optionally add to a "rejected patterns" list to prevent re-generation

**On Modify:**
1. Ask the user what to change
2. Update the candidate
3. Re-present for approval

### Step 5: Summary

After all candidates are reviewed, show:
```
Review Complete:
- Approved: N (promoted to standards/orchestration)
- Deferred: N (kept for later)
- Rejected: N (removed)
```
