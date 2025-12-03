#!/usr/bin/env bash
# Common functions and variables for all scripts

# --- Robust Scripting Header ---
set -eo pipefail

# --- Color Definitions ---
# Usage: echo "${GREEN}This is green text${NC}"
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'

# --- Logging Functions ---
# Usage: info "This is an info message"
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

# --- Core Functions ---

# Get repository root, with fallback for non-git repositories
get_repo_root() {
    if git rev-parse --show-toplevel >/dev/null 2>&1; then
        git rev-parse --show-toplevel
    else
        # Fall back to this script's location for non-git repos
        local script_dir
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        (cd "$script_dir/../../.." && pwd)
    fi
}

# Check if git is available
has_git() {
    command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null
}

# Get current branch, with fallback for non-git repositories
get_current_branch() {
    # 1. Prioritize SPECIFY_FEATURE environment variable
    if [[ -n "${SPECIFY_FEATURE:-}" ]]; then
        echo "$SPECIFY_FEATURE"
        return
    fi
    
    # 2. Check git if available
    if has_git; then
        git rev-parse --abbrev-ref HEAD
        return
    fi
    
    # 3. Fallback for non-git repos: find the latest-numbered feature directory
    local repo_root
    repo_root=$(get_repo_root)
    local specs_dir="$repo_root/specs"
    
    if [[ -d "$specs_dir" ]]; then
        # Find the directory with the highest number prefix (e.g., "007-...")
        local latest_feature
        latest_feature=$(ls -1 "$specs_dir" | grep -E '^[0-9]{3}-' | sort -r | head -n 1)
        
        if [[ -n "$latest_feature" ]]; then
            echo "$latest_feature"
            return
        fi
    fi
    
    # 4. Final fallback
    echo "main"
}


# Validate that the current branch is a feature branch (e.g., 001-some-feature)
check_feature_branch() {
    local branch="$1"
    
    if ! has_git; then
        warn "Git repository not detected; skipping branch validation."
        return 0
    fi
    
    if [[ ! "$branch" =~ ^[0-9]{3}- ]]; then
        error "Not on a valid feature branch (e.g., '001-feature-name'). Current branch: $branch"
    fi
    
    return 0
}

# Resolve the full path to the specification directory for a given feature branch
resolve_spec_dir() {
    local repo_root="$1"
    local feature_branch="$2"
    echo "$repo_root/specs/$feature_branch"
}

# Output all relevant feature paths as environment variables
get_feature_paths() {
    local repo_root
    repo_root=$(get_repo_root)
    local current_branch
    current_branch=$(get_current_branch)
    
    local feature_dir
    feature_dir=$(resolve_spec_dir "$repo_root" "$current_branch")
    
    # Use cat for clean multiline output
    cat <<EOF
REPO_ROOT='$repo_root'
CURRENT_BRANCH='$current_branch'
HAS_GIT='$(has_git && echo true || echo false)'
FEATURE_DIR='$feature_dir'
FEATURE_SPEC='$feature_dir/spec.md'
IMPL_PLAN='$feature_dir/plan.md'
TASKS='$feature_dir/tasks.md'
RESEARCH='$feature_dir/research.md'
DATA_MODEL='$feature_dir/data-model.md'
QUICKSTART='$feature_dir/quickstart.md'
CONTRACTS_DIR='$feature_dir/contracts'
EOF
}

# --- Status Check Helpers ---
# Usage: check_file "$FEATURE_SPEC" "Feature Spec"
check_file() {
    [[ -f "$1" ]] && echo -e "  ${GREEN}✓${NC} $2" || echo -e "  ${RED}✗${NC} $2"
}

check_dir() {
    # Checks if a directory exists and is not empty
    [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo -e "  ${GREEN}✓${NC} $2" || echo -e "  ${RED}✗${NC} $2"
}