---
description: Version bump, Changelog und Git-Tag erstellen
interactive: true
---

# Release

Bumps project version, updates all files, generates changelog entry, and creates git tag.

## Process

### Step 1: Determine Bump Type

Use AskUserQuestion to ask the user:

```
What type of release?
- patch (0.2.7 → 0.2.8) - Bug fixes, small changes
- minor (0.2.7 → 0.3.0) - New features, backward-compatible
- major (0.2.7 → 1.0.0) - Breaking changes
```

### Step 2: Dry-Run Preview

Run the release script in dry-run mode to show what will change:

```bash
bash scripts/release.sh <bump_type> --dry-run --verbose
```

Show the user the output and ask for confirmation.

### Step 3: Execute Release

If confirmed, run the actual release:

```bash
bash scripts/release.sh <bump_type>
```

This will:
1. Read current version from `VERSION` (Single Source of Truth)
2. Calculate new version using SemVer
3. Update all files referencing the version (20+ files)
4. Generate a CHANGELOG.md entry from conventional commits
5. Create git commit and tag

### Step 4: Push Confirmation

Use AskUserQuestion to ask:

```
Release v{new_version} created locally.
Push to remote?
- Yes (git push && git push --tags)
- No (keep local only)
```

If yes:
```bash
git push && git push --tags
```

## Key Files

- `VERSION` - Single Source of Truth (SemVer)
- `CHANGELOG.md` - Auto-generated release history
- `scripts/release.sh` - Release automation script

## Notes

- Always use `--dry-run` first to preview changes
- The script updates: VERSION, package.json, plugin.json, config.yml, orchestration.yml, README, docs, hooks, skills, templates
- CHANGELOG entries are generated from git log using Conventional Commits grouping
- Use `--no-tag` if you want to commit without tagging
- Use `--no-commit` if you only want file updates without git operations
