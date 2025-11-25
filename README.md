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

Sets up Node.js environment with automatic package manager detection (npm, pnpm, yarn) and intelligent caching support for faster builds. Auto-detects lockfiles and configures the appropriate package manager with optimized caching.

### [upload-artifacts](/.github/actions/upload-artifacts)

Uploads build artifacts to GitHub Actions storage with detailed logging and support for multiple file paths.

### [deploy-cloudflare-from-artifact](/.github/actions/deploy-cloudflare-from-artifact)

Deploys Cloudflare Workers from pre-built artifacts with secure credential handling. Ensures safe and reproducible deployments without exposing code or secrets.

### [ensure-wildcard-certificate](/.github/actions/ensure-wildcard-certificate)

Ensures a wildcard SSL certificate exists in Cloudflare ACM. Idempotent action that creates certificates only when needed and waits for activation. Primarily used via the manual `generate-ssl-certificate` workflow.

**Note**: Deployment workflows no longer automatically generate SSL certificates. Use the `generate-ssl-certificate` workflow to pre-generate certificates.

### [ensure-single-certificate](/.github/actions/ensure-single-certificate)

Ensures a single-domain SSL certificate exists in Cloudflare ACM. Similar to wildcard certificate action but generates certificates for a single domain only (without wildcard pattern).

### [sentry-release](/.github/actions/sentry-release)

Creates and finalizes a Sentry release and registers a deployment for the target environment. Integrates with your deployment pipeline to track releases and errors across environments (alpha, beta, prod).

### [comment-pr](/.github/actions/comment-pr)

Posts or updates comments on Pull Requests with deployment info (e.g., preview URLs, environment details, Chromatic links). Avoids duplicating the same message across retries by using a dedupe key.

### [package-template](/.github/actions/package-template)

Wraps, tokenizes, and packages a template into a tarball. Automates the template build process by running `template:wrap`, `template:tokenize`, and `template:pack` scripts in sequence. Used as part of the automated template release system.

**Inputs:**

- `working_directory` (required): Directory containing the template
- `template_name` (required): Name of the template (e.g., bff-template)
- `version` (required): Version to package

**Outputs:**

- `tarball_path`: Path to generated tarball
- `tarball_name`: Name of generated tarball

### [bump-version](/.github/actions/bump-version)

Automatically bumps version using semantic-release based on conventional commits. Analyzes commit messages to determine the appropriate version bump (major/minor/patch) and updates package.json, creates changelog, and tags the release.

**Inputs:**

- `github_token` (required): GitHub token for authentication
- `working_directory` (optional): Directory containing package.json (default: ".")
- `dry_run` (optional): Run in dry-run mode (default: "false")

**Outputs:**

- `new_version`: New version number
- `new_release_published`: Whether a new release was published

### [provision-template](/.github/actions/provision-template)

Provisions a new repository from a template release. Automates the entire process of creating a new repository with templated code, including downloading the template, initializing git, creating the remote repository, and configuring repository variables.

**Features:**

- Smart release resolution (latest or specific version)
- Flexible archive formats (custom assets or GitHub source tarballs)
- Secure token handling
- Complete repository setup with variables

**Inputs:**

- `source_repo` (required): Source template repository (e.g., 'owner/repo')
- `app_name` (required): Name of the repository to create
- `slug` (required): URL-friendly slug for environment configuration
- `sentry_project` (optional): Sentry project name (defaults to app_name)
- `version` (optional): Template release tag (default: "latest")
- `admin_token` (required): GitHub token with repo and admin:org scopes
- `github_token` (required): Standard GitHub token for API calls

**Outputs:**

- `repository_url`: URL of the created repository
- `release_tag`: Template version used for provisioning

### [update-provisioned-app](/.github/actions/update-provisioned-app)

Updates an already provisioned app with the latest or specific template version by creating a pull request. Automates the process of downloading a template release, applying changes to an existing repository, and creating a PR for review.

**Features:**

- Smart release resolution (latest or specific version)
- Flexible archive formats (custom assets or GitHub source tarballs)
- Branch management with configurable naming
- Automatic PR creation or update
- Smart exclusions to preserve local customizations
- Change detection (skips PR if no changes)

