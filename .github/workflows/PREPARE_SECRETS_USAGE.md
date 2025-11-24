# Prepare Secrets Reusable Workflow

This reusable workflow helps you prepare secrets for deployment by converting GitHub secrets into a JSON format that can be passed to deployment workflows.

## Why Use This?

GitHub Actions restricts using the `secrets` context in the `with:` block when calling reusable workflows. This workflow provides a clean, reusable solution to work around that limitation.

## Before (Manual Approach)

```yaml
jobs:
  # Had to repeat this in every workflow
  prepare-secrets:
    name: Prepare Secrets
    needs: build
    runs-on: ubuntu-latest
    outputs:
      secrets_json: ${{ steps.build-secrets.outputs.secrets_json }}
    steps:
      - name: Build secrets JSON
        id: build-secrets
        run: |
          SECRETS_JSON=$(cat <<EOF
          {
            "AUTH_JWT_SECRET": "${{ secrets.AUTH_JWT_SECRET }}",
            "S3_ACCESS_KEY_ID": "${{ secrets.S3_ACCESS_KEY_ID }}",
            "S3_SECRET_ACCESS_KEY": "${{ secrets.S3_SECRET_ACCESS_KEY }}"
          }
          EOF
          )
          {
            echo "secrets_json<<EOF"
            echo "$SECRETS_JSON"
            echo "EOF"
          } >> "$GITHUB_OUTPUT"
```

## After (Using Reusable Workflow)

```yaml
jobs:
  prepare-secrets:
    name: Prepare Secrets
    uses: algtools/actions/.github/workflows/prepare-secrets-reusable.yml@main
    secrets:
      auth_jwt_secret: ${{ secrets.AUTH_JWT_SECRET }}
      s3_access_key_id: ${{ secrets.S3_ACCESS_KEY_ID }}
      s3_secret_access_key: ${{ secrets.S3_SECRET_ACCESS_KEY }}
      s3_bucket_name: ${{ secrets.S3_BUCKET_NAME }}
```

**Much cleaner!** ✨

## Full Example

```yaml
name: Deploy to Dev

on:
  push:
    branches: [dev]

jobs:
  build:
    name: Build and Test
    uses: algtools/actions/.github/workflows/build-test-artifact-reusable.yml@main
    with:
      build_cmd: 'pnpm build'
      artifact_name: 'dev-build-${{ github.sha }}'
      artifact_paths: 'dist,wrangler.jsonc'

  # ✨ Use the reusable prepare-secrets workflow
  prepare-secrets:
    name: Prepare Secrets
    needs: build
    uses: algtools/actions/.github/workflows/prepare-secrets-reusable.yml@main
    secrets:
      auth_jwt_secret: ${{ secrets.AUTH_JWT_SECRET }}
      database_url: ${{ secrets.DATABASE_URL }}
      s3_access_key_id: ${{ secrets.S3_ACCESS_KEY_ID }}
      s3_secret_access_key: ${{ secrets.S3_SECRET_ACCESS_KEY }}

  deploy:
    name: Deploy to Dev
    needs: [build, prepare-secrets]
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: 'dev'
      slug: '${{ vars.SLUG }}'
      app_name: '${{ vars.APP_NAME }}'
      wrangler_config: 'wrangler.jsonc'
      zone: '${{ vars.DEV_ZONE_ID }}'
      custom_domain: 'app.example.dev'
      artifact_name: 'dev-build-${{ github.sha }}'
      # ✨ Use the output from prepare-secrets
      secrets_json: ${{ needs.prepare-secrets.outputs.secrets_json }}
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Available Secret Inputs

The workflow supports these common secrets:

### Authentication

- `auth_jwt_secret` - JWT secret for authentication
- `api_key` - API key for external services

### Database

- `database_url` - Database connection URL

### AWS/S3

- `s3_access_key_id` - AWS S3 access key ID
- `s3_secret_access_key` - AWS S3 secret access key
- `s3_bucket_name` - AWS S3 bucket name

### External Services

- `openai_api_key` - OpenAI API key
- `sendgrid_api_key` - SendGrid API key
- `stripe_secret_key` - Stripe secret key

### Cloudflare

- `cloudflare_account_id` - Cloudflare account ID (if needed as worker secret)

### Custom Secrets

- `custom_secrets_json` - Additional secrets as JSON string

## Using Custom Secrets

If you have secrets not in the predefined list, use `custom_secrets_json`:

```yaml
prepare-secrets:
  uses: algtools/actions/.github/workflows/prepare-secrets-reusable.yml@main
  secrets:
    auth_jwt_secret: ${{ secrets.AUTH_JWT_SECRET }}
    # Add custom secrets as JSON
    custom_secrets_json: |
      {
        "TWILIO_AUTH_TOKEN": "${{ secrets.TWILIO_AUTH_TOKEN }}",
        "SLACK_WEBHOOK_URL": "${{ secrets.SLACK_WEBHOOK_URL }}",
        "CUSTOM_API_KEY": "${{ secrets.CUSTOM_API_KEY }}"
      }
```

## Only Pass What You Need

You only need to pass the secrets your application actually uses:

```yaml
# Minimal example - just one secret
prepare-secrets:
  uses: algtools/actions/.github/workflows/prepare-secrets-reusable.yml@main
  secrets:
    auth_jwt_secret: ${{ secrets.AUTH_JWT_SECRET }}
```

## Output

The workflow outputs a single value:

- `secrets_json` - JSON object containing all provided secrets

This output is used by the deployment workflows to sync secrets to Cloudflare Workers.

## Benefits

1. **DRY** - No need to repeat the same code in every workflow
2. **Maintainable** - Update secret handling logic in one place
3. **Type-safe** - Predefined inputs for common secrets
4. **Flexible** - Custom secrets support for unique cases
5. **Secure** - Secret values are masked in logs automatically
6. **Clear** - Shows which secret keys were configured (without values)

## Migration Guide

To migrate existing workflows:

1. Replace your custom `prepare-secrets` job with a call to this workflow
2. Map your secrets to the appropriate input names (snake_case)
3. Use `custom_secrets_json` for any secrets not in the predefined list
4. The output usage remains the same: `needs.prepare-secrets.outputs.secrets_json`

## Example: Auth-Core Migration

**Before:**

```yaml
prepare-secrets:
  name: Prepare Secrets
  needs: [build, migrate, seed]
  runs-on: ubuntu-latest
  outputs:
    secrets_json: ${{ steps.build-secrets.outputs.secrets_json }}
  steps:
    - name: Build secrets JSON
      id: build-secrets
      run: |
        SECRETS_JSON=$(cat <<EOF
        {
          "AUTH_JWT_SECRET": "${{ secrets.AUTH_JWT_SECRET }}"
        }
        EOF
        )
        {
          echo "secrets_json<<EOF"
          echo "$SECRETS_JSON"
          echo "EOF"
        } >> "$GITHUB_OUTPUT"
```

**After:**

```yaml
prepare-secrets:
  name: Prepare Secrets
  needs: [build, migrate, seed]
  uses: algtools/actions/.github/workflows/prepare-secrets-reusable.yml@main
  secrets:
    auth_jwt_secret: ${{ secrets.AUTH_JWT_SECRET }}
```

**Lines of code reduced: 18 → 5** 🎉
