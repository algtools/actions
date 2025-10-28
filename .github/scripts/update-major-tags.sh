#!/bin/bash
set -e

# Update major version tags for GitHub Actions
# Usage: update-major-tags.sh <version>
# Example: update-major-tags.sh 1.2.3 will create/update v1 tag

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version argument is required"
  echo "Usage: $0 <version>"
  exit 1
fi

# Remove 'v' prefix if present
VERSION=${VERSION#v}

# Extract major version (e.g., 1 from 1.2.3)
MAJOR_VERSION=$(echo "$VERSION" | cut -d. -f1)

# Create major version tag (e.g., v1)
MAJOR_TAG="v$MAJOR_VERSION"

echo "Current version: v$VERSION"
echo "Updating major version tag: $MAJOR_TAG"

# Configure git
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Delete the major version tag locally if it exists
git tag -d "$MAJOR_TAG" 2>/dev/null || true

# Create new major version tag pointing to current commit
git tag -a "$MAJOR_TAG" -m "Update $MAJOR_TAG to v$VERSION"

# Force push the major version tag
git push origin "$MAJOR_TAG" --force

echo "✓ Successfully updated $MAJOR_TAG to point to v$VERSION"
