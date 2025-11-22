#!/usr/bin/env bash
set -euo pipefail

# apply-incremental-diffs.sh
# Applies diffs sequentially to the provisioned app with conflict tracking

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1" >&2
    fi
}

log_conflict() {
    echo -e "${MAGENTA}[CONFLICT]${NC} $1" >&2
}

# Usage function
usage() {
    cat << EOF
Usage: $0 --target <dir> --diffs-dir <dir> --metadata <file> [options]

Required Arguments:
  --target <dir>         Target provisioned app directory
  --diffs-dir <dir>      Directory containing diff files
  --metadata <file>      Metadata JSON file from collect-diffs.sh

Optional Arguments:
  --exclude <file>       Exclusions file (e.g., .template-app/exclude.json)
  --dry-run              Simulate application without making changes
  --help                 Show this help message

Environment Variables:
  DEBUG                  Set to 'true' for debug output

Example:
  $0 --target ./my-app --diffs-dir ./diffs --metadata ./diffs/diffs-metadata.json

EOF
    exit 1
}

# Parse arguments
TARGET_DIR=""
DIFFS_DIR=""
METADATA_FILE=""
EXCLUDE_FILE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            TARGET_DIR="$2"
            shift 2
            ;;
        --diffs-dir)
            DIFFS_DIR="$2"
            shift 2
            ;;
        --metadata)
            METADATA_FILE="$2"
            shift 2
            ;;
        --exclude)
            EXCLUDE_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            log_error "Unknown argument: $1"
            usage
            ;;
    esac
done

# Validate required arguments
if [ -z "$TARGET_DIR" ] || [ -z "$DIFFS_DIR" ] || [ -z "$METADATA_FILE" ]; then
    log_error "Missing required arguments"
    usage
fi

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    log_error "Target directory not found: $TARGET_DIR"
    exit 1
fi

# Check if diffs directory exists
if [ ! -d "$DIFFS_DIR" ]; then
    log_error "Diffs directory not found: $DIFFS_DIR"
    exit 1
fi

# Check if metadata file exists
if [ ! -f "$METADATA_FILE" ]; then
    log_error "Metadata file not found: $METADATA_FILE"
    exit 1
fi

if [ "$DRY_RUN" = true ]; then
    log_warn "DRY RUN MODE - No changes will be made"
fi

# Read exclusion patterns if provided
exclusion_patterns=()
if [ -n "$EXCLUDE_FILE" ] && [ -f "$EXCLUDE_FILE" ]; then
    log_info "Loading exclusion patterns from: $EXCLUDE_FILE"
    mapfile -t exclusion_patterns < <(jq -r '.[] // empty' "$EXCLUDE_FILE")
    log_info "Loaded ${#exclusion_patterns[@]} exclusion pattern(s)"
fi

# Function to check if file matches exclusion patterns
is_excluded() {
    local file="$1"
    for pattern in "${exclusion_patterns[@]}"; do
        if [[ "$file" == $pattern ]]; then
            log_debug "File excluded by pattern '$pattern': $file"
            return 0
        fi
    done
    return 1
}

# Change to target directory
cd "$TARGET_DIR"
log_info "Working in target directory: $TARGET_DIR"

# Initialize git if not already initialized (for patch application)
if [ ! -d ".git" ]; then
    log_warn "Target directory is not a git repository"
    log_warn "Initializing temporary git repository for patch application"
    if [ "$DRY_RUN" = false ]; then
        git init --quiet
        git config user.email "template-update@algtools.local"
        git config user.name "Template Update Bot"
        git add -A
        git commit --quiet -m "Initial commit before template update"
    fi
fi

# Read metadata
diffs_count=$(jq 'length' "$METADATA_FILE")
log_info "Applying $diffs_count incremental diff(s)"

# Track statistics
total_files_changed=0
total_conflicts=0
applied_versions=()
skipped_versions=()
conflict_files=()

