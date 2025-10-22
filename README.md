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
      slug: "my-app"
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
- `slug` (optional): Project slug for certificate management (required if deploy_to_dev is true)
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
A comprehensive deployment workflow for deploying Cloudflare Workers to dev/qa/production environments. Handles wildcard SSL certificates, artifact-based deployments, and optional Sentry release tracking.

**Features:**
- Automatic wildcard SSL certificate management with Cloudflare ACM
- Secure deployment from pre-built artifacts
- Environment-specific configurations
- Optional Sentry release integration for error tracking
- Comprehensive deployment summaries with all key information
- Idempotent certificate operations

**Example Usage:**
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
      artifact_paths: "dist,wrangler.toml"
  
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
- `slug` (required): Project/application identifier for certificate management
- `artifact_name` (required): Name of artifact containing built worker code

**Optional Inputs:**
- `wrangler_version` (optional): Wrangler version to use (default: "latest")
- `download_path` (optional): Artifact download directory (default: "./worker-artifact")
- `max_wait_seconds` (optional): Max wait for certificate activation (default: 300)
- `poll_interval_seconds` (optional): Certificate status check interval (default: 10)
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
      slug: "my-app-dev"
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
