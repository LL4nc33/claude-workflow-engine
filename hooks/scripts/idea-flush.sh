#!/usr/bin/env bash
# On session stop: Notify if new idea observations exist for CURRENT project

source "$(dirname "$0")/_lib.sh"

# Consume stdin to prevent hook errors
cat > /dev/null 2>&1

resolve_slug

IDEAS_FILE="$HOME/.claude/cwe/ideas/${PROJECT_SLUG}.jsonl"

# Skip if no observations for this project
[ ! -f "$IDEAS_FILE" ] && exit 0
[ ! -s "$IDEAS_FILE" ] && exit 0

# Count ideas for this project only
COUNT=$(line_count "$IDEAS_FILE")
RAW=$(grep_count '"status":"raw"' "$IDEAS_FILE")

json_msg "${COUNT} idea(s) captured for ${PROJECT_SLUG} (${RAW} unreviewed). Review with /cwe:innovator."

exit 0
