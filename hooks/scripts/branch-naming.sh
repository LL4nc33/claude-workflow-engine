#!/usr/bin/env bash
# Validate branch name follows naming convention
# Triggered by PreToolUse on Bash(git checkout -b*) / Bash(git switch -c*)
# Exit 0 = valid, Exit 2 = blocked with guidance

set -euo pipefail

TOOL_INPUT=$(cat)

# Extract the command
COMMAND=$(echo "$TOOL_INPUT" | grep -oP '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/"command"\s*:\s*"//;s/"$//' || true)

# Only check branch creation
case "$COMMAND" in
  git\ checkout\ -b*|git\ switch\ -c*)
    ;;
  *)
    exit 0
    ;;
esac

# Extract branch name
BRANCH=$(echo "$COMMAND" | sed -n 's/.*\(checkout -b\|switch -c\)\s\+\([^ ]*\).*/\2/p' || true)

if [ -z "$BRANCH" ]; then
  exit 0
fi

# Allowed patterns
PATTERN='^(main|develop|feature\/[a-z0-9]+-[a-z0-9-]+|fix\/[a-z0-9]+-[a-z0-9-]+|hotfix\/[a-z0-9-]+|chore\/[a-z0-9-]+|release\/[0-9]+\.[0-9]+\.[0-9]+)$'

if ! echo "$BRANCH" | grep -qE "$PATTERN"; then
  echo ""
  echo "=== CWE Git Standards: Invalid Branch Name ==="
  echo ""
  echo "  Your branch: \"$BRANCH\""
  echo ""
  echo "  Allowed patterns:"
  echo "    main, develop"
  echo "    feature/<ticket>-<description>"
  echo "    fix/<ticket>-<description>"
  echo "    hotfix/<description>"
  echo "    chore/<description>"
  echo "    release/<version>"
  echo ""
  echo "  Examples:"
  echo "    feature/123-user-auth"
  echo "    fix/456-login-crash"
  echo "    hotfix/session-timeout"
  echo "    chore/update-deps"
  echo "    release/0.4.2"
  echo ""
  echo "  Rules: lowercase, hyphens, prefix required."
  echo ""
  exit 2
fi

exit 0
