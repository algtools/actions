#!/usr/bin/env bash
set -euo pipefail

# query-versions.sh
# Queries GitHub API for versions between current and target

# Get all releases from GitHub
releases_json=$(gh api "/repos/${SOURCE_REPO}/releases" --paginate --jq '[.[] | select(.draft == false and .prerelease == false)]')

# Extract versions
all_versions=$(echo "$releases_json" | jq -r '.[].tag_name')

# Find versions between current and target (inclusive of target)
# This is a simple approach - just get all versions and filter
versions_array="[]"

found_current=false
for version in $all_versions; do
  # Once we find current version, start collecting
  if [ "$version" = "$TARGET_VERSION" ]; then
    # Add target version
    release_info=$(echo "$releases_json" | jq ".[] | select(.tag_name == \"$version\")")
    versions_array=$(echo "$versions_array" | jq ". += [$release_info]")
    break
  fi

  if [ "$version" = "$CURRENT_VERSION" ]; then
    found_current=true
    continue
  fi

  if [ "$found_current" = true ]; then
    release_info=$(echo "$releases_json" | jq ".[] | select(.tag_name == \"$version\")")
    versions_array=$(echo "$versions_array" | jq ". += [$release_info]")
  fi
done

# Output the versions array
echo "$versions_array" | jq '.'
