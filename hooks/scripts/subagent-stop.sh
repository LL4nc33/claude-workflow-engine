#!/usr/bin/env bash
# SubagentStop Hook: Log agent execution for observability
# Receives agent metadata via stdin JSON

source "$(dirname "$0")/_lib.sh"

# Read stdin (agent result metadata)
INPUT=$(cat)

resolve_root

# Only log if memory directory exists (daily log target required)
[ ! -d "${ROOT}/memory" ] && exit 0

mkdir -p "${ROOT}/memory"

# Extract agent name from input if available (best effort)
AGENT_NAME=$(echo "$INPUT" | grep -oE '"agent_type"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"agent_type"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/' 2>/dev/null) || true

if [ -n "$AGENT_NAME" ]; then
  DATE=$(date +%Y-%m-%d)
  TIME=$(date +%H:%M)
  DAILY_LOG="${ROOT}/memory/${DATE}.md"

  # Create daily log with header if it doesn't exist
  if [ ! -f "$DAILY_LOG" ]; then
    printf "# %s\n" "$DATE" > "$DAILY_LOG"
  fi

  # Append agent completion as lightweight entry
  printf "\n- %s agent=%s completed\n" "$TIME" "$AGENT_NAME" >> "$DAILY_LOG"
fi

exit 0
