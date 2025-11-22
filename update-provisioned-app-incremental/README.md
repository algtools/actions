# Update Provisioned App (Incremental)

A GitHub Action that updates provisioned template apps using **incremental diffs** from intermediate versions, providing better change tracking and conflict resolution.

## 🌟 Features

- **Incremental Updates**: Applies changes from each version sequentially (e.g., v1.7.2 → v1.7.3 → v1.7.4 → v1.8.0 → v1.8.1 → v1.8.2)
- **Better Conflict Resolution**: Sequential application makes conflicts easier to understand and resolve
- **Detailed Change History**: See exactly what changed in each version
- **Smart Exclusions**: Respects `.template-app/exclude.json` patterns
- **Comprehensive PR Descriptions**: Auto-generated descriptions with version-by-version breakdown
- **Dry Run Support**: Test updates without making changes
- **Fallback Mode**: Automatically falls back to simple update if no intermediate versions exist

## 📋 Prerequisites

- Target repository must be a provisioned template app with `.template.config.json`
- Source template repository must have semantic versioned releases
- GitHub token with `repo` permissions

## 🚀 Usage

### Basic Usage

```yaml
name: Update Template

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Target version (or "latest")'
        required: false
        default: 'latest'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/update-provisioned-app-incremental@v1
        with:
          source_repo: 'algtools/bff-template'
          target_repo: ${{ github.repository }}
          version: ${{ inputs.version }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Scheduled Updates

```yaml
name: Weekly Template Update

on:
  schedule:
    - cron: '0 0 * * 1' # Every Monday at midnight

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/update-provisioned-app-incremental@v1
        with:
          source_repo: 'algtools/core-template'
          target_repo: ${{ github.repository }}
          version: 'latest'
          base_branch: 'dev'
          github_token: ${{ secrets.TEMPLATE_UPDATES_TOKEN }}
```

### Advanced Usage with Custom Settings

```yaml
name: Update Template

on:
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/update-provisioned-app-incremental@v1
        with:
          source_repo: 'algtools/web-template'
          target_repo: 'myorg/my-app'
          version: 'v2.0.0'
          base_branch: 'main'
          branch_name: 'template-update-v2.0.0'
          pr_title: 'feat: major template update to v2.0.0'
          github_token: ${{ secrets.GITHUB_TOKEN }}
          use_incremental: 'true'
          dry_run: 'false'
```

## 📥 Inputs

| Input             | Description                                                | Required | Default                         |
| ----------------- | ---------------------------------------------------------- | -------- | ------------------------------- |
| `source_repo`     | Source template repository (e.g., `algtools/bff-template`) | ✅ Yes   | -                               |
| `target_repo`     | Target repository to update (e.g., `owner/my-app`)         | ✅ Yes   | -                               |
| `version`         | Target template version (e.g., `v1.8.2` or `latest`)       | No       | `latest`                        |
| `base_branch`     | Base branch to create PR against                           | No       | `main`                          |
| `branch_name`     | Custom branch name for update                              | No       | `algtools/{template}-{version}` |
| `pr_title`        | Custom PR title                                            | No       | Auto-generated                  |
| `pr_body`         | Custom PR body                                             | No       | Auto-generated                  |
| `github_token`    | GitHub token with repo permissions                         | ✅ Yes   | -                               |
| `use_incremental` | Use incremental diff approach                              | No       | `true`                          |
| `dry_run`         | Perform dry run without creating PR                        | No       | `false`                         |

## 📤 Outputs

| Output             | Description                             |
| ------------------ | --------------------------------------- |
| `pr_url`           | URL of the created pull request         |
| `pr_number`        | Number of the created pull request      |
| `release_tag`      | Template version used for the update    |
| `branch_name`      | Name of the branch created              |
| `versions_applied` | Number of versions successfully applied |
| `files_changed`    | Total number of files changed           |
| `conflicts`        | Number of conflicts encountered         |

## 🔄 How It Works

### 1. Version Detection

The action reads `.template.config.json` in your app to determine:

- Current template version (e.g., `v1.7.2`)
- Template name (e.g., `bff-template`)
- Source repository

### 2. Version Query

Queries GitHub API to find all releases between current and target versions:

- Filters out pre-releases and drafts
- Sorts versions semantically
- Retrieves release notes and changelogs

### 3. Diff Collection

For each version pair, collects:

- Git diffs between consecutive tags
- List of changed files
- Commit messages
- Release metadata

### 4. Incremental Application

Applies diffs sequentially:

- Respects exclusion patterns
- Tracks conflicts per version
- Attempts 3-way merge for conflicts
- Maintains git history

### 5. PR Generation

Creates a comprehensive PR with:

- Version-by-version breakdown
- Release notes from each version
- Conflict information
- Testing checklist

## 📝 Example PR Description

When updating from v1.7.2 to v1.8.2, the generated PR looks like this:

```markdown
# 🔄 Template Update: `v1.7.2` → `v1.8.2`

