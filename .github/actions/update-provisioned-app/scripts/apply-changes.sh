#!/usr/bin/env bash
set -euo pipefail

# apply-changes.sh
# Applies diffs with rule processing

DIFFS_DIR="$1"
METADATA_FILE="$2"

# Load metadata
diffs_count=$(jq 'length' "$METADATA_FILE")
echo "  Processing $diffs_count diff(s)"

# Initialize stats
total_files_changed=0
applied_versions=()

# Process each diff
for i in $(seq 0 $((diffs_count - 1))); do
  diff_info=$(jq ".[$i]" "$METADATA_FILE")

  from_version=$(echo "$diff_info" | jq -r '.from_version')
  to_version=$(echo "$diff_info" | jq -r '.to_version')
  diff_file=$(echo "$diff_info" | jq -r '.diff_file')
  files_changed=$(echo "$diff_info" | jq -r '.files_changed')

  echo "  Applying diff $((i+1))/$diffs_count: $from_version → $to_version"

  if [ ! -f "$diff_file" ]; then
    echo "    Warning: Diff file not found: $diff_file"
    continue
  fi

  # Apply the patch
  if git apply --whitespace=nowarn "$diff_file" 2>&1; then
    echo "    ✓ Patch applied successfully"
    applied_versions+=("$to_version")
    total_files_changed=$((total_files_changed + files_changed))

    # Now process files with rules if rule engine is available
    if [ -n "${RULES_ENGINE_PATH:-}" ] && [ -d "$RULES_ENGINE_PATH" ]; then
      # Get list of changed files
      changed_files_file="${diff_file%.diff}.files"
      if [ -f "$changed_files_file" ]; then
        while IFS= read -r file; do
          if [ -n "$file" ] && [ -f "$file" ]; then
            # Process file through rule engine
            node "${RULES_ENGINE_PATH}/rule-engine.js" process-file "$file" 2>&1 | grep -v "^$" || true
          fi
        done < "$changed_files_file"
      fi
    fi

    # Commit this version
    git add -A
    git commit --quiet -m "chore: apply template updates from $to_version" || true
  else
    echo "    Warning: Failed to apply patch cleanly"
    # Try 3-way merge
    if git apply --3way "$diff_file" 2>&1; then
      echo "    ✓ 3-way merge successful"
      applied_versions+=("$to_version (with merge)")
      total_files_changed=$((total_files_changed + files_changed))
      git add -A
      git commit --quiet -m "chore: apply template updates from $to_version (merged)" || true
    else
      echo "    ✗ Merge failed, skipping this version"
    fi
  fi
done

# Generate report
report_json=$(jq -n \
  --argjson total "$diffs_count" \
  --argjson applied "${#applied_versions[@]}" \
  --argjson files_changed "$total_files_changed" \
  --argjson applied_list "$(printf '%s\n' "${applied_versions[@]}" | jq -R . | jq -s .)" \
  '{
    total_diffs: $total,
    applied: $applied,
    files_changed: $files_changed,
    applied_versions: $applied_list
  }')

echo "$report_json" | jq '.'
