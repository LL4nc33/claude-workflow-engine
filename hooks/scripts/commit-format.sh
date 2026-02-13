#!/usr/bin/env bash
# Validate commit message follows Conventional Commits format
# Triggered by PreToolUse on Bash(git commit*)
# Exit 0 = valid, Exit 2 = blocked with guidance

set -euo pipefail

TOOL_INPUT=$(cat)

# Extract the command
COMMAND=$(echo "$TOOL_INPUT" | grep -oP '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/"command"\s*:\s*"//;s/"$//' || true)

# Only check git commit (not amend without message, merge commits, etc.)
case "$COMMAND" in
  git\ commit\ -m*|git\ commit\ --message*)
    ;;
  git\ commit*--no-verify*|git\ commit*--amend*)
    # Allow --no-verify and --amend to pass through
    exit 0
    ;;
  git\ commit*)
    # Other commit forms (interactive editor) — can't validate pre-emptively
    exit 0
    ;;
  *)
    exit 0
    ;;
esac

# Extract commit message from -m flag
# Handles: git commit -m "message" and git commit -m 'message'
MSG=$(echo "$COMMAND" | sed -n 's/.*git commit.*-m[= ]*["'\'']\?\([^"'\'']*\)["'\'']\?.*/\1/p' || true)

# Also try heredoc pattern: git commit -m "$(cat <<'EOF'...EOF)"
if [ -z "$MSG" ]; then
  MSG=$(echo "$COMMAND" | sed -n 's/.*-m.*\$.*cat.*<<.*EOF.*\n\?\(.*\)\n\?.*EOF.*/\1/p' || true)
fi

# If we can't extract the message, let it through
if [ -z "$MSG" ]; then
  exit 0
fi

# Get first line of commit message
FIRST_LINE=$(echo "$MSG" | head -1)

# Conventional Commits regex
# type(scope)!: subject
# type!: subject
# type(scope): subject
# type: subject
PATTERN='^(feat|fix|chore|docs|style|refactor|test|perf|ci|build|revert)(\([a-z0-9_-]+\))?!?:\s.+'

if ! echo "$FIRST_LINE" | grep -qE "$PATTERN"; then
  echo ""
  echo "=== CWE Git Standards: Invalid Commit Message ==="
  echo ""
  echo "  Your message: \"$FIRST_LINE\""
  echo ""
  echo "  Expected format: <type>(<scope>): <subject>"
  echo ""
  echo "  Valid types: feat, fix, chore, docs, style, refactor, test, perf, ci, build, revert"
  echo ""
  echo "  Examples:"
  echo "    feat(auth): add JWT token refresh"
  echo "    fix: prevent crash on empty input"
  echo "    docs: update API documentation"
  echo "    chore: update dependencies"
  echo ""
  echo "  Use --no-verify to bypass (for emergencies)."
  echo ""
  exit 2
fi

exit 0
