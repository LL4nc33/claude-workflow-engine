---
description: Auto-detect Phase und gefuehrter 5-Phasen Workflow
interactive: true
---

# Smart Workflow

Consolidated workflow command that guides users through all 5 phases automatically. Detects current state and continues from the appropriate phase.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Auto-detect phase** — check existing artifacts to determine where to resume
- **Minimal questions** — only ask what's needed for the current phase (max 3 per phase)
- **Phase transitions** — automatically advance when a phase completes

## Process

### Step 1: Detect Current State

Check existing artifacts to determine which phase to start/resume:

1. Check `workflow/product/mission.md` exists → Phase 1 (plan-product) complete?
2. Check `workflow/specs/` for folders with `shape.md` → Phase 2 (shape-spec) complete?
3. Check for `spec.md` in the latest spec folder → Phase 3 (write-spec) complete?
4. Check for `tasks.md` in the latest spec folder → Phase 4 (create-tasks) complete?
5. Check for `progress.md` with "completed" status → Phase 5 (orchestrate-tasks) complete?

### Step 2: Present Status and Options

Use AskUserQuestion to show the user their current state:

```
Workflow Status:
- [x/o] Phase 1: Plan Product (mission.md)
- [x/o] Phase 2: Shape Spec (shape.md)
- [x/o] Phase 3: Write Spec (spec.md)
- [x/o] Phase 4: Create Tasks (tasks.md)
- [x/o] Phase 5: Orchestrate Tasks (progress.md)

Options:
1. Continue from Phase N (recommended)
2. Start a new feature from Phase 2
3. Restart from Phase 1
```

### Step 3: Execute Selected Phase

Based on user selection, execute the appropriate phase workflow:

#### Phase 1: Plan Product
- Ask 3 key questions: What is the project? Who is it for? What tech stack?
- Create `workflow/product/mission.md` and `workflow/product/roadmap.md`
- Auto-advance to Phase 2

#### Phase 2: Shape Spec
- Ask: What feature do you want to build next?
- Create spec folder with timestamp: `workflow/specs/{YYYY-MM-DD-HHMM}-{feature-slug}/`
- Gather 3-5 key requirements (functional + non-functional)
- Create `shape.md` with gathered requirements
- Auto-advance to Phase 3

#### Phase 3: Write Spec
- Read the `shape.md` from the active spec folder
- Generate technical specification covering: architecture, data model, API, UI
- Create `spec.md`
- Auto-advance to Phase 4

#### Phase 4: Create Tasks
- Read the `spec.md`
- Break into implementable tasks with clear acceptance criteria
- Assign task groups (backend, frontend, testing, etc.)
- Create `tasks.md` with task breakdown
- Auto-advance to Phase 5

#### Phase 5: Orchestrate Tasks
- Read the `tasks.md`
- Use the Task tool to delegate to specialized agents based on task_groups mapping
- Track progress in `progress.md`
- Report completion status to user

### Step 4: Phase Transition

After each phase completion:
1. Confirm phase output was created successfully
2. Ask user: "Phase N abgeschlossen. Weiter mit Phase N+1?" (default: yes)
3. If user says no: save state and exit gracefully
4. If user says yes: continue to next phase

## Standards Injection

During Phase 5 (orchestration), inject standards based on the `selective_matching` rules:
- Read `workflow/standards/index.yml` for available standards
- Match task tags against standard tags
- Only inject standards with relevance_score >= 0.3
- Always include `global/tech-stack`
- Maximum 4 standards per task delegation

## Error Handling

- If any phase fails: report what went wrong and offer retry or manual intervention
- If user wants to skip a phase: allow it with a warning about prerequisites
- If spec folder already exists: offer to continue existing or create new

## Predictive Features

The workflow supports smart suggestions based on context and learned patterns.
Check `workflow/orchestration.yml` under `predictive:` for configuration.

### Phase Transition Suggestions

Automatically suggest next steps when:
- Spec modified 3+ times → "Ready for create-tasks?"
- All tasks done → "Ready for release?"
- Shape exists but no spec → "Continue with write-spec?"

### Smart Standards Pre-Loading

Based on task keywords, automatically suggest relevant standards:
- "auth/login/session" → security standards
- "api/endpoint/route" → API standards
- "database/migration" → database standards
- "component/ui/style" → frontend standards
- "docker/ci/deploy" → devops standards

### Contextual Hints

Show max 2 hints per interaction:
- First-run: Quick vs Smart workflow choice
- Spec writing: Focus on acceptance criteria
- Task creation: Keep tasks small (1-2 hours)
- Stuck: Suggest /workflow:help

### NaNo Integration

When enough observations exist (min 5 sessions):
- Suggest optimal agent based on historical choices
- Recommend workflow simplification if user often skips phases
- Alert when builder tasks frequently need retries
