# Deploy Cloudflare Worker from Artifact

A composite GitHub Action that deploys Cloudflare Workers from pre-built artifacts. This action ensures safe and reproducible deployments without exposing source code or secrets in the build environment.

## Features

- 🚀 **Artifact-Based Deployment**: Deploy from pre-built artifacts stored in GitHub Actions
- 🔒 **Secure Credential Handling**: Automatic masking of API tokens and sensitive data
- 🔐 **Secrets & Vars Sync**: Automatically sync secrets and vars from GitHub to Cloudflare Workers
- 📊 **Detailed Logging**: Comprehensive deployment information with security-filtered output
- ✅ **Pre-Deployment Validation**: Validates artifacts and configuration before deployment
- 🌍 **Environment Support**: Deploy to different Cloudflare environments (production, staging, etc.)
- 🧪 **Dry Run Mode**: Test deployments without actually publishing
- 📈 **Deployment Outputs**: Get worker URL, status, and version information

## Deployment Flow

The action follows this order:

1. **Sync Vars** → Updates wrangler config file with vars (before deployment)
2. **Deploy Worker** → Creates the worker if it doesn't exist, or updates existing worker
3. **Sync Secrets** → Sets secrets on the now-existing worker (after deployment)

**Why this order?** Cloudflare Workers must exist before secrets can be set. The deployment step creates the worker, then secrets are synced to it.

## Usage

### Basic Example

```yaml
- name: Deploy to Cloudflare Workers
  uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build'
    worker_name: 'my-worker'
    wrangler_config: 'wrangler.toml'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Complete Build and Deploy Workflow

**Important:** This action is called from within a job's `steps`, so it **CAN** use the `secrets` context in its inputs. This is different from calling reusable workflows at the `jobs` level, which cannot use `secrets` in the `with:` block. See [Actionlint Errors](#actionlint-errors-with-secrets_jsonvars_json) for details.

```yaml
name: Build and Deploy Worker

on:
  push:
    branches: [main]

permissions:
  contents: read
  actions: write

jobs:
  build:
    name: Build Worker
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: algtools/actions/.github/actions/setup-node@v1
        with:
          node-version: '20'

      - name: Build without secrets
        uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build'
          output_dir: 'dist'

      - name: Upload build artifacts
        uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'worker-build-${{ github.sha }}'
          artifact_paths: 'dist, wrangler.toml'
          retention_days: '30'

  deploy:
    name: Deploy to Cloudflare
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy worker from artifact
        id: deploy
        uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'worker-build-${{ github.sha }}'
          worker_name: 'my-api-worker'
          wrangler_config: 'wrangler.toml'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          # Use toJSON() to properly construct JSON and avoid actionlint errors
          secrets_json: ${{ toJSON({
            "OPENAI_API_KEY": secrets.OPENAI_API_KEY,
            "DATABASE_URL": secrets.DATABASE_URL
          }) }}
          vars_json: ${{ toJSON({
            "ENVIRONMENT": vars.ENVIRONMENT,
            "API_URL": vars.API_URL
          }) }}

      - name: Display deployment info
        run: |
          echo "Worker deployed successfully!"
          echo "URL: ${{ steps.deploy.outputs.worker_url }}"
          echo "Version: ${{ steps.deploy.outputs.version }}"
```

### Multi-Environment Deployment

```yaml
name: Deploy to Multiple Environments

on:
  push:
    branches: [main, staging]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build'
          output_dir: 'dist'
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'worker-${{ github.sha }}'
          artifact_paths: 'dist, wrangler.toml'

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'worker-${{ github.sha }}'
          worker_name: 'my-worker'
          wrangler_config: 'wrangler.toml'
          deploy_environment: 'staging'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'worker-${{ github.sha }}'
          worker_name: 'my-worker'
          wrangler_config: 'wrangler.toml'
          deploy_environment: 'production'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Deployment with Secrets and Vars

```yaml
- name: Deploy with secrets and vars
  uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build'
    worker_name: 'my-worker'
    wrangler_config: 'wrangler.toml'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    # Use toJSON() to properly construct JSON and avoid actionlint errors
    secrets_json: ${{ toJSON({
      "OPENAI_API_KEY": secrets.OPENAI_API_KEY,
      "DATABASE_URL": secrets.DATABASE_URL,
      "API_SECRET": secrets.API_SECRET
    }) }}
    vars_json: ${{ toJSON({
      "ENVIRONMENT": "production",
      "API_URL": vars.API_URL,
      "FEATURE_FLAG": vars.FEATURE_FLAG
    }) }}
```

