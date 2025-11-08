# Update Provisioned App Action

A composite GitHub Action that updates an already provisioned app with the latest or specific template version by creating a pull request. This action automates the process of downloading a template release, applying changes to an existing repository, and creating a PR for review.

## Features

- 🔍 **Smart Release Resolution**: Supports "latest" or specific version tags
- 📦 **Flexible Archive Formats**: Works with custom template assets or GitHub source tarballs
- 🔒 **Secure Token Handling**: Properly masks sensitive tokens in logs
- 🌿 **Branch Management**: Creates a new branch for the update (configurable name)
- 🔀 **Pull Request Creation**: Automatically creates or updates a PR with the changes
- 🛡️ **Smart Exclusions**: Preserves local customizations (node_modules, .env files, etc.)
- ✅ **Change Detection**: Skips PR creation if no changes are detected

## Usage

### Basic Example

```yaml
- name: Update provisioned app
  uses: algtools/actions/.github/actions/update-provisioned-app@main
  with:
    source_repo: 'owner/bff-template'
    target_repo: 'owner/my-app'
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Complete Workflow Example

```yaml
name: Update Provisioned App

on:
  workflow_dispatch:
    inputs:
      target_repo:
        description: 'Repository to update (e.g., owner/app-name)'
        required: true
        type: string
      version:
        description: 'Template version (latest or specific tag)'
        required: false
        type: string
        default: 'latest'
      base_branch:
        description: 'Base branch for PR'
        required: false
        type: string
        default: 'main'

permissions:
  contents: write
  pull-requests: write

jobs:
  update:
    name: Update App
    runs-on: ubuntu-latest
    steps:
      - name: Update provisioned app
        id: update
        uses: algtools/actions/.github/actions/update-provisioned-app@main
        with:
          source_repo: ${{ github.repository }}
          target_repo: ${{ inputs.target_repo }}
          version: ${{ inputs.version }}
          base_branch: ${{ inputs.base_branch }}
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Display results
        run: |
          echo "PR URL: ${{ steps.update.outputs.pr_url }}"
          echo "PR Number: ${{ steps.update.outputs.pr_number }}"
          echo "Release Tag: ${{ steps.update.outputs.release_tag }}"
```

### Using the Reusable Workflow

```yaml
name: Update My App

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Template version'
        required: false
        type: string
        default: 'latest'

jobs:
  update:
    uses: algtools/actions/.github/workflows/update-provisioned-app-reusable.yml@main
    with:
      target_repo: 'owner/my-app'
      version: ${{ inputs.version }}
      base_branch: 'main'
    secrets:
      github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input          | Description                                                     | Required | Default                                 |
| -------------- | --------------------------------------------------------------- | -------- | --------------------------------------- |
| `source_repo`  | Source template repository (e.g., 'owner/repo')                 | Yes      | -                                       |
| `target_repo`  | Target repository to update (e.g., 'owner/app-name')            | Yes      | -                                       |
| `version`      | Template release tag (use 'latest' for newest release)          | No       | `"latest"`                              |
| `base_branch`  | Base branch to create PR against                                | No       | `"main"`                                |
| `branch_name`  | Name for the update branch (default: update-template-{version}) | No       | `""`                                    |
| `pr_title`     | Title for the pull request                                      | No       | `"chore: update template to {version}"` |
| `pr_body`      | Body for the pull request (default: auto-generated)             | No       | `""`                                    |
| `github_token` | GitHub token with repo permissions                              | Yes      | -                                       |

## Outputs

| Output        | Description                          |
| ------------- | ------------------------------------ |
| `pr_url`      | URL of the created pull request      |
| `pr_number`   | Number of the created pull request   |
| `release_tag` | Template version used for the update |
| `branch_name` | Name of the branch created           |

## How It Works

