#!/usr/bin/env bash
set -euo pipefail

# detect-version.sh
# Detects the current template version from the provisioned app

# Try .template-metadata.json first (new format)
if [ -f ".template-metadata.json" ]; then
  current_version=$(jq -r '.templateVersion' .template-metadata.json)
  template_name=$(jq -r '.templateRepo' .template-metadata.json | cut -d'/' -f2)
  template_repo=$(jq -r '.templateRepo' .template-metadata.json)

  echo "current_version=$current_version" >> $GITHUB_OUTPUT
  echo "template_name=$template_name" >> $GITHUB_OUTPUT
  echo "template_repo=$template_repo" >> $GITHUB_OUTPUT

  echo "✓ Detected from .template-metadata.json"
  echo "  Current version: $current_version"
  echo "  Template: $template_name"
  exit 0
fi

# Fallback to .template.config.json (old format)
if [ -f ".template.config.json" ]; then
  current_version=$(jq -r '.templateVersion' .template.config.json)
  template_name=$(jq -r '.templateName' .template.config.json)

  # Try to infer template_repo
  template_repo="algtools/${template_name}"

  echo "current_version=$current_version" >> $GITHUB_OUTPUT
  echo "template_name=$template_name" >> $GITHUB_OUTPUT
  echo "template_repo=$template_repo" >> $GITHUB_OUTPUT

  echo "✓ Detected from .template.config.json"
  echo "  Current version: $current_version"
  echo "  Template: $template_name"
  exit 0
fi

# No version info found
echo "::error::No template version information found (.template-metadata.json or .template.config.json)"
echo "current_version=unknown" >> $GITHUB_OUTPUT
echo "template_name=unknown" >> $GITHUB_OUTPUT
exit 1
