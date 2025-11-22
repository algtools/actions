#!/usr/bin/env bash
set -euo pipefail

# generate-pr-description.sh
# Generates a comprehensive PR description showing version-by-version changes

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Usage function
usage() {
    cat << EOF
Usage: $0 --from <version> --to <version> --metadata <file> --application-report <file> [options]

Required Arguments:
  --from <version>             Starting version (e.g., v1.7.2)
  --to <version>               Target version (e.g., v1.8.2)
  --metadata <file>            Metadata JSON from collect-diffs.sh
  --application-report <file>  Application report JSON from apply-incremental-diffs.sh

Optional Arguments:
  --template-name <name>       Template name (default: from metadata)
  --help                       Show this help message

Example:
  $0 --from v1.7.2 --to v1.8.2 --metadata diffs-metadata.json --application-report report.json

EOF
    exit 1
}

# Parse arguments
FROM_VERSION=""
TO_VERSION=""
METADATA_FILE=""
APPLICATION_REPORT=""
TEMPLATE_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --from)
            FROM_VERSION="$2"
            shift 2
            ;;
        --to)
            TO_VERSION="$2"
            shift 2
            ;;
        --metadata)
            METADATA_FILE="$2"
            shift 2
            ;;
        --application-report)
            APPLICATION_REPORT="$2"
            shift 2
            ;;
        --template-name)
            TEMPLATE_NAME="$2"
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
if [ -z "$FROM_VERSION" ] || [ -z "$TO_VERSION" ] || [ -z "$METADATA_FILE" ] || [ -z "$APPLICATION_REPORT" ]; then
    log_error "Missing required arguments"
    usage
fi

# Check if files exist
if [ ! -f "$METADATA_FILE" ]; then
    log_error "Metadata file not found: $METADATA_FILE"
    exit 1
fi

if [ ! -f "$APPLICATION_REPORT" ]; then
    log_error "Application report file not found: $APPLICATION_REPORT"
    exit 1
fi

# Extract template name from metadata if not provided
if [ -z "$TEMPLATE_NAME" ]; then
    TEMPLATE_NAME=$(jq -r '.[0].release_info.release_info.url // "template"' "$METADATA_FILE" | sed 's|https://github.com/[^/]*/\([^/]*\)/.*|\1|')
    if [ "$TEMPLATE_NAME" = "template" ] || [ -z "$TEMPLATE_NAME" ]; then
        TEMPLATE_NAME="template"
    fi
fi

log_info "Generating PR description..."
log_info "From: $FROM_VERSION → To: $TO_VERSION"
log_info "Template: $TEMPLATE_NAME"

# Read metadata and application report
diffs_count=$(jq 'length' "$METADATA_FILE")
applied_count=$(jq '.applied' "$APPLICATION_REPORT")
skipped_count=$(jq '.skipped' "$APPLICATION_REPORT")
files_changed=$(jq '.files_changed' "$APPLICATION_REPORT")
conflicts_count=$(jq '.conflicts' "$APPLICATION_REPORT")

# Start building PR description
pr_description=""

# Header
pr_description+="# 🔄 Template Update: \`$FROM_VERSION\` → \`$TO_VERSION\`\n\n"

# Summary
pr_description+="## 📊 Update Summary\n\n"
pr_description+="This PR applies **incremental changes** from **$diffs_count intermediate version(s)** to bring your app from \`$FROM_VERSION\` to \`$TO_VERSION\`.\n\n"

# Statistics table
pr_description+="| Metric | Value |\n"
pr_description+="|--------|-------|\n"
pr_description+="| 📦 Versions Applied | $applied_count / $diffs_count |\n"
pr_description+="| 📝 Files Changed | $files_changed |\n"
pr_description+="| ⚠️ Conflicts | $conflicts_count |\n"

if [ "$skipped_count" -gt 0 ]; then
    pr_description+="| ⏭️ Versions Skipped | $skipped_count |\n"
fi

pr_description+="\n"

# Version-by-version breakdown
pr_description+="## 📋 Version-by-Version Changes\n\n"
pr_description+="Below are the changes introduced in each version, applied incrementally:\n\n"

