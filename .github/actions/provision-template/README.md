# Provision Template Action

A composite GitHub Action that provisions a new repository from a template release. This action automates the entire process of creating a new repository with templated code, including downloading the template, initializing git, creating the remote repository, and configuring repository variables.

## Features

- 🔍 **Smart Release Resolution**: Supports "latest" or specific version tags
- 📦 **Flexible Archive Formats**: Works with custom template assets or GitHub source tarballs
- 🔒 **Secure Token Handling**: Properly masks sensitive tokens in logs
- 🏗️ **Complete Setup**: Initializes git, creates remote repository, and configures variables
- ✅ **Comprehensive Summary**: Provides detailed provisioning summary

## Usage

### Basic Example

```yaml
- name: Provision template repository
  uses: algtools/actions/.github/actions/provision-template@main
  with:
    source_repo: 'owner/bff-template'
    app_name: 'my-new-app'
    slug: 'myapp'
    admin_token: ${{ secrets.ADMIN_TOKEN }}
    github_token: ${{ github.token }}
```

### Complete Workflow Example

```yaml
name: Provision Template Application

on:
  workflow_dispatch:
    inputs:
      app_name:
        description: 'Name of the repository to create'
        required: true
        type: string
      slug:
        description: 'URL-friendly slug'
        required: true
        type: string

permissions:
  contents: read
  id-token: write

jobs:
  provision:
    name: Provision Template
    runs-on: ubuntu-latest
    steps:
      - name: Provision template repository
        id: provision
        uses: algtools/actions/.github/actions/provision-template@main
        with:
          source_repo: ${{ github.repository }}
          app_name: ${{ inputs.app_name }}
          slug: ${{ inputs.slug }}
          sentry_project: ${{ inputs.sentry_project }}
          version: 'latest'
          admin_token: ${{ secrets.ADMIN_TOKEN }}
          github_token: ${{ github.token }}

      - name: Display results
        run: |
          echo "Repository URL: ${{ steps.provision.outputs.repository_url }}"
          echo "Release Tag: ${{ steps.provision.outputs.release_tag }}"
```

## Inputs

| Input            | Description                                                      | Required | Default    |
| ---------------- | ---------------------------------------------------------------- | -------- | ---------- |
| `source_repo`    | Source template repository (e.g., 'owner/repo')                  | Yes      | -          |
| `app_name`       | Name of the repository to create (e.g., 'acme-bff')              | Yes      | -          |
| `slug`           | URL-friendly slug for environment configuration (e.g., 'janovi') | Yes      | -          |
| `sentry_project` | Sentry project name (defaults to app_name if not provided)       | No       | `""`       |
| `version`        | Template release tag (use 'latest' for newest release)           | No       | `"latest"` |
| `admin_token`    | GitHub token with repo and admin:org scopes                      | Yes      | -          |
| `github_token`   | Standard GitHub token for API calls                              | Yes      | -          |

## Outputs

| Output           | Description                            |
| ---------------- | -------------------------------------- |
| `repository_url` | URL of the created repository          |
| `release_tag`    | Template version used for provisioning |

## How It Works

1. **Resolve Release**: Fetches the specified release (or latest) from the source repository
2. **Download Archive**: Downloads either custom template asset or GitHub source tarball
3. **Extract Template**: Extracts the archive to a working directory
4. **Initialize Git**: Initializes a new git repository with initial commit
5. **Create Remote**: Creates a new private repository in GitHub
6. **Push Code**: Pushes the initial commit to the remote repository
7. **Configure Variables**: Sets up repository variables (APP_NAME, SLUG, SENTRY_PROJECT)
8. **Generate Summary**: Outputs a comprehensive summary of the provisioning

## Required Secrets

### ADMIN_TOKEN

A GitHub Personal Access Token with the following scopes:

- `repo` - Full control of private repositories
- `admin:org` - Admin access if creating in an organization

### SENTRY_TOKEN (Optional)

Sentry authentication token for error monitoring setup.

## Repository Variables

The action automatically configures the following repository variables:

- **APP_NAME**: Name of the application
- **SLUG**: URL-friendly slug for environments
- **SENTRY_PROJECT**: Sentry project name (defaults to APP_NAME if not provided)

## Template Requirements

For this action to work properly, your template repository should:

1. Have releases created with either:
   - Custom template assets (`.tar.gz` or `.tgz` files)
   - GitHub's automatic source archives (fallback)

2. Include a `.template-manifest.json` file with:
   - Template metadata
   - Variable definitions
   - Required dependencies

## Example Templates

- **BFF Template**: `owner/bff-template` - Backend for Frontend
- **Core Template**: `owner/core-template` - Core API with database
- **Web Template**: `owner/web-template` - Next.js web application

## Troubleshooting

### Release Not Found

```
Error: Release tag "v1.0.0" not found
```

**Solution**: Verify the release exists in the source repository and the tag is correct.

### Invalid Tarball

```
Error: Downloaded file is not a valid gzip archive
```

**Solution**: Check that the release asset is a valid `.tar.gz` or `.tgz` file.

### Repository Already Exists

```
Error: Repository already exists
```

**Solution**: Choose a different repository name or delete the existing repository.

### Permission Denied

```
Error: Resource not accessible by integration
```

**Solution**: Ensure the `admin_token` has the required scopes (repo, admin:org).

## Related

- [Provision Template Reusable Workflow](../../workflows/provision-template-reusable.yml)
- [Template System Documentation](../../../README.md)
