# Documentation Update for v0.3.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update all documentation to reflect the new Convenience-Layer features (Pre-Delegation Context, First-Run Guard, Auto-Devlog, bilingual patterns) and prepare for 0.3.0 release.

**Architecture:** Systematic update of README, docs/, and cli/templates/ to match current 0.2.9a state. Then version bump to 0.3.0 with CHANGELOG update.

**Tech Stack:** Markdown, YAML (orchestration.yml, config.yml, plugin.json)

---

## Gap Analysis

Based on reading the current docs, these are the identified inconsistencies:

| File | Issue | Priority |
|------|-------|----------|
| README.md | Says "5 event handlers" but we have 7 hooks now | HIGH |
| README.md | Says "23 slash commands" but we have 25 now | HIGH |
| README.md | Says "13 context skills" but we have more | MEDIUM |
| docs/workflow.md | Says "v0.2.7" in header | HIGH |
| docs/workflow.md | References `/workflow:homunculus-status` (renamed to nano-status) | HIGH |
| docs/workflow.md | Missing new commands: devlog, nano-idea | HIGH |
| docs/plattform-architektur.md | Hook section outdated (5 hooks vs 7) | HIGH |
| docs/plattform-architektur.md | Version "0.2.7" in plugin.json example | MEDIUM |
| docs/plattform-architektur.md | Missing new hooks: pre-delegation-context, session-stop, gate-check | HIGH |
| docs/plattform-architektur.md | Missing new skills: auto-delegation, planning, quality-gates, cwe-principles | MEDIUM |
| docs/nano-learning-system.md | Says "v0.2.9" but we're at 0.2.9a heading to 0.3.0 | LOW |
| docs/nano-learning-system.md | Missing nano-idea command | MEDIUM |
| docs/erste-schritte.md | Says "23 Slash Commands" and "13 Skills" | MEDIUM |
| docs/erste-schritte.md | Says "5 Hooks" in structure diagram | MEDIUM |
| English docs (docs/en/*) | Same issues as German docs | MEDIUM |

---

### Task 1: Update README.md

**Files:**
- Modify: `/mnt/d/GHrepos/oidanice-agents/README.md`

**Step 1: Read current README**

Run: Already read above - identified issues:
- Line 98: "5 event handlers" → "7 event handlers"
- Line 100: "23 slash commands" → "25 slash commands"
- Line 99: "13 context skills" → count actual skills

**Step 2: Update Architecture table**

```markdown
| Layer | Component | Count |
|-------|-----------|-------|
| 6 | Plugin Packaging | 1 bundle |
| 5 | Hooks | 7 event handlers |
| 4 | Agents | 9 specialists |
| 3 | Skills | 17 context skills |
| 2 | Commands | 25 slash commands |
| 1 | CLAUDE.md | Project instructions |
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): Update counts for 0.3.0 (7 hooks, 25 commands, 17 skills)"
```

---

### Task 2: Update docs/workflow.md

**Files:**
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/workflow.md`

**Step 1: Fix version header**

Change line 3:
```markdown
Die Claude Workflow Engine (v0.3.0) bietet drei Wege zur Entwicklung:
```

**Step 2: Fix homunculus-status reference**

Change line 427:
```markdown
| `/workflow:nano-status` | NaNo Learning Status + Quick-Actions |
```

**Step 3: Add missing commands to NaNo table**

Add after nano-reset:
```markdown
| `/workflow:nano-status` | NaNo Learning Status + Quick-Actions |
| `/workflow:nano-idea` | Ideen sammeln fuer zukuenftige Vorschlaege |
| `/workflow:devlog` | Session-Dokumentation erstellen |
```

**Step 4: Commit**

```bash
git add docs/workflow.md
git commit -m "docs(workflow): Fix version, rename homunculus→nano, add new commands"
```

---

### Task 3: Update docs/plattform-architektur.md

**Files:**
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/plattform-architektur.md`

**Step 1: Update Layer 2 Commands section**

Add to NaNo Learning Commands table:
```markdown
| `/workflow:nano-status` | NaNo Learning Status + Quick-Actions |
| `/workflow:nano-idea` | Ideen sammeln fuer zukuenftige Vorschlaege |
| `/workflow:devlog` | Session-Dokumentation erstellen |
```

Remove homunculus-status reference.

**Step 2: Update Layer 3 Skills section**

Add new skills:
```markdown
| `auto-delegation` | PROACTIVELY, intent recognition, agent mapping | Intent-to-Agent Routing |
| `planning` | EnterPlanMode, complex task, architecture | Plan-Mode Triggers |
| `quality-gates` | gate, review, checklist | 4-Gate Checklists |
| `cwe-principles` | system overview, how it works | Core Principles |
```

**Step 3: Update Layer 5 Hooks section**

Add new hooks:
```markdown
### PreToolUse Hook (Task)
- **Script:** `hooks/scripts/pre-delegation-context.sh`
- **Funktion:** Auto-Context-Injection vor Agent-Delegation
- **Injiziert:** Relevante Standards, bestehender Code, Architecture-Context

### Stop Hook (Auto-Devlog)
- **Script:** `hooks/scripts/session-stop.sh`
- **Funktion:** Empfiehlt `/workflow:devlog` bei >3 Datei-Aenderungen

### PreToolUse Hook (Skill - Gate-Check)
- **Script:** `hooks/scripts/gate-check.sh`
- **Funktion:** Blockiert Workflow-Commands wenn Quality Gates nicht bestanden
```

**Step 4: Update plugin.json version example**

```json
{
  "name": "claude-workflow-engine",
  "version": "0.3.0",
  ...
}
```

**Step 5: Commit**

```bash
git add docs/plattform-architektur.md
git commit -m "docs(architecture): Add 3 new hooks, 4 new skills, fix version"
```

---

### Task 4: Update docs/nano-learning-system.md

**Files:**
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/nano-learning-system.md`

**Step 1: Update version in Implementierungsstatus**

Change line 25:
```markdown
> **Aktualisiert:** 2026-01-26 (v0.3.0)
```

**Step 2: Add Idea Collection feature to status table**

Add to "Aktuell funktionsfaehig" table:
```markdown
| **Idea Collection** | **Implementiert** | Ideen sammeln via `nano-observer.sh idea` fuer bessere Vorschlaege |
```

**Step 3: Update Commands section**

Add nano-idea:
```markdown
| `/workflow:nano-idea` | Idee sammeln fuer zukuenftige Vorschlaege |
```

Fix homunculus-status → nano-status.

**Step 4: Commit**

```bash
git add docs/nano-learning-system.md
git commit -m "docs(nano): Add idea collection, fix nano-status name, update version"
```

---

### Task 5: Update docs/erste-schritte.md

**Files:**
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/erste-schritte.md`

**Step 1: Update counts in structure description**

Line 74: "23 Slash Commands" → "25 Slash Commands"
Line 75: "13 Skills" → "17 Skills"

**Step 2: Update hooks count**

Line 81: Should reference 7 hooks, not 5.

**Step 3: Update Commands pruefen section**

Line 330: Add nano-idea and devlog to the list.

**Step 4: Commit**

```bash
git add docs/erste-schritte.md
git commit -m "docs(getting-started): Update counts (25 commands, 17 skills, 7 hooks)"
```

---

### Task 6: Update English docs

**Files:**
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/en/workflow.md`
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/en/platform-architecture.md`
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/en/nano-learning-system.md`
- Modify: `/mnt/d/GHrepos/oidanice-agents/docs/en/getting-started.md`

**Step 1: Apply same changes as German docs**

Mirror all changes from Tasks 2-5 to English equivalents.

**Step 2: Commit**

```bash
git add docs/en/
git commit -m "docs(en): Mirror German doc updates for 0.3.0"
```

---

### Task 7: Update cli/templates/

**Files:**
- Check: `/mnt/d/GHrepos/oidanice-agents/cli/templates/base/.claude-commands/workflow/`
- Check: `/mnt/d/GHrepos/oidanice-agents/cli/templates/base/.claude-skills/workflow/`
- Check: `/mnt/d/GHrepos/oidanice-agents/cli/templates/base/docs/`

**Step 1: Verify templates are in sync**

Run:
```bash
# Check if new commands exist in templates
ls cli/templates/base/.claude-commands/workflow/ | wc -l
# Should have: nano-idea.md, nano-status.md, devlog.md
```

**Step 2: Sync missing files if needed**

Copy new commands/skills to templates if they're missing.

**Step 3: Commit**

```bash
git add cli/templates/
git commit -m "chore(templates): Sync new commands and skills for 0.3.0"
```

---

### Task 8: Version bump to 0.3.0

**Files:**
- Modify: `/mnt/d/GHrepos/oidanice-agents/VERSION`
- Modify: `/mnt/d/GHrepos/oidanice-agents/workflow/config.yml`
- Modify: `/mnt/d/GHrepos/oidanice-agents/workflow/orchestration.yml`
- Modify: `/mnt/d/GHrepos/oidanice-agents/.claude-plugin/plugin.json`
- Modify: `/mnt/d/GHrepos/oidanice-agents/CHANGELOG.md`

**Step 1: Update VERSION file**

```
0.3.0
```

**Step 2: Update config.yml**

```yaml
version: "0.3.0"
```

**Step 3: Update orchestration.yml**

```yaml
version: "0.3.0"
```

**Step 4: Update plugin.json**

```json
"version": "0.3.0"
```

**Step 5: Update CHANGELOG.md**

Add new section at top:
```markdown
## [0.3.0] - 2026-01-26

### Added
- **Convenience-Layer** for natural language development
  - Pre-Delegation Context-Injection hook (auto-inject standards + code)
  - First-Run Guard (offers workflow setup to new users)
  - Feature-Scoping questions for complex features (Auth, DB, UI)
  - Bilingual pattern recognition (German + English)
- **New Commands**
  - `/workflow:nano-idea` - Collect ideas for future suggestions
  - `/workflow:nano-status` - NaNo Learning Status (replaces homunculus-status)
  - `/workflow:devlog` - Auto-document debugging sessions
- **New Skills**
  - `auto-delegation` - Intent-to-Agent routing with PROACTIVELY keywords
  - `planning` - EnterPlanMode triggers for complex tasks
  - `quality-gates` - 4-Gate checklists for quality enforcement
  - `cwe-principles` - System overview and coherence documentation
- **New Hooks**
  - `pre-delegation-context.sh` - Context injection before Task tool
  - `session-stop.sh` - Auto-devlog suggestion at session end
  - `gate-check.sh` - Quality gate enforcement
- **New Standards**
  - `completion-workflow.md` - Task completion flow
  - `toon-format.md` - Token optimization rules
  - `design-tokens.md` - Visual clone design tokens

### Changed
- Renamed `/workflow:homunculus-status` to `/workflow:nano-status`
- CLAUDE.md reduced by 14% (references standards instead of inline duplication)
- Agent-First enforcement now configurable (warn/block/off)
- All 25 commands now have YAML frontmatter

### Fixed
- German error patterns ("funktioniert nicht") now recognized
- Keyword mappings synchronized between orchestration.yml and common.sh
```

**Step 6: Commit and tag**

```bash
git add VERSION workflow/config.yml workflow/orchestration.yml .claude-plugin/plugin.json CHANGELOG.md
git commit -m "chore(release): Bump version to 0.3.0"
git tag -a v0.3.0 -m "Release 0.3.0 - Convenience-Layer for natural language development"
```

---

### Task 9: Final verification and push

**Step 1: Verify all changes**

Run:
```bash
git log --oneline -10
grep -r "0.2.9" docs/ --include="*.md" | head -5  # Should be empty
grep -r "homunculus-status" docs/ --include="*.md" | head -5  # Should be empty
```

**Step 2: Push with tags**

```bash
git push && git push --tags
```

---

## Summary

| Task | Files | Commits |
|------|-------|---------|
| 1 | README.md | 1 |
| 2 | docs/workflow.md | 1 |
| 3 | docs/plattform-architektur.md | 1 |
| 4 | docs/nano-learning-system.md | 1 |
| 5 | docs/erste-schritte.md | 1 |
| 6 | docs/en/*.md | 1 |
| 7 | cli/templates/ | 1 |
| 8 | VERSION, config.yml, orchestration.yml, plugin.json, CHANGELOG.md | 1 |
| 9 | - (verification only) | 0 |

**Total: 9 Tasks, 8 Commits, 1 Tag**
