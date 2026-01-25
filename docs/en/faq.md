# FAQ & Troubleshooting

Here you can find answers to the most frequently asked questions about the Claude Workflow Engine.
If your problem is not covered here, check the linked detail pages or
create an issue in the repository.

---

## Setup

### 1. What are the prerequisites?

You need the following tools on your system:

- **Node.js >= 18** (for the CLI)
- **Claude Code CLI** (as runtime for the agents)
- **Git** (for version control and standards management)

Check your installation:

```bash
node --version    # >= 18.0.0
claude --version  # Claude Code CLI must be installed
git --version     # any recent version
```

If Node.js is missing or outdated, installation via `nvm` is recommended:

```bash
nvm install 18
nvm use 18
```

---

### 2. How do I install the Workflow Engine into my existing project?

Use the `workflow install` command with `--dry-run` to first see what will happen:

```bash
# Preview of planned changes
workflow install --dry-run

# Actual installation
workflow install
```

The installer creates the following structure in your project:

```
.claude/
  agents/           # Agent definitions
  settings.local.json
workflow/
  config.yml        # Main configuration
  orchestration.yml # Orchestration
  standards/        # Standards by domain
  product/          # Product context (mission, roadmap, architecture)
  specs/            # Feature specifications
```

Existing files are never overwritten. In case of conflicts, the CLI shows a `CONFLICT` warning (see Troubleshooting below).

---

### 3. Can I use the engine without the CLI?

Yes, this is possible. You can set up the files manually:

1. Copy the directory structure (`workflow/`, `.claude/agents/`) into your project
2. Create or adjust the `CLAUDE.md` in the project root
3. Register the standards in `workflow/standards/index.yml`
4. Configure `workflow/config.yml` for your project

The downside: You lose CLI features like `--dry-run`, automatic conflict detection, and `workflow check`. Manual setup is mainly suitable for special cases or when you want to heavily customize the structure.

---

### 4. Does this work without Claude Code?

No. The agents are implemented as Claude Code subagents and require the Claude Code runtime. Specifically:

- Agent definitions in `.claude/agents/` are loaded by Claude Code as subagents
- The `Task` tool for agent delegation is a Claude Code feature
- Slash commands (`/plan-product`, `/shape-spec`, etc.) are Claude Code commands

Without Claude Code, you can use the standards and specs as pure documentation, but the agent orchestration will not work.

---

## Workflow

### 5. Do I always have to go through all 5 phases?

No. The phases build on each other, but you can start where it makes sense:

| Situation | Start with |
|-----------|-----------|
| New project, no product vision | `/plan-product` |
| Product exists, new feature | `/shape-spec` |
| Shape is already clear, only spec missing | `/write-spec` |
| Spec exists, need tasks | `/create-tasks` |
| Tasks are defined, just execute | `/orchestrate-tasks` |

Note: Later phases expect certain artifacts. If you start `/create-tasks`, a `spec.md` must be present in the spec folder.

---

### 6. Can I cancel a running workflow?

Yes. You can cancel at any time (Ctrl+C or end the session). All previously generated artifacts are preserved:

- Already written specs, shapes, tasks remain in `workflow/specs/{folder}/`
- Progress is recorded in `progress.md`
- You can resume at the same point later

There is no "corrupt state" -- the engine is idempotent. Running a phase again overwrites the previous artifacts in that folder.

---

### 7. What happens when a phase fails?

The engine pauses and shows an error message with context:

```
[ERROR] Phase 'write-spec' failed: quality gate 'gate_1_pre_implementation' not passed
  - Check: spec_architecturally_sound -> FAILED
  - Reason: Missing dependency analysis for database layer
  - Action: Add database dependencies to the spec and restart
```

You can:
1. Fix the problem and restart the phase
2. Manually override the quality gate (if `allow_override: true` is configured)
3. Go back to the previous phase and make improvements there

---

### 8. How do I link multiple features?

Each feature gets its own folder under `workflow/specs/`:

```
workflow/specs/
  20250115-user-auth/
    shape.md
    spec.md
    tasks.md
  20250120-payment-integration/
    shape.md
    spec.md
    tasks.md
```

Features are independent of each other. If Feature B depends on Feature A, document this in the `spec.md` of Feature B under "Prerequisites" or "Dependencies". The engine does not enforce feature ordering -- this is a deliberate design decision.

---

## Agents

### 9. Can I create custom agents?

Yes. Create a Markdown file in `.claude/agents/` with frontmatter for configuration:

```markdown
---
name: my-custom-agent
access: read-only
tools:
  - Read
  - Grep
  - Glob
---

# My Custom Agent

## Task
[Description of what the agent does]

## Methodology
[How the agent proceeds]
```

Then register the agent in `workflow/config.yml` under `agents.available` and in `workflow/orchestration.yml` under `agents.registry`. For a detailed guide, see the how-to [Create a Custom Agent](how-to/create-custom-agent.md).

---

### 10. Why is the architect agent not allowed to write?

