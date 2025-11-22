#!/usr/bin/env bash
set -euo pipefail

# collect-diffs.sh
# Collects git diffs between consecutive versions from a template repository

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1" >&2
    fi
}

# Usage function
usage() {
    cat << EOF
Usage: $0 --repo <owner/repo> --versions <json-file> --output <dir> [options]

Required Arguments:
  --repo <owner/repo>    GitHub repository (e.g., algtools/bff-template)
  --versions <file>      JSON file with version list from query-versions.sh
  --output <dir>         Output directory for diffs

Optional Arguments:
  --token <token>        GitHub API token (or set GITHUB_TOKEN env var)
  --temp-dir <dir>       Temporary directory for cloning (default: /tmp/template-diffs)
  --help                 Show this help message

Environment Variables:
  GITHUB_TOKEN           GitHub API token for authentication
  DEBUG                  Set to 'true' for debug output

Example:
  $0 --repo algtools/bff-template --versions versions.json --output ./diffs

EOF
    exit 1
}

# Parse arguments
REPO=""
VERSIONS_FILE=""
OUTPUT_DIR=""
TEMP_DIR="/tmp/template-diffs-$$"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo)
            REPO="$2"
            shift 2
            ;;
        --versions)
            VERSIONS_FILE="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --temp-dir)
            TEMP_DIR="$2"
            shift 2
            ;;
        --token)
            GITHUB_TOKEN="$2"
            shift 2
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
if [ -z "$REPO" ] || [ -z "$VERSIONS_FILE" ] || [ -z "$OUTPUT_DIR" ]; then
    log_error "Missing required arguments"
    usage
fi

# Check if versions file exists
if [ ! -f "$VERSIONS_FILE" ]; then
    log_error "Versions file not found: $VERSIONS_FILE"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Read versions from JSON file
versions=$(jq -r '.[].version' "$VERSIONS_FILE")
versions_array=($versions)

if [ ${#versions_array[@]} -eq 0 ]; then
    log_error "No versions found in $VERSIONS_FILE"
    exit 1
fi

log_info "Processing ${#versions_array[@]} version(s)"
log_info "Repository: $REPO"
log_info "Output directory: $OUTPUT_DIR"

# Setup git clone URL
if [ -n "$GITHUB_TOKEN" ]; then
    CLONE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"
    log_debug "Using authenticated git clone"
else
    CLONE_URL="https://github.com/${REPO}.git"
    log_warn "No GitHub token provided. Cloning public repository."
fi

# Clone the repository
log_info "Cloning repository to: $TEMP_DIR"
mkdir -p "$TEMP_DIR"

if ! git clone --quiet "$CLONE_URL" "$TEMP_DIR/repo" 2>&1 | grep -v "warning: "; then
    log_error "Failed to clone repository"
    exit 1
fi

cd "$TEMP_DIR/repo"

# Fetch all tags
log_info "Fetching all tags..."
git fetch --tags --quiet

# Process each version and collect diffs
prev_version=""
diffs_metadata="[]"

for i in "${!versions_array[@]}"; do
    current_version="${versions_array[$i]}"
    log_info "Processing version $((i+1))/${#versions_array[@]}: $current_version"

    # Determine the previous version
    if [ -z "$prev_version" ]; then
        # For the first version, we need to find what came before it
        # Get all tags and find the one right before current_version
        all_tags=$(git tag -l --sort=version:refname)
        prev_version=$(echo "$all_tags" | grep -B1 "^${current_version}$" | head -n1)

        if [ -z "$prev_version" ] || [ "$prev_version" = "$current_version" ]; then
            log_warn "Could not find previous version for $current_version"
            log_warn "This might be the first version. Skipping diff generation."
            prev_version="$current_version"
            continue
        fi
        log_debug "Determined previous version: $prev_version"
    fi

    # Generate diff between versions
    diff_file="${OUTPUT_DIR}/${prev_version}_to_${current_version}.diff"
    log_info "Generating diff: $prev_version → $current_version"

    if git diff "$prev_version..$current_version" > "$diff_file"; then
        diff_size=$(wc -c < "$diff_file")
        line_count=$(wc -l < "$diff_file")

        if [ "$diff_size" -eq 0 ]; then
            log_warn "No changes detected between $prev_version and $current_version"
        else
            log_info "  Diff size: $diff_size bytes, $line_count lines"
        fi

        # Get list of changed files
        changed_files=$(git diff --name-only "$prev_version..$current_version")
        files_count=$(echo "$changed_files" | grep -c . || echo "0")
        log_info "  Files changed: $files_count"

        # Get commit messages between versions
        commit_messages=$(git log --oneline "$prev_version..$current_version")
        commits_count=$(echo "$commit_messages" | grep -c . || echo "0")
        log_debug "  Commits: $commits_count"

        # Save changed files list
        echo "$changed_files" > "${OUTPUT_DIR}/${prev_version}_to_${current_version}.files"

        # Save commit messages
        git log --pretty=format:"%h %s" "$prev_version..$current_version" > "${OUTPUT_DIR}/${prev_version}_to_${current_version}.commits"

        # Get stats
        stats=$(git diff --stat "$prev_version..$current_version")
        echo "$stats" > "${OUTPUT_DIR}/${prev_version}_to_${current_version}.stats"

        # Get release info from versions file
        release_info=$(jq --arg ver "$current_version" '.[] | select(.version == $ver)' "$VERSIONS_FILE")

        # Add metadata
        diffs_metadata=$(echo "$diffs_metadata" | jq \
            --arg from "$prev_version" \
            --arg to "$current_version" \
            --arg diff_file "$diff_file" \
            --arg files_count "$files_count" \
            --arg commits_count "$commits_count" \
            --arg diff_size "$diff_size" \
            --argjson release "$release_info" \
            '. += [{
                from_version: $from,
                to_version: $to,
                diff_file: $diff_file,
                files_changed: ($files_count | tonumber),
                commits: ($commits_count | tonumber),
                diff_size: ($diff_size | tonumber),
                release_info: $release
            }]')
    else
        log_error "Failed to generate diff for $prev_version → $current_version"
    fi

    # Update previous version for next iteration
    prev_version="$current_version"
done

# Save metadata
metadata_file="${OUTPUT_DIR}/diffs-metadata.json"
echo "$diffs_metadata" | jq '.' > "$metadata_file"
log_info "Metadata saved to: $metadata_file"

# Cleanup
log_info "Cleaning up temporary directory..."
cd - > /dev/null
rm -rf "$TEMP_DIR"

log_info "Diff collection complete!"
log_info "Generated $(echo "$diffs_metadata" | jq 'length') diff(s)"

# Output metadata to stdout
echo "$diffs_metadata" | jq '.'

exit 0