**Inputs:**

- `source_repo` (required): Source template repository (e.g., 'owner/repo')
- `target_repo` (required): Target repository to update (e.g., 'owner/app-name')
- `version` (optional): Template release tag (default: "latest")
- `base_branch` (optional): Base branch to create PR against (default: "main")
- `branch_name` (optional): Name for the update branch (default: algtools/{template_name}-{version}, e.g., algtools/web-template-1-16-4)
- `pr_title` (optional): Title for the pull request
- `pr_body` (optional): Body for the pull request
- `github_token` (required): GitHub token with repo permissions

**Outputs:**

- `pr_url`: URL of the created pull request
- `pr_number`: Number of the created pull request
- `release_tag`: Template version used for the update
- `branch_name`: Name of the branch created

### [test-template](/.github/actions/test-template)

Tests template packaging and provision regression. Validates that templates are properly packaged, extract correctly, and contain the expected files and workflows for provisioned applications.

**Features:**

- Template packaging tests
- Structure validation
- Workflow verification
- Provision regression testing
- Integrated with build-test-artifact workflow

**Inputs:**

- `working_directory` (optional): Directory containing the template (default: ".")

**What It Tests:**

- Template packaging process
- Tarball extraction and structure
- Correct workflows included/excluded
- Provisioned app structure validation
- Script presence and configuration

## SSL Certificate Management

**Important Update**: Deployment workflows no longer automatically generate SSL certificates. Certificates must be pre-generated using the manual `generate-ssl-certificate` workflow.

### Why This Change?

- ⚡ **Faster Deployments**: No more waiting for SSL certificate provisioning (saves 30-60 seconds per deployment)
- 🎯 **Centralized Management**: All SSL certificates managed from one place
- 🚫 **Reduced Failures**: SSL generation failures don't block deployments
- 💰 **Cost Savings**: Fewer API calls to Cloudflare

### Quick Start

1. Navigate to **Actions** → **Generate SSL Certificate**
2. Click **Run workflow**
3. Enter your domain and zone ID
4. Select certificate type (wildcard or single)
5. Run the workflow

**📚 Full Documentation**: [SSL Certificate Management Guide](docs/SSL_CERTIFICATE_MANAGEMENT.md)

### [generate-ssl-certificate.yml](/.github/workflows/generate-ssl-certificate.yml)

Manual workflow for generating SSL certificates on-demand. Supports both wildcard and single-domain certificates.

**Features:**

- Manual dispatch for on-demand certificate generation
- Supports wildcard certificates (covers base + all subdomains)
- Supports single certificates (specific domain only)
- Idempotent operation (safe to run multiple times)
- Detailed certificate information in workflow summary

**When to Use:**

- Setting up new environments
- Adding new domains
- Initial project setup
- Certificate has expired (rare, auto-renews)

## Available Reusable Workflows

### [pr-build-reusable.yml](/.github/workflows/pr-build-reusable.yml)

A complete PR build workflow that sets up Node.js, builds your project without secrets, uploads artifacts, and optionally deploys to Cloudflare Workers dev environment. Perfect for pull request previews and automated testing.

**Features:**

- Secure Node.js setup with dependency caching
- Clean build environment without secret exposure
- Automatic artifact upload with detailed metadata
- Configurable retention and working directories
- **Optional**: Deploy to Cloudflare Workers dev environment
- **Note**: Requires pre-generated SSL certificates

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
      build_cmd: 'npm run build'
      artifact_name: 'pr-build-${{ github.event.pull_request.number }}'
      artifact_paths: 'dist'
      working_directory: '.'
      output_dir: 'dist'
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
      build_cmd: 'npm run build'
      artifact_name: 'pr-build-${{ github.event.pull_request.number }}'
      artifact_paths: 'dist,wrangler.toml'
      working_directory: '.'
      output_dir: 'dist'
      retention_days: 7
      # Enable dev deployment
      deploy_to_dev: true
      worker_name: 'my-app-pr-${{ github.event.pull_request.number }}'
      wrangler_config: 'wrangler.toml'
      zone: '${{ vars.CLOUDFLARE_ZONE_ID }}'
      custom_domain: 'dev.example.com'
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

