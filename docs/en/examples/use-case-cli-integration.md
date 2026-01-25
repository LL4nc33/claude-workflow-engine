# Use Case: Integrating the CLI into an Existing Node.js Project

Integrating the Claude Workflow Engine into an existing Express.js project -- with conflict checking, safe installation, and health check.

## Scenario

You have an existing Express.js project (REST API for an e-commerce backend) that has been in development for 8 months. The project already has:

- A `.claude/` file (not a directory) with Claude notes
- A `workflow/` directory with Gulp task definitions
- Existing `.gitignore`, `package.json`, tests
- 3 team members actively developing

You want to integrate the Claude Workflow Engine without destroying existing structures.

---

## Walkthrough

### Step 1: Pre-check for Conflicts

Before installing anything, check for potential conflicts:

```bash
workflow check . --type conflicts
```

**Output:**

```
Conflict Check Results:

  [CONFLICT] .claude/ - File exists (not a directory)
    Current: Regular file with text content (2.3 KB)
    Required: Directory for agent definitions
    Resolution: Rename existing file, then create directory

  [CONFLICT] workflow/ - Directory exists with different content
    Current: Contains gulp-tasks/ (3 files)
    Required: Engine structure (config.yml, standards/, product/, specs/)
    Resolution: Merge (engine files alongside existing content)

  [OK] .gitignore - File exists, can be extended
  [OK] package.json - File exists, no conflicts

Conflicts found: 2
Run 'workflow resolve .' for resolution options.
```

Two conflicts found. Let us look at the resolution options:

```bash
workflow resolve .
```

**Output:**

```
Conflict Resolution Options:

1. .claude/ (file -> directory)
   [a] Rename .claude to .claude-notes.md, create .claude/ directory
   [b] Move file content into .claude/notes.md, create directory structure
   [c] Delete existing file, create fresh directory (DESTRUCTIVE)

   Recommended: Option [b]

2. workflow/ (directory merge)
   [a] Merge: Add engine files alongside existing gulp-tasks/
   [b] Namespace: Move existing content to workflow/legacy/
   [c] Relocate: Install engine to .workflow/ instead

   Recommended: Option [a]

Select resolution for each conflict, or use --auto for recommended options.
```

### Step 2: Resolve Conflicts

We go with the recommended options:

```bash
workflow resolve . --auto
```

**Output:**

```
Resolving conflicts:

  [1/2] .claude/ - Moving file content to .claude/notes.md
    Created: .claude/
    Moved: .claude (file) -> .claude/notes.md
    Done.

  [2/2] workflow/ - Merging with existing content
    Existing content preserved: workflow/gulp-tasks/ (3 files)
    Engine files will be added alongside.
    Done.

All conflicts resolved. Ready for installation.
```

### Step 3: Dry-Run Installation

Before the actual installation runs, a dry run:

```bash
workflow install . --dry-run
```

**Output:**

```
[DRY RUN] Installation Preview:

  .claude/
    notes.md              [EXISTING - preserved from conflict resolution]
    agents/
      architect.md        [NEW]
      explainer.md              [NEW]
      builder.md            [NEW]
      devops.md           [NEW]
      guide.md            [NEW]
      innovator.md        [NEW]
      quality.md          [NEW]
      researcher.md       [NEW]
      security.md         [NEW]
    settings.local.json   [NEW]
    CLAUDE.md             [NEW]

  workflow/
    gulp-tasks/           [EXISTING - 3 files preserved]
    config.yml            [NEW]
    orchestration.yml     [NEW]
    product/              [NEW - empty directory]
    specs/                [NEW - empty directory]
    standards/
      index.yml           [NEW]
      global/             [NEW - 2 files]
      api/                [NEW - 2 files]
      database/           [NEW - 1 file]
      devops/             [NEW - 3 files]
      frontend/           [NEW - 1 file]
      testing/            [NEW - 1 file]
      agents/             [NEW - 1 file]

  .gitignore              [APPEND - adding .local.md entries]

Summary:
  New files: 23
  Preserved files: 4
  Modified files: 1 (.gitignore)
  Deleted files: 0

No data loss detected. Proceed with 'workflow install .' (without --dry-run).
```

### Step 4: Run the Installation

```bash
workflow install .
```

**Output:**

```
Installing Claude Workflow Engine...

  [1/4] Creating agent definitions...
    Created: .claude/agents/ (9 agents)
    Created: .claude/CLAUDE.md
    Created: .claude/settings.local.json

  [2/4] Setting up workflow structure...
    Created: workflow/config.yml
    Created: workflow/orchestration.yml
    Created: workflow/product/
    Created: workflow/specs/

  [3/4] Installing standards...
    Created: workflow/standards/index.yml
    Created: workflow/standards/global/ (2 standards)
    Created: workflow/standards/api/ (2 standards)
    Created: workflow/standards/database/ (1 standard)
    Created: workflow/standards/devops/ (3 standards)
    Created: workflow/standards/frontend/ (1 standard)
    Created: workflow/standards/testing/ (1 standard)
    Created: workflow/standards/agents/ (1 standard)

  [4/4] Updating .gitignore...
    Added: *.local.md
    Added: .claude/settings.local.json

Installation complete.
  Backup created: .workflow-backup-20240122-153012/
  Run 'workflow health .' to verify.
```

### Step 5: Health Check

```bash
workflow health .
```

**Output:**

