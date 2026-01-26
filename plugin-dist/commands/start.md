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
-> Guide: "Let's define your product vision."
-> Help user fill out workflow/product/mission.md

### 3. No specs/ folders (or all empty)
-> Phase: **Spec**
-> Guide: "Ready to write your first feature spec?"
-> Ask: "What feature do you want to build?"
-> Create spec folder and guide through spec.md creation

### 4. Spec exists but no tasks.md
-> Phase: **Tasks**
-> Guide: "Let's break this spec into tasks."
-> Read spec.md, create tasks.md with implementation steps

When creating tasks with `TaskCreate`, you can specify which agent should handle each task:
```
TaskCreate(
  description: "Implement user authentication",
  metadata: { agent: "builder" }
)
```

Valid agents: builder, architect, devops, security, researcher, explainer, quality, innovator, guide

If no agent is specified, the system auto-detects based on task keywords or defaults to "builder".

### 5. Tasks exist but not all completed
-> Phase: **Build**
-> Guide: "Ready to implement. Which task should we start?"
-> Show task list, delegate to appropriate agent

## Build Phase - Parallel Task Orchestration

When in Build phase, execute tasks in waves:

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

### 6. All tasks completed
-> Phase: **Review**
-> Guide: "Implementation complete. Let's review."
-> Suggest code review, verification

## Agent Delegation

When in Build phase, delegate to the right agent:
- Architecture decisions -> architect
- Implementation -> builder
- Infrastructure/Deploy -> devops
- Security concerns -> security
- Documentation -> researcher
- Questions/Learning -> explainer

## Superpowers Integration

Remind user of relevant superpowers skills:
- Planning -> "Consider using superpowers:writing-plans for detailed planning"
- Building -> "The builder agent uses TDD via superpowers:test-driven-development"
- Debugging -> "For bugs, try superpowers:systematic-debugging"
- Review -> "Use superpowers:verification-before-completion before marking done"
