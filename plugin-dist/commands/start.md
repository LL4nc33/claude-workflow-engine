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

### 5. Tasks exist but not all completed
-> Phase: **Build**
-> Guide: "Ready to implement. Which task should we start?"
-> Show task list, delegate to appropriate agent

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