```
Health Check Results:

  [OK] .claude/agents/ - 9 agent files present and valid
  [OK] .claude/CLAUDE.md - Project instructions present
  [OK] workflow/config.yml - Valid YAML, schema correct
  [OK] workflow/standards/index.yml - 11 standards registered
  [OK] workflow/product/ - Directory exists (empty, run plan-product)
  [OK] workflow/specs/ - Directory exists (empty, run shape-spec)
  [OK] workflow/gulp-tasks/ - Non-engine content preserved
  [OK] .gitignore - Local files excluded from version control

Status: HEALTHY (8/8 checks passed)
```

### Step 6: Check Status

```bash
workflow status .
```

**Output:**

```
Claude Workflow Engine Status:

  Version: 1.0.0
  Installed: 2024-01-22 15:30:12
  Path: /home/user/projects/ecommerce-api

  Product Phase:
    mission.md:    [NOT CREATED] - Run /workflow/plan-product
    roadmap.md:    [NOT CREATED]
    tech-stack.md: [NOT CREATED]

  Standards: 11 registered, 0 customized
  Specs: 0 features specified
  Agents: 9 available

  Next Step: Run /workflow/plan-product to define your product vision.
```

---

### Step 7: Document the Existing Project

Since the project already exists, use `plan-product` to document the current state:

```
> /workflow/plan-product

Claude: What problem does this product solve?
You:    We are building an e-commerce backend (REST API) for an
        online marketplace. Merchants list products, customers
        place orders, the system manages orders and payments.

Claude: Tech stack?
You:    Express.js, PostgreSQL with Sequelize, Redis for caching,
        Stripe for payments. Tests with Jest + Supertest.
```

The `workflow/product/` files are created based on the existing project.

---

## Handling Special Cases

### Existing `.claude/` as a Directory

If a `.claude/` directory already exists (e.g. from prior Claude Code usage):

```bash
workflow check . --type conflicts
```

```
  [CONFLICT] .claude/ - Directory exists with partial content
    Found: .claude/settings.json (1 file)
    Missing: agents/, CLAUDE.md
    Resolution: Extend existing directory
```

Here the existing structure is extended, not replaced.

### Existing `workflow/` with Identically Named Files

If your project happens to have a `workflow/config.yml` (e.g. for GitHub Actions):

```
  [CONFLICT] workflow/config.yml - File exists with different schema
    Current: GitHub Actions workflow config
    Required: Claude Workflow Engine config
    Resolution options:
      [a] Rename existing to workflow/config.github.yml
      [b] Install engine config as workflow/engine-config.yml
      [c] Relocate engine to .workflow/
```

### GDPR/Data Privacy Check

For projects in the EU, check GDPR compliance:

```bash
workflow check . --type gdpr
```

```
GDPR Check Results:

  [OK] No PII detected in standards files
  [OK] .local.md files in .gitignore
  [OK] settings.local.json in .gitignore
  [OK] No external data transmission configured
  [WARN] workflow/config.yml: No data_residency field set
    Recommendation: Add 'data_residency: eu-central-1' to config.yml

Status: PASS (4 OK, 1 Warning)
```

### Permission Check

```bash
workflow check . --type permissions
```

```
Permission Check Results:

  [OK] .claude/ - Read/Write accessible
  [OK] workflow/ - Read/Write accessible
  [OK] .gitignore - Writable
  [WARN] workflow/gulp-tasks/ - Contains executable files
    Note: Engine will not modify these files

Status: PASS (3 OK, 1 Warning)
```

---

## Rollback on Problems

If something goes wrong, you can undo the installation:

```bash
workflow rollback .
```

```
Rollback Options:

  Backup found: .workflow-backup-20240122-153012/
  Created: 2024-01-22 15:30:12 (2 hours ago)

  This will:
    - Remove all engine-created files (23 files)
    - Restore .claude from .claude/notes.md back to .claude (file)
    - Restore original .gitignore
    - Preserve workflow/gulp-tasks/ (was not modified)

  Proceed? [y/N]
```

---

## Result

| Step | Command | What Happens |
|------|---------|--------------|
| Conflict check | `workflow check . --type conflicts` | 2 conflicts detected |
| Resolution | `workflow resolve . --auto` | Conflicts safely resolved |
| Dry run | `workflow install . --dry-run` | Preview without changes |
| Installation | `workflow install .` | Engine installed, backup created |
| Verification | `workflow health .` | 8/8 checks passed |
| Status | `workflow status .` | Next steps displayed |

**Important:** At no point were existing files deleted or overwritten. The engine works additively and creates a backup with every installation.

---

## Variations

### Monorepo with Multiple Packages

For monorepos you install the engine at the root:

```bash
workflow install /path/to/monorepo
```

The standards then apply to all packages. Specific overrides can be defined through domain extensions in the standards.

### Project Without Node.js

The Claude Workflow Engine needs Node.js only for the CLI itself. The target project can be in any language (Python, Go, Rust). The standards and agents are adapted accordingly:

```bash
# Python project
workflow install /path/to/python-project
# -> Standards are configured for Python conventions
```

### CI/CD Integration

After installation you can integrate the health check into your pipeline:

```yaml
# .github/workflows/ci.yml
- name: Workflow Engine Health Check
  run: workflow health . --exit-code
  # Exit code 1 on failed checks
```

---

## See Also

- [CLI Reference](../cli.md) -- All commands in detail
- [Configuration](../configuration.md) -- config.yml options
- [Customizing Standards](../standards.md) -- Defining your own standards
- [Getting Started](../getting-started.md) -- Introduction for new users
