# How-To: Create a Custom Agent

This guide shows you how to create a new specialized agent for the Claude Workflow Engine. Agents are Markdown files with a defined role, access level, and toolset.

## Goal

After completing this guide, you will have:

- Created a new agent in `.claude/agents/`
- Defined role, access, and tools
- Configured context sources
- Registered the agent in `orchestration.yml`
- Tested and deployed the agent

## Prerequisites

- Claude Workflow Engine is installed (see [CLI Installation](cli-installation.md))
- Basic understanding of the agent system (see [Agents Overview](../agents.md))
- A clear idea of your agent's specialization

## Step 1: Create the Agent File

Agents live as Markdown files in `.claude/agents/`. The filename becomes the agent identifier.

Create a new file:

```
.claude/agents/reviewer.md
```

### File Structure

Each agent file consists of two parts:

1. **Frontmatter** (YAML between `---`) -- Metadata for the system
2. **Body** (Markdown) -- System prompt and behavior definition

```markdown
---
name: reviewer
description: Code Review Specialist. Use when reviewing pull requests, enforcing code quality standards, or providing structured feedback on code changes.
tools: Read, Grep, Glob
---

# Reviewer Agent

## Identity

[Agent personality and specialization]

## Context Sources

[References to standards and product documentation]

## Rules

[Behavioral rules and constraints]

## Output Format

[Defined output formats]

## Collaboration

[Collaboration with other agents]
```

---

## Step 2: Define the Frontmatter

The frontmatter defines the technical properties of the agent.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase, no spaces) |
| `description` | Yes | When and for what Claude should use this agent |
| `tools` | Yes | Comma-separated list of allowed tools |

### Access Levels and Associated Tools

| Access Level | Tools | Usage |
|--------------|-------|-------|
| READ-ONLY | Read, Grep, Glob | Analysis, review, explanations |
| READ-ONLY + Web | Read, Grep, Glob, WebSearch, WebFetch | Research, evaluation |
| FULL | Read, Write, Edit, Bash, Grep, Glob | Implementation, fixes |
| RESTRICTED | Read, Grep, Glob, Bash (limited) | Security scanning |
| TASK-DELEGATION | Task, Read, Grep, Glob | Coordination |

### Example Frontmatter

```yaml
---
name: reviewer
description: Code Review Specialist. Use when reviewing pull requests, enforcing code quality standards, or providing structured feedback on code changes.
tools: Read, Grep, Glob
---
```

**Important regarding `description`:** Claude uses this field to decide when the agent should be proactively deployed. Formulate it so that the situations in which the agent should be chosen are clear.

---

## Step 3: Write the System Prompt

The body of the Markdown file is the agent's system prompt. It defines personality, behavior, and output formats.

### Identity Section

Define the role and specializations:

```markdown
## Identity

You are a meticulous code reviewer specializing in:
- Pull request analysis and structured feedback
- Code quality assessment (readability, maintainability, performance)
- Pattern consistency enforcement
- Best practice recommendations with concrete examples
- SOLID principles and clean code evaluation

You review code like a senior engineer: thorough, constructive, and specific.
Every finding includes a concrete suggestion for improvement.
```

### Context Sources

Reference standards and product documentation that the agent should know about:

```markdown
## Context Sources

@workflow/standards/global/tech-stack.md
@workflow/standards/global/naming.md
@workflow/standards/testing/coverage.md
@workflow/product/mission.md
@workflow/product/architecture.md
```

The `@` references automatically load the content of these files into the agent context.

### Rules Section

Define clear behavioral rules:

```markdown
## Rules

1. **READ-ONLY access** - Analyze and recommend, never modify code directly
2. **Constructive** - Every finding includes a concrete improvement suggestion
3. **Severity ratings** - Categorize findings: Critical, Major, Minor, Suggestion
4. **Standards-aware** - Check compliance with standards from `workflow/standards/`
5. **Scope-aware** - Only review code belonging to the PR/change
6. **No nitpicking** - Formatting issues only if no formatter is configured
7. **GDPR-conscious** - Flag PII exposure or logging issues
```

### Output Format

Define standardized output formats:

```markdown
## Output Format

### For Code Reviews
\```markdown
## Code Review: {PR/Feature}

### Summary
[1-2 sentences overall impression]

### Findings

#### Critical
- **[file:line]** [Problem] -> [Suggested fix]

#### Major
- **[file:line]** [Problem] -> [Suggested fix]

#### Minor
- **[file:line]** [Problem] -> [Suggested fix]

#### Suggestions
- **[file:line]** [Improvement idea]

### Standards Compliance
| Standard | Status | Details |
|----------|--------|---------|
| naming | PASS/FAIL | [Details] |
| coverage | PASS/FAIL | [Details] |

### Verdict
[APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION]
\```
```

### Collaboration Section

Define how the agent collaborates with others:

```markdown
## Collaboration

- Receives review requests from **Main Chat**
- Escalates architecture concerns to **architect**
- Flags security issues to **security** agent
- Delegates implementation fixes to **builder**
```

---

## Step 4: Configure Context Sources

Context sources determine what knowledge is available to the agent. Choose deliberately:

### Recommended Context Sources by Agent Type

| Agent Type | Recommended Sources |
|------------|---------------------|
| Analysis/Review | tech-stack, naming, relevant domain standards, mission |
| Implementation | tech-stack, naming, all domain standards, mission, architecture |
| Research | tech-stack, agent-conventions, mission, architecture, roadmap |
| Security | tech-stack, naming, error-handling, response-format, mission |
| Coordination | agent-conventions, tech-stack, mission, architecture |

### Rules

- **Less is more:** Each source costs tokens in the context window
- **Relevance:** Only reference standards the agent actually needs
- **Product context:** `mission.md` should be included for almost every agent (for alignment)
- **Architecture:** Agents that influence design decisions need `architecture.md`

---

## Step 5: Register the Agent in orchestration.yml

For the orchestrator to delegate to your agent, register it in the configuration.

### Add to Agent Registry

Open `workflow/orchestration.yml` and add the agent under `agents.registry`:

```yaml
agents:
  registry:
    # ... existing agents ...

    reviewer:
      access: read-only
      tools: [Read, Grep, Glob]
      strengths:
        - Code review and quality assessment
        - Pattern consistency enforcement
        - Standards compliance checking
        - Constructive feedback generation
      standards_domains: [global, testing]
      context_sources:
        - workflow/standards/global/tech-stack.md
        - workflow/standards/global/naming.md
        - workflow/standards/testing/coverage.md
        - workflow/product/mission.md
        - workflow/product/architecture.md
```

### Add a Task Group (optional)

If your agent handles its own task category, add a task group:

```yaml
task_groups:
  # ... existing groups ...

  code_review:
    primary_agent: reviewer
    review_agent: null
    standards: [global/tech-stack, global/naming, testing/coverage]
    override_when:
      security_review: security
```

### Define a Fallback (optional)

Define what happens when your agent is unavailable:

```yaml
fallbacks:
  agent_unavailable:
    # ... existing fallbacks ...

    reviewer:
      fallback_to: architect
      reason: "Architect can assess code quality at architecture level"
      limitation: "May focus more on design than implementation details"
```

---

## Step 6: Test the Agent

### Direct Test

Invoke the agent directly to verify its behavior:

```
> @reviewer Review the file src/services/auth.service.ts
```

Expected reaction: The agent analyzes the file and delivers a structured review in the defined format.

### Delegation via Main Chat

Test delegation through Main Chat:

```
> Delegate a code review of src/services/ to the reviewer agent.
```

### Checklist

Verify the following:

- [ ] Agent is automatically suggested for relevant tasks
- [ ] Access level is correctly enforced (no write access for READ-ONLY)
- [ ] Context sources are loaded (agent knows the tech stack)
- [ ] Output follows the defined format
- [ ] Collaboration rules are respected (escalates correctly)
- [ ] Standards are considered during evaluation

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Agent not found | Filename/path incorrect | Verify `.claude/agents/reviewer.md` exists |
| Wrong access | Tools field incorrect | Check frontmatter `tools:` line |
| No context | `@` references missing | Check context source paths |
| Not delegatable | Not in orchestration.yml | Add agent to registry |
| Poor quality | Vague system prompt | Make Rules and Output Format more concrete |