**Optional Secrets (if deploy_to_dev is true):**

- `worker_secrets_json`: JSON string mapping Cloudflare secret names to values. Construct using `toJSON()` in your calling workflow.
- `worker_vars_json`: JSON string mapping Cloudflare var names to values. Construct using `toJSON()` in your calling workflow.

**Passing Worker Secrets:**

To pass custom secrets to your Cloudflare Worker when deploying to dev:

```yaml
secrets:
  cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  worker_secrets_json: ${{ format('{"MY_SECRET":"{0}"}', secrets.MY_SECRET || '') }}
  worker_vars_json: ${{ format('{"MY_VAR":"{0}"}', vars.MY_VAR || '') }}
```

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

- Secure deployment from pre-built artifacts
- Environment-specific configurations
- **Note**: Requires pre-generated SSL certificates (see SSL Certificate Management section above)
- GitHub Deployments tracking in repository UI
- Optional GitHub Release creation for production deployments
- Optional Sentry release integration for error tracking
- Comprehensive deployment summaries with all key information
- Idempotent certificate operations

**Example Usage (Production with GitHub Release and Secrets/Vars):**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build:
    uses: algtools/actions/.github/workflows/pr-build-reusable.yml@main
    with:
      build_cmd: 'npm run build'
      artifact_name: 'production-build'
      artifact_paths: 'dist,wrangler.toml,package.json'

  deploy:
    needs: build
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: 'production'
      worker_name: 'my-worker'
      wrangler_config: 'wrangler.toml'
      zone: '${{ vars.CLOUDFLARE_ZONE_ID }}'
      custom_domain: 'example.com'
      slug: 'my-app'
      app_name: 'api'
      artifact_name: 'production-build'
      create_github_release: true
      release_name_template: 'My App {0}'
      sentry_release: true
      sentry_org: 'my-org'
      sentry_project: 'my-project'
      # vars_json can use vars context (but NOT secrets context)
      vars_json: ${{ toJSON({
        "ENVIRONMENT": "production",
        "API_URL": vars.API_URL
      }) }}
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

**Important: GitHub Actions Context Restrictions**

⚠️ **WARNING:** When calling reusable workflows, the `secrets` context **CANNOT** be used in the `with:` block. It can only be used in the `secrets:` block.

**This means:**

- ❌ **NEVER** use `secrets_json: ${{ toJSON({ "KEY": secrets.MY_SECRET }) }}` in reusable workflow calls
- ❌ **NEVER** use `secrets_json: '{ "KEY": "${{ secrets.MY_SECRET }}" }'` in reusable workflow calls
- ✅ **ONLY** pass secrets through the dedicated `secrets:` block

**For secrets management:**

- Pass secrets explicitly through the `secrets:` block (recommended)
- Set secrets directly in Cloudflare dashboard for your workers
- Use `wrangler.toml` environment configurations with `vars` (not for sensitive data)
- Use `vars_json` with `vars` context for non-sensitive configuration (✅ this works)

**Why this limitation exists:**
GitHub Actions restricts which contexts are available in different parts of workflows for security. When calling a reusable workflow at the `jobs` level, only these contexts are available in `with:`: `github`, `inputs`, `matrix`, `needs`, `strategy`, `vars`. The `secrets` context is intentionally excluded for security reasons.

**Required Inputs:**

- `environment` (required): Target environment (e.g., "dev", "qa", "production")
- `worker_name` (required): Name of the Cloudflare Worker
- `wrangler_config` (required): Path to wrangler.toml (relative to artifact root)
- `zone` (required): Cloudflare zone ID for the domain
- `custom_domain` (required): Domain for wildcard certificate (e.g., "example.com" for "\*.example.com")
- `artifact_name` (required): Name of artifact containing built worker code

**Optional Inputs:**

