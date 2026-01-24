#!/usr/bin/env bash
# =============================================================================
# Claude Workflow Engine - Release Script
# Bumps version, updates all files, generates changelog, creates git tag
#
# Usage:
#   bash scripts/release.sh [patch|minor|major] [options]
#
# Options:
#   --dry-run     Show what would be done without making changes
#   --no-commit   Skip git commit
#   --no-tag      Skip git tag creation
#   --verbose     Show detailed output
# =============================================================================

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION_FILE="$PROJECT_ROOT/VERSION"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# --- Defaults ---
BUMP_TYPE="patch"
DRY_RUN=false
NO_COMMIT=false
NO_TAG=false
VERBOSE=false

# Files to update (relative to PROJECT_ROOT)
UPDATE_FILES=(
  "VERSION"
  "cli/package.json"
  ".claude-plugin/plugin.json"
  "workflow/config.yml"
  "workflow/orchestration.yml"
  "README.md"
  "README_EN.md"
  "hooks/scripts/session-start.sh"
  "docs/workflow.md"
  "docs/en/workflow.md"
  "docs/cli.md"
  "docs/en/cli.md"
  "docs/plattform-architektur.md"
  "docs/en/platform-architecture.md"
  "docs/konfiguration.md"
  "docs/en/configuration.md"
  "docs/how-to/cli-installation.md"
  "docs/en/how-to/cli-installation.md"
  ".claude/skills/workflow/hook-patterns/SKILL.md"
  ".claude/skills/workflow/plugin-config/SKILL.md"
)

# Template files (same files but in cli/templates/base/)
TEMPLATE_PREFIX="cli/templates/base"

# --- Functions ---

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[DONE]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}  →${NC} $1"
  fi
}

log_dry() {
  echo -e "${YELLOW}[DRY-RUN]${NC} $1"
}

get_current_version() {
  if [ ! -f "$VERSION_FILE" ]; then
    log_error "VERSION file not found at $VERSION_FILE"
    exit 1
  fi
  cat "$VERSION_FILE" | tr -d '[:space:]'
}

bump_version() {
  local current="$1"
  local type="$2"

  local major minor patch
  IFS='.' read -r major minor patch <<< "$current"

  case "$type" in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      log_error "Unknown bump type: $type (use: patch, minor, major)"
      exit 1
      ;;
  esac

  echo "${major}.${minor}.${patch}"
}

update_file() {
  local file="$1"
  local old_version="$2"
  local new_version="$3"
  local full_path="$PROJECT_ROOT/$file"

  if [ ! -f "$full_path" ]; then
    log_verbose "Skipped (not found): $file"
    return 0
  fi

  # Count replacements
  local count
  count=$(grep -c "$old_version" "$full_path" 2>/dev/null | tr -d '[:space:]' || echo "0")

  if [ "$count" -eq 0 ]; then
    log_verbose "Skipped (no match): $file"
    return 0
  fi

  if [ "$DRY_RUN" = true ]; then
    log_dry "Would update: $file ($count occurrence(s))"
    return 0
  fi

  sed -i "s/${old_version}/${new_version}/g" "$full_path"
  log_verbose "Updated: $file ($count occurrence(s))"
  return 1  # Return 1 to indicate file was changed (for counting)
}

update_all_files() {
  local old_version="$1"
  local new_version="$2"
  local changed=0

  echo ""
  echo -e "${BOLD}Updating files...${NC}"

  for file in "${UPDATE_FILES[@]}"; do
    update_file "$file" "$old_version" "$new_version" || changed=$((changed + 1))
  done

  # Also update template files
  for file in "${UPDATE_FILES[@]}"; do
    local template_file="$TEMPLATE_PREFIX/$file"
    update_file "$template_file" "$old_version" "$new_version" || changed=$((changed + 1))
  done

  if [ "$DRY_RUN" = true ]; then
    echo ""
    log_info "Dry-run complete. No files were modified."
  else
    echo ""
    log_success "$changed file(s) updated."
  fi
}