This is a deliberate design principle: **Separation of Concerns**.

- The architect **designs** (specs, ADRs, reviews) -- but does not implement
- The builder agent **implements** -- but does not make architectural decisions
- Main Chat **coordinates** -- delegates tasks to specialized agents

If the architect could write, architectural reviews and simultaneous code changes could lead to uncontrolled states. The separation ensures that every change goes through the intended channel (builder agent with standards injection).

---

### 11. How do agents communicate with each other?

Agents do **not** communicate directly with each other. Communication runs exclusively through Main Chat:

```
Main Chat --[Task Tool]--> Builder Agent
Main Chat --[Task Tool]--> Security Agent
Main Chat <--[Result]--- Builder Agent
```

Main Chat:
1. Reads the task definition and associated standards
2. Formulates a delegation prompt (with standards injection)
3. Delegates via the `Task` tool to the responsible agent
4. Receives the result and updates `progress.md`
5. Delegates the next task based on the result

There is no direct agent-to-agent communication. This prevents uncontrolled side effects.

---

### 12. Can I customize agent access rights?

Yes. Access rights are defined in two places:

1. **In the agent file** (`.claude/agents/{name}.md`):
   ```yaml
   ---
   access: full  # Options: read-only, full, restricted, task-delegation
   tools:
     - Read
     - Write
     - Edit
     - Bash
   ---
   ```

2. **In `orchestration.yml`** under `agents.registry`:
   ```yaml
   my-agent:
     access: full
     tools: [Read, Write, Edit, Bash, Grep, Glob]
   ```

Both must be consistent. The tools in the agent file determine what Claude Code actually allows the agent to do.

---

## Standards

### 13. What is the difference between standards and specs?

| Aspect | Standards | Specs |
|--------|-----------|-------|
| **Purpose** | HOW (how to build) | WHAT NEXT (what to build) |
| **Lifespan** | Long-lived, cross-project | One-time per feature |
| **Path** | `workflow/standards/` | `workflow/specs/{feature}/` |
| **Example** | "API responses always have a `data` envelope" | "User auth needs login, register, password reset" |
| **Who uses them** | All agents (via injection) | Main Chat and responsible agent |

Standards define the quality rules. Specs define what is concretely implemented. A feature spec references relevant standards, but standards never reference individual specs.

---

### 14. How do I create a new standards domain?

Three steps:

1. **Create the folder:**
   ```bash
   mkdir -p workflow/standards/my-domain
   ```

2. **Create a standard file** (e.g., `workflow/standards/my-domain/my-topic.md`):
   ```markdown
   # My Topic Standard

   ## Conventions
   - Rule 1: ...
   - Rule 2: ...

   ## Examples
   ...
   ```

3. **Register in `workflow/standards/index.yml`:**
   ```yaml
   my-domain:
     my-topic:
       description: Description of the standard
       tags: [relevant, tags, for, matching]
   ```

4. **Add standards mapping in `orchestration.yml`:**
   ```yaml
   standards_injection:
     domain_mapping:
       my-domain:
         - my-domain/my-topic
   ```

For a detailed guide, see [Extend Standards](how-to/extend-standards.md).

---

### 15. Are standards automatically injected?

Yes, based on the configuration in `workflow/orchestration.yml`:

- `always_inject` standards are included with **every** delegation (e.g., `global/tech-stack`)
- `domain_mapping` determines which standards are loaded for which task type
- The `task_groups` in `orchestration.yml` define which standards are relevant per task group

Example: A backend task automatically receives:
```
global/tech-stack (always_inject)
global/naming (domain_mapping: backend)
api/response-format (domain_mapping: backend)
api/error-handling (domain_mapping: backend)
```

The injection happens inline -- the standard content is inserted directly into the delegation prompt, since subagents cannot resolve file paths.

---

## CLI

### 16. Why does 'workflow install' fail?

Common causes and solutions:

**Node.js version too old:**
```bash
node --version
# If < 18: nvm install 18 && nvm use 18
```

**Missing write permissions:**
```bash
# Check permissions in the target directory
ls -la .
# If needed: sudo chown -R $USER:$USER .
```

**Existing files with conflicts:**
```bash
# Show conflicts
workflow check --type conflicts

# Options:
workflow install --force      # Overwrites existing files
workflow install --merge      # Attempts to merge
workflow install --skip       # Skips conflicts
```

**CLAUDE.md already exists:**
The CLI appends the workflow section to existing CLAUDE.md files instead of overwriting them. If the file is locked or has unexpected content, check it manually.

---

### 17. What exactly does --dry-run do?

`--dry-run` simulates the command without making changes to the file system:

```bash
workflow install --dry-run
```

Output:
```
[DRY-RUN] Would create: .claude/agents/architect.md
[DRY-RUN] Would create: .claude/agents/builder.md
[DRY-RUN] Would create: workflow/config.yml
[DRY-RUN] Would create: workflow/standards/global/tech-stack.md
[DRY-RUN] Would modify: CLAUDE.md (append workflow section)
[DRY-RUN] Would skip: .gitignore (already contains patterns)

Summary: 12 files to create, 1 to modify, 1 skipped
No changes were made.
```