- `wrangler_version` (optional): Wrangler version to use (default: "latest")
- `download_path` (optional): Artifact download directory (default: "./worker-artifact")
- `max_wait_seconds` (optional): Max wait for certificate activation (default: 300)
- `poll_interval_seconds` (optional): Certificate status check interval (default: 10)
- `create_github_release` (optional): Create a GitHub release (default: false)
- `package_json_path` (optional): Path to package.json for version extraction (default: "package.json")
- `release_name_template` (optional): Template for release name with {0} as version placeholder (default: "Release {0}")
- `sentry_release` (optional): Enable Sentry release tracking (default: false)
- `sentry_org` (optional): Sentry organization slug (required if sentry_release is true)
- `sentry_project` (optional): Sentry project slug (required if sentry_release is true)
- `sync_secrets_before_deploy` (optional): If true, syncs secrets from GitHub to Cloudflare Workers after deployment (default: true)
- `sync_vars_before_deploy` (optional): If true, syncs vars from GitHub to Cloudflare Workers before deployment (default: true)

**Required Secrets:**

- `cloudflare_api_token`: Cloudflare API token with Workers deployment and SSL permissions
- `cloudflare_account_id`: Cloudflare account ID
- `sentry_auth_token`: Sentry auth token (required if sentry_release is true)

**Optional Secrets:**

- `worker_secrets_json`: JSON string mapping Cloudflare secret names to values. Construct using `toJSON()` in your calling workflow.
- `worker_vars_json`: JSON string mapping Cloudflare var names to values. Construct using `toJSON()` in your calling workflow.

**Passing Worker Secrets:**

To pass custom secrets to your Cloudflare Worker, construct a JSON string in your calling workflow and pass it via the `secrets:` block:

```yaml
secrets:
  cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  worker_secrets_json: ${{ format('{"MY_SECRET":"{0}","ANOTHER_SECRET":"{1}"}', secrets.MY_SECRET || '', secrets.ANOTHER_SECRET || '') }}
  worker_vars_json: ${{ format('{"MY_VAR":"{0}"}', vars.MY_VAR || '') }}
```

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
  sentry_org: 'your-sentry-org'
  sentry_project: 'your-sentry-project'
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
      build_cmd: 'npm run build'
      artifact_name: 'app-build-${{ github.sha }}'
      artifact_paths: 'dist,wrangler.toml'

  deploy-dev:
    needs: build
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: 'dev'
      worker_name: 'my-worker-dev'
      wrangler_config: 'wrangler.toml'
      zone: '${{ vars.CLOUDFLARE_ZONE_ID }}'
      custom_domain: 'dev.example.com'
      artifact_name: 'app-build-${{ github.sha }}'
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-production:
    needs: deploy-dev
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: 'production'
      worker_name: 'my-worker'
      wrangler_config: 'wrangler.toml'
      zone: '${{ vars.CLOUDFLARE_ZONE_ID }}'
      custom_domain: 'example.com'
      slug: 'my-app'
      artifact_name: 'app-build-${{ github.sha }}'
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

### [template-release-reusable.yml](/.github/workflows/template-release-reusable.yml)

A reusable workflow for automating template versioning, packaging, and releases. Uses semantic-release to automatically determine version bumps based on conventional commits, packages the template with checksums and tokens, and creates GitHub releases with the tarball as an asset.

**Features:**

- Automatic semantic versioning based on conventional commits
- Branch-based prerelease channels (dev, qa, main)
- Template packaging with wrapping and tokenization
- GitHub release creation with tarball artifacts
- Artifact upload for downstream use
- Cumulative commit analysis (multiple fixes = one patch bump)
- Priority-based version determination (BREAKING > feat > fix)

**Version Flow:**

- **dev branch**: `1.0.1-dev.1` → `1.0.1-dev.2` → `1.0.1-dev.3`
- **qa branch**: `1.0.1-rc.1` → `1.0.1-rc.2`
- **main branch**: `1.0.1` (final release)

**Example Usage:**

```yaml
name: Release Template

on:
  push:
    branches:
      - main
      - qa
      - dev

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  build:
    uses: algtools/actions/.github/workflows/pr-build-reusable.yml@main
    with:
      build_cmd: 'pnpm run lint && pnpm run test && pnpm run build'
      artifact_name: 'bff-build-${{ github.sha }}'
      artifact_paths: 'dist,wrangler.jsonc,package.json'

  release-template:
    needs: build
    uses: algtools/actions/.github/workflows/template-release-reusable.yml@main
    with:
      template_name: 'bff-template'
      working_directory: '.'
      branch: ${{ github.ref_name }}
      retention_days: ${{ github.ref_name == 'main' && 90 || github.ref_name == 'qa' && 60 || 30 }}
    secrets:
      repo_token: ${{ secrets.GITHUB_TOKEN }}
```

