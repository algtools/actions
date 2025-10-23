# algtools/actions

Algenium common GitHub Actions and reusable workflows for all projects across the Algenium and Algtools ecosystem.

## Repository Structure

```
.github/
├── actions/         # Custom reusable actions
├── workflows/       # Reusable workflows and CI/CD pipelines
└── tests/          # Test files and fixtures
```

## Available Actions

### [build-no-secrets](/.github/actions/build-no-secrets)
Builds a project in a clean environment without exposing secrets. Perfect for PR previews or secure builds.

### [setup-node](/.github/actions/setup-node)
Sets up Node.js environment with caching support for faster builds.

### [upload-artifacts](/.github/actions/upload-artifacts)
Uploads build artifacts to GitHub Actions storage with detailed logging and support for multiple file paths.

### [deploy-cloudflare-from-artifact](/.github/actions/deploy-cloudflare-from-artifact)
Deploys Cloudflare Workers from pre-built artifacts with secure credential handling. Ensures safe and reproducible deployments without exposing code or secrets.

### [ensure-wildcard-certificate](/.github/actions/ensure-wildcard-certificate)
Ensures a wildcard SSL certificate exists in Cloudflare ACM. Idempotent action that creates certificates only when needed and waits for activation.

### [sentry-release](/.github/actions/sentry-release)
Creates and finalizes a Sentry release and registers a deployment for the target environment. Integrates with your deployment pipeline to track releases and errors across environments (alpha, beta, prod).

### [comment-pr](/.github/actions/comment-pr)
Posts or updates comments on Pull Requests with deployment info (e.g., preview URLs, environment details, Chromatic links). Avoids duplicating the same message across retries by using a dedupe key.

## Available Reusable Workflows

### [pr-build-reusable.yml](/.github/workflows/pr-build-reusable.yml)
A complete PR build workflow that sets up Node.js, builds your project without secrets, uploads artifacts, and optionally deploys to Cloudflare Workers dev environment with automatic SSL certificate management. Perfect for pull request previews and automated testing.

**Features:**
- Secure Node.js setup with dependency caching
- Clean build environment without secret exposure
- Automatic artifact upload with detailed metadata
- Configurable retention and working directories
- **Optional**: Deploy to Cloudflare Workers dev environment
- **Optional**: Automatic wildcard SSL certificate management
- **Optional**: PR preview deployments with secure HTTPS

**Example Usage (Build Only):**
```yaml
name: PR Build

on:
  pull_request:
    branches: [main]

jobs:
  build:
    uses: algtools/actions/.github/workflows/pr-build-reusable.yml@main
    with:
      build_cmd: "npm run build"
      artifact_name: "pr-build-${{ github.event.pull_request.number }}"
      artifact_paths: "dist"
      working_directory: "."
      output_dir: "dist"
      retention_days: 7
```

