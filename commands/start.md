---
description: Guided workflow - detects current phase and shows next steps
allowed-tools: ["Read", "Glob", "AskUserQuestion", "Task"]
---

# CWE Start - Guided Workflow

Detect where the user is in their workflow and guide them to the next step.

## Phase Detection

Check the following in order:

### 1. No workflow/ directory
-> "Project not initialized. Run `/cwe:init` first."

### 2. No mission.md or empty mission.md
-> Phase: **Plan**

Use AskUserQuestion:
```
Question: "What would you like to do?"
Header: "Plan Phase"
Options:
  1. "Define product vision" - Guide through mission.md creation
  2. "Import existing vision" - Copy from existing docs
  3. "Skip to specs" - Jump to spec phase (not recommended)
```

### 3. No specs/ folders (or all empty)
-> Phase: **Spec**

Use AskUserQuestion:
```
Question: "Ready to write your first feature spec. What approach?"
Header: "Spec Approach"
Options:
  1. "Shape-Spec Interview" - Guided interview via /cwe:architect shape (Recommended)
  2. "Quick spec" - Create minimal spec from scratch
  3. "Bug fix spec" - Create fix spec
  4. "Refactoring spec" - Create refactor spec
```

If "Shape-Spec Interview": delegate to architect agent with `shape` argument.

If quick/bug/refactor, ask:
```
Question: "Describe the feature in a few words:"
Header: "Feature"
Options:
  1. "User authentication"
  2. "API endpoint"
  3. "UI component"
```
(User can type custom via "Other")

Spec folders use structure: `workflow/specs/YYYY-MM-DD-HHMM-<slug>/`
containing: plan.md, shape.md, references.md, standards.md

### 4. Spec exists but no tasks.md
-> Phase: **Tasks**

List available specs and use AskUserQuestion:
```
Question: "Which spec should we break into tasks?"
Header: "Select Spec"
Options:
  [Dynamically list spec folders]
```

Then:
```
Question: "How should tasks be organized?"
Header: "Task Style"
Options:
  1. "By component" - Group by file/module
  2. "By priority" - Critical first, nice-to-have last
  3. "By dependency" - Build order (A before B)
```

### 5. Tasks exist but not all completed
-> Phase: **Build**

Show task summary and use AskUserQuestion:
```
Question: "X tasks pending. How do you want to proceed?"
Header: "Build Mode"
Options:
  1. "Start next task" - Work on highest priority
  2. "Select specific task" - Choose from list
  3. "Run parallel" - Execute up to 3 tasks simultaneously
  4. "Show all tasks" - Review full task list
```

If "Select specific task":
```
Question: "Which task?"
Header: "Task"
Options:
  [Dynamically list pending tasks]
```

### 6. All tasks completed
-> Phase: **Review**

Use AskUserQuestion:
```
Question: "All tasks done! What's next?"
Header: "Review"
Options:
  1. "Code review" - Invoke quality agent
  2. "Run tests" - Verify everything works
  3. "Create PR" - Prepare pull request
  4. "Add more tasks" - Continue development
```

## Build Phase - Parallel Task Orchestration

When in Build phase and user selects "Run parallel":

### Wave Execution Algorithm

1. **Get Tasks:** `TaskList()` - fetch all pending tasks
2. **Filter Unblocked:** Tasks where `blockedBy` is empty OR all blockedBy tasks are completed
3. **Select Wave:** Take up to 3 unblocked tasks (sorted by priority if `metadata.priority` exists)
4. **Parallel Execution:** For each task in wave:
   - `TaskUpdate(taskId, status: "in_progress")`
   - Determine agent: `metadata.agent` > auto-detect > "builder"
   - Spawn agent with `Task` tool using `subagent_type`
5. **Wait:** All agents in wave must complete
6. **Update:** `TaskUpdate(taskId, status: "completed")` for successful tasks
7. **Repeat:** Continue until no pending tasks remain

### Example Output

```
Wave 1 (3 tasks parallel):
  [builder] Task 1: Implement API ✓
  [devops] Task 2: Setup Docker ✓
  [builder] Task 3: Add validation ✓

Wave 2 (1 task, was blocked):
  [quality] Task 4: Write tests ✓

All tasks completed.
```

## Agent Delegation

When delegating, use appropriate agent based on task type or user selection.

## Superpowers Integration

After phase detection, remind user of relevant skills:
- Planning -> "Consider using superpowers:writing-plans"
- Building -> "Builder uses TDD via superpowers:test-driven-development"
- Debugging -> "For bugs, try superpowers:systematic-debugging"
- Review -> "Use superpowers:verification-before-completion"
