#!/usr/bin/env bash
# SessionStart Hook: Status check + Memory resume for CWE
# Reads project memory for session continuity

# Consume stdin to prevent hook errors
cat > /dev/null 2>&1 &

VERSION="Claude Workflow Engine v0.4.1"

# Determine project root
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  ROOT="$CLAUDE_PROJECT_DIR"
else
  ROOT="$PWD"
fi

# Build status message
if [ -d "${ROOT}/workflow" ]; then
  STATUS="Ready"
  HINT="Run /cwe:start to continue or just describe what you need."
else
  STATUS="No project initialized"
  HINT="Run /cwe:init to start."
fi

# Check for idea count
PROJECT_SLUG=$(basename "$ROOT" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
IDEAS_FILE="$HOME/.claude/cwe/ideas/${PROJECT_SLUG}.jsonl"
IDEA_COUNT=0
if [ -f "$IDEAS_FILE" ]; then
  IDEA_COUNT=$(wc -l < "$IDEAS_FILE" | tr -d ' ')
fi

# Build resume context from sessions.md if it exists
RESUME=""
SESSIONS_FILE="${ROOT}/memory/sessions.md"
if [ -f "$SESSIONS_FILE" ]; then
  # Get the most recent session line (first non-empty, non-comment, non-header line)
  LAST_SESSION=$(grep -m1 '^[0-9]' "$SESSIONS_FILE" 2>/dev/null)
  if [ -n "$LAST_SESSION" ]; then
    RESUME=" | Last: ${LAST_SESSION}"
  fi
fi

# Idea info
IDEA_INFO=""
if [ "$IDEA_COUNT" -gt 0 ]; then
  IDEA_INFO=" | ${IDEA_COUNT} idea(s) captured"
fi

# Auto-delegation reminder (compact)
DELEGATION="Auto-delegation: fix/build->builder | explain->explainer | audit->security | deploy->devops | design->architect | brainstorm->innovator"

echo "{\"systemMessage\": \"${VERSION} | ${STATUS}. ${HINT}${RESUME}${IDEA_INFO} | ${DELEGATION}\"}"
