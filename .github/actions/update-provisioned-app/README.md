# Update Provisioned App Action

A GitHub Action that updates provisioned template apps using incremental diffs with smart merge rules for special files.

## Overview

This action collects incremental changes between template versions and applies them with custom processing rules for files like `package.json` and `wrangler.jsonc`. It creates a comprehensive PR with version-by-version breakdown of changes.

## Features

- **Incremental Updates**: Applies changes version-by-version for better traceability
- **Smart Merge Rules**: Custom processing for configuration files
- **Conflict Handling**: Detects and reports merge conflicts
- **Comprehensive PRs**: Detailed breakdown of what changed in each version
- **Flexible Rules**: Easy to add custom rules via YAML configuration

## Usage

### Basic Example

```yaml
name: Update Template

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly
  workflow_dispatch:
    inputs:
      version:
        description: 'Target version'
        default: 'latest'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/update-provisioned-app@main
        with:
          source_repo: 'algtools/core-template'
          target_repo: ${{ github.repository }}
          version: 'latest'
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input          | Description                                                 | Required | Default        |
| -------------- | ----------------------------------------------------------- | -------- | -------------- |
| `source_repo`  | Source template repository (e.g., `algtools/core-template`) | Yes      | -              |
| `target_repo`  | Target repository to update                                 | Yes      | -              |
| `version`      | Target version (e.g., `v1.8.2` or `latest`)                 | No       | `latest`       |
| `base_branch`  | Base branch for PR                                          | No       | `main`         |
| `branch_name`  | Custom branch name                                          | No       | Auto-generated |
| `pr_title`     | Custom PR title                                             | No       | Auto-generated |
| `pr_body`      | Custom PR body                                              | No       | Auto-generated |
| `github_token` | GitHub token with repo permissions                          | Yes      | -              |
| `dry_run`      | Test mode without creating PR                               | No       | `false`        |

## Outputs

| Output             | Description                     |
| ------------------ | ------------------------------- |
| `pr_url`           | URL of the created pull request |
| `pr_number`        | Number of the pull request      |
| `release_tag`      | Template version used           |
| `branch_name`      | Name of the branch created      |
| `versions_applied` | Number of versions applied      |
| `files_changed`    | Total files changed             |

## How It Works

### 1. Version Detection

Reads `.template-metadata.json` or `.template.config.json` to determine current template version.

### 2. Query Versions

Uses GitHub API to find all releases between current and target versions.

### 3. Collect Diffs

Clones template repository and generates git diffs for each version transition.

### 4. Load Rules

Reads `.template-app/merge-rules.yml` from the template to determine how to process files.

### 5. Apply Changes

- Applies each diff incrementally
- Processes files through rule engine
- Tracks conflicts and resolutions

### 6. Create PR

Generates comprehensive PR with version-by-version breakdown and testing checklist.

## Rule System

Templates define merge rules in `.template-app/merge-rules.yml`:

```yaml
version: 1

# Files that should never be updated
exclude:
  - '.github/template-updates.yml'
  - 'CHANGELOG.md'
  - '*.lock'

# Custom processing
rules:
  - pattern: 'package.json'
    handler: 'builtin:package-json'
    description: 'Smart merge preserving app name/version'
    config:
      preserve: ['name', 'version', 'description']

  - pattern: 'wrangler.jsonc'
    handler: 'builtin:wrangler-jsonc'
    description: 'Preserve binding IDs'
    config:
      preserve_binding_ids: true
```

### Built-in Handlers

**`builtin:package-json`**

- Preserves app name, version, description
- Validates for placeholder syntax
- Warns if placeholders detected

**`builtin:wrangler-jsonc`**

- Preserves database IDs and binding IDs
- Preserves app worker name
- Validates configuration
- Warns about placeholders

**`builtin:preserve-files`**

- Keeps file unchanged
- Used for app-specific files

**`builtin:strip-placeholders`**

- Detects `{{PLACEHOLDER}}` syntax
- Warns or errors based on configuration

## Template Architecture

### Files That Can Be Updated

Files in the released template package CAN receive updates:

- Source code
- Workflows (from `.github/workflows/app/`)
- Configuration files (with smart merge rules)
- Documentation

### Files That Never Update

Files in `.template-app/include/` are NEVER in the release package:

- Files with `{{PLACEHOLDERS}}`
- Provision-only configurations
- These are copied only during initial provisioning

### Excluded Files

Files in the exclude list are preserved:

- `CHANGELOG.md` - App's own history
- `.github/template-updates.yml` - App-specific config
- Lock files
- Environment files

## Example PR Output

When updating from v1.7.2 to v1.8.2:

```markdown
# 🔄 Template Update: `v1.7.2` → `v1.8.2`

## 📊 Update Summary

| Metric              | Value |
| ------------------- | ----- |
| 📦 Versions Applied | 5 / 5 |
| 📝 Files Changed    | 23    |

## 📋 Version-by-Version Changes

### ✅ `v1.7.3` - Bug fixes

- 3 files changed
- Fixed authentication timeout
- [View Release](...)

### ✅ `v1.8.0` - New features

- 12 files changed
- Added new API endpoints
- [View Release](...)

...
```

## Troubleshooting

### No template metadata found

**Cause**: Repository is not a provisioned app.
**Solution**: Ensure `.template-metadata.json` or `.template.config.json` exists.

### Merge conflicts detected

**Cause**: Local changes conflict with template updates.
**Solution**: Review PR, resolve conflicts manually.

### Rule engine errors

**Cause**: Invalid merge-rules.yml syntax.
**Solution**: Validate YAML syntax and check schema.

## Security

- Minimal required permissions
- Does not expose secrets
- Validates inputs
- Respects exclusion patterns

## License

MIT License - see repository LICENSE file