**Important:** Use `toJSON()` function to construct the JSON properly. This avoids actionlint errors that occur when using `${{ secrets... }}` directly in multiline strings. The secrets are accessed directly via `secrets.SECRET_NAME` (without the `${{ }}` wrapper inside `toJSON()`).

### Deployment with Dry Run (Testing)

```yaml
- name: Test deployment (dry run)
  uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build'
    worker_name: 'my-worker'
    wrangler_config: 'wrangler.toml'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    dry_run: 'true'
```

### Environment-Specific Secrets and Vars

```yaml
- name: Deploy to production environment
  uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build'
    worker_name: 'my-worker'
    wrangler_config: 'wrangler.toml'
    deploy_environment: 'production'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    # Use toJSON() to properly construct JSON
    secrets_json: ${{ toJSON({
      "PROD_API_KEY": secrets.PROD_API_KEY,
      "PROD_DATABASE_URL": secrets.PROD_DATABASE_URL
    }) }}
    vars_json: ${{ toJSON({
      "ENVIRONMENT": "production",
      "API_URL": "https://api.example.com"
    }) }}
```

**Note:** When `deploy_environment` is set, secrets are synced to the environment-specific worker, and vars are added to the environment-specific section in the wrangler config.

### Custom Wrangler Version

```yaml
- name: Deploy with specific Wrangler version
  uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build'
    worker_name: 'my-worker'
    wrangler_config: 'wrangler.toml'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    wrangler_version: '3.78.0'
```

## Inputs

| Input                        | Description                                                                | Required | Default             |
| ---------------------------- | -------------------------------------------------------------------------- | -------- | ------------------- |
| `artifact_name`              | Name of the artifact containing the built worker code                      | Yes      | -                   |
| `worker_name`                | Name of the Cloudflare Worker to deploy                                    | Yes      | -                   |
| `wrangler_config`            | Path to wrangler.toml config file (relative to artifact root)              | Yes      | -                   |
| `cloudflare_api_token`       | Cloudflare API token with Workers deployment permissions                   | Yes      | -                   |
| `cloudflare_account_id`      | Cloudflare account ID                                                      | Yes      | -                   |
| `download_path`              | Directory where artifact will be downloaded                                | No       | `./worker-artifact` |
| `wrangler_version`           | Version of Wrangler to install (e.g., "3.78.0" or "latest")                | No       | `latest`            |
| `deploy_environment`         | Environment to deploy to (maps to wrangler environment config)             | No       | `''`                |
| `dry_run`                    | Perform dry run without actually deploying                                 | No       | `false`             |
| `secrets_json`               | JSON object mapping Cloudflare secret names to GitHub secret values        | No       | `{}`                |
| `vars_json`                  | JSON object mapping Cloudflare var names to GitHub var/secret values       | No       | `{}`                |
| `sync_secrets_before_deploy` | If true, syncs secrets from GitHub to Cloudflare Workers before deployment | No       | `true`              |
| `sync_vars_before_deploy`    | If true, syncs vars from GitHub to Cloudflare Workers before deployment    | No       | `true`              |

### Input Details

#### `artifact_name`

The name of the GitHub Actions artifact that contains your built worker code. This should match the artifact name used in the `upload-artifacts` action.

**Examples:**

- `'worker-build'`
- `'worker-build-${{ github.sha }}'`
- `'production-worker'`

#### `worker_name`

The name of your Cloudflare Worker. This will be used as the worker's identifier in Cloudflare and affects the default `*.workers.dev` URL.

**Examples:**

- `'my-api-worker'`
- `'user-authentication'`
- `'image-optimizer'`

#### `wrangler_config`

Path to your `wrangler.toml` configuration file, relative to the artifact root. The artifact must include this file.

**Example wrangler.toml:**

```toml
name = "my-worker"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[env.staging]
name = "my-worker-staging"

[env.production]
name = "my-worker-production"
```

#### `cloudflare_api_token`

A Cloudflare API token with Workers deployment permissions. This should be stored as a GitHub secret.

**Required permissions:**

- Account Settings: Workers Scripts - Edit
- Account Settings: Workers Routes - Edit