# Process each version
for i in $(seq 0 $((diffs_count - 1))); do
    diff_info=$(jq ".[$i]" "$METADATA_FILE")

    from_ver=$(echo "$diff_info" | jq -r '.from_version')
    to_ver=$(echo "$diff_info" | jq -r '.to_version')
    files_count=$(echo "$diff_info" | jq -r '.files_changed')
    commits_count=$(echo "$diff_info" | jq -r '.commits')
    release_name=$(echo "$diff_info" | jq -r '.release_info.name // .to_version')
    release_body=$(echo "$diff_info" | jq -r '.release_info.body // ""')
    release_url=$(echo "$diff_info" | jq -r '.release_info.url // ""')
    published_at=$(echo "$diff_info" | jq -r '.release_info.published_at // ""')

    # Parse version type (major, minor, patch)
    from_clean="${from_ver#v}"
    to_clean="${to_ver#v}"

    IFS='.' read -r from_major from_minor from_patch <<< "$from_clean"
    IFS='.' read -r to_major to_minor to_patch <<< "$to_clean"

    version_type="Patch"
    version_emoji="🔧"
    if [ "$from_major" != "$to_major" ]; then
        version_type="Major"
        version_emoji="💥"
    elif [ "$from_minor" != "$to_minor" ]; then
        version_type="Minor"
        version_emoji="✨"
    fi

    # Check if this version was applied
    was_applied=$(jq --arg ver "$to_ver" '.applied_versions | any(. == $ver)' "$APPLICATION_REPORT")

    if [ "$was_applied" = "true" ]; then
        status_emoji="✅"
        status_text="Applied"
    else
        status_emoji="⏭️"
        status_text="Skipped"
    fi

    # Version header
    pr_description+="<details>\n"
    pr_description+="<summary>\n\n"
    pr_description+="### $status_emoji \`$to_ver\` - $version_emoji $version_type Release\n\n"
    pr_description+="</summary>\n\n"

    # Release details
    if [ -n "$release_name" ] && [ "$release_name" != "$to_ver" ]; then
        pr_description+="**$release_name**\n\n"
    fi

    if [ -n "$published_at" ]; then
        formatted_date=$(echo "$published_at" | cut -d'T' -f1)
        pr_description+="📅 Published: $formatted_date\n\n"
    fi

    pr_description+="📊 **Stats:**\n"
    pr_description+="- $files_count file(s) changed\n"
    pr_description+="- $commits_count commit(s)\n"
    pr_description+="- Status: **$status_text**\n\n"

    if [ -n "$release_url" ]; then
        pr_description+="🔗 [View Release]($release_url)\n\n"
    fi

    # Release notes
    if [ -n "$release_body" ] && [ "$release_body" != "null" ]; then
        pr_description+="#### Release Notes\n\n"
        # Escape and format release body
        formatted_body=$(echo "$release_body" | sed 's/^/> /')
        pr_description+="$formatted_body\n\n"
    fi

    pr_description+="</details>\n\n"
done

# Conflict information
if [ "$conflicts_count" -gt 0 ]; then
    pr_description+="## ⚠️ Conflicts & Manual Review Required\n\n"
    pr_description+="Some changes could not be applied automatically and require manual review:\n\n"

    conflict_files=$(jq -r '.conflict_files[]' "$APPLICATION_REPORT" 2>/dev/null || echo "")
    if [ -n "$conflict_files" ]; then
        pr_description+="**Files with conflicts:**\n"
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                pr_description+="- \`$file\`\n"
            fi
        done <<< "$conflict_files"
        pr_description+="\n"
    fi

    skipped_versions=$(jq -r '.skipped_versions[]' "$APPLICATION_REPORT" 2>/dev/null || echo "")
    if [ -n "$skipped_versions" ]; then
        pr_description+="**Skipped versions:**\n"
        while IFS= read -r version; do
            if [ -n "$version" ]; then
                pr_description+="- \`$version\`\n"
            fi
        done <<< "$skipped_versions"
        pr_description+="\n"
    fi

    pr_description+="Please review these files carefully and resolve conflicts manually.\n\n"
fi

# Testing checklist
pr_description+="## ✅ Testing Checklist\n\n"
pr_description+="Before merging this PR, please verify:\n\n"
pr_description+="- [ ] All tests pass (\`pnpm test\`)\n"
pr_description+="- [ ] Lint checks pass (\`pnpm lint\`)\n"
pr_description+="- [ ] Build succeeds (\`pnpm build\`)\n"
pr_description+="- [ ] Application runs locally without errors\n"

if [ "$conflicts_count" -gt 0 ]; then
    pr_description+="- [ ] All conflicts have been reviewed and resolved\n"
fi

pr_description+="- [ ] Breaking changes have been reviewed (if any)\n"
pr_description+="- [ ] Documentation has been updated (if needed)\n\n"

# Additional notes
pr_description+="## 📝 Additional Notes\n\n"
pr_description+="This is an **incremental update** that applies changes from each intermediate version sequentially. This approach:\n\n"
pr_description+="- ✅ Makes it easier to understand what changed in each version\n"
pr_description+="- ✅ Provides better conflict resolution by applying changes incrementally\n"
pr_description+="- ✅ Allows you to identify which specific version introduced breaking changes\n"
pr_description+="- ✅ Maintains a clear history of template evolution\n\n"

pr_description+="---\n\n"
pr_description+="<sub>🤖 This PR was generated automatically by the incremental template update system.</sub>\n"

# Output to stdout
echo -e "$pr_description"

exit 0