## 📊 Update Summary

This PR applies **incremental changes** from **5 intermediate version(s)**...

| Metric              | Value |
| ------------------- | ----- |
| 📦 Versions Applied | 5 / 5 |
| 📝 Files Changed    | 23    |
| ⚠️ Conflicts        | 0     |

## 📋 Version-by-Version Changes

<details>
<summary>

### ✅ `v1.7.3` - 🔧 Patch Release

</summary>

📅 Published: 2024-01-15

📊 **Stats:**

- 3 file(s) changed
- 2 commit(s)
- Status: **Applied**

🔗 [View Release](https://github.com/algtools/bff-template/releases/tag/v1.7.3)

#### Release Notes

> - fix: resolve authentication timeout issue
> - fix: update error handling in middleware

</details>

...
```

## 🔍 Comparison with Simple Update

| Feature                 | Incremental Update           | Simple Update                |
| ----------------------- | ---------------------------- | ---------------------------- |
| **Change Tracking**     | ✅ Version-by-version        | ❌ Single diff               |
| **Conflict Resolution** | ✅ Easier to identify source | ❌ Large conflicting changes |
| **Change History**      | ✅ Clear progression         | ❌ One big change            |
| **Breaking Changes**    | ✅ Identify which version    | ❌ Mixed together            |
| **Performance**         | ⚠️ Slower (multiple diffs)   | ✅ Faster                    |
| **Best For**            | Multiple versions gap        | Single version jump          |

## 🛠️ Technical Details

### Dependencies

The action requires:

- `jq` - JSON processing
- `git` - Version control
- `curl` - API requests
- `bash` - Script execution

These are automatically installed if not available on Ubuntu runners.

### Scripts

The action uses several shell scripts:

1. **detect-version.sh**: Reads `.template.config.json` to get current version
2. **query-versions.sh**: Queries GitHub API for intermediate releases
3. **collect-diffs.sh**: Clones repo and generates diffs between versions
4. **apply-incremental-diffs.sh**: Applies diffs with conflict tracking
5. **generate-pr-description.sh**: Creates detailed PR description

### Exclusion Patterns

The action respects patterns in `.template-app/exclude.json`:

```json
["*.env*", ".env*", "node_modules/**", "dist/**", "*.lock", "local.db"]
```

Files matching these patterns are never modified during updates.

## 🐛 Troubleshooting

### No intermediate versions found

**Cause**: There are no versions between current and target (e.g., v1.0.0 → v1.0.1 directly)

**Solution**: The action automatically falls back to simple update mode.

### Conflicts detected

**Cause**: Changes in the template conflict with local modifications

**Solution**: The PR will include conflict information. Review and resolve manually.

### GitHub API rate limits

**Cause**: Too many API requests without authentication

**Solution**: Use `TEMPLATE_UPDATES_TOKEN` instead of `GITHUB_TOKEN` for higher rate limits.

### Template config not found

**Cause**: Repository is not a provisioned template app

**Solution**: Ensure `.template.config.json` exists in the repository root.

## 📊 Performance Considerations

- **Small updates** (1-2 versions): ~30-60 seconds
- **Medium updates** (3-5 versions): ~1-3 minutes
- **Large updates** (6+ versions): ~3-5 minutes

Performance depends on:

- Number of intermediate versions
- Size of diffs
- Number of conflicts
- Network speed

## 🔒 Security

- Never commits sensitive files (respects exclusions)
- Uses minimal required permissions
- Runs in isolated environment
- Does not expose secrets in logs

## 🤝 Contributing

To improve this action:

1. Test with various template repositories
2. Report issues with specific version ranges
3. Suggest improvements to conflict resolution
4. Enhance PR description format

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details

## 🆘 Support

For issues or questions:

- Open an issue in the repository
- Check existing documentation
- Review workflow logs for detailed error messages

---

**Made with ❤️ by Algtools**