1. **Resolve Release**: Fetches the specified release (or latest) from the source repository
2. **Download Archive**: Downloads either custom template asset or GitHub source tarball
3. **Extract Template**: Extracts the archive to a working directory
4. **Clone Target**: Clones the target repository to update
5. **Create Branch**: Creates a new branch for the update (or uses existing)
6. **Apply Changes**: Copies template files while preserving local customizations
7. **Check Changes**: Detects if there are any actual changes
8. **Commit & Push**: Commits changes and pushes the branch (if changes exist)
9. **Create PR**: Creates or updates a pull request (if changes exist)
10. **Generate Summary**: Outputs a comprehensive summary of the update

## Excluded Files/Directories

The action automatically excludes the following from template updates to preserve local customizations:

- `.git` - Git repository data
- `node_modules` - Dependencies
- `.next`, `dist`, `build` - Build outputs
- `.env*` - Environment files
- `*.log` - Log files
- `.DS_Store`, `.idea`, `.vscode` - IDE files
- `coverage`, `.nyc_output` - Test coverage
- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` - Lock files

## Branch Naming

By default, branches are named `update-template-{version}` where `{version}` is the release tag (normalized). For example:

- `update-template-v1-2-3` for version `v1.2.3`
- `update-template-latest` for version `latest`

You can override this by providing a custom `branch_name` input.

## Pull Request Behavior

- **New PR**: Creates a new PR if one doesn't exist for the branch
- **Existing PR**: Updates the existing PR if one already exists
- **No Changes**: Skips PR creation if no changes are detected

## Required Permissions

The GitHub token needs the following permissions:

- `contents: write` - To push branches and commits
- `pull-requests: write` - To create/update pull requests

## Example Use Cases

### 1. Scheduled Updates

```yaml
name: Weekly Template Update

on:
  schedule:
    - cron: '0 0 * * 1' # Every Monday

jobs:
  update:
    uses: algtools/actions/.github/workflows/update-provisioned-app-reusable.yml@main
    with:
      target_repo: 'owner/my-app'
      version: 'latest'
    secrets:
      github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Manual Update to Specific Version

```yaml
name: Update to Specific Version

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to update to'
        required: true

jobs:
  update:
    uses: algtools/actions/.github/workflows/update-provisioned-app-reusable.yml@main
    with:
      target_repo: 'owner/my-app'
      version: ${{ inputs.version }}
      pr_title: 'chore: update template to ${{ inputs.version }}'
    secrets:
      github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Update Multiple Apps

```yaml
name: Update All Apps

on:
  workflow_dispatch:

jobs:
  update-app-1:
    uses: algtools/actions/.github/workflows/update-provisioned-app-reusable.yml@main
    with:
      target_repo: 'owner/app-1'
      version: 'latest'
    secrets:
      github_token: ${{ secrets.GITHUB_TOKEN }}

  update-app-2:
    uses: algtools/actions/.github/workflows/update-provisioned-app-reusable.yml@main
    with:
      target_repo: 'owner/app-2'
      version: 'latest'
    secrets:
      github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Troubleshooting

### Release Not Found

```
Error: Release tag "v1.0.0" not found
```

**Solution**: Verify the release exists in the source repository and the tag is correct.

### Repository Not Found

```
Error: Repository not found
```

**Solution**: Ensure the `target_repo` exists and the token has access to it.

### No Changes Detected

```
No changes detected, template is already up to date
```

**Solution**: This is expected if the template is already up to date. The action will skip PR creation.

### Permission Denied

```
Error: Resource not accessible by integration
```

**Solution**: Ensure the `github_token` has `contents: write` and `pull-requests: write` permissions.

### Branch Already Exists

The action will checkout the existing branch and update it. If you want a fresh branch, use a different `branch_name` or delete the existing branch first.

## Best Practices

1. **Review PRs**: Always review the generated PRs before merging
2. **Test Changes**: Run tests on the PR branch before merging
3. **Version Pinning**: Use specific versions for production updates instead of "latest"
4. **Branch Names**: Use descriptive branch names when updating multiple apps
5. **PR Titles**: Customize PR titles to include context about the update

## Related

- [Provision Template Action](../provision-template/README.md) - For creating new apps from templates
- [Update Provisioned App Reusable Workflow](../../workflows/update-provisioned-app-reusable.yml) - Reusable workflow wrapper
- [Template System Documentation](../../../README.md) - General template system documentation