**Example Usage (Build + Deploy to Dev):**
```yaml
name: PR Build and Deploy

on:
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    uses: algtools/actions/.github/workflows/pr-build-reusable.yml@main
    with:
      build_cmd: "npm run build"
      artifact_name: "pr-build-${{ github.event.pull_request.number }}"
      artifact_paths: "dist,wrangler.toml"
      working_directory: "."
      output_dir: "dist"
      retention_days: 7
      # Enable dev deployment
      deploy_to_dev: true
      worker_name: "my-app-pr-${{ github.event.pull_request.number }}"
      wrangler_config: "wrangler.toml"
      zone: "${{ vars.CLOUDFLARE_ZONE_ID }}"
      custom_domain: "dev.example.com"
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Required Inputs:**
- `build_cmd` (required): Build command to execute
- `artifact_name` (required): Name for the uploaded artifact
- `artifact_paths` (required): Comma-separated paths to upload

**Optional Build Inputs:**
- `node_version` (optional): Node.js version (defaults to .nvmrc)
- `working_directory` (optional): Working directory (default: ".")
- `output_dir` (optional): Build output directory (default: "dist")
- `retention_days` (optional): Artifact retention in days (default: 30)

**Optional Deployment Inputs:**
- `deploy_to_dev` (optional): Enable deployment to dev environment (default: false)
- `worker_name` (optional): Cloudflare Worker name for dev (required if deploy_to_dev is true)
- `wrangler_config` (optional): Path to wrangler.toml (default: "wrangler.toml")
- `zone` (optional): Cloudflare zone ID (required if deploy_to_dev is true)
- `custom_domain` (optional): Domain for wildcard SSL (required if deploy_to_dev is true)
- `wrangler_version` (optional): Wrangler version (default: "latest")
- `max_wait_seconds` (optional): Max wait for certificate activation (default: 300)
- `poll_interval_seconds` (optional): Certificate status check interval (default: 10)

**Required Secrets (if deploy_to_dev is true):**
- `cloudflare_api_token`: Cloudflare API token with Workers and SSL permissions
- `cloudflare_account_id`: Cloudflare account ID

**Build Outputs:**
- `artifact_id`: GitHub artifact ID
- `artifact_url`: Download URL for the artifact
- `total_files`: Number of files uploaded
- `total_size`: Total size in bytes
- `build_status`: Build result status

**Deployment Outputs (if deploy_to_dev is true):**
- `worker_url`: URL of the deployed Worker
- `deployment_status`: Deployment status
- `certificate_id`: SSL certificate ID
- `certificate_status`: SSL certificate status

---

### [env-deploy-reusable.yml](/.github/workflows/env-deploy-reusable.yml)
A comprehensive deployment workflow for deploying Cloudflare Workers to dev/qa/production environments. Handles wildcard SSL certificates, artifact-based deployments, optional Sentry release tracking, and automatic GitHub release creation.

**Features:**
- Automatic wildcard SSL certificate management with Cloudflare ACM
- Secure deployment from pre-built artifacts
- Environment-specific configurations
- GitHub Deployments tracking in repository UI
- Optional GitHub Release creation for production deployments
- Optional Sentry release integration for error tracking
- Comprehensive deployment summaries with all key information
- Idempotent certificate operations

**Example Usage (Production with GitHub Release):**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build:
    uses: algtools/actions/.github/workflows/pr-build-reusable.yml@main
    with:
      build_cmd: "npm run build"
      artifact_name: "production-build"
      artifact_paths: "dist,wrangler.toml,package.json"

  deploy:
    needs: build
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: "production"
      worker_name: "my-worker"
      wrangler_config: "wrangler.toml"
      zone: "${{ vars.CLOUDFLARE_ZONE_ID }}"
      custom_domain: "example.com"
      slug: "my-app"
      artifact_name: "production-build"
      create_github_release: true
      release_name_template: "My App {version}"
      sentry_release: true
      sentry_org: "my-org"
      sentry_project: "my-project"
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

**Required Inputs:**
- `environment` (required): Target environment (e.g., "dev", "qa", "production")
- `worker_name` (required): Name of the Cloudflare Worker
- `wrangler_config` (required): Path to wrangler.toml (relative to artifact root)
- `zone` (required): Cloudflare zone ID for the domain
- `custom_domain` (required): Domain for wildcard certificate (e.g., "example.com" for "*.example.com")
- `artifact_name` (required): Name of artifact containing built worker code

**Optional Inputs:**
- `wrangler_version` (optional): Wrangler version to use (default: "latest")
- `download_path` (optional): Artifact download directory (default: "./worker-artifact")
- `max_wait_seconds` (optional): Max wait for certificate activation (default: 300)
- `poll_interval_seconds` (optional): Certificate status check interval (default: 10)
- `create_github_release` (optional): Create a GitHub release (default: false)
- `package_json_path` (optional): Path to package.json for version extraction (default: "package.json")
- `release_name_template` (optional): Template for release name with {version} placeholder (default: "Release {version}")
- `sentry_release` (optional): Enable Sentry release tracking (default: false)
- `sentry_org` (optional): Sentry organization slug (required if sentry_release is true)
- `sentry_project` (optional): Sentry project slug (required if sentry_release is true)

**Required Secrets:**
- `cloudflare_api_token`: Cloudflare API token with Workers deployment and SSL permissions
- `cloudflare_account_id`: Cloudflare account ID
- `sentry_auth_token`: Sentry auth token (required if sentry_release is true)

**Outputs:**
- `worker_url`: URL of the deployed Cloudflare Worker
- `deployment_status`: Deployment status (success/failure)
- `worker_version`: Version identifier of deployed worker
- `certificate_id`: ID of the wildcard SSL certificate
- `certificate_status`: Status of the SSL certificate
- `certificate_created`: Whether a new certificate was created

**Sentry Integration:**

To enable Sentry release tracking, set `sentry_release: true` and provide the required inputs:

```yaml
with:
  sentry_release: true
  sentry_org: "your-sentry-org"
  sentry_project: "your-sentry-project"