# Process each diff
for i in $(seq 0 $((diffs_count - 1))); do
    diff_info=$(jq ".[$i]" "$METADATA_FILE")

    from_version=$(echo "$diff_info" | jq -r '.from_version')
    to_version=$(echo "$diff_info" | jq -r '.to_version')
    diff_file=$(echo "$diff_info" | jq -r '.diff_file')
    files_changed=$(echo "$diff_info" | jq -r '.files_changed')

    log_info ""
    log_info "═══════════════════════════════════════════════════"
    log_info "Applying diff $((i+1))/$diffs_count: $from_version → $to_version"
    log_info "Files to change: $files_changed"
    log_info "═══════════════════════════════════════════════════"

    # Check if diff file exists
    if [ ! -f "$diff_file" ]; then
        log_error "Diff file not found: $diff_file"
        skipped_versions+=("$to_version")
        continue
    fi

    # Get list of files that would be changed
    changed_files_file="${diff_file%.diff}.files"
    if [ ! -f "$changed_files_file" ]; then
        log_warn "Changed files list not found: $changed_files_file"
    else
        # Filter files based on exclusions
        filtered_files=()
        while IFS= read -r file; do
            if [ -n "$file" ] && ! is_excluded "$file"; then
                filtered_files+=("$file")
            else
                log_debug "Excluding file from update: $file"
            fi
        done < "$changed_files_file"

        actual_files_to_change=${#filtered_files[@]}
        excluded_count=$((files_changed - actual_files_to_change))

        if [ "$excluded_count" -gt 0 ]; then
            log_info "Excluded $excluded_count file(s) based on patterns"
        fi
    fi

    # Try to apply the patch
    log_info "Applying patch..."

    if [ "$DRY_RUN" = true ]; then
        # Dry run: Check if patch would apply cleanly
        if git apply --check --allow-empty "$diff_file" 2>&1; then
            log_success "✓ Patch would apply cleanly"
            applied_versions+=("$to_version")
            total_files_changed=$((total_files_changed + files_changed))
        else
            log_conflict "✗ Patch would have conflicts"
            skipped_versions+=("$to_version")
            total_conflicts=$((total_conflicts + 1))
        fi
    else
        # Actually apply the patch
        if git apply --allow-empty "$diff_file" 2>&1; then
            log_success "✓ Patch applied successfully"
            applied_versions+=("$to_version")
            total_files_changed=$((total_files_changed + files_changed))

            # Commit the changes
            git add -A
            git commit --quiet -m "chore: apply template updates from $to_version" || true
        else
            log_conflict "✗ Patch has conflicts"

            # Try 3-way merge
            log_info "Attempting 3-way merge..."
            if git apply --3way "$diff_file" 2>&1; then
                log_success "✓ 3-way merge successful"

                # Check for remaining conflicts
                if git diff --check 2>&1 | grep -q "conflict"; then
                    log_warn "Some conflicts remain and need manual resolution"
                    conflict_files+=($(git diff --name-only --diff-filter=U))
                    total_conflicts=$((total_conflicts + 1))
                else
                    log_success "All conflicts resolved automatically"
                fi

                applied_versions+=("$to_version (with conflicts)")
                total_files_changed=$((total_files_changed + files_changed))

                # Stage resolved files
                git add -A
                git commit --quiet -m "chore: apply template updates from $to_version (with merge conflicts resolved)" || true
            else
                log_error "3-way merge failed"
                log_warn "Skipping this version. Manual intervention may be required."
                skipped_versions+=("$to_version")
                total_conflicts=$((total_conflicts + 1))

                # Reset to clean state
                git reset --hard HEAD --quiet
            fi
        fi
    fi
done

# Generate application report
log_info ""
log_info "═══════════════════════════════════════════════════"
log_info "APPLICATION SUMMARY"
log_info "═══════════════════════════════════════════════════"
log_info "Total diffs processed: $diffs_count"
log_info "Successfully applied: ${#applied_versions[@]}"
log_info "Skipped/Failed: ${#skipped_versions[@]}"
log_info "Total files changed: $total_files_changed"
log_info "Conflicts encountered: $total_conflicts"

if [ ${#applied_versions[@]} -gt 0 ]; then
    log_success ""
    log_success "Applied versions:"
    for version in "${applied_versions[@]}"; do
        log_success "  ✓ $version"
    done
fi

if [ ${#skipped_versions[@]} -gt 0 ]; then
    log_warn ""
    log_warn "Skipped versions:"
    for version in "${skipped_versions[@]}"; do
        log_warn "  ✗ $version"
    done
fi

if [ ${#conflict_files[@]} -gt 0 ]; then
    log_conflict ""
    log_conflict "Files with unresolved conflicts:"
    for file in "${conflict_files[@]}"; do
        log_conflict "  ! $file"
    done
fi

# Generate JSON report
report_json=$(jq -n \
    --argjson total "$diffs_count" \
    --argjson applied "${#applied_versions[@]}" \
    --argjson skipped "${#skipped_versions[@]}" \
    --argjson files_changed "$total_files_changed" \
    --argjson conflicts "$total_conflicts" \
    --argjson applied_list "$(printf '%s\n' "${applied_versions[@]}" | jq -R . | jq -s .)" \
    --argjson skipped_list "$(printf '%s\n' "${skipped_versions[@]}" | jq -R . | jq -s .)" \
    --argjson conflict_files "$(printf '%s\n' "${conflict_files[@]}" | jq -R . | jq -s .)" \
    '{
        total_diffs: $total,
        applied: $applied,
        skipped: $skipped,
        files_changed: $files_changed,
        conflicts: $conflicts,
        applied_versions: $applied_list,
        skipped_versions: $skipped_list,
        conflict_files: $conflict_files,
        dry_run: env.DRY_RUN
    }')

# Output JSON report to stdout
echo "$report_json" | jq '.'

# Exit with appropriate code
if [ ${#skipped_versions[@]} -gt 0 ]; then
    exit 1
else
    exit 0
fi
