#!/usr/bin/env bash
set -euo pipefail

# detect-version.sh
# Detects the current template version from .template.config.json in the provisioned app

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if .template.config.json exists
if [ ! -f ".template.config.json" ]; then
    log_error ".template.config.json not found in current directory"
    log_error "This does not appear to be a provisioned template app"
    exit 1
fi

# Extract current version using jq
if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install jq to use this script."
    exit 1
fi

# Read the template config
template_config=$(cat .template.config.json)

# Extract template name
template_name=$(echo "$template_config" | jq -r '.templateName // empty')
if [ -z "$template_name" ]; then
    log_error "templateName not found in .template.config.json"
    exit 1
fi

# Extract current version
current_version=$(echo "$template_config" | jq -r '.templateVersion // empty')
if [ -z "$current_version" ]; then
    log_error "templateVersion not found in .template.config.json"
    exit 1
fi

# Extract source repository if available
source_repo=$(echo "$template_config" | jq -r '.sourceRepo // empty')

# Validate version format (should be semver-like)
if ! echo "$current_version" | grep -qE '^v?[0-9]+\.[0-9]+\.[0-9]+'; then
    log_error "Invalid version format: $current_version"
    log_error "Expected semantic version (e.g., 1.0.0 or v1.0.0)"
    exit 1
fi

# Normalize version (ensure it starts with 'v')
if [[ ! "$current_version" =~ ^v ]]; then
    current_version="v${current_version}"
fi

# Output the detected information
log_info "Template Name: $template_name"
log_info "Current Version: $current_version"
if [ -n "$source_repo" ]; then
    log_info "Source Repository: $source_repo"
fi

# Output as JSON for programmatic use (to stdout)
jq -n \
    --arg template_name "$template_name" \
    --arg current_version "$current_version" \
    --arg source_repo "$source_repo" \
    '{
        templateName: $template_name,
        currentVersion: $current_version,
        sourceRepo: $source_repo
    }'

exit 0
