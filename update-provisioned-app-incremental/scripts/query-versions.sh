#!/usr/bin/env bash
set -euo pipefail

# query-versions.sh
# Queries GitHub API to find all versions between current and target

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
Usage: $0 --repo <owner/repo> --from <version> --to <version> [options]

Required Arguments:
  --repo <owner/repo>    GitHub repository (e.g., algtools/bff-template)
  --from <version>       Starting version (e.g., v1.7.2)
  --to <version>         Target version (e.g., v1.8.2 or 'latest')

Optional Arguments:
  --token <token>        GitHub API token (or set GITHUB_TOKEN env var)
  --help                 Show this help message

Environment Variables:
  GITHUB_TOKEN           GitHub API token for authentication
  DEBUG                  Set to 'true' for debug output

Example:
  $0 --repo algtools/bff-template --from v1.7.2 --to v1.8.2
  $0 --repo algtools/core-template --from v1.0.0 --to latest

EOF
    exit 1
}

# Parse arguments
REPO=""
FROM_VERSION=""
TO_VERSION=""
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo)
            REPO="$2"
            shift 2
            ;;
        --from)
            FROM_VERSION="$2"
            shift 2
            ;;
        --to)
            TO_VERSION="$2"
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
if [ -z "$REPO" ] || [ -z "$FROM_VERSION" ] || [ -z "$TO_VERSION" ]; then
    log_error "Missing required arguments"
    usage
fi

# Normalize versions (ensure they start with 'v')
if [[ ! "$FROM_VERSION" =~ ^v ]]; then
    FROM_VERSION="v${FROM_VERSION}"
fi
if [[ "$TO_VERSION" != "latest" ]] && [[ ! "$TO_VERSION" =~ ^v ]]; then
    TO_VERSION="v${TO_VERSION}"
fi

log_info "Repository: $REPO"
log_info "From Version: $FROM_VERSION"
log_info "To Version: $TO_VERSION"

# Setup GitHub API headers
if [ -n "$GITHUB_TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $GITHUB_TOKEN"
    log_debug "Using authenticated GitHub API requests"
else
    AUTH_HEADER=""
    log_warn "No GitHub token provided. API rate limits may apply."
fi

# Function to make GitHub API request
gh_api() {
    local endpoint="$1"
    local url="https://api.github.com${endpoint}"

    if [ -n "$AUTH_HEADER" ]; then
        curl -s -H "$AUTH_HEADER" -H "Accept: application/vnd.github+json" "$url"
    else
        curl -s -H "Accept: application/vnd.github+json" "$url"
    fi
}

# Fetch all releases from GitHub
log_info "Fetching releases from GitHub..."
releases_json=$(gh_api "/repos/${REPO}/releases?per_page=100")

# Check if API call was successful
if echo "$releases_json" | jq -e '.message' > /dev/null 2>&1; then
    error_message=$(echo "$releases_json" | jq -r '.message')
    log_error "GitHub API error: $error_message"
    exit 1
fi

# If TO_VERSION is 'latest', get the latest non-prerelease version
if [ "$TO_VERSION" = "latest" ]; then
    TO_VERSION=$(echo "$releases_json" | jq -r '[.[] | select(.prerelease == false and .draft == false)] | .[0].tag_name')
    if [ "$TO_VERSION" = "null" ] || [ -z "$TO_VERSION" ]; then
        log_error "No releases found in repository"
        exit 1
    fi
    log_info "Latest version resolved to: $TO_VERSION"
fi

# Function to parse semantic version
parse_semver() {
    local version="$1"
    # Remove 'v' prefix
    version="${version#v}"
    # Split into major.minor.patch (handle prerelease and metadata)
    local ver_core="${version%%-*}"  # Remove prerelease
    ver_core="${ver_core%%+*}"       # Remove metadata
    echo "$ver_core"
}

# Function to compare versions (returns 0 if v1 < v2, 1 if v1 >= v2)
version_lt() {
    local v1="$1"
    local v2="$2"

    # Parse versions
    local v1_clean=$(parse_semver "$v1")
    local v2_clean=$(parse_semver "$v2")

    # Use sort to compare versions
    if [ "$v1_clean" = "$v2_clean" ]; then
        return 1  # equal
    fi

    local sorted=$(printf "%s\n%s" "$v1_clean" "$v2_clean" | sort -V | head -n1)
    if [ "$sorted" = "$v1_clean" ]; then
        return 0  # v1 < v2
    else
        return 1  # v1 >= v2
    fi
}

# Filter releases between FROM_VERSION and TO_VERSION
log_info "Filtering versions between $FROM_VERSION and $TO_VERSION..."

# Get all non-prerelease, non-draft releases
all_versions=$(echo "$releases_json" | jq -r '[.[] | select(.prerelease == false and .draft == false)] | .[].tag_name')

# Filter versions in range
intermediate_versions=()
for version in $all_versions; do
    # Check if version is > FROM_VERSION and <= TO_VERSION
    if version_lt "$FROM_VERSION" "$version" && (version_lt "$version" "$TO_VERSION" || [ "$version" = "$TO_VERSION" ]); then
        intermediate_versions+=("$version")
        log_debug "Including version: $version"
    else
        log_debug "Excluding version: $version (outside range)"
    fi
done

# Sort versions
IFS=$'\n' sorted_versions=($(sort -V <<<"${intermediate_versions[*]}"))
unset IFS

# Check if we found any versions
if [ ${#sorted_versions[@]} -eq 0 ]; then
    log_warn "No versions found between $FROM_VERSION and $TO_VERSION"
    log_warn "The app might already be on the latest version or versions don't exist"
    # Output empty array
    echo "[]"
    exit 0
fi

log_info "Found ${#sorted_versions[@]} version(s) to apply"

# Build detailed version info with release data
versions_json="[]"
for version in "${sorted_versions[@]}"; do
    log_info "  - $version"

    # Get release details for this version
    release_data=$(echo "$releases_json" | jq --arg tag "$version" '.[] | select(.tag_name == $tag)')

    # Extract key information
    release_name=$(echo "$release_data" | jq -r '.name // ""')
    release_body=$(echo "$release_data" | jq -r '.body // ""')
    release_url=$(echo "$release_data" | jq -r '.html_url // ""')
    published_at=$(echo "$release_data" | jq -r '.published_at // ""')
    tarball_url=$(echo "$release_data" | jq -r '.tarball_url // ""')

    # Check for custom template tarball in assets
    template_asset=$(echo "$release_data" | jq -r '[.assets[] | select(.name | endswith(".tgz") or endswith(".tar.gz"))] | .[0] | .browser_download_url // ""')
    if [ -n "$template_asset" ]; then
        tarball_url="$template_asset"
        log_debug "Using custom template asset: $template_asset"
    fi

    # Add to versions array
    versions_json=$(echo "$versions_json" | jq \
        --arg version "$version" \
        --arg name "$release_name" \
        --arg body "$release_body" \
        --arg url "$release_url" \
        --arg published "$published_at" \
        --arg tarball "$tarball_url" \
        '. += [{
            version: $version,
            name: $name,
            body: $body,
            url: $url,
            published_at: $published,
            tarball_url: $tarball
        }]')
done

# Output JSON to stdout
echo "$versions_json" | jq '.'

exit 0