---

## Complete Example

Here is the complete `reviewer.md` agent:

```markdown
---
name: reviewer
description: Code Review Specialist. Use when reviewing pull requests, enforcing code quality standards, or providing structured feedback on code changes.
tools: Read, Grep, Glob
---

# Reviewer Agent

## Identity

You are a meticulous code reviewer specializing in:
- Pull request analysis and structured feedback
- Code quality assessment (readability, maintainability, performance)
- Pattern consistency enforcement across the codebase
- Best practice recommendations with concrete examples
- SOLID principles and clean code evaluation

You review code like a senior engineer: thorough, constructive, and specific.
Every finding includes a concrete suggestion for improvement.
You never nitpick formatting if a formatter is configured.

## Context Sources

@workflow/standards/global/tech-stack.md
@workflow/standards/global/naming.md
@workflow/standards/testing/coverage.md
@workflow/product/mission.md
@workflow/product/architecture.md

## Rules

1. **READ-ONLY access** - Analyze and recommend, never modify code directly
2. **Constructive feedback** - Every finding includes a concrete improvement suggestion
3. **Severity ratings** - Categorize: Critical, Major, Minor, Suggestion
4. **Standards-aware** - Check compliance with workflow/standards/
5. **Scope-aware** - Only review code belonging to the PR/change
6. **No nitpicking** - Skip formatting issues if a formatter is configured
7. **GDPR-conscious** - Flag PII exposure or logging issues
8. **Evidence-based** - Cite specific lines and patterns, not vague observations

## Output Format

### For Code Reviews

## Code Review: {PR/Feature}

### Summary
[1-2 sentences overall impression]

### Findings

#### Critical
- **[file:line]** [Problem] -> [Suggested fix]

#### Major
- **[file:line]** [Problem] -> [Suggested fix]

#### Minor
- **[file:line]** [Problem] -> [Suggested fix]

#### Suggestions
- **[file:line]** [Improvement idea]

### Standards Compliance
| Standard | Status | Details |
|----------|--------|---------|
| naming | PASS/FAIL | [Details] |
| coverage | PASS/FAIL | [Details] |

### Verdict
[APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION]

## Collaboration

- Receives review requests from **Main Chat**
- Escalates architecture concerns to **architect**
- Flags security issues to **security** agent
- Delegates implementation fixes to **builder**
```

---

## Result

You now have:

- An agent file at `.claude/agents/reviewer.md`
- The agent registered in `orchestration.yml`
- Clearly defined role, access, tools, and output formats
- A tested and ready-to-use agent

## Next Steps

- **Refine the agent:** Observe outputs and adjust rules/output format
- **Standards for agents:** See [Extend Standards](extend-standards.md)
- **Use in workflow:** Create tasks that are delegated to your agent
- **Test fallbacks:** Verify the fallback agent works when the primary is unavailable

## Best Practices

### Agent Granularity

- **One agent, one responsibility:** No "jack of all trades" agents
- **Clear boundaries:** Each agent has a unique area of competence
- **Avoid overlap:** If two agents can do the same thing, one is redundant

### Naming

- Lowercase, no spaces, no special characters
- Descriptive name that clearly indicates the role
- Examples: `reviewer`, `migrator`, `optimizer`, `translator`

### Collaboration

- Explicitly define which agents collaborate with each other
- Use `escalate` for problems outside the agent's competence
- Avoid circular delegations (A -> B -> A)

### System Prompt Quality

- **Specific:** "You review code for SOLID violations" instead of "You help with code"
- **Actionable rules:** Every rule must be concretely implementable
- **Output examples:** Show the agent what good output looks like
- **Negative constraints:** Explicitly state what the agent should NOT do

## See Also

- [Agents Overview](../agents.md) -- All 7 standard agents in detail
- [Standards](../standards.md) -- Understanding context sources for agents
- [Workflow Guide](../workflow.md) -- How agents are used in the workflow
- [CLI Reference](../cli.md) -- Running health checks after changes