**Setup:**

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Create a custom token with the permissions above
3. Add to GitHub repository secrets as `CLOUDFLARE_API_TOKEN`

#### `cloudflare_account_id`

Your Cloudflare account ID. Found in the Cloudflare Dashboard URL or account settings. Store as a GitHub secret.

**Where to find:**

- Cloudflare Dashboard → Workers & Pages → Overview (in the right sidebar)
- Or in the URL: `dash.cloudflare.com/<account-id>/`

#### `download_path`

The directory where the artifact will be downloaded. The action will create this directory if it doesn't exist.

#### `wrangler_version`

The version of Wrangler CLI to install. Use `latest` for the newest version or specify a version like `3.78.0`.

Check [Wrangler releases](https://github.com/cloudflare/workers-sdk/releases) for available versions.

#### `deploy_environment`

The Cloudflare environment to deploy to, as defined in your `wrangler.toml` file. This corresponds to `[env.{name}]` sections in the config.

**Example:**

```toml
# wrangler.toml
[env.staging]
name = "my-worker-staging"
vars = { ENVIRONMENT = "staging" }

[env.production]
name = "my-worker-production"
vars = { ENVIRONMENT = "production" }
```

Use `deploy_environment: 'staging'` or `deploy_environment: 'production'` to deploy to these environments.

#### `dry_run`

When set to `true`, Wrangler will validate the deployment without actually publishing to Cloudflare. Useful for testing in CI/CD pipelines.

#### `secrets_json`

A JSON object that maps Cloudflare Worker secret names to GitHub secret values. Secrets are synced to Cloudflare Workers using `wrangler secret put` **after deployment** (the worker must exist first).

**Important:**

- **You do NOT need to add individual secrets to a `secrets:` section** when using this action directly. The secrets are accessed directly via `secrets.SECRET_NAME` in the `toJSON()` expression.
- **Use `toJSON()` function** to construct the JSON properly and avoid actionlint errors.

**Format:**

```json
{
  "SECRET_NAME_1": "value_from_github_secret",
  "SECRET_NAME_2": "another_secret_value"
}
```

**Example (Recommended - using toJSON()):**

```yaml
secrets_json: ${{ toJSON({
  "OPENAI_API_KEY": secrets.OPENAI_API_KEY,
  "DATABASE_URL": secrets.DATABASE_URL,
  "API_SECRET": secrets.API_SECRET
}) }}
```

**Alternative format (may trigger actionlint warnings):**

```yaml
secrets_json: |
  {
    "OPENAI_API_KEY": "${{ secrets.OPENAI_API_KEY }}",
    "DATABASE_URL": "${{ secrets.DATABASE_URL }}"
  }
```

**Important Notes:**

- Secrets are synced **after** deployment (worker must exist first)
- The deployment step creates the worker if it doesn't exist, then secrets are synced
- Secrets are available at runtime once synced (no redeployment needed)
- Secrets are environment-specific when `deploy_environment` is set
- Empty or missing secrets will be skipped with a warning
- Secret values are automatically masked in logs

#### `vars_json`

A JSON object that maps Cloudflare Worker variable names to GitHub variable or secret values. Vars are added to the wrangler config file before deployment.

**Important:** Use `toJSON()` function to construct the JSON properly and avoid actionlint errors.

**Format:**

```json
{
  "VAR_NAME_1": "value_from_github_var",
  "VAR_NAME_2": "another_var_value"
}
```

**Example (Recommended - using toJSON()):**

```yaml
vars_json: ${{ toJSON({
  "ENVIRONMENT": vars.ENVIRONMENT,
  "API_URL": vars.API_URL,
  "FEATURE_FLAG": vars.FEATURE_FLAG
}) }}
```

**Alternative format (may trigger actionlint warnings):**

```yaml
vars_json: |
  {
    "ENVIRONMENT": "${{ vars.ENVIRONMENT }}",
    "API_URL": "${{ vars.API_URL }}"
  }
```

**Important Notes:**

- Vars are added to the wrangler config file (not set via CLI)
- Vars are environment-specific when `deploy_environment` is set
- Vars are non-sensitive and can be stored in GitHub Variables (not Secrets)
- Empty or null vars will be skipped with a warning

#### `sync_secrets_before_deploy`

Controls whether secrets should be synced from GitHub to Cloudflare Workers after deployment. Set to `false` to disable secret syncing.

**Note:** Despite the name, secrets are actually synced **after** deployment because the worker must exist before secrets can be set. The name is kept for backward compatibility.

**Default:** `true`

#### `sync_vars_before_deploy`

Controls whether vars should be synced from GitHub to the wrangler config before deployment. Set to `false` to disable var syncing.

**Default:** `true`

## Outputs

| Output              | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `worker_url`        | URL of the deployed Cloudflare Worker                          |
| `deployment_status` | Status of deployment: `success` or `failure`                   |
| `worker_version`    | Version identifier of the deployed worker (usually commit SHA) |

### Using Outputs

```yaml
- name: Deploy worker
  id: deploy
  uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build'
    worker_name: 'my-worker'
    wrangler_config: 'wrangler.toml'
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

- name: Test deployed worker
  run: |
    curl -f "${{ steps.deploy.outputs.worker_url }}/health" || exit 1
    echo "Worker is healthy!"

- name: Notify deployment
  if: success()
  run: |
    echo "Deployment successful!"
    echo "URL: ${{ steps.deploy.outputs.worker_url }}"
    echo "Version: ${{ steps.deploy.outputs.worker_version }}"
```

## Detailed Logging

The action provides comprehensive logging throughout the deployment process:

### Input Validation

- Validates all required inputs
- Displays configuration (with sensitive data masked)
- Shows Wrangler version and environment settings

### Artifact Verification

- Lists downloaded artifact contents
- Verifies wrangler.toml exists
- Shows configuration file (with secrets filtered)

### Secrets and Vars Syncing

- **Vars**: Synced to wrangler config file before deployment
- **Secrets**: Synced to Cloudflare Workers after deployment (worker must exist first)
- Lists secrets and vars to be synced
- Shows sync progress for each secret/var
- Validates JSON format before syncing
- Skips empty or invalid values with warnings
- Masks secret values in logs

### Deployment Process

- Shows Wrangler installation progress
- Displays deployment command (with credentials masked)
- Captures and filters deployment output
- Extracts and displays worker URL

### Security Features

- Automatically masks API tokens and account IDs
- Filters sensitive information from all logs
- Redacts credentials from error messages
- Secret values are never exposed in logs
- Secrets synced securely via `wrangler secret put`

### Example Log Output

```
================================
🚀 Cloudflare Worker Deployment
================================

Worker Details:
  Name: my-api-worker
  Status: success
  URL: https://my-api-worker.workers.dev
  Version: abc123def456
  Environment: production

Artifact Details:
  Source: worker-build-abc123
  Config: wrangler.toml

Security:
  ✓ Credentials redacted from logs
  ✓ Deployment from verified artifact
  ✓ No source code exposed

✓ Deployment completed successfully
```

## Use Cases

### Secure PR Previews

Deploy preview workers for pull requests without exposing secrets in the build environment:

```yaml
name: PR Preview

on:
  pull_request:
    branches: [main]

jobs:
  build-and-deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build'
          output_dir: 'dist'
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'pr-${{ github.event.pull_request.number }}'
          artifact_paths: 'dist, wrangler.toml'
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'pr-${{ github.event.pull_request.number }}'
          worker_name: 'my-worker-pr-${{ github.event.pull_request.number }}'
          wrangler_config: 'wrangler.toml'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Production Deployments with Approval

Deploy to production with manual approval:

```yaml
name: Production Deployment

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build'
          output_dir: 'dist'
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'release-${{ github.ref_name }}'
          artifact_paths: 'dist, wrangler.toml'
          retention_days: '90'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production # Requires manual approval
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'release-${{ github.ref_name }}'
          worker_name: 'my-production-worker'
          wrangler_config: 'wrangler.toml'
          deploy_environment: 'production'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Rollback Deployments

Redeploy a previous artifact for rollback:

```yaml
name: Rollback Worker

on:
  workflow_dispatch:
    inputs:
      artifact_run_id:
        description: 'Run ID of the artifact to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Download previous artifact
        uses: actions/download-artifact@v4
        with:
          name: 'worker-build'
          run-id: ${{ github.event.inputs.artifact_run_id }}

      - name: Deploy previous version
        uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'worker-build'
          worker_name: 'my-worker'
          wrangler_config: 'wrangler.toml'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Required Permissions

```yaml
permissions:
  contents: read
  actions: write # Required for downloading artifacts
```

## Security Best Practices

1. **Store Credentials as Secrets**: Never hardcode API tokens or account IDs

   ```yaml
   cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
   cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   ```

2. **Use Minimal Token Permissions**: Create API tokens with only necessary permissions
   - Workers Scripts: Edit
   - Workers Routes: Edit

3. **Separate Build and Deploy**: Build in a clean environment without secrets, then deploy from artifact

   ```yaml
   jobs:
     build: # No secrets here
       - uses: algtools/actions/.github/actions/build-no-secrets@v1
     deploy: # Secrets only in deployment
       - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
   ```

4. **Use GitHub Environments**: Leverage environment protection rules for production

   ```yaml
   deploy:
     environment: production # Requires approval
   ```

5. **Enable Dry Run for Testing**: Test deployment configuration without publishing
   ```yaml
   dry_run: 'true'
   ```

## Troubleshooting

### Artifact Not Found

**Error:** "Artifact not found: worker-build"

**Solution:** Ensure the artifact name matches exactly between upload and deploy:

```yaml
# Upload
- uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'worker-build' # ✅

# Deploy
- uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build' # ✅ Must match
```

### Wrangler Config Not Found

**Error:** "Wrangler config file not found"

**Solution:** Ensure `wrangler.toml` is included in the uploaded artifact:

```yaml
- uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'worker-build'
    artifact_paths: 'dist, wrangler.toml' # ✅ Include config
```

### Authentication Failed

**Error:** "Authentication failed" or "Invalid API token"

**Solution:** Verify your API token has the correct permissions:

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Check token permissions: Workers Scripts (Edit), Workers Routes (Edit)
3. Regenerate token if needed
4. Update GitHub secret

### Worker Name Mismatch

**Error:** "Worker name does not match configuration"

**Solution:** Ensure worker name matches wrangler.toml:

```toml
# wrangler.toml
name = "my-worker"
```

```yaml
# workflow
worker_name: 'my-worker' # Must match
```

### Deployment Succeeds But Worker Not Accessible

**Issue:** Deployment shows success but worker URL returns 404

**Solution:**

1. Check worker name and URL match
2. Verify deployment went to the correct environment
3. Check Cloudflare dashboard for worker status
4. Review worker routes configuration

### Actionlint Errors with secrets_json/vars_json

**Issue:** Actionlint reports errors like "context 'secrets' is not allowed here" when using `secrets_json` or `vars_json`

**Root Cause:** This error occurs when calling **reusable workflows** (not when calling this action directly). GitHub Actions does not allow the `secrets` context in the `with:` block of reusable workflow calls - it can only be used in the `secrets:` block.

**Solution Depends on Context:**

**If calling this ACTION from within a job step** (✅ Works):

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@main
        with:
          # ✅ This WORKS - actions can use secrets context in inputs
          secrets_json: ${{ toJSON({
            "SECRET": secrets.SECRET
          }) }}
```

**If calling a REUSABLE WORKFLOW that uses this action** (❌ Doesn't work the old way):

```yaml
jobs:
  deploy:
    # ❌ This FAILS - reusable workflows cannot use secrets in with: block
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      secrets_json: ${{ toJSON({ "SECRET": secrets.SECRET }) }}  # ❌ ERROR
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**Solution for Reusable Workflows** (✅ Works):

Our reusable workflows (env-deploy-reusable, preview-deploy-reusable, pr-build-reusable) now accept secrets via the `secrets:` block using `worker_secrets_json` and `worker_vars_json`:

```yaml
jobs:
  deploy:
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
      # ... other inputs
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      # ✅ Pass worker secrets via secrets: block using format()
      worker_secrets_json: ${{ format('{{"AUTH_JWT_SECRET":"{0}","DATABASE_URL":"{1}"}}', secrets.AUTH_JWT_SECRET || '', secrets.DATABASE_URL || '') }}
      # ✅ Pass worker vars via secrets: block using format()
      worker_vars_json: ${{ format('{{"ENVIRONMENT":"production","API_URL":"{0}"}}', vars.API_URL || '') }}
```

**Why?** GitHub Actions has different context availability rules:

- **Actions** (called in `steps`): ✅ Can use `secrets` context in inputs
- **Reusable workflows** (called in `jobs`): ❌ Cannot use `secrets` context in `with:` block, ✅ but CAN use it in `secrets:` block

**How it works:**

1. The `format()` expression is evaluated in your calling workflow's context (where `secrets` and `vars` are accessible) to construct a valid JSON string
2. The resulting JSON string is passed as a **secret value** to the reusable workflow
3. The reusable workflow receives it as an opaque string and passes it to this action
4. This action parses the JSON and syncs the secrets/vars to Cloudflare

**Note:** Use `|| ''` to provide empty string fallbacks for potentially missing secrets/vars (e.g., `secrets.MY_SECRET || ''`)

### Secrets Not Syncing

**Issue:** Secrets are not available in the deployed worker

**Solution:**

1. Verify the worker was deployed successfully (secrets can only be set on existing workers)
2. Verify `secrets_json` format is valid JSON (use `toJSON()` function)
3. Check that GitHub secrets exist and are accessible
4. Ensure `sync_secrets_before_deploy` is `true` (default)
5. Verify secret names match what your worker expects
6. Check Cloudflare dashboard to confirm secrets are set
7. Note: Secrets are synced **after** deployment, so the worker must exist first

**Example valid formats:**

**Direct action usage (using toJSON):**

```yaml
secrets_json: ${{ toJSON({
  "SECRET_NAME": secrets.GITHUB_SECRET_NAME,
  "API_KEY": secrets.API_KEY
}) }}
```

**Reusable workflow usage (using format):**

```yaml
# In the calling workflow's secrets: block
worker_secrets_json: ${{ format('{{"SECRET_NAME":"{0}","API_KEY":"{1}"}}', secrets.SECRET_NAME || '', secrets.API_KEY || '') }}
```

**Conditional inclusion:**

```yaml
worker_secrets_json: ${{ secrets.MY_SECRET != '' && format('{{"MY_SECRET":"{0}"}}', secrets.MY_SECRET) || '{}' }}
```

### Vars Not Syncing

**Issue:** Vars are not available in the deployed worker

**Solution:**

1. Verify `vars_json` format is valid JSON
2. Check that GitHub variables exist (or use secrets)
3. Ensure `sync_vars_before_deploy` is `true` (default)
4. Verify vars are added to the correct environment section in wrangler config
5. Check the wrangler config file after deployment to confirm vars were added

**Example valid formats:**

**Direct action usage (using toJSON):**

```yaml
vars_json: ${{ toJSON({
  "VAR_NAME": vars.GITHUB_VAR_NAME,
  "ENVIRONMENT": vars.ENVIRONMENT
}) }}
```

**Reusable workflow usage (using format):**

```yaml
# In the calling workflow's secrets: block
worker_vars_json: ${{ format('{{"VAR_NAME":"{0}","ENVIRONMENT":"{1}"}}', vars.VAR_NAME || '', vars.ENVIRONMENT || '') }}
```

**Alternative format (may trigger actionlint warnings):**

```yaml
vars_json: |
  {
    "VAR_NAME": "${{ vars.GITHUB_VAR_NAME }}"
  }
```

## Compatibility

- ✅ Linux runners (ubuntu-latest)
- ✅ macOS runners (macos-latest)
- ✅ Windows runners (windows-latest)

## Differences from Direct Wrangler Deploy

| Feature                    | Direct Wrangler | This Action      |
| -------------------------- | --------------- | ---------------- |
| Deploy from source         | ✅              | ❌               |
| Deploy from artifact       | ❌              | ✅               |
| Automatic secret redaction | ❌              | ✅               |
| Pre-deployment validation  | ❌              | ✅               |
| Detailed logging           | ⚠️ Basic        | ✅ Comprehensive |
| Artifact verification      | ❌              | ✅               |
| Security-filtered output   | ❌              | ✅               |
| Dry run support            | ✅              | ✅               |

## Related Actions

- [`build-no-secrets`](../build-no-secrets/README.md): Build projects without exposing secrets
- [`upload-artifacts`](../upload-artifacts/README.md): Upload build artifacts with detailed logging
- [`setup-node`](../setup-node/README.md): Set up Node.js environment

## Workflow Integration

This action is designed to work seamlessly with other algtools actions:

```yaml
# Complete secure deployment pipeline
jobs:
  build:
    steps:
      - uses: algtools/actions/.github/actions/setup-node@v1
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
      - uses: algtools/actions/.github/actions/upload-artifacts@v1

  deploy:
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
```

## License

MIT License - see [LICENSE](../../../LICENSE) for details

## Support

For questions or issues, please open an issue in the [algtools/actions](https://github.com/algtools/actions) repository.
