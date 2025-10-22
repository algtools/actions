# Deploy Cloudflare Worker from Artifact

A composite GitHub Action that deploys Cloudflare Workers from pre-built artifacts. This action ensures safe and reproducible deployments without exposing source code or secrets in the build environment.

## Features

- 🚀 **Artifact-Based Deployment**: Deploy from pre-built artifacts stored in GitHub Actions
- 🔒 **Secure Credential Handling**: Automatic masking of API tokens and sensitive data
- 📊 **Detailed Logging**: Comprehensive deployment information with security-filtered output
- ✅ **Pre-Deployment Validation**: Validates artifacts and configuration before deployment
- 🌍 **Environment Support**: Deploy to different Cloudflare environments (production, staging, etc.)
- 🧪 **Dry Run Mode**: Test deployments without actually publishing
- 📈 **Deployment Outputs**: Get worker URL, status, and version information

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

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `artifact_name` | Name of the artifact containing the built worker code | Yes | - |
| `worker_name` | Name of the Cloudflare Worker to deploy | Yes | - |
| `wrangler_config` | Path to wrangler.toml config file (relative to artifact root) | Yes | - |
| `cloudflare_api_token` | Cloudflare API token with Workers deployment permissions | Yes | - |
| `cloudflare_account_id` | Cloudflare account ID | Yes | - |
| `download_path` | Directory where artifact will be downloaded | No | `./worker-artifact` |
| `wrangler_version` | Version of Wrangler to install (e.g., "3.78.0" or "latest") | No | `latest` |
| `deploy_environment` | Environment to deploy to (maps to wrangler environment config) | No | `''` |
| `dry_run` | Perform dry run without actually deploying | No | `false` |

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

## Outputs

| Output | Description |
|--------|-------------|
| `worker_url` | URL of the deployed Cloudflare Worker |
| `deployment_status` | Status of deployment: `success` or `failure` |
| `worker_version` | Version identifier of the deployed worker (usually commit SHA) |

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

### Deployment Process
- Shows Wrangler installation progress
- Displays deployment command (with credentials masked)
- Captures and filters deployment output
- Extracts and displays worker URL

### Security Features
- Automatically masks API tokens and account IDs
- Filters sensitive information from all logs
- Redacts credentials from error messages

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
    environment: production  # Requires manual approval
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
  actions: write  # Required for downloading artifacts
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
     build:  # No secrets here
       - uses: algtools/actions/.github/actions/build-no-secrets@v1
     deploy:  # Secrets only in deployment
       - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
   ```

4. **Use GitHub Environments**: Leverage environment protection rules for production
   ```yaml
   deploy:
     environment: production  # Requires approval
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
    artifact_name: 'worker-build'  # ✅

# Deploy
- uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
  with:
    artifact_name: 'worker-build'  # ✅ Must match
```

### Wrangler Config Not Found

**Error:** "Wrangler config file not found"

**Solution:** Ensure `wrangler.toml` is included in the uploaded artifact:
```yaml
- uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'worker-build'
    artifact_paths: 'dist, wrangler.toml'  # ✅ Include config
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
worker_name: 'my-worker'  # Must match
```

### Deployment Succeeds But Worker Not Accessible

**Issue:** Deployment shows success but worker URL returns 404

**Solution:**
1. Check worker name and URL match
2. Verify deployment went to the correct environment
3. Check Cloudflare dashboard for worker status
4. Review worker routes configuration

## Compatibility

- ✅ Linux runners (ubuntu-latest)
- ✅ macOS runners (macos-latest) 
- ✅ Windows runners (windows-latest)

## Differences from Direct Wrangler Deploy

| Feature | Direct Wrangler | This Action |
|---------|----------------|-------------|
| Deploy from source | ✅ | ❌ |
| Deploy from artifact | ❌ | ✅ |
| Automatic secret redaction | ❌ | ✅ |
| Pre-deployment validation | ❌ | ✅ |
| Detailed logging | ⚠️ Basic | ✅ Comprehensive |
| Artifact verification | ❌ | ✅ |
| Security-filtered output | ❌ | ✅ |
| Dry run support | ✅ | ✅ |

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
