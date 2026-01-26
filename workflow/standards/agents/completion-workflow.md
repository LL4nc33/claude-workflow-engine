# Task Completion Workflow Standards

Was nach Abschluss eines Tasks passieren MUSS.

## Verification Checklist

Vor "Task Complete" melden:

| Check | Required For | How |
|-------|-------------|-----|
| Code compiles/lints | builder | `npm run lint` / `cargo check` |
| Tests pass | builder | `npm test` / `pytest` |
| No new warnings | builder, devops | Compare stderr before/after |
| Standards followed | all | Self-check gegen injected standards |
| No debug code left | builder | Grep for `console.log`, `debugger`, `TODO: remove` |

## Documentation Triggers

### Automatic (via NaNo)

| Event | Action |
|-------|--------|
| >3 files changed | Suggest `/workflow:devlog` |
| Bug fixed | Record root-cause in observation |
| New pattern discovered | Add to evolution-candidates |

### Manual (Agent responsibility)

| Task Type | Documentation |
|-----------|--------------|
| Bug fix | Root cause + fix in commit message |
| Feature | Update relevant spec status |
| Refactor | Note in PR description |
| Breaking change | Update CHANGELOG.md |

## NaNo Observation Recording

Nach jeder Task-Delegation schreibt PostToolUse Hook:

```
{timestamp} | {agent} | {task_type} | {files_changed} | {duration_ms}
```

Location: `.claude/nano-cache/delegations.log`

Rules:
- Atomic write (flock-based)
- No PII (filenames only, no content)
- Rotation: Keep last 1000 entries

## User Notification Format

### Success Response

```markdown
## Done: {Task Title}

**Changed:** {n} files
**Agent:** {agent_name}
**Duration:** {time}

### Summary
{1-3 sentences what was done}

### Files Modified
- `{path1}`: {brief change}
- `{path2}`: {brief change}

### Next Steps (optional)
- [ ] {suggested follow-up}
```

### Failure Response

```markdown
## Blocked: {Task Title}

**Reason:** {category}
**Agent:** {agent_name}

### Issue
{What went wrong}

### Attempted
{What was tried}

### Options
1. {Option A}
2. {Option B}
3. Escalate to user
```

## Post-Completion Actions

### For Orchestrator (Main Chat)

1. Mark TodoItem as `completed`
2. Check if more tasks remain
3. If all done: summarize overall result
4. If applicable: suggest `/workflow:devlog`

### For Agent

1. Clean up diagnostic code
2. Verify no temp files left
3. Return structured result (not raw output)
4. Include relevant file paths (absolute)

## Quality Gates

Before marking complete, verify:

| Gate | Threshold | Blocker |
|------|-----------|---------|
| Lint errors | 0 | Yes |
| Test failures | 0 | Yes |
| Coverage drop | >2% | Yes |
| New TODOs | >3 | Warn |
| File size increase | >50% | Warn |
