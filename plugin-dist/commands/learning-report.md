---
description: Umfassender NaNo Analyse-Report generieren
interactive: false
---

# Learning Report

Generiert einen umfassenden Bericht ueber die Lernfortschritte des NaNo-Systems.

## Process

### Step 1: Gather All Data

Read and analyze:
1. All session observation files from `workflow/nano/observations/`
2. All pattern files from `workflow/nano/patterns/`
3. Evolution log from `workflow/nano/evolution/evolution-log.md`
4. Pattern rules config from `workflow/nano/config/pattern-rules.yml`
5. Current orchestration config from `workflow/orchestration.yml`

### Step 2: Analyze Trends

Calculate:
- **Delegation efficiency**: How often are tasks delegated to the right agent on first try?
- **Quality gate pass rate**: How often do gates pass on first attempt?
- **Standards impact**: Which standards correlate with higher success rates?
- **Pattern velocity**: How fast are new patterns emerging?
- **Evolution success**: How many promoted patterns improved outcomes?

### Step 3: Generate Report

Present the report in this format:

```
# NaNo Learning Report
Generated: [date]
Period: [oldest observation] to [newest observation]

## Executive Summary
[2-3 sentences about overall learning health]

## Delegation Insights

### Agent Utilization
| Agent | Delegations | Success Rate | Avg Retries |
|-------|-------------|--------------|-------------|
| ...   | ...         | ...          | ...         |

### Top Agent-Task Matches
[Most effective combinations discovered]

### Improvement Opportunities
[Combinations that often need retries]

## Quality Gate Analysis

### Pass Rates by Gate
| Gate | First-Pass Rate | Common Failures |
|------|-----------------|-----------------|
| ...  | ...             | ...             |

### Systemic Issues
[Patterns in gate failures that suggest structural problems]

## Standards Effectiveness

### Most Impactful Standards
[Standards with highest correlation to task success]

### Underutilized Standards
[Standards rarely injected but potentially useful]

### Suggested New Standards
[Gaps where no standard exists but patterns suggest one should]

## Evolution History
| Date | Pattern | Action | Confidence | Outcome |
|------|---------|--------|------------|---------|
| ...  | ...     | ...    | ...        | ...     |

## Recommendations
1. [Actionable suggestion based on data]
2. [Another suggestion]
3. [...]
```

### Step 4: Offer Actions

Use AskUserQuestion:
1. Review evolution candidates now
2. Adjust pattern detection thresholds
3. Focus learning on specific area
4. Export report as markdown file
