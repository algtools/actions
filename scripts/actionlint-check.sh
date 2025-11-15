#!/usr/bin/env sh
# Wrapper script for actionlint that handles missing installation gracefully
# Usage: actionlint-check.sh [files...]

if ! command -v actionlint >/dev/null 2>&1; then
  echo "⚠️  actionlint not found, skipping workflow validation"
  echo "   Install actionlint for local validation:"
  echo "   - Windows: choco install actionlint"
  echo "   - macOS: brew install actionlint"
  echo "   - Go: go install github.com/rhysd/actionlint/cmd/actionlint@latest"
  echo "   CI will still validate workflows on push/PR"
  exit 0
fi

# If files are provided, check only those; otherwise run on all workflows
if [ $# -gt 0 ]; then
  # Filter to only workflow files (actionlint doesn't support action files)
  WORKFLOW_FILES=""
  for file in "$@"; do
    # Only check workflow files, skip action files (they have different structure)
    if echo "$file" | grep -qE '\.github/workflows/.*\.(yml|yaml)$'; then
      WORKFLOW_FILES="${WORKFLOW_FILES}${WORKFLOW_FILES:+ }$file"
    elif echo "$file" | grep -qE '\.github/actions/.*\.(yml|yaml)$'; then
      # Skip action files - actionlint doesn't validate action files, only workflows
      echo "⚠️  Skipping action file (actionlint only validates workflows): $file"
    fi
  done

  if [ -n "$WORKFLOW_FILES" ]; then
    # Run actionlint on specific workflow files only
    for file in $WORKFLOW_FILES; do
      actionlint "$file" || exit 1
    done
  fi
else
  # Run actionlint on all workflow files
  # actionlint by default only checks .github/workflows/ directory
  actionlint || exit 1
fi