**Required Inputs:**

- `template_name` (required): Name of the template (e.g., bff-template)
- `working_directory` (required): Directory containing the template (default: ".")
- `branch` (required): Branch being released (dev/qa/main)

**Optional Inputs:**

- `retention_days` (optional): Artifact retention days (default: 30)

**Required Secrets:**

- `github_token`: GitHub token with write permissions for releases

**Outputs:**

- `version`: Version that was released
- `tarball_url`: URL to download tarball

**Semantic Versioning Rules:**

- `feat:` → minor bump (1.0.0 → 1.1.0)
- `fix:` → patch bump (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` or `feat!:` → major bump (1.0.0 → 2.0.0)
- Multiple commits of same type = ONE version bump
- Priority: BREAKING > feat > fix > docs/chore (no bump)

**Configuration (.releaserc.json):**

The template must have a `.releaserc.json` file in its root:

```json
{
  "branches": [
    "+([0-9])?(.{+([0-9]),x}).x",
    "main",
    {
      "name": "qa",
      "prerelease": "rc"
    },
    {
      "name": "dev",
      "prerelease": "dev"
    }
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/npm", { "npmPublish": false }],
    ["@semantic-release/exec", { "prepareCmd": "pnpm run template:pack" }],
    [
      "@semantic-release/github",
      {
        "assets": [
          {
            "path": "template-dist/${template_name}-v${nextRelease.version}.tgz",
            "label": "Template Package v${nextRelease.version}"
          }
        ]
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
}
```

**Required Template Scripts:**

The template must have these npm scripts in package.json:

```json
{
  "scripts": {
    "template:wrap": "tsx scripts/templateWrap.ts",
    "template:tokenize": "tsx scripts/templateTokenize.ts",
    "template:pack": "tsx scripts/template-pack.ts"
  }
}
```

**Required Dependencies:**

The template must have these devDependencies:

```json
{
  "devDependencies": {
    "semantic-release": "^24.0.0",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/exec": "^6.0.3",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^11.0.0"
  }
}
```

**Commit Message Format:**

All commits must follow Conventional Commits:

```bash
# Feature (minor bump)
git commit -m "feat(api): add new caching endpoint"

# Bug fix (patch bump)
git commit -m "fix(auth): resolve token validation"

# Breaking change (major bump)
git commit -m "feat!: redesign authentication
BREAKING CHANGE: authentication now requires OAuth2"
```

**Manual Override:**

To force a specific version bump:

```bash
# Force major version
git commit --allow-empty -m "feat!: BREAKING CHANGE: force major"

# Force minor version
git commit --allow-empty -m "feat: force minor version"
```

---

### [update-provisioned-app-reusable.yml](/.github/workflows/update-provisioned-app-reusable.yml)

A reusable workflow for updating an already provisioned app with the latest or specific template version. Automates the process of downloading a template release, applying changes to an existing repository, and creating a pull request for review.

**Features:**

- Smart release resolution (latest or specific version)
- Flexible archive formats (custom assets or GitHub source tarballs)
- Branch management with configurable naming
- Automatic PR creation or update
- Smart exclusions to preserve local customizations
- Change detection (skips PR if no changes)

**Example Usage:**

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
      repo_token: ${{ secrets.GITHUB_TOKEN }}
```

**Required Inputs:**

- `target_repo` (required): Target repository to update (e.g., 'owner/app-name')

**Optional Inputs:**

- `version` (optional): Template release tag (default: "latest")
- `base_branch` (optional): Base branch to create PR against (default: "main")
- `branch_name` (optional): Name for the update branch (default: algtools/{template_name}-{version}, e.g., algtools/web-template-1-16-4)
- `pr_title` (optional): Title for the pull request
- `pr_body` (optional): Body for the pull request

**Required Secrets:**

- `github_token`: GitHub token with repo permissions

**Outputs:**

- `pr_url`: URL of the created pull request
- `pr_number`: Number of the created pull request
- `release_tag`: Template version used for the update
- `branch_name`: Name of the branch created

**Scheduled Updates:**

You can set up scheduled updates to keep apps up to date:

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
      repo_token: ${{ secrets.GITHUB_TOKEN }}
```

**Update Multiple Apps:**

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
      repo_token: ${{ secrets.GITHUB_TOKEN }}

  update-app-2:
    uses: algtools/actions/.github/workflows/update-provisioned-app-reusable.yml@main
    with:
      target_repo: 'owner/app-2'
      version: 'latest'
    secrets:
      repo_token: ${{ secrets.GITHUB_TOKEN }}
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
      pull-requests: write # Required for PR comments
    uses: algtools/actions/.github/workflows/preview-deploy-reusable.yml@main
    with:
      # Build configuration
      build_cmd: 'npm run build'
      artifact_name: 'preview-${{ github.event.pull_request.number }}'
      artifact_paths: 'dist,wrangler.toml'
      working_directory: '.'
      output_dir: 'dist'

      # Deployment configuration
      worker_name: 'my-app-pr-${{ github.event.pull_request.number }}'
      wrangler_config: 'wrangler.toml'
      zone: '${{ vars.CLOUDFLARE_ZONE_ID }}'
      custom_domain: 'dev.example.com'

      # Preview URL configuration
      app_domain: '${{ vars.APP_DOMAIN }}' # e.g., "my-app"
      dev_zone: '${{ vars.DEV_ZONE }}' # e.g., "dev.example.com"

      # Optional: Enable Chromatic
      enable_chromatic: true
      chromatic_project_token: '${{ secrets.CHROMATIC_PROJECT_TOKEN }}'
      storybook_build_dir: 'storybook-static'
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
      pull-requests: write # Required for PR comments
    uses: algtools/actions/.github/workflows/preview-deploy-reusable.yml@main
    with:
      # Build configuration
      build_cmd: 'npm run test && npm run lint && npm run type-check'
      artifact_name: 'preview-${{ github.event.pull_request.number }}'
      artifact_paths: 'src,package.json,pnpm-lock.yaml,wrangler.jsonc'
      working_directory: '.'
      retention_days: 7

      # Deployment configuration
      worker_name: 'my-api-pr-${{ github.event.pull_request.number }}'
      wrangler_config: 'wrangler.jsonc'
      zone: '${{ vars.CLOUDFLARE_ZONE_ID }}'
      custom_domain: 'dev.example.com'

      # Preview URL configuration
      app_domain: '${{ vars.APP_DOMAIN }}' # e.g., "my-api"
      dev_zone: '${{ vars.DEV_ZONE }}' # e.g., "dev.example.com"

      # Optional: Enable API Documentation
      enable_api_docs: true
      api_docs_type: 'scalar'
      api_docs_output_dir: 'api-docs'
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

**Optional Secrets:**

- `worker_secrets_json`: JSON string mapping Cloudflare secret names to values. Construct using `toJSON()` in your calling workflow.
- `worker_vars_json`: JSON string mapping Cloudflare var names to values. Construct using `toJSON()` in your calling workflow.

**Passing Worker Secrets:**

To pass custom secrets to your Cloudflare Worker in preview environments:

```yaml
secrets:
  cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  worker_secrets_json: ${{ format('{"AUTH_JWT_SECRET":"{0}","DATABASE_URL":"{1}"}', secrets.AUTH_JWT_SECRET || '', secrets.DATABASE_URL || '') }}
  worker_vars_json: ${{ format('{"ENVIRONMENT":"preview"}', '') }}
```

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
  pull-requests: write # Required for posting PR comments
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
      pr_number: '${{ github.event.pull_request.number }}'
      app_domain: "${{ vars.APP_DOMAIN || vars.APP_NAME || 'my-app' }}"
      dev_zone: "${{ vars.DEV_ZONE || 'dev.example.com' }}"
      slug: "${{ vars.SLUG || 'template' }}"
      delete_worker: true
      delete_certificate: false # Certificates are usually shared
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
     delete_worker: true # Default: true
   ```

2. **Certificate Deletion** (use with caution):

   ```yaml
   with:
     delete_certificate: true # Default: false
   ```

   ⚠️ **Warning**: Certificates are often shared across deployments. Only delete if you're sure the certificate is not used by other deployments.

3. **Dry Run Mode** (for testing):
   ```yaml
   with:
     dry_run: true # Default: false
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

## Releases and Versioning

This repository uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically manage versioning and releases based on [Conventional Commits](https://www.conventionalcommits.org/).

### Versioning Strategy

The repository follows **Semantic Versioning** (SemVer) and maintains both specific version tags and major version tags for convenience:

- **Specific Version Tags**: `v1.2.3`, `v1.2.4`, `v2.0.0`
- **Major Version Tags**: `v1`, `v2`, `v3` (automatically updated to latest in that major version)

### How Releases Work

1. **Automatic Releases**: When changes are pushed to the `main` branch, semantic-release automatically:
   - Analyzes commit messages to determine the version bump
   - Updates the version in `package.json`
   - Generates a `CHANGELOG.md` with release notes
   - Creates a GitHub release with the new version tag
   - Updates the major version tag (e.g., `v1` → latest `v1.x.x`)

2. **Version Bumps**: Based on Conventional Commits:
   - `fix:` → Patch release (1.0.0 → 1.0.1)
   - `feat:` → Minor release (1.0.0 → 1.1.0)
   - `BREAKING CHANGE:` or `feat!:` → Major release (1.0.0 → 2.0.0)
   - `docs:`, `chore:`, `style:`, etc. → No release

### Referencing Actions

You can reference actions and workflows using either specific versions or major version tags:

**Major Version Tag (Recommended for stability):**

```yaml
- uses: algtools/actions/.github/actions/setup-node@v1
```

This automatically gets bug fixes and new features within v1.x.x.

**Specific Version (Recommended for reproducibility):**

```yaml
- uses: algtools/actions/.github/actions/setup-node@v1.2.3
```

This pins to an exact version.

**Main Branch (Not recommended for production):**

```yaml
- uses: algtools/actions/.github/actions/setup-node@main
```

This uses the latest code but may include breaking changes.

### Contributing Changes

When creating pull requests, ensure your PR title follows Conventional Commits format:

**Format:**

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**

```
feat(setup-node): add support for Bun package manager
fix(deploy-cloudflare): resolve artifact download timeout
docs: update README with new examples
chore: update dependencies
```

**Valid Types:**

- `feat`: New feature (triggers minor release)
- `fix`: Bug fix (triggers patch release)
- `docs`: Documentation changes (no release)
- `style`: Code style changes (no release)
- `refactor`: Code refactoring (no release)
- `perf`: Performance improvements (triggers patch release)
- `test`: Test additions or changes (no release)
- `build`: Build system changes (no release)
- `ci`: CI/CD changes (no release)
- `chore`: Other changes (no release)
- `revert`: Revert a previous commit (triggers appropriate release)

**Breaking Changes:**

For breaking changes, use `!` after the type or add `BREAKING CHANGE:` in the footer:

```
feat!: redesign action API

BREAKING CHANGE: The input parameter `node_version` is now required.
```

This will trigger a major version release (e.g., 1.x.x → 2.0.0).

### Commit Message Validation

This repository enforces Conventional Commits format at two levels:

1. **Local Git Hooks (Husky + Commitlint)**: When you make a commit locally, commitlint automatically validates your commit message format. If it doesn't follow Conventional Commits, the commit will be rejected.

2. **PR Validation**: All commits in pull requests are validated in CI to ensure they follow the format. The validation checks all commits between the base and head of your PR.

3. **PR Title Validation**: Pull request titles are also validated to follow Conventional Commits format.

If validation fails, you'll need to fix your commit messages before merging.

### Workflow Validation

This repository also validates GitHub Actions workflow files before commit:

1. **Pre-commit Hook**: When you commit changes to workflow files, actionlint automatically validates them for syntax errors, best practices, and shellcheck issues.

2. **CI Validation**: All workflows are validated in CI using actionlint to catch any issues that might have been missed locally.

**Setting up local validation:**

After cloning the repository, run:

```powershell
cd actions
pnpm install
```

The `prepare` script will automatically set up Husky hooks. After this:

- All commits will validate commit messages
- Commits with workflow changes will run actionlint validation

**Installing actionlint (recommended):**

For workflow validation to work locally, install actionlint:

```powershell
# Using Go
go install github.com/rhysd/actionlint/cmd/actionlint@latest

# On macOS with Homebrew
brew install actionlint

# On Windows with Chocolatey
choco install actionlint
```

Without actionlint installed, the pre-commit hook will skip workflow validation with a warning, but CI will still catch issues.

**Manual workflow validation:**

You can manually validate workflows at any time:

```powershell
pnpm run lint:workflows
```

## Development

### Prerequisites

- Git
- Node.js (v20 or later)
- pnpm (v9 or later)
- actionlint (recommended, for workflow validation)
- GitHub CLI (optional, for testing)

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
    os: [ubuntu-latest, windows-latest, macos-latest] # Add macos-latest here
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
- **validate-commits.yml**: Validates all commit messages in PRs follow Conventional Commits format
- **lint-pr.yml**: Validates PR titles follow Conventional Commits format
- **release.yml**: Automatically creates releases when changes are pushed to main

## Security

- All workflows use minimal required permissions
- Dependencies are pinned to specific versions (SHA or tag)
- Regular security audits of actions and dependencies

## Troubleshooting

### Actionlint Error: "context 'secrets' is not allowed here"

**Error Example:**

```
.github/workflows/deploy-prod.yml:98:50: context "secrets" is not allowed here. available contexts are "github", "inputs", "matrix", "needs", "strategy", "vars"
```

**Root Cause:**
You're trying to use `secrets` context in the `with:` block when calling a reusable workflow. GitHub Actions restricts which contexts are available at different workflow levels for security reasons.

**Where this restriction applies:**

- ❌ Calling reusable workflows at the `jobs:` level - Cannot use `secrets` in `with:` block
- ✅ Calling actions within job `steps:` - Can use `secrets` in `with` parameters

**Common Mistake:**

```yaml
jobs:
  deploy:
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      secrets_json: ${{ toJSON({ "KEY": secrets.MY_SECRET }) }}  # ❌ ERROR
```

**Solution:**
Pass secrets through the dedicated `secrets:` block using the new `worker_secrets_json` and `worker_vars_json` secret parameters:

```yaml
jobs:
  deploy:
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: 'production'
      # ... other inputs (no secrets here)
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      # Pass worker secrets as JSON string
      worker_secrets_json: ${{ format('{"AUTH_JWT_SECRET":"{0}","DATABASE_URL":"{1}"}', secrets.AUTH_JWT_SECRET || '', secrets.DATABASE_URL || '') }}
      # Pass worker vars as JSON string
      worker_vars_json: ${{ format('{"ENVIRONMENT":"{0}"}', vars.ENVIRONMENT || '') }}
```

This works because:

- The `toJSON()/format()` expression is evaluated in the **calling workflow's context** where secrets are accessible
- The resulting JSON string is passed as a **secret value** to the reusable workflow
- The reusable workflow treats it as an opaque string and passes it to the action
- The action parses the JSON and sets the secrets/vars in Cloudflare

**Available Contexts by Workflow Level:**

| Context    | Reusable Workflow `with:` | Action Inputs |
| ---------- | ------------------------- | ------------- |
| `github`   | ✅ Yes                    | ✅ Yes        |
| `vars`     | ✅ Yes                    | ✅ Yes        |
| `secrets`  | ❌ No                     | ✅ Yes        |
| `inputs`   | ✅ Yes                    | ✅ Yes        |
| `needs`    | ✅ Yes                    | ✅ Yes        |
| `matrix`   | ✅ Yes                    | ✅ Yes        |
| `strategy` | ✅ Yes                    | ✅ Yes        |

**References:**

- [GitHub Docs: Context availability](https://docs.github.com/en/actions/learn-github-actions/contexts#context-availability)
- [Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)

## Contributing

1. Create a new branch for your changes
2. Add or modify actions/workflows following the structure above
3. Ensure all CI checks pass
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

For questions or issues, please open an issue in this repository.