This is particularly useful with existing projects to understand what will happen before installation.

---

### 18. How do I uninstall the engine?

**Option A: CLI Rollback** (recommended)
```bash
workflow rollback
```
This removes all files created by `workflow install` and restores the previous state (provided a backup exists).

**Option B: Manual removal**
```bash
# Remove workflow directory
rm -rf workflow/

# Remove agent definitions
rm -rf .claude/agents/

# Clean up CLAUDE.md (manually remove workflow section)
# Or remove entirely if it only contains workflow content:
rm CLAUDE.md
```

Note: `workflow rollback` only removes the engine files, not your specs or product data. You must delete those manually if needed.

---

## Troubleshooting

### 19. Agent does not behave as expected

**Symptom:** An agent ignores standards, gives unexpected responses, or behaves differently than defined.

**Diagnostic steps:**

1. **Check CLAUDE.md** -- Is the project configuration loaded correctly?
   ```bash
   # Is the CLAUDE.md in the correct directory?
   ls -la CLAUDE.md .claude/CLAUDE.md
   ```

2. **Check agent definition** -- Are tools and access level correct?
   ```bash
   # Read the agent file
   cat .claude/agents/{agent-name}.md
   ```

3. **Check standards injection** -- Are the correct standards being injected?
   ```bash
   # Check orchestration.yml: task_groups and standards_injection
   grep -A5 "standards:" workflow/orchestration.yml
   ```

4. **Context overflow** -- Too many standards can exceed the context:
   ```yaml
   # In orchestration.yml:
   context_optimization:
     max_delegation_tokens: 8000  # Increase if needed
   ```

5. **Update agent definition** -- After changes to the agent file, a new Claude Code session must be started.

---

### 20. Workflow artifacts are empty

**Symptom:** `shape.md`, `spec.md`, or `tasks.md` are created but are empty or have only minimal content.

**Causes and solutions:**

1. **Too little input during the phase:**
   The phases are interactive. The more context you provide, the better the result:
   ```
   # Bad:
   /shape-spec "User Login"

   # Better:
   /shape-spec "User Login with OAuth2 (Google, GitHub),
     email/password as fallback, 2FA optional,
     session management with JWT, refresh tokens,
     GDPR-compliant consent handling"
   ```

2. **Missing product context:**
   Check whether `workflow/product/mission.md` and `workflow/product/architecture.md` exist and have content. Without product context, the agents lack a foundation.

3. **Standards not registered:**
   If `index.yml` is empty or the relevant domains are missing, the agents have no guardrails.

---

### 21. CLI shows 'CONFLICT' warning

**Symptom:**
```
[CONFLICT] workflow/config.yml already exists with different content
[CONFLICT] .claude/agents/builder.md has local modifications
```

**Solution:**

```bash
# Show all conflicts in detail
workflow check --type conflicts

# Resolution options:
workflow resolve              # Interactive merge
workflow resolve --theirs     # Accept engine version
workflow resolve --ours       # Keep local version
workflow install --force      # Overwrite everything (use with caution!)
```

Conflicts typically occur when:
- You have manually modified agent definitions and install an update
- Multiple team members have configured the engine differently
- An older engine version is installed and you are upgrading

---

### 22. Standards are not being applied

**Symptom:** The delegated agent obviously ignores standards (e.g., wrong response format, missing error codes).

**Diagnosis:**

1. **Check registration:**
   ```bash
   # Is the standard registered in index.yml?
   grep "my-standard" workflow/standards/index.yml
   ```

2. **Check mapping:**
   ```bash
   # Is the standard assigned to a task group?
   grep -A10 "domain_mapping:" workflow/orchestration.yml
   ```

3. **Check injection method:**
   Standards must be injected `inline` (default setting). Subagents cannot resolve file paths:
   ```yaml
   # In orchestration.yml:
   standards_injection:
     method: inline  # MUST be inline for subagents
   ```

4. **Check max limit:**
   ```yaml
   optimization:
     max_standards_per_task: 5  # Increase if more standards are needed
   ```

5. **Check standard file:**
   Is the content of the standard file clearly and unambiguously formulated? Vague standards lead to vague implementations.

---

## Further Information

- [Getting Started](getting-started.md) -- Quick start guide
- [CLI Reference](cli.md) -- All CLI commands in detail
- [Workflow Guide](workflow.md) -- The 5 phases in detail
- [Agents](agents.md) -- All 9 agents with capabilities and configuration
- [Standards](standards.md) -- Standards system and domain overview
- [Configuration](configuration.md) -- config.yml and orchestration.yml reference
- How-Tos:
  - [Develop a New Feature](how-to/develop-new-feature.md)
  - [Create a Custom Agent](how-to/create-custom-agent.md)
  - [Extend Standards](how-to/extend-standards.md)
  - [CLI Installation](how-to/cli-installation.md)
