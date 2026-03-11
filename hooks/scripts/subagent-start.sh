#!/usr/bin/env bash
# SubagentStart Hook: Log agent start for observability
# Receives agent metadata via stdin JSON

source "$(dirname "$0")/_lib.sh"

# Read stdin (agent metadata)
INPUT=$(cat)

resolve_root

# Only log if memory directory exists (daily log target required)
[ ! -d "${ROOT}/memory" ] && exit 0

# Extract agent name from input if available (best effort)
AGENT_NAME=$(echo "$INPUT" | grep -oP '"agent_type"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"agent_type"\s*:\s*"\([^"]*\)".*/\1/' 2>/dev/null) || true

if [ -n "$AGENT_NAME" ]; then
  DATE=$(date +%Y-%m-%d)
  TIME=$(date +%H:%M)
  DAILY_LOG="${ROOT}/memory/${DATE}.md"

  # Create daily log with header if it doesn't exist
  if [ ! -f "$DAILY_LOG" ]; then
    printf "# %s\n" "$DATE" > "$DAILY_LOG"
  fi

  # Append agent start as lightweight entry
  printf "\n- %s agent=%s started\n" "$TIME" "$AGENT_NAME" >> "$DAILY_LOG"
fi

exit 0