generate_changelog_entry() {
  local new_version="$1"
  local old_version="$2"
  local changelog="$PROJECT_ROOT/CHANGELOG.md"
  local date
  date=$(date +%Y-%m-%d)

  # Get commits since last tag or since beginning
  local last_tag
  last_tag=$(git -C "$PROJECT_ROOT" tag --sort=-version:refname | head -1 2>/dev/null || echo "")

  local log_range
  if [ -n "$last_tag" ]; then
    log_range="${last_tag}..HEAD"
  else
    log_range="HEAD"
  fi

  # Collect commits by type
  local feats fixes docs refactors others
  feats=$(git -C "$PROJECT_ROOT" log "$log_range" --pretty=format:"%s" 2>/dev/null | grep -E "^feat" | sed 's/^feat[^:]*: //' || true)
  fixes=$(git -C "$PROJECT_ROOT" log "$log_range" --pretty=format:"%s" 2>/dev/null | grep -E "^fix" | sed 's/^fix[^:]*: //' || true)
  docs=$(git -C "$PROJECT_ROOT" log "$log_range" --pretty=format:"%s" 2>/dev/null | grep -E "^docs" | sed 's/^docs[^:]*: //' || true)
  refactors=$(git -C "$PROJECT_ROOT" log "$log_range" --pretty=format:"%s" 2>/dev/null | grep -E "^refactor" | sed 's/^refactor[^:]*: //' || true)
  others=$(git -C "$PROJECT_ROOT" log "$log_range" --pretty=format:"%s" 2>/dev/null | grep -vE "^(feat|fix|docs|refactor)" || true)

  # Build entry
  local entry=""
  entry+="## [${new_version}] - ${date}\n\n"

  if [ -n "$feats" ]; then
    entry+="### Added\n\n"
    while IFS= read -r line; do
      [ -n "$line" ] && entry+="- ${line}\n"
    done <<< "$feats"
    entry+="\n"
  fi

  if [ -n "$fixes" ]; then
    entry+="### Fixed\n\n"
    while IFS= read -r line; do
      [ -n "$line" ] && entry+="- ${line}\n"
    done <<< "$fixes"
    entry+="\n"
  fi

  if [ -n "$docs" ]; then
    entry+="### Documentation\n\n"
    while IFS= read -r line; do
      [ -n "$line" ] && entry+="- ${line}\n"
    done <<< "$docs"
    entry+="\n"
  fi

  if [ -n "$refactors" ]; then
    entry+="### Changed\n\n"
    while IFS= read -r line; do
      [ -n "$line" ] && entry+="- ${line}\n"
    done <<< "$refactors"
    entry+="\n"
  fi

  if [ -n "$others" ]; then
    entry+="### Other\n\n"
    while IFS= read -r line; do
      [ -n "$line" ] && entry+="- ${line}\n"
    done <<< "$others"
    entry+="\n"
  fi

  if [ "$DRY_RUN" = true ]; then
    echo ""
    log_dry "Would generate CHANGELOG.md entry:"
    echo -e "$entry"
    return 0
  fi

  # Insert new entry after the header
  if [ -f "$changelog" ]; then
    # Insert after the "# Changelog" header line and first blank line
    local temp_file
    temp_file=$(mktemp)
    local header_done=false

    while IFS= read -r line; do
      echo "$line" >> "$temp_file"
      if [ "$header_done" = false ] && echo "$line" | grep -qE "^# Changelog"; then
        echo "" >> "$temp_file"
        echo -e "$entry" >> "$temp_file"
        header_done=true
        # Skip the next blank line if present
        read -r next_line || true
        if [ -n "$next_line" ]; then
          echo "$next_line" >> "$temp_file"
        fi
      fi
    done < "$changelog"

    mv "$temp_file" "$changelog"
  else
    # Create new changelog
    {
      echo "# Changelog"
      echo ""
      echo "All notable changes to this project will be documented in this file."
      echo "Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)."
      echo ""
      echo -e "$entry"
    } > "$changelog"
  fi

  log_success "CHANGELOG.md updated."
}

