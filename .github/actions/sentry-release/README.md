# Sentry Release

A composite GitHub Action that creates and finalizes a Sentry release and registers a deployment for the target environment. This action runs in **trusted** jobs (dev/qa/prod) and helps track releases and deployments in Sentry for better error monitoring and debugging.

## Features

- 📊 **Release Management**: Automatically creates and finalizes Sentry releases
- 🚀 **Deployment Tracking**: Registers deployments to specific environments
- 🔒 **Secure Token Handling**: Automatic masking of authentication tokens
- ✅ **Input Validation**: Validates all required inputs before execution
- 📈 **Detailed Logging**: Comprehensive output with security-filtered logs
- 🌍 **Environment Support**: Track deployments across multiple environments (alpha, beta, prod)

## Usage

### Basic Example

```yaml
- name: Create Sentry release
  uses: algtools/actions/.github/actions/sentry-release@v1
  with:
    sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
    org: 'my-org'
    project: 'my-project'
    environment: 'production'
```

### Complete Deploy and Track Workflow

```yaml
name: Deploy and Track Release

on:
  push:
    branches: [main]

permissions:
  contents: read
  actions: write

jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: algtools/actions/.github/actions/setup-node@v1

      - name: Build without secrets
        uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build'
          output_dir: 'dist'

      - name: Upload build artifacts
        uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'app-build-${{ github.sha }}'
          artifact_paths: 'dist, wrangler.toml'

  deploy:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Cloudflare
        uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'app-build-${{ github.sha }}'
          worker_name: 'my-worker'
          wrangler_config: 'wrangler.toml'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Create Sentry release
        uses: algtools/actions/.github/actions/sentry-release@v1
        with:
          sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
          org: 'my-org'
          project: 'my-project'
          environment: 'production'
```

### Custom Release Version

```yaml
- name: Create Sentry release with custom version
  uses: algtools/actions/.github/actions/sentry-release@v1
  with:
    sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
    org: 'my-org'
    project: 'my-project'
    release: 'v1.0.0'
    environment: 'production'
```

### Multi-Environment Deployment with Sentry Tracking

```yaml
name: Multi-Environment Deploy

on:
  push:
    branches: [main, staging, develop]

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
          artifact_name: 'build-${{ github.sha }}'
          artifact_paths: 'dist, wrangler.toml'

  deploy-alpha:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: alpha
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'build-${{ github.sha }}'
          worker_name: 'my-worker-alpha'
          wrangler_config: 'wrangler.toml'
          deploy_environment: 'alpha'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Track alpha release in Sentry
        uses: algtools/actions/.github/actions/sentry-release@v1
        with:
          sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
          org: 'my-org'
          project: 'my-project'
          environment: 'alpha'

  deploy-beta:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment: beta
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'build-${{ github.sha }}'
          worker_name: 'my-worker-beta'
          wrangler_config: 'wrangler.toml'
          deploy_environment: 'beta'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Track beta release in Sentry
        uses: algtools/actions/.github/actions/sentry-release@v1
        with:
          sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
          org: 'my-org'
          project: 'my-project'
          environment: 'beta'

  deploy-prod:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
        with:
          artifact_name: 'build-${{ github.sha }}'
          worker_name: 'my-worker'
          wrangler_config: 'wrangler.toml'
          deploy_environment: 'production'
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Track production release in Sentry
        uses: algtools/actions/.github/actions/sentry-release@v1
        with:
          sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
          org: 'my-org'
          project: 'my-project'
          environment: 'prod'
```

### Using with Reusable Workflow

This action integrates seamlessly with the `env-deploy-reusable.yml` workflow:

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

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `sentry_auth_token` | Sentry authentication token | Yes | - |
| `org` | Sentry organization slug | Yes | - |
| `project` | Sentry project slug | Yes | - |
| `release` | Release identifier (e.g., git SHA or version tag) | No | `${{ github.sha }}` |
| `environment` | Target environment (e.g., alpha, beta, prod) | Yes | - |

### Input Details

#### `sentry_auth_token`

A Sentry authentication token with permissions to create releases and register deployments. This should be stored as a GitHub secret.

**Required permissions:**
- Project: Releases (Admin)
- Organization: Read

**Setup:**
1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Click "Create New Token"
3. Name it (e.g., "GitHub Actions Releases")
4. Add scopes: `project:releases`, `org:read`
5. Click "Create Token"
6. Add to GitHub repository secrets as `SENTRY_AUTH_TOKEN`

#### `org`

Your Sentry organization slug. This is the identifier for your Sentry organization.

**Where to find:**
- In the Sentry URL: `sentry.io/organizations/{org-slug}/`
- Sentry Settings → General Settings → Organization Slug