secrets:
  sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

The workflow will automatically:
- Create a Sentry release with the current git SHA
- Associate commits with the release
- Create a deployment record for the target environment
- Track releases across different environments

**Multi-Environment Setup:**

You can easily deploy to multiple environments in sequence:

```yaml
jobs:
  build:
    uses: algtools/actions/.github/workflows/pr-build-reusable.yml@main
    with:
      build_cmd: "npm run build"
      artifact_name: "app-build-${{ github.sha }}"
      artifact_paths: "dist,wrangler.toml"

  deploy-dev:
    needs: build
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: "dev"
      worker_name: "my-worker-dev"
      wrangler_config: "wrangler.toml"
      zone: "${{ vars.CLOUDFLARE_ZONE_ID }}"
      custom_domain: "dev.example.com"
      artifact_name: "app-build-${{ github.sha }}"
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-production:
    needs: deploy-dev
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: "production"
      worker_name: "my-worker"
      wrangler_config: "wrangler.toml"
      zone: "${{ vars.CLOUDFLARE_ZONE_ID }}"
      custom_domain: "example.com"
      slug: "my-app"
      artifact_name: "app-build-${{ github.sha }}"
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

### [preview-deploy-reusable.yml](/.github/workflows/preview-deploy-reusable.yml)
A complete PR preview deployment workflow that builds your application, deploys to Cloudflare Workers, optionally uploads to Chromatic for visual testing or generates API documentation, and automatically posts/updates a comment on the PR with all deployment information.

**Features:**
- Full build and deployment pipeline for PR previews
- Automatic PR comment with deployment info (create/update with no duplicates)
- Resolves PR number from various event contexts (pull_request, workflow_run, etc.)
- Works with both regular and Dependabot PRs
- Optional Chromatic visual testing integration (for web templates)
- Optional API documentation generation (for API templates)
- Wildcard SSL certificate management
- Preview URL construction and sharing
- Markdown-formatted PR comments with emojis

**Example Usage:**
```yaml
name: PR Preview Deploy

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    permissions:
      contents: read
      pull-requests: write  # Required for PR comments
    uses: algtools/actions/.github/workflows/preview-deploy-reusable.yml@main
    with:
      # Build configuration
      build_cmd: "npm run build"
      artifact_name: "preview-${{ github.event.pull_request.number }}"
      artifact_paths: "dist,wrangler.toml"
      working_directory: "."
      output_dir: "dist"

      # Deployment configuration
      worker_name: "my-app-pr-${{ github.event.pull_request.number }}"
      wrangler_config: "wrangler.toml"
      zone: "${{ vars.CLOUDFLARE_ZONE_ID }}"
      custom_domain: "dev.example.com"

      # Preview URL configuration
      app_domain: "${{ vars.APP_DOMAIN }}"  # e.g., "my-app"
      dev_zone: "${{ vars.DEV_ZONE }}"      # e.g., "dev.example.com"

      # Optional: Enable Chromatic
      enable_chromatic: true
      chromatic_project_token: "${{ secrets.CHROMATIC_PROJECT_TOKEN }}"
      storybook_build_dir: "storybook-static"
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Example Usage (API Documentation):**
```yaml
name: PR Preview Deploy

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    permissions:
      contents: read
      pull-requests: write  # Required for PR comments
    uses: algtools/actions/.github/workflows/preview-deploy-reusable.yml@main
    with:
      # Build configuration
      build_cmd: "npm run test && npm run lint && npm run type-check"
      artifact_name: "preview-${{ github.event.pull_request.number }}"
      artifact_paths: "src,package.json,pnpm-lock.yaml,wrangler.jsonc"
      working_directory: "."
      retention_days: 7

      # Deployment configuration
      worker_name: "my-api-pr-${{ github.event.pull_request.number }}"
      wrangler_config: "wrangler.jsonc"
      zone: "${{ vars.CLOUDFLARE_ZONE_ID }}"
      custom_domain: "dev.example.com"

      # Preview URL configuration
      app_domain: "${{ vars.APP_DOMAIN }}"  # e.g., "my-api"
      dev_zone: "${{ vars.DEV_ZONE }}"      # e.g., "dev.example.com"

      # Optional: Enable API Documentation
      enable_api_docs: true
      api_docs_type: "scalar"
      api_docs_output_dir: "api-docs"
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Required Inputs:**
- `build_cmd` (required): Build command to execute
- `artifact_name` (required): Name for the uploaded artifact
- `artifact_paths` (required): Comma-separated paths to upload
- `worker_name` (required): Cloudflare Worker name for preview
- `zone` (required): Cloudflare zone ID
- `custom_domain` (required): Domain for wildcard SSL certificate
- `app_domain` (required): Application domain prefix for preview URL
- `dev_zone` (required): Development zone suffix for preview URLs

**Optional Build Inputs:**
- `node_version` (optional): Node.js version (defaults to .nvmrc)
- `working_directory` (optional): Working directory (default: ".")
- `output_dir` (optional): Build output directory (default: "dist")
- `retention_days` (optional): Artifact retention in days (default: 30)
- `wrangler_config` (optional): Path to wrangler.toml (default: "wrangler.toml")
- `wrangler_version` (optional): Wrangler version (default: "latest")
- `max_wait_seconds` (optional): Max wait for certificate activation (default: 300)
- `poll_interval_seconds` (optional): Certificate status check interval (default: 10)

**Optional Chromatic Inputs:**
- `enable_chromatic` (optional): Enable Chromatic visual testing (default: false)
- `chromatic_project_token` (optional): Chromatic project token (required if enable_chromatic is true)
- `storybook_build_dir` (optional): Storybook build directory (default: "storybook-static")

**Optional API Documentation Inputs:**
- `enable_api_docs` (optional): Enable API documentation generation (default: false)
- `api_docs_type` (optional): Type of API documentation (scalar, redoc, swagger-ui) (default: "scalar")
- `api_docs_output_dir` (optional): Directory where API documentation will be generated (default: "api-docs")

**Required Secrets:**
- `cloudflare_api_token`: Cloudflare API token with Workers and SSL permissions
- `cloudflare_account_id`: Cloudflare account ID

**Build Outputs:**
- `artifact_id`: GitHub artifact ID
- `artifact_url`: Download URL for the artifact
- `build_status`: Build result status

**Deployment Outputs:**
- `worker_url`: URL of the deployed Worker
- `deployment_status`: Deployment status
- `certificate_id`: SSL certificate ID
- `preview_url`: Public preview URL for the PR

**Chromatic Outputs (if enabled):**
- `chromatic_url`: URL to Chromatic visual testing results

**API Documentation Outputs (if enabled):**
- `api_docs_url`: URL to API documentation
- `api_docs_status`: Status of API documentation generation

**Comment Outputs:**
- `comment_id`: ID of the PR comment
- `comment_url`: URL of the PR comment

**PR Comment Example:**

The workflow automatically posts/updates a comment on the PR with this format:

**For Web Templates (with Chromatic):**
```markdown
✅ **Preview deployed successfully!**
🌐 [Open Preview](https://my-app-pr-42.my-app.dev.example.com)
🧩 [Chromatic Visuals](https://www.chromatic.com/build?appId=...)

---

**Deployment Details:**
- Worker: `my-app-pr-42`
- Environment: `dev`
- Commit: `abc123def456...`
```

**For API Templates (with API Documentation):**
```markdown
✅ **Preview deployed successfully!**
🌐 [Open Preview](https://my-api-pr-42.my-api.dev.example.com)
📚 [API Documentation](https://my-api-pr-42.my-api.dev.example.com/docs)

---

**Deployment Details:**
- Worker: `my-api-pr-42`
- Environment: `dev`
- Commit: `abc123def456...`
```

**For Templates with Both:**
```markdown
✅ **Preview deployed successfully!**
🌐 [Open Preview](https://my-app-pr-42.my-app.dev.example.com)
🧩 [Chromatic Visuals](https://www.chromatic.com/build?appId=...)
📚 [API Documentation](https://my-app-pr-42.my-app.dev.example.com/docs)

---

**Deployment Details:**
- Worker: `my-app-pr-42`
- Environment: `dev`
- Commit: `abc123def456...`
```

**Key Features:**

1. **Smart PR Number Resolution**: Works with `pull_request`, `workflow_run`, and other event types
2. **Deduplication**: Uses `dedupe_key: 'preview-deploy'` to update existing comments instead of creating duplicates
3. **Graceful Chromatic Handling**: Only shows Chromatic link if enabled and URL is available
4. **API Documentation Support**: Generates Scalar, ReDoc, or Swagger UI documentation for API templates
5. **Template Flexibility**: Supports both web templates (Chromatic) and API templates (API docs)
6. **Works with Dependabot**: Handles PRs from forks and Dependabot where secrets aren't directly available
7. **Comprehensive Logging**: Detailed job summaries and outputs for debugging

**Required Permissions:**

```yaml
permissions:
  contents: read
  pull-requests: write  # Required for posting PR comments
```

---

### [cleanup-preview-reusable.yml](/.github/workflows/cleanup-preview-reusable.yml)
A reusable workflow for cleaning up PR preview environments when pull requests are closed. Removes Cloudflare Workers and optionally SSL certificates to prevent resource accumulation and reduce costs.

**Features:**
- Automatic cleanup of Cloudflare Workers when PRs are closed
- Optional SSL certificate deletion (with safety warnings)
- Dry run mode for safe testing without actual deletion
- Comprehensive cleanup status reporting
- Preview URL construction for reference
- Conditional execution based on cleanup preferences
- Detailed logging and error handling

**Example Usage:**
```yaml
name: Cleanup Preview Environment

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    uses: algtools/actions/.github/workflows/cleanup-preview-reusable.yml@main
    with:
      worker_name: "${{ vars.APP_NAME || 'my-app' }}-pr-${{ github.event.pull_request.number }}"
      pr_number: "${{ github.event.pull_request.number }}"
      app_domain: "${{ vars.APP_DOMAIN || vars.APP_NAME || 'my-app' }}"
      dev_zone: "${{ vars.DEV_ZONE || 'dev.example.com' }}"
      slug: "${{ vars.SLUG || 'template' }}"
      delete_worker: true
      delete_certificate: false  # Certificates are usually shared
      dry_run: false
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Required Inputs:**
- `worker_name` (required): Name of the Cloudflare Worker to delete
- `pr_number` (required): Pull request number for cleanup identification
- `app_domain` (required): Application domain prefix for preview URL construction
- `dev_zone` (required): Development zone suffix for preview URLs

**Optional Inputs:**
- `slug` (optional): Project slug for additional identification (default: "")
- `delete_worker` (optional): Whether to delete the Cloudflare Worker (default: true)
- `delete_certificate` (optional): Whether to delete the SSL certificate (default: false)
- `dry_run` (optional): Perform dry run without actual deletion (default: false)

**Required Secrets:**
- `cloudflare_api_token`: Cloudflare API token with Workers and SSL permissions
- `cloudflare_account_id`: Cloudflare account ID

**Outputs:**
- `worker_deleted`: Whether the worker was successfully deleted
- `certificate_deleted`: Whether the certificate was successfully deleted
- `cleanup_status`: Overall status of the cleanup operation
- `preview_url`: The preview URL that was cleaned up

**Cleanup Options:**

1. **Worker Deletion** (recommended):
   ```yaml
   with:
     delete_worker: true  # Default: true
   ```

2. **Certificate Deletion** (use with caution):
   ```yaml
   with:
     delete_certificate: true  # Default: false
   ```
   ⚠️ **Warning**: Certificates are often shared across deployments. Only delete if you're sure the certificate is not used by other deployments.

3. **Dry Run Mode** (for testing):
   ```yaml
   with:
     dry_run: true  # Default: false
   ```
   This will log what would be deleted without actually performing the deletion.

**Complete PR Lifecycle Example:**

```yaml
# .github/workflows/pr-preview.yml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    uses: algtools/actions/.github/workflows/preview-deploy-reusable.yml@main
    with:
      build_cmd: "npm run build"
      artifact_name: "preview-${{ github.event.pull_request.number }}"
      artifact_paths: "dist,wrangler.toml"
      worker_name: "my-app-pr-${{ github.event.pull_request.number }}"
      zone: "${{ vars.CLOUDFLARE_ZONE_ID }}"
      custom_domain: "dev.example.com"
      app_domain: "my-app"
      dev_zone: "dev.example.com"
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

# .github/workflows/cleanup-preview.yml
name: Cleanup Preview

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    uses: algtools/actions/.github/workflows/cleanup-preview-reusable.yml@main
    with:
      worker_name: "my-app-pr-${{ github.event.pull_request.number }}"
      pr_number: "${{ github.event.pull_request.number }}"
      app_domain: "my-app"
      dev_zone: "dev.example.com"
      delete_worker: true
      delete_certificate: false
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Safety Features:**

1. **Dry Run Support**: Test cleanup logic without actual deletion
2. **Conditional Execution**: Only delete resources when explicitly requested
3. **Certificate Safety**: Defaults to not deleting certificates (shared resource)
4. **Error Handling**: Graceful handling of missing resources
5. **Detailed Logging**: Comprehensive logs for debugging and auditing

**Best Practices:**

1. **Always use dry_run: true first** to test your cleanup configuration
2. **Set delete_certificate: false** unless you're certain certificates aren't shared
3. **Use consistent naming patterns** for workers to ensure proper cleanup
4. **Monitor cleanup logs** to ensure resources are being properly removed
5. **Set up alerts** for failed cleanup operations

## Usage

### Using Custom Actions

To use a custom action from this repository in your workflow:

```yaml
- uses: algtools/actions/.github/actions/your-action@v1
  with:
    input-param: value
```

### Using Reusable Workflows

To use a reusable workflow:

```yaml
jobs:
  call-workflow:
    uses: algtools/actions/.github/workflows/your-workflow.yml@v1
    with:
      input-param: value
```

## Development

### Prerequisites

- Git
- GitHub CLI (optional, for testing)
- actionlint (for workflow validation)

### Test Configuration

**macOS Tests**: macOS runner tests are disabled by default to reduce CI costs, as macOS runners are significantly more expensive than Linux/Windows runners. Tests run on Ubuntu and Windows provide sufficient cross-platform coverage for most use cases.

To enable macOS tests when needed:
1. Edit the relevant workflow file (e.g., `.github/workflows/test-*.yml`)
2. Add `macos-latest` to the matrix `os` array
3. Look for comments like: `# macOS tests disabled by default (expensive)`

Example:
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]  # Add macos-latest here
```

### Adding New Actions

1. Create a new directory under `.github/actions/your-action-name/`
2. Add `action.yml` with your action definition
3. Include a comprehensive `README.md` documenting:
   - Purpose and use cases
   - All inputs and outputs
   - Required permissions
   - Usage examples
4. Ensure all workflows pass the CI lint checks

### Validation

All workflows are automatically validated using `actionlint` on push and pull requests. To run locally:

```bash
# Install actionlint
brew install actionlint  # macOS
# or
go install github.com/rhysd/actionlint/cmd/actionlint@latest

# Run validation
actionlint
```

## CI/CD

This repository uses the following CI workflows:

- **ci-lint.yml**: Validates all GitHub Actions workflows using actionlint

## Security

- All workflows use minimal required permissions
- Dependencies are pinned to specific versions (SHA or tag)
- Regular security audits of actions and dependencies

## Contributing

1. Create a new branch for your changes
2. Add or modify actions/workflows following the structure above
3. Ensure all CI checks pass
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

For questions or issues, please open an issue in this repository.