create_commit_and_tag() {
  local new_version="$1"

  if [ "$DRY_RUN" = true ]; then
    log_dry "Would commit: \"release: v${new_version}\""
    log_dry "Would tag: v${new_version}"
    return 0
  fi

  if [ "$NO_COMMIT" = false ]; then
    echo ""
    echo -e "${BOLD}Creating commit...${NC}"
    git -C "$PROJECT_ROOT" add -A
    git -C "$PROJECT_ROOT" commit -m "release: v${new_version}"
    log_success "Committed: release: v${new_version}"
  fi

  if [ "$NO_TAG" = false ] && [ "$NO_COMMIT" = false ]; then
    echo ""
    echo -e "${BOLD}Creating tag...${NC}"
    git -C "$PROJECT_ROOT" tag -a "v${new_version}" -m "Release v${new_version}"
    log_success "Tagged: v${new_version}"
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      patch|minor|major)
        BUMP_TYPE="$1"
        ;;
      --dry-run)
        DRY_RUN=true
        ;;
      --no-commit)
        NO_COMMIT=true
        ;;
      --no-tag)
        NO_TAG=true
        ;;
      --verbose|-v)
        VERBOSE=true
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
    shift
  done
}

show_help() {
  echo ""
  echo -e "${BOLD}${CYAN}release.sh${NC} - Claude Workflow Engine Release Tool"
  echo ""
  echo -e "${BOLD}USAGE:${NC}"
  echo "  bash scripts/release.sh [patch|minor|major] [options]"
  echo ""
  echo -e "${BOLD}BUMP TYPES:${NC}"
  echo "  patch    Increment patch version (0.2.7 -> 0.2.8) [default]"
  echo "  minor    Increment minor version (0.2.7 -> 0.3.0)"
  echo "  major    Increment major version (0.2.7 -> 1.0.0)"
  echo ""
  echo -e "${BOLD}OPTIONS:${NC}"
  echo "  --dry-run     Show what would be done without making changes"
  echo "  --no-commit   Skip git commit"
  echo "  --no-tag      Skip git tag creation"
  echo "  --verbose     Show detailed output"
  echo "  --help, -h    Show this help"
  echo ""
  echo -e "${BOLD}EXAMPLES:${NC}"
  echo "  bash scripts/release.sh patch --dry-run    # Preview patch bump"
  echo "  bash scripts/release.sh minor              # Release minor version"
  echo "  bash scripts/release.sh patch --no-tag     # Bump without tagging"
  echo ""
}

# --- Main ---

main() {
  parse_args "$@"

  local current_version new_version
  current_version=$(get_current_version)
  new_version=$(bump_version "$current_version" "$BUMP_TYPE")

  echo ""
  echo -e "${BOLD}${CYAN}Claude Workflow Engine Release${NC}"
  echo -e "  ${current_version} → ${GREEN}${BOLD}${new_version}${NC} (${BUMP_TYPE})"

  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${YELLOW}[DRY-RUN MODE]${NC}"
  fi

  # 1. Update all files
  update_all_files "$current_version" "$new_version"

  # 2. Generate changelog
  echo ""
  echo -e "${BOLD}Generating changelog...${NC}"
  generate_changelog_entry "$new_version" "$current_version"

  # 3. Commit and tag
  create_commit_and_tag "$new_version"

  # Summary
  echo ""
  if [ "$DRY_RUN" = false ]; then
    echo -e "${GREEN}${BOLD}Release v${new_version} complete.${NC}"
    if [ "$NO_COMMIT" = false ]; then
      echo -e "  Run ${CYAN}git push && git push --tags${NC} to publish."
    fi
  fi
}

main "$@"
