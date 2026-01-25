# NaNo Learning System

The NaNo Learning System is a project-based learning system that observes workflow patterns and learns from usage. It was named after **Nala & Nino** and is based on the [Homunculus concept](https://github.com/humanplane/homunculus).

## Table of Contents

1. [Why NaNo](#why-nano)
2. [What is NaNo](#what-is-nano)
3. [How it Works](#how-it-works)
4. [Architecture Decisions](#architecture-decisions)
5. [Data Flow](#data-flow)
6. [Available Commands](#available-commands)
7. [Configuration](#configuration)
8. [Hooks Integration](#hooks-integration)
9. [Project Isolation](#project-isolation)
10. [GDPR Compliance](#gdpr-compliance)
11. [Troubleshooting](#troubleshooting)
12. [Examples](#examples)
13. [How-Tos](#how-tos)

---

## Implementation Status

> **Important:** Not all documented features are currently implemented. This section shows the current state.

### Currently Working

| Feature | Status | Description |
|---------|--------|-------------|
| Delegation Observations | Implemented | Agent delegations are captured and stored in session TOON files |
| Pattern Detection | Implemented | Detection of agent-task combinations above threshold |
| Evolution Candidates | Implemented | Automatic generation at high confidence |
| GDPR Cleanup | Implemented | Automatic deletion of old sessions |

### Planned / Not Implemented

| Feature | Status | Explanation |
|---------|--------|-------------|
| Quality Gate Observations | Not implemented | Requires quality gate hook integration |
| Standards Injection Tracking | Not implemented | Requires standards injection hook |
| `auto_evolution` Config | Planned | Automatic application of candidates (currently always manual) |

The quality and standards observations are defined in `pattern-rules.yml`, but the corresponding hooks to capture these events do not exist yet.

---

## Why NaNo

### The Problem

The Claude Workflow Engine is a powerful multi-agent system, but without learning, inefficient patterns repeat themselves:

**1. Context Waste**
Without a learning system, Claude delegates identical standards for similar queries every time, performs the same explorations, and consumes context tokens for already-known decisions.

```
Session 1: "Implement Login" -> Standards-Lookup -> Agent-Choice -> Implementation
Session 2: "Implement Logout" -> Standards-Lookup -> Agent-Choice -> Implementation
                                 ^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^
                                 Identical steps, no learning effect
```

**2. Recurring Errors**
When a quality gate fails repeatedly at the same point, there is no way to address it systemically without pattern recognition.

**3. Manual Optimization**
Without data, optimizations to `orchestration.yml` or standards must be based on guesswork. With NaNo, decisions are data-driven.

### The Solution

NaNo observes usage patterns and generates **Evolution Candidates** from them - concrete suggestions for improving the workflow configuration:

- Which agent-task combinations work well?
- Which quality gates fail systematically?
- Which standards are used effectively?

These insights are **never applied automatically**, but require manual review. The human remains in control.

---

## What is NaNo

NaNo (Nano-Homunculus) is a local learning system that observes the usage of the Claude Workflow Engine and derives patterns from it. Unlike the original Homunculus concept, which focuses on personal learning, NaNo focuses on **project learning**:

- **Which agents** are chosen for which tasks?
- **Which patterns** repeat in the project?
- **Which standards** are used effectively?
- **Which quality gates** fail regularly?

The goal is to generate **Evolution Candidates** from observed patterns - suggestions for improving the orchestration configuration or creating new standards.

### Naming

The name **NaNo** comes from the cats Nala and Nino, who served as inspiration for the system. "Nano" also refers to the minimal, lightweight nature of the system - it observes in the background without noticeable performance impact.

---

## How it Works

NaNo operates in a 4-stage cycle:

```
Session --> Observation --> Pattern --> Evolution Candidate
```

### 1. Session

Each Claude session receives a unique ID. All observations from a session are collected in a TOON file:

```
workflow/nano/observations/session-20260125-131559.toon
```

Example content:
```
session: 20260125-131559
started: 2026-01-25T13:17:31+01:00
level: medium
count: 2
observations:
  2026-01-25T13:17:31+01:00 | delegation | agent=explainer,task_group=explanation
  2026-01-25T13:22:34+01:00 | delegation | agent=builder,task_group=implementation
```

### 2. Observation

Observations are captured at specific events:

| Event | What is Captured |
|-------|------------------|
| Agent Delegation (Task Tool) | Agent type, task group, optional description |
| Quality Gate | Gate name, result (pass/fail) |
| Standards Injection | Which standards were injected |

The level of detail depends on the configured `observation_level`:
- **minimal**: Only agent type and task group
- **medium**: Agent, task group, outcome (default)
- **comprehensive**: Additionally task description (80 characters)

### 3. Pattern Detection

At the end of each session (Stop Hook), NaNo analyzes the observations and detects patterns:

**Delegation Patterns:**
- Which agent-task combinations occur frequently?
- A pattern is recognized once the configured threshold is reached (default: 3)

Example from `workflow/nano/patterns/delegation-patterns.md`:
```markdown
### Agent-Task Combinations (threshold: 3+)

| Count | Agent | Task Group |
|-------|-------|-----------|
| 4 | explainer | explanation |
| 3 | builder | implementation |
```

**Quality Patterns:**
- Which gates fail regularly?
- Recognize systemic problems

**Standards Patterns:**
- Which standards are used frequently?
- Correlation between standards and task success

### 4. Evolution Candidates

When a pattern reaches high confidence (default: 5+ observations), an **Evolution Candidate** is automatically generated:

```yaml
# workflow/nano/evolution/candidates/delegation-20260125.yml
type: orchestration_update
confidence: high
source: delegation-patterns
suggestion: |
  The following agent-task combinations show strong patterns
  and may benefit from explicit orchestration rules.

patterns:
  - agent: builder
    task_group: implementation
    occurrences: 12

proposed_change:
  target: workflow/orchestration.yml
  section: task_groups
  action: validate_or_add_mapping
```

Evolution Candidates are **never applied automatically**. They require manual review via `/workflow:review-candidates`.

---

## Architecture Decisions

### Why TOON Format?

**Problem:** JSON files consume many tokens when loaded into context.

**Solution:** [TOON](https://github.com/toon-format/toon) is a token-optimized format that is ~40% more compact than JSON while remaining human-readable.

```
# JSON (95 characters)
{"session":"20260125","count":3,"observations":[{"type":"delegation","agent":"builder"}]}

# TOON (58 characters, ~39% less)
session: 20260125
count: 3
observations:
  delegation | agent=builder
```

Benefits:
- Fewer tokens = more context for actual work
- Human-readable (no parsing needed for debugging)
- Easy to parse with standard Unix tools (grep, awk, sed)

### Why flock-based Locking?

**Problem:** Multiple hooks can write to the same session file simultaneously (e.g., two parallel task delegations).

**Solution:** File locking with `flock` guarantees atomic write operations.

```bash
(
  flock -w 2 200 || return 0  # 2s timeout, skip if locked
  # ... write operations ...
) 200>"${SESSION_FILE}.lock"
```

Benefits:
- **Atomicity:** No corrupted files from race conditions
- **Timeout:** 2s wait time, then graceful skip (no hang)
- **O(1) Writes:** Counter in header instead of line count on each write
- **Lock Files:** Visible for debugging (`session-*.toon.lock`)

### Why Incremental Analysis?

**Problem:** With many sessions, a full scan on each Stop Hook would be too slow.

**Solution:** Analysis only for sessions newer than the pattern file.

```bash
# Only analyze sessions newer than delegation-patterns.md
new_sessions=$(find "${OBSERVATIONS_DIR}" -name "session-*.toon" \
  -newer "${PATTERNS_DIR}/delegation-patterns.md")
```

Benefits:
- **Performance:** O(n) only for new sessions, not O(total)
- **Idempotent:** Running multiple times changes nothing
- **Append-Only:** Existing patterns are extended, not overwritten

### Why Local Processing?

**Problem:** Cloud-based analysis would complicate GDPR compliance.

**Solution:** All analyses run locally via Bash scripts.

Benefits:
- **GDPR-compliant:** No data leaves the machine
- **Offline-capable:** Works without network
- **No Dependencies:** Only Bash, grep, awk, sed (on any Unix system)

---

## Data Flow

The following diagram shows the complete NaNo data flow:

```mermaid
flowchart TD
    subgraph "Hooks Layer"
        A[SessionStart Hook] -->|Initialize Session-ID| B[Create Session File]
        C[PostToolUse Hook] -->|Task Tool Event| D[nano-observer.sh delegation]
        E[Stop Hook] -->|Session End| F[nano-observer.sh analyze]
    end

    subgraph "Observation Layer"
        D -->|flock-atomic| G[Write Session-TOON]
        G -->|agent, task_group| H[(observations/session-*.toon)]
    end

    subgraph "Analysis Layer"
        F -->|Incremental| I{New Sessions?}
        I -->|Yes| J[Pattern Aggregation]
        I -->|No| K[Skip]
        J -->|grep + awk| L[Delegation Patterns]
        J -->|grep + awk| M[Quality Patterns]
        J -->|grep + awk| N[Standards Patterns]
    end

    subgraph "Evolution Layer"
        L --> O{Threshold >= 5?}
        M --> O
        N --> O
        O -->|Yes| P[Create Evolution Candidate]
        O -->|No| Q[Wait for More Data]
        P --> R[(evolution/candidates/*.yml)]
    end

    subgraph "Review Layer"
        R --> S[/workflow:review-candidates]
        S --> T{User Decision}
        T -->|Approve| U[Update orchestration.yml]
        T -->|Defer| V[Keep Candidate]
        T -->|Reject| W[Delete Candidate]
        U --> X[evolution-log.md]
    end

    style H fill:#e1f5fe
    style R fill:#fff3e0
    style X fill:#e8f5e9
```

### Data Flow in Detail

1. **SessionStart:** Generates unique session ID, stores in `/tmp/claude-current-session-id`

2. **Task Delegation:** PostToolUse Hook fires, extracts `subagent_type` from JSON, writes TOON observation

3. **Session End:** Stop Hook triggers incremental analysis
   - Finds sessions newer than pattern files
   - Aggregates counts with grep/awk
   - Updates pattern Markdown files

4. **Evolution Check:** When pattern count >= threshold
   - Generates YAML candidate with suggestion
   - Saves to `evolution/candidates/`

5. **Review:** User runs `/workflow:review-candidates`
   - Sees pattern details and proposed change
   - Decides: Approve/Defer/Reject
   - Approved changes are logged

---

## Available Commands

### /workflow:nano-toggle

Toggles NaNo on or off.

**Options when NaNo is active:**
1. Deactivate - Sets `enabled: false`
2. Show status - Displays current metrics

**Options when NaNo is inactive:**
1. Activate - Sets `enabled: true`
2. Activate + Configure - Also starts configuration

On first activation, the directory structure is created and `nano.local.md` is generated.

### /workflow:nano-config

Interactive configuration of the NaNo system. Asks for:

1. **Observation Level**: minimal / medium / comprehensive
2. **Pattern Threshold**: 2 (aggressive) / 3 (standard) / 5 (conservative)
3. **Focus Areas**: delegation_patterns, quality_patterns, standards_effectiveness
4. **Cleanup Period**: 7 / 14 / 30 / 60 days

### /workflow:nano-session

Shows the observations of the current session in readable form:

```
NaNo Session (started 13:17)
------------------------------
13:17:31  explainer -> explanation
13:22:34  builder -> implementation
------------------------------
2 observations | level: medium | threshold: 2/3 until pattern
```

Offers quick actions:
1. Run analysis now
2. Full status
3. Done

### /workflow:nano-reset

Resets NaNo data. Options:

1. **Reset everything** - Observations, Patterns AND Evolution Candidates
2. **Observations only** - Delete session files, keep patterns
3. **Candidates only** - Delete Evolution Candidates
4. **Cancel**

**WARNING:** This action is irreversible!

### /workflow:homunculus-status

Shows the current NaNo status with actionable insights:

```
NaNo Learning Status
=====================

Status: enabled | Level: medium | Threshold: 3

Metrics
  Sessions: 7 observed sessions
  Patterns: 2 recognized patterns
  Candidates: 0 pending reviews

Insights
  - explainer dominates with 40% of all delegations
  - builder -> implementation: strong pattern (3x)
  - 2 more observations until pattern: architect -> architecture

Top Patterns
  1. explainer -> explanation (4x)
  2. builder -> implementation (3x)
```

Quick Actions:
1. Patterns in detail
2. Review Candidates
3. Current session
4. Change configuration

### /workflow:learning-report

Generates a comprehensive report on learning progress:

- **Executive Summary**: Overall overview
- **Delegation Insights**: Agent usage, top matches, improvement opportunities
- **Quality Gate Analysis**: Pass rates, systemic problems
- **Standards Effectiveness**: Most effective standards, underutilized standards
- **Evolution History**: All past promotions
- **Recommendations**: Data-driven recommendations

### /workflow:review-candidates

Interactive review of Evolution Candidates:

For each candidate:
1. Shows pattern details and proposed change
2. Asks for decision:
   - **Approve**: Apply change
   - **Defer**: Keep for later
   - **Reject**: Delete candidate
   - **Modify**: Adjust before applying

Approved candidates are logged in `evolution-log.md`.

---

## Configuration

### nano.local.md Format

The configuration is located in `.claude/nano.local.md` (automatically gitignored):

```yaml
---
enabled: true
observation_level: medium
max_session_observations: 1000
cleanup_after_days: 30
pattern_detection_threshold: 3
focus_areas:
  - delegation_patterns
  - quality_patterns
  - standards_effectiveness
---

# NaNo Learning Configuration

Project-based learning system - observes agent delegations and recognizes patterns.
```

### Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | true | NaNo active/inactive |
| `observation_level` | string | medium | Detail level: minimal, medium, comprehensive |
| `max_session_observations` | number | 1000 | Max observations per session (memory limit) |
| `cleanup_after_days` | number | 30 | Delete session files older than X days (GDPR) |
| `pattern_detection_threshold` | number | 3 | Minimum repetitions for pattern recognition |
| `focus_areas` | array | all | Which areas to observe |

### Focus Areas

| Area | Observes | Status |
|------|----------|--------|
| `delegation_patterns` | Which agents are chosen for which tasks | Implemented |
| `quality_patterns` | Quality gate results and failure patterns | Not implemented |
| `standards_effectiveness` | How often and how effectively standards are applied | Not implemented |

> **Note:** Currently only `delegation_patterns` is actively captured. The other focus areas are reserved for future extensions.

### Task Group Mapping

When capturing delegation observations, the agent type is automatically mapped to a task group:

| Agent | Task Group | Typical Tasks |
|-------|------------|---------------|
| `builder` | `implementation` | Write code, fix bugs, tests |
| `architect` | `architecture` | System design, ADRs, API review |
| `security` | `security` | Audits, vulnerability scans |
| `devops` | `infrastructure` | CI/CD, Docker, Kubernetes |
| `researcher` | `research` | Analysis, documentation |
| `explainer` | `explanation` | Code explanations, walkthroughs |
| `quality` | `quality` | Test coverage, quality gates |
| `innovator` | `ideation` | Brainstorming, alternatives |
| `guide` | `evolution` | NaNo patterns, workflow improvement |
| `Explore` | `exploration` | Codebase exploration |
| (other) | `other` | Fallback for unknown agents |

This mapping is hardcoded in `nano-observer.sh` and can be changed by modifying the `case` statement.

### Threshold Concepts

NaNo uses two different thresholds:

| Threshold | Configuration | Default | Meaning |
|-----------|---------------|---------|---------|
| **Pattern Detection** | `pattern_detection_threshold` in `nano.local.md` | 3 | Minimum repetitions for an agent-task combination to be recognized as a "pattern" and included in `delegation-patterns.md` |
| **Candidate Generation** | `candidate_threshold` in `pattern-rules.yml` | 5 | Minimum repetitions for a pattern to be proposed as an "Evolution Candidate" |

**Example:** With default values:
- A combination `builder -> implementation` appears in the pattern file after 3 observations
- After 5 observations, an Evolution Candidate is generated

### pattern-rules.yml

The file `workflow/nano/config/pattern-rules.yml` defines advanced pattern rules:

```yaml
patterns:
  delegation_efficiency:
    trigger: task_completion
    threshold: 3
    fields: [agent, task_group, retry_count, outcome]

  quality_gate_insights:      # NOT YET IMPLEMENTED
    trigger: gate_failure
    threshold: 2
    fields: [gate_name, failing_checks, agent_responsible]

  standards_effectiveness:    # NOT YET IMPLEMENTED
    trigger: standards_injection
    threshold: 5
    fields: [standards_injected, task_group, outcome]

evolution:
  candidate_threshold: 5      # For Evolution Candidate generation
  min_confidence: 0.7
  auto_generate: true         # Generates candidates, but NO auto-apply
```

### Evolution Preferences (Planned)

In the future, the following options are planned for `nano.local.md`:

```yaml
evolution_preferences:
  auto_evolution: false       # Auto-apply candidates (always false currently)
  notify_on_candidate: true   # Notification on new candidate
  min_confidence: 0.7         # Minimum confidence for candidates
```

> **Current State:** These options are not yet implemented. All candidates require manual review via `/workflow:review-candidates`.

---

## Hooks Integration

NaNo uses three hooks for data collection. Hooks are configured in `.claude/settings.local.json` (not in `hooks/hooks.json` - that file no longer exists).

### SessionStart Hook

The SessionStart hook is intentionally minimal:

```bash
#!/usr/bin/env bash
# SessionStart Hook - Absolute minimal, no output
echo "$(date +%Y%m%d-%H%M%S)" > "/tmp/claude-current-session-id" 2>/dev/null
exit 0
```

**What it does:**
- Generates a unique session ID based on timestamp
- Writes the ID to `/tmp/claude-current-session-id`
- No output (avoids hook timeout problems)

**What it does NOT do (contrary to earlier documentation):**
- Does not show NaNo status
- Does not trigger background analysis
- Does not clean up cache

These functions were removed to avoid hook timeouts. Analysis happens in the Stop hook instead.

### PostToolUse (Task) Hook

Captures agent delegations. Configuration in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/scripts/nano-observer.sh delegation"
          }
        ]
      }
    ]
  }
}
```

The hook:
1. Reads tool input from stdin (Claude Hook Protocol)
2. Extracts `subagent_type` and `description`
3. Writes observation atomically (flock-based, O(1))

### Stop Hook

Performs session analysis:

```bash
hooks/scripts/nano-observer.sh analyze
```

The analysis process:
1. Finds sessions newer than the last pattern file (incremental)
2. Analyzes delegation, quality, and standards patterns
3. Updates pattern files
4. Checks for Evolution Candidates
5. Cleans up old sessions (GDPR)

---

## Project Isolation

### Local Data

All NaNo data remains local to the project:

```
workflow/nano/
  observations/          # Session files (TOON)
  patterns/              # Recognized patterns (Markdown)
  evolution/
    candidates/          # Pending candidates (YAML)
    evolution-log.md     # Promotion history
  config/
    pattern-rules.yml    # Pattern definitions
```

### .gitignore

Observations and local config are not versioned:

```gitignore
# NaNo Learning (GDPR: no session data in repo)
workflow/nano/observations/
.claude/nano.local.md
```

Pattern files and Evolution Log **can** be versioned as they contain no personal data.

### Multiple Projects

Each project has its own NaNo system. Learnings are not shared between projects. This enables:

- Project-specific patterns
- Different configurations per project
- No data leaks between projects

---

## GDPR Compliance

NaNo was designed with privacy by design:

### Data Minimization

- **Minimal capture**: Only agent type, task group, optionally 80 character description
- **No PII**: No usernames, IP addresses, or other personal data
- **No Cloud**: All data remains local (no sync, no upload)

### Automatic Cleanup

Session files are automatically deleted after `cleanup_after_days`:

```bash
find workflow/nano/observations/ -name "session-*.toon" -mtime +30 -delete
```

Default: 30 days. Configurable from 7 to 60 days.

### Manual Deletion

Available anytime via `/workflow:nano-reset`:

- Delete observations only
- Delete candidates only
- Reset everything

### Local Processing

All analyses run locally:

- No external APIs
- No cloud services
- No telemetry

### Transparency

- Pattern files are human-readable (Markdown)
- Session files are human-readable (TOON)
- Configuration is documented and accessible

---

## Troubleshooting

### Common Problems

#### 1. No Observations Being Captured

**Symptoms:**
- `workflow/nano/observations/` is empty
- `/workflow:nano-session` shows no data

**Possible Causes and Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| NaNo not activated | `grep "enabled:" .claude/nano.local.md` | `/workflow:nano-toggle` |
| Hook not configured | Check if `hooks.json` contains Task hook | Fix hook configuration |
| Session ID problem | Multiple session files per minute | Check `/tmp/claude-current-session-id` |
| Permission error | `ls -la workflow/nano/` | Fix directory permissions |

#### 2. Hook Timeout Errors

**Symptoms:**
- "Hook timed out" message
- Observations incomplete

**Solutions:**

```bash
# PostToolUse Hook Timeout (3s default)
# Problem: flock waiting too long
# Solution: Manually delete lock file
rm workflow/nano/observations/*.lock

# Stop Hook Timeout (10s default)
# Problem: Too many session files for analysis
# Solution: Manually clean up old sessions
find workflow/nano/observations/ -name "session-*.toon" -mtime +7 -delete
```

#### 3. Pattern Files Not Being Updated

**Symptoms:**
- Observations present, but `patterns/` empty or outdated
- Stop hook runs but no updates

**Diagnosis:**
```bash
# Check if sessions are newer than patterns
ls -lt workflow/nano/observations/ | head -5
ls -lt workflow/nano/patterns/ | head -5

# Manually trigger analysis
hooks/scripts/nano-observer.sh analyze
```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Threshold not reached | Reduce threshold via `/workflow:nano-config` |
| Pattern file too recent | Delete pattern file, restart analysis |
| Grep error | Manually test `grep "| delegation |"` |

#### 4. Evolution Candidates Not Being Generated

**Symptoms:**
- Patterns present with high counts
- No files in `evolution/candidates/`

**Solution:**
```bash
# Check if counts >= 5 (candidate threshold)
grep "^|" workflow/nano/patterns/delegation-patterns.md | awk -F'|' '$2 >= 5'

# Adjust candidate threshold in pattern-rules.yml
# evolution.candidate_threshold: 5  ->  3
```

#### 5. Lock Files Remain

**Symptoms:**
- `.lock` files accumulate
- Observations are skipped

**Solution:**
```bash
# Remove orphaned lock files (older than 1 minute)
find workflow/nano/observations/ -name "*.lock" -mmin +1 -delete
```

### Debug Mode

For deeper analysis, run the observer manually with builder output:

```bash
# Test delegation manually
echo '{"subagent_type":"builder","description":"test task"}' | \
  bash -x hooks/scripts/nano-observer.sh delegation

# Analysis manually with trace
bash -x hooks/scripts/nano-observer.sh analyze

# Check status
hooks/scripts/nano-observer.sh status
```

### Complete Reset

For persistent problems: Complete restart:

```bash
# 1. Deactivate NaNo
sed -i 's/enabled: true/enabled: false/' .claude/nano.local.md

# 2. Delete all data
rm -rf workflow/nano/observations/*
rm -rf workflow/nano/patterns/*
rm -rf workflow/nano/evolution/candidates/*

# 3. Remove lock files
rm -f /tmp/nano-status-cache
rm -f /tmp/claude-current-session-id

# 4. Reactivate NaNo
sed -i 's/enabled: false/enabled: true/' .claude/nano.local.md
```

---

## Examples

### Example 1: Complete Session Observation

A typical session with multiple delegations:

**Session File** (`workflow/nano/observations/session-20260125-131559.toon`):
```
session: 20260125-131559
started: 2026-01-25T13:17:31+01:00
level: medium
count: 3
observations:
  2026-01-25T13:17:31+01:00 | delegation | agent=explainer,task_group=explanation
  2026-01-25T13:22:34+01:00 | delegation | agent=explainer,task_group=explanation
  2026-01-25T13:25:57+01:00 | delegation | agent=builder,task_group=implementation
```

**Interpretation:**
- Session ID based on start time
- Level "medium" = agent + task group without description
- Counter in header for O(1) count queries
- Pipe-separated format for easy parsing

### Example 2: Detected Delegation Pattern

After multiple sessions, the pattern analysis shows:

**Pattern File** (`workflow/nano/patterns/delegation-patterns.md`):
```markdown
# Delegation Patterns

Recognized patterns in agent delegation and task assignment.

## Active Patterns

### Agent-Task Combinations (threshold: 3+)

| Count | Agent | Task Group |
|-------|-------|-----------|
| 4 | builder | implementation |
| 4 | explainer | explanation |

### Agent Usage

- **builder**: 4 delegations
- **explainer**: 4 delegations
- **security**: 1 delegations
- **researcher**: 1 delegations
- **architect**: 1 delegations

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | 11 |
| Patterns Detected | 2 |
| Last Updated | 2026-01-25T13:26:04+01:00 |
```

**Interpretation:**
- 2 patterns detected (count >= 3)
- `builder -> implementation` and `explainer -> explanation` are the dominant combinations
- 11 observations total, distributed across 5 different agents

### Example 3: Evolution Candidate

When a pattern occurs 5+ times, a candidate is generated:

**Candidate File** (`workflow/nano/evolution/candidates/delegation-20260125.yml`):
```yaml
# Evolution Candidate: Delegation Optimization
# Generated: 2026-01-25T14:30:00+01:00
# Status: pending_review

type: orchestration_update
confidence: high
source: delegation-patterns
suggestion: |
  The following agent-task combinations show strong patterns
  and may benefit from explicit orchestration rules.

patterns:
  - agent: builder
    task_group: implementation
    occurrences: 7
  - agent: explainer
    task_group: explanation
    occurrences: 6

proposed_change:
  target: workflow/orchestration.yml
  section: task_groups
  action: validate_or_add_mapping
```

**Interpretation:**
- Automatically generated when count >= 5
- Status `pending_review` = waiting for `/workflow:review-candidates`
- Proposed change: Validate task group mappings in orchestration.yml

### Example 4: Quality Gate Pattern

With repeated gate failures:

**Pattern File** (`workflow/nano/patterns/quality-patterns.md`):
```markdown
# Quality Patterns

Recognized patterns in quality gate results.

## Active Patterns

### Gate Failure Frequency (threshold: 3+)

- **security-audit**: 4 failures
- **test-coverage**: 3 failures

## Metrics

| Metric | Value |
|--------|-------|
| Total Observations | 12 |
| Patterns Detected | 2 |
| Last Updated | 2026-01-25T15:00:00+01:00 |
```

**Interpretation:**
- Security audit gate fails systematically
- Possible action: Strengthen security standards or adjust agent configuration

### Example 5: Approved Evolution

After review, a candidate is approved:

**Evolution Log** (`workflow/nano/evolution/evolution-log.md`):
```markdown
# Evolution Log

Tracks all pattern promotions and standard evolutions.

| Date | Pattern | Action | Confidence | Target |
|------|---------|--------|------------|--------|
| 2026-01-25 | builder -> implementation (7x) | approved | high | orchestration.yml |
| 2026-01-25 | explainer -> explanation (6x) | approved | high | orchestration.yml |
```

**Interpretation:**
- Both patterns were approved and adopted in orchestration.yml
- Confidence "high" = based on 5+ observations
- Log serves as audit trail for all evolution decisions

---

## How-Tos

### How-To: Run Manual Analysis

Pattern analysis normally runs automatically at session end (Stop hook). For manual execution:

```bash
# 1. Change to project directory
cd /path/to/project

# 2. Start analysis manually
./hooks/scripts/nano-observer.sh analyze

# 3. Check results
cat workflow/nano/patterns/delegation-patterns.md
```

**With builder output:**

```bash
# Full trace for troubleshooting
bash -x ./hooks/scripts/nano-observer.sh analyze
```

**Check status:**

```bash
./hooks/scripts/nano-observer.sh status
```

Output:
```yaml
nano:
  enabled: true
  level: medium
  sessions: 7
  patterns: 2
  candidates: 0
  threshold: 3
  cleanup_days: 30
```

### How-To: Customize pattern-rules.yml

The pattern rules in `workflow/nano/config/pattern-rules.yml` define when patterns are recognized and candidates are generated.

**1. Lower threshold for pattern detection:**

```yaml
patterns:
  delegation_efficiency:
    threshold: 2    # Was: 3, now more aggressive
```

**2. Adjust candidate threshold:**

```yaml
evolution:
  candidate_threshold: 3    # Was: 5, generates candidates earlier
```

**3. Define new pattern (requires code change):**

To track a new pattern, in addition to `pattern-rules.yml`, the corresponding hook must also be implemented. Example for a hypothetical "error pattern":

```yaml
patterns:
  error_patterns:
    trigger: error_occurrence
    threshold: 2
    fields: [error_type, agent, context]
```

> **Important:** Defining in `pattern-rules.yml` alone is not enough. The observer code must capture the corresponding events.

**4. Change confidence threshold for candidates:**

```yaml
evolution:
  min_confidence: 0.5    # Was: 0.7, accepts less certain patterns
```

### How-To: Extend Task Group Mapping

To add a new agent or different mapping, edit `hooks/scripts/nano-observer.sh`:

```bash
# Find the case statement in handle_delegation()
case "${agent_type}" in
  builder) task_group="implementation" ;;
  architect) task_group="architecture" ;;
  # ...
  # New agent:
  my_new_agent) task_group="my_new_group" ;;
  *) task_group="other" ;;
esac
```

### How-To: Change Observation Level

The `observation_level` determines how much detail is captured:

```bash
# Via command (interactive)
# Run /workflow:nano-config and select level

# Or directly in nano.local.md:
# Open .claude/nano.local.md and change:
observation_level: comprehensive    # Was: medium
```

| Level | Captured Data | Storage Usage |
|-------|---------------|---------------|
| `minimal` | Only agent + task group | Low |
| `medium` | Agent + task group + outcome | Medium |
| `comprehensive` | + 80 character task description | Higher |

---

## See Also

- [Workflow Guide](workflow.md) - Main documentation of the Workflow Engine
- [Platform Architecture](platform-architecture.md) - Hook system and event-based automation
- [Error Recovery](../workflow/ERROR-RECOVERY.md) - Troubleshooting hook timeouts
- [Homunculus](https://github.com/humanplane/homunculus) - Original concept for personal learning