**Examples:**
- `'my-company'`
- `'acme-corp'`
- `'my-org'`

#### `project`

Your Sentry project slug. This identifies the specific project within your organization.

**Where to find:**
- In the Sentry URL: `sentry.io/organizations/{org}/projects/{project-slug}/`
- Sentry Project Settings → General Settings → Project Slug

**Examples:**
- `'web-app'`
- `'api-service'`
- `'mobile-app'`

#### `release`

The release identifier. Defaults to the current git commit SHA (`${{ github.sha }}`).

**Examples:**
- `${{ github.sha }}` (default - recommended for commit-based tracking)
- `'v1.0.0'` (semantic version)
- `'release-2024-01-15'` (date-based version)
- `${{ github.ref_name }}` (tag name, useful for tagged releases)

**Best practices:**
- Use git SHA for continuous deployment (default)
- Use semantic versions for tagged releases
- Keep it consistent across your deployments
- Make it human-readable when possible

#### `environment`

The target environment for the deployment. This helps track which environment a release is deployed to in Sentry.

**Common values:**
- `'alpha'` - Alpha/development environment
- `'beta'` - Beta/staging environment
- `'prod'` - Production environment
- `'production'` - Alternative production naming
- `'staging'` - Staging environment
- `'qa'` - QA/testing environment

**Note:** This can be any string that makes sense for your deployment workflow.

## Outputs

| Output | Description |
|--------|-------------|
| `release_version` | The Sentry release version that was created |
| `deployment_status` | Status of the deployment registration (success or failure) |

### Using Outputs

```yaml
- name: Create Sentry release
  id: sentry
  uses: algtools/actions/.github/actions/sentry-release@v1
  with:
    sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
    org: 'my-org'
    project: 'my-project'
    environment: 'production'

- name: Display release info
  run: |
    echo "Release created: ${{ steps.sentry.outputs.release_version }}"
    echo "Deployment status: ${{ steps.sentry.outputs.deployment_status }}"

- name: Notify team
  if: steps.sentry.outputs.deployment_status == 'success'
  run: |
    echo "✓ Release ${{ steps.sentry.outputs.release_version }} tracked in Sentry"
```

## What This Action Does

This action performs the following operations in sequence:

1. **Validates Inputs**: Ensures all required parameters are provided
2. **Installs Sentry CLI**: Uses `npx @sentry/cli` to ensure the latest version
3. **Creates Release**: Creates a new release in Sentry with the specified version
4. **Finalizes Release**: Marks the release as finalized (ready for use)
5. **Registers Deployment**: Associates the release with a specific environment deployment
6. **Provides Summary**: Outputs a detailed summary of the completed operations

## Detailed Logging

The action provides comprehensive logging throughout the process:

### Input Validation
- Validates all required inputs
- Displays configuration (with auth token masked)
- Shows organization, project, release, and environment

### Sentry CLI Installation
- Verifies Sentry CLI is available via npx
- Shows CLI version information

### Release Creation
- Creates the release in Sentry
- Associates it with the organization and project
- Outputs the release identifier

### Release Finalization
- Finalizes the release to make it active
- Confirms successful completion

### Deployment Registration
- Registers the deployment to the specified environment
- Links the release with the environment
- Outputs deployment status

### Security Features
- Automatically masks authentication tokens
- Filters sensitive information from all logs
- Redacts credentials from error messages

### Example Log Output

```
=====================================
📊 Sentry Release & Deployment
=====================================

Release Details:
  Version: abc123def456
  Organization: my-org
  Project: my-project
  Environment: production

Actions Completed:
  ✓ Release created
  ✓ Release finalized
  ✓ Deployment registered

Security:
  ✓ Auth token redacted from logs
  ✓ Secure credential handling

✓ Sentry release workflow completed successfully
```

## Use Cases

### Post-Deployment Release Tracking

Track releases immediately after deploying to Cloudflare Workers:

```yaml
steps:
  - name: Deploy to Cloudflare
    id: deploy
    uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
    with:
      artifact_name: 'worker-build'
      worker_name: 'my-worker'
      wrangler_config: 'wrangler.toml'
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  - name: Track release in Sentry
    if: steps.deploy.outputs.deployment_status == 'success'
    uses: algtools/actions/.github/actions/sentry-release@v1
    with:
      sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
      org: 'my-org'
      project: 'my-project'
      environment: 'production'
```

### Tagged Releases

Create Sentry releases based on git tags:

```yaml
name: Tagged Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      # ... build and deploy steps ...
      
      - name: Create Sentry release
        uses: algtools/actions/.github/actions/sentry-release@v1
        with:
          sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
          org: 'my-org'
          project: 'my-project'
          release: ${{ github.ref_name }}  # Uses the tag name (e.g., v1.0.0)
          environment: 'production'
```

