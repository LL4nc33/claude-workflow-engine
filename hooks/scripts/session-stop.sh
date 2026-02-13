#!/usr/bin/env bash
# Session Stop Hook: Log session summary
# Appends to memory/sessions.md, keeps last 50 entries

# Consume stdin to prevent hook errors
cat > /dev/null 2>&1 &

# Determine project root
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  ROOT="$CLAUDE_PROJECT_DIR"
else
  ROOT="$PWD"
fi

SESSIONS_FILE="${ROOT}/memory/sessions.md"

# Only log if memory directory exists (project is initialized)
if [ -d "${ROOT}/memory" ] || [ -d "${ROOT}/workflow" ]; then
  mkdir -p "${ROOT}/memory"

  # Create sessions file from template if it doesn't exist
  if [ ! -f "$SESSIONS_FILE" ]; then
    PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$(dirname "$0")")")}"
    TEMPLATE="${PLUGIN_ROOT}/templates/memory/sessions.md"
    if [ -f "$TEMPLATE" ]; then
      cp "$TEMPLATE" "$SESSIONS_FILE"
    else
      printf "# Session Log\n\nRecent sessions. Newest first. Max 50 entries.\n\n---\n\n" > "$SESSIONS_FILE"
    fi
  fi

  # Append session entry (date only — Claude will fill in the summary via memory tools)
  DATE=$(date +%Y-%m-%d)
  TIME=$(date +%H:%M)

  # Insert new entry after the --- separator (prepend to list)
  # Using a temp file for portability
  TEMP_FILE=$(mktemp)
  head -n 6 "$SESSIONS_FILE" > "$TEMP_FILE"
  printf "%s %s: (session ended, summary pending)\n" "$DATE" "$TIME" >> "$TEMP_FILE"
  tail -n +7 "$SESSIONS_FILE" >> "$TEMP_FILE"
  mv "$TEMP_FILE" "$SESSIONS_FILE"

  # Keep only last 50 session entries (lines after header)
  HEADER_LINES=6
  TOTAL_LINES=$(wc -l < "$SESSIONS_FILE" | tr -d ' ')
  MAX_ENTRIES=$((HEADER_LINES + 50))
  if [ "$TOTAL_LINES" -gt "$MAX_ENTRIES" ]; then
    TEMP_FILE=$(mktemp)
    head -n "$MAX_ENTRIES" "$SESSIONS_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$SESSIONS_FILE"
  fi
fi

echo '{"systemMessage": "Session complete. Run /cwe:start next time to continue where you left off."}'
