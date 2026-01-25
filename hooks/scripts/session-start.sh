#!/usr/bin/env bash
# SessionStart Hook - Absolute minimal, no output
echo "$(date +%Y%m%d-%H%M%S)" > "/tmp/claude-current-session-id" 2>/dev/null
exit 0
