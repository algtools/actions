#!/usr/bin/env sh
# Wrapper script for actionlint that handles missing installation gracefully
# Usage: actionlint-check.sh [files...]
# Note: actionlint only validates workflow files, not action files (action.yml)

if ! command -v actionlint >/dev/null 2>&1; then
  echo "⚠️  actionlint not found, skipping workflow validation"
  echo "   Install actionlint for local validation:"
  echo "   - Windows: choco install actionlint"
  echo "   - macOS: brew install actionlint"
  echo "   - Go: go install github.com/rhysd/actionlint/cmd/actionlint@latest"
  echo "   CI will still validate workflows on push/PR"
  exit 0
fi

# If files are provided, check only workflow files (exclude action files)
if [ $# -gt 0 ]; then
  # Filter to only workflow files (exclude .github/actions/ since actionlint doesn't validate action.yml)
  WORKFLOW_FILES=""
  for file in "$@"; do
    # Only include workflow files, exclude action files
    if echo "$file" | grep -qE '\.github/workflows/.*\.(yml|yaml)$'; then
      WORKFLOW_FILES="${WORKFLOW_FILES}${WORKFLOW_FILES:+ }$file"
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
  # actionlint automatically only checks .github/workflows/ by default, so action files are excluded
  actionlint || exit 1
fi
