#!/usr/bin/env bash
# Pre-commit safety gate: scan for secrets, PII, credentials
# Validates .gitignore completeness
# Exit 0 = safe, Exit 2 = blocked with report
#
# Triggered by PreToolUse on: git commit, git push, git add -A

set -euo pipefail

# Read tool input from stdin
TOOL_INPUT=$(cat)

# Extract the command being run
COMMAND=$(echo "$TOOL_INPUT" | grep -oP '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/"command"\s*:\s*"//;s/"$//' || true)

# Only check git commit, git push, git add -A/--all
case "$COMMAND" in
  git\ commit*|git\ push*|git\ add\ -A*|git\ add\ --all*)
    ;;
  *)
    exit 0
    ;;
esac

ISSUES=()
WARNINGS=()

# --- Secret Patterns ---
SECRET_PATTERNS=(
  'sk-[a-zA-Z0-9]{20,}'                          # OpenAI/Anthropic keys
  'pk-[a-zA-Z0-9]{20,}'                          # Public keys
  'ANTHROPIC_API_KEY\s*=\s*["\x27]?[a-zA-Z0-9]'  # Anthropic API key assignment
  'OPENAI_API_KEY\s*=\s*["\x27]?[a-zA-Z0-9]'     # OpenAI API key assignment
  'AKIA[0-9A-Z]{16}'                              # AWS access key
  'ghp_[a-zA-Z0-9]{36}'                           # GitHub PAT
  'gho_[a-zA-Z0-9]{36}'                           # GitHub OAuth
  'github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}'   # GitHub fine-grained PAT
  'xoxb-[0-9]{10,}-[a-zA-Z0-9]+'                  # Slack bot token
  'xoxp-[0-9]{10,}-[a-zA-Z0-9]+'                  # Slack user token
  '-----BEGIN.*PRIVATE KEY-----'                   # Private keys
)

PASSWORD_PATTERNS=(
  'password\s*=\s*["\x27][^\$\{]'                 # password= with literal value (not variable)
  'passwd\s*=\s*["\x27][^\$\{]'                   # passwd= with literal value
  'secret\s*=\s*["\x27][^\$\{]'                   # secret= with literal value
)

DB_URL_PATTERNS=(
  'postgres://[^@]+:[^@]+@'                        # PostgreSQL with credentials
  'mongodb://[^@]+:[^@]+@'                         # MongoDB with credentials
  'mysql://[^@]+:[^@]+@'                           # MySQL with credentials
)

# --- Get staged files (for commit) or all tracked files (for push) ---
if [[ "$COMMAND" == git\ commit* ]]; then
  FILES=$(git diff --cached --name-only 2>/dev/null || true)
elif [[ "$COMMAND" == git\ push* ]]; then
  FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only HEAD 2>/dev/null || true)
else
  # git add -A: check all untracked + modified
  FILES=$(git status --porcelain 2>/dev/null | awk '{print $2}' || true)
fi

if [ -z "$FILES" ]; then
  exit 0
fi

# --- Scan files for secrets ---
scan_file() {
  local file="$1"
  local pattern="$2"
  local category="$3"

  # Skip binary files and common non-code files
  if ! [ -f "$file" ]; then return; fi
  if file "$file" 2>/dev/null | grep -q "binary"; then return; fi

  local matches
  matches=$(grep -nE "$pattern" "$file" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    while IFS= read -r match; do
      ISSUES+=("BLOCKED [$category] $file:$match")
    done <<< "$matches"
  fi
}

# Scan each file
while IFS= read -r file; do
  [ -z "$file" ] && continue

  # Check for dangerous file types being committed
  case "$file" in
    *.pem|*.key|*.pfx|*.p12|*.crt)
      ISSUES+=("BLOCKED [certificate/key file] $file — should not be committed")
      continue
      ;;
    .env|.env.*|*.env)
      ISSUES+=("BLOCKED [env file] $file — should be in .gitignore")
      continue
      ;;
    id_rsa*|id_ed25519*|id_ecdsa*)
      ISSUES+=("BLOCKED [SSH key] $file — should never be committed")
      continue
      ;;
  esac

  # Skip node_modules, vendor, etc.
  case "$file" in
    node_modules/*|.venv/*|__pycache__/*|vendor/*|.git/*)
      continue
      ;;
  esac

  # Scan for secret patterns
  for pattern in "${SECRET_PATTERNS[@]}"; do
    scan_file "$file" "$pattern" "secret/API key"
  done

  for pattern in "${PASSWORD_PATTERNS[@]}"; do
    scan_file "$file" "$pattern" "hardcoded password"
  done

  for pattern in "${DB_URL_PATTERNS[@]}"; do
    scan_file "$file" "$pattern" "database credentials"
  done

done <<< "$FILES"

# --- Validate .gitignore ---
if [ -f ".gitignore" ]; then
  GITIGNORE_REQUIRED=(".env" "*.pem" "*.key" "node_modules/" ".DS_Store")
  for entry in "${GITIGNORE_REQUIRED[@]}"; do
    if ! grep -qF "$entry" .gitignore 2>/dev/null; then
      WARNINGS+=("WARNING [.gitignore] Missing entry: $entry")
    fi
  done
else
  WARNINGS+=("WARNING [.gitignore] No .gitignore file found!")
fi

# --- Report ---
if [ ${#ISSUES[@]} -gt 0 ]; then
  echo ""
  echo "=== CWE Safety Gate: BLOCKED ==="
  echo ""
  for issue in "${ISSUES[@]}"; do
    echo "  $issue"
  done
  echo ""
  if [ ${#WARNINGS[@]} -gt 0 ]; then
    for warning in "${WARNINGS[@]}"; do
      echo "  $warning"
    done
    echo ""
  fi
  echo "Fix these issues before committing."
  echo "If this is a false positive, use: git commit --no-verify"
  echo ""
  exit 2
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "=== CWE Safety Gate: WARNINGS ==="
  echo ""
  for warning in "${WARNINGS[@]}"; do
    echo "  $warning"
  done
  echo ""
fi

exit 0
