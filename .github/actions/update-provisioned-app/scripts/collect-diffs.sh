#!/usr/bin/env bash
set -euo pipefail

# collect-diffs.sh
# Collects git diffs between consecutive versions

VERSIONS_FILE="$1"
OUTPUT_DIR="$2"

# Setup temp directory for cloning
TEMP_DIR="/tmp/template-diffs-$$"
mkdir -p "$TEMP_DIR"
mkdir -p "$OUTPUT_DIR"

# Clone the template repository
if [ -n "$GH_TOKEN" ]; then
  CLONE_URL="https://x-access-token:${GH_TOKEN}@github.com/${SOURCE_REPO}.git"
else
  CLONE_URL="https://github.com/${SOURCE_REPO}.git"
fi

echo "  Cloning repository: $SOURCE_REPO"
git clone --quiet "$CLONE_URL" "$TEMP_DIR/repo" 2>&1 | grep -v "warning:" || true
cd "$TEMP_DIR/repo"
git fetch --tags --quiet

# Read versions
versions=$(jq -r '.[].tag_name' "$VERSIONS_FILE")
versions_array=($versions)

# Initialize metadata
diffs_metadata="[]"
prev_version=""

for version in "${versions_array[@]}"; do
  if [ -z "$prev_version" ]; then
    # For first version, find what came before it
    all_tags=$(git tag -l --sort=version:refname)
    prev_version=$(echo "$all_tags" | grep -B1 "^${version}$" | head -n1)

    if [ -z "$prev_version" ] || [ "$prev_version" = "$version" ]; then
      echo "  Warning: Could not find previous version for $version"
      prev_version="$version"
      continue
    fi
  fi

  echo "  Generating diff: $prev_version → $version"

  # Generate diff
  diff_file="${OUTPUT_DIR}/${prev_version}_to_${version}.diff"
  git diff "$prev_version..$version" > "$diff_file"

  diff_size=$(wc -c < "$diff_file")

  # Get changed files
  changed_files=$(git diff --name-only "$prev_version..$version")
  files_count=$(echo "$changed_files" | grep -c . || echo "0")
  echo "$changed_files" > "${OUTPUT_DIR}/${prev_version}_to_${version}.files"

  # Get commits
  git log --pretty=format:"%h %s" "$prev_version..$version" > "${OUTPUT_DIR}/${prev_version}_to_${version}.commits"
  commits_count=$(git log --oneline "$prev_version..$version" | wc -l)

  # Get release info
  release_info=$(jq --arg ver "$version" '.[] | select(.tag_name == $ver)' "$VERSIONS_FILE")

  # Add to metadata
  diffs_metadata=$(echo "$diffs_metadata" | jq \
    --arg from "$prev_version" \
    --arg to "$version" \
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

  prev_version="$version"
done

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo "✓ Generated $(echo "$diffs_metadata" | jq 'length') diff(s)"

# Output metadata
echo "$diffs_metadata" | jq '.'