### Error Monitoring Across Environments

Track the same release across multiple environments:

```yaml
jobs:
  deploy-staging:
    steps:
      # ... deploy to staging ...
      - uses: algtools/actions/.github/actions/sentry-release@v1
        with:
          sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
          org: 'my-org'
          project: 'my-project'
          release: ${{ github.sha }}
          environment: 'staging'

  deploy-production:
    needs: deploy-staging
    steps:
      # ... deploy to production ...
      - uses: algtools/actions/.github/actions/sentry-release@v1
        with:
          sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
          org: 'my-org'
          project: 'my-project'
          release: ${{ github.sha }}  # Same release, different environment
          environment: 'production'
```

## Required Permissions

```yaml
permissions:
  contents: read  # Required to access repository
```

No special GitHub permissions are needed beyond basic repository access.

## Security Best Practices

1. **Store Token as Secret**: Never hardcode the Sentry auth token
   ```yaml
   sentry_auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}  # ✅ Correct
   sentry_auth_token: 'sntrys_abc123...'                # ❌ Never do this
   ```

2. **Use Minimal Token Permissions**: Create tokens with only necessary scopes
   - `project:releases` - Required for creating releases
   - `org:read` - Required for organization access

3. **Rotate Tokens Regularly**: Update Sentry auth tokens periodically
   
4. **Separate Environments**: Consider using different projects for different environments
   ```yaml
   # Development
   project: 'my-app-dev'
   environment: 'alpha'
   
   # Production
   project: 'my-app-prod'
   environment: 'prod'
   ```

5. **Use GitHub Environments**: Leverage environment protection rules
   ```yaml
   deploy:
     environment: production  # Requires approval
     steps:
       - uses: algtools/actions/.github/actions/sentry-release@v1
   ```

## Troubleshooting

### Authentication Failed

**Error:** "Authentication failed" or "Invalid auth token"

**Solution:** Verify your Sentry auth token:
1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Check token has correct scopes: `project:releases`, `org:read`
3. Regenerate token if needed
4. Update GitHub secret: `SENTRY_AUTH_TOKEN`

### Organization or Project Not Found

**Error:** "Organization not found" or "Project not found"

**Solution:** Verify organization and project slugs:
1. Check Sentry URL for correct slugs
2. Ensure token has access to the organization
3. Verify project exists and you have access
4. Organization slug: `sentry.io/organizations/{org-slug}/`
5. Project slug: `sentry.io/organizations/{org}/projects/{project-slug}/`

### Release Already Exists

**Error:** "Release already exists"

**Solution:** This can happen if the same commit is deployed multiple times
- This is usually not an error - Sentry will use the existing release
- To deploy to a different environment, the action will still register the deployment
- Use different release identifiers if you need distinct releases

### CLI Installation Failed

**Error:** "npx: command not found" or "Sentry CLI installation failed"

**Solution:** Ensure Node.js is available in your workflow:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Create Sentry release
  uses: algtools/actions/.github/actions/sentry-release@v1
  # ...
```

## Compatibility

- ✅ Linux runners (ubuntu-latest)
- ✅ macOS runners (macos-latest)
- ✅ Windows runners (windows-latest)

All runners that support Node.js and npx are compatible.

## Benefits of Using Sentry Releases

1. **Error Tracking**: Associate errors with specific releases
2. **Deploy Tracking**: Know which version is deployed to which environment
3. **Source Maps**: Upload source maps for better stack traces
4. **Regression Detection**: Identify new errors introduced in releases
5. **Release Health**: Monitor crash rates and user adoption
6. **Suspect Commits**: Identify commits that may have caused issues

## Related Actions

- [`deploy-cloudflare-from-artifact`](../deploy-cloudflare-from-artifact/README.md): Deploy Cloudflare Workers from artifacts
- [`ensure-wildcard-certificate`](../ensure-wildcard-certificate/README.md): Manage SSL certificates
- [`build-no-secrets`](../build-no-secrets/README.md): Build projects without exposing secrets

## Workflow Integration

This action is designed to work after deployment actions:

```yaml
jobs:
  build:
    steps:
      - uses: algtools/actions/.github/actions/setup-node@v1
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
      - uses: algtools/actions/.github/actions/upload-artifacts@v1

  deploy:
    needs: build
    steps:
      - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@v1
      - uses: algtools/actions/.github/actions/sentry-release@v1  # Track after deploy
```

## License

MIT License - see [LICENSE](../../../LICENSE) for details

## Support

For questions or issues, please open an issue in the [algtools/actions](https://github.com/algtools/actions) repository.
