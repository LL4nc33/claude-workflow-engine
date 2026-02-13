#!/usr/bin/env bash
# SubagentStop Hook: Log agent execution for observability
# Receives agent metadata via stdin JSON

# Read stdin (agent result metadata)
INPUT=$(cat)

# Determine project root
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  ROOT="$CLAUDE_PROJECT_DIR"
else
  ROOT="$PWD"
fi

# Only log if memory directory exists (project is initialized)
[ ! -d "${ROOT}/memory" ] && [ ! -d "${ROOT}/workflow" ] && exit 0

mkdir -p "${ROOT}/memory"

SESSIONS_FILE="${ROOT}/memory/sessions.md"

# Extract agent name from input if available (best effort)
AGENT_NAME=$(echo "$INPUT" | grep -oP '"agent_type"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"agent_type"\s*:\s*"\([^"]*\)".*/\1/' 2>/dev/null)

if [ -n "$AGENT_NAME" ]; then
  # Log agent execution as a lightweight entry
  DATE=$(date +%Y-%m-%d)
  TIME=$(date +%H:%M)

  # Append to sessions.md as sub-entry (indented)
  if [ -f "$SESSIONS_FILE" ]; then
    # Find the most recent session entry and append agent info after it
    TEMP_FILE=$(mktemp)
    head -n 7 "$SESSIONS_FILE" > "$TEMP_FILE"
    printf "  - %s %s: agent=%s completed\n" "$DATE" "$TIME" "$AGENT_NAME" >> "$TEMP_FILE"
    tail -n +8 "$SESSIONS_FILE" >> "$TEMP_FILE"
    mv "$TEMP_FILE" "$SESSIONS_FILE"
  fi
fi

exit 0
