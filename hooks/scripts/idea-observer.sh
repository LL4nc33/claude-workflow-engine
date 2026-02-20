#!/usr/bin/env bash
# Scan user prompts for idea keywords
# Write JSONL to ~/.claude/cwe/ideas/<project-slug>.jsonl (project-scoped)
# Migrates old .toon file on first run

source "$(dirname "$0")/_lib.sh"

IDEA_PATTERNS="idee|was wäre wenn|könnte man|vielleicht|alternativ|verbesserung|idea|what if|could we|maybe|alternative|improvement"

# Read stdin (user prompt)
PROMPT=$(cat)

# Check for idea patterns (case insensitive)
if ! echo "$PROMPT" | grep -iqE "$IDEA_PATTERNS"; then
  exit 0
fi

IDEAS_DIR="$HOME/.claude/cwe/ideas"
mkdir -p "$IDEAS_DIR"

resolve_slug

# Migration: convert old .toon to JSONL on first run
OLD_TOON="$HOME/.claude/cwe/idea-observations.toon"
if [ -f "$OLD_TOON" ] && [ ! -f "$OLD_TOON.bak" ]; then
  while IFS= read -r line; do
    # Parse TOON format: i{d:MM-DD p:prompt text}
    if [[ "$line" =~ ^i\{d:([0-9-]+)\ p:(.*)\}$ ]]; then
      OLD_DATE="${BASH_REMATCH[1]}"
      OLD_PROMPT=$(json_escape "${BASH_REMATCH[2]}")
      printf '{"ts":"2025-%s","prompt":"%s","project":"_global","keywords":[],"status":"raw"}\n' \
        "$OLD_DATE" "$OLD_PROMPT" >> "$IDEAS_DIR/_global.jsonl"
    fi
  done < "$OLD_TOON"
  mv "$OLD_TOON" "$OLD_TOON.bak"
fi

# Extract matched keywords
MATCHED_KEYWORDS=$(echo "$PROMPT" | grep -ioE "$IDEA_PATTERNS" | tr '[:upper:]' '[:lower:]' | sort -u | paste -sd',' -) || true

# Truncate and escape prompt for JSON
CLEAN_PROMPT=$(json_escape "${PROMPT:0:300}")

# Build keywords JSON array
if [ -n "$MATCHED_KEYWORDS" ]; then
  KEYWORDS_JSON=$(echo "$MATCHED_KEYWORDS" | sed 's/,/","/g' | sed 's/^/"/;s/$/"/')
else
  KEYWORDS_JSON=""
fi

# Write JSONL entry
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
printf '{"ts":"%s","prompt":"%s","project":"%s","keywords":[%s],"status":"raw"}\n' \
  "$TIMESTAMP" "$CLEAN_PROMPT" "$PROJECT_SLUG" "$KEYWORDS_JSON" \
  >> "$IDEAS_DIR/${PROJECT_SLUG}.jsonl"

exit 0
