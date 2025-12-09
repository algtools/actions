# Manage Ephemeral KV Namespace

GitHub Action for managing ephemeral Cloudflare KV namespaces for PR preview environments.

## Overview

This action creates and manages ephemeral KV namespaces for pull request previews, ensuring each PR has its own isolated KV namespace to prevent conflicts during testing.

## Features

- ✅ Creates ephemeral KV namespaces for PR previews
- ✅ Automatically updates `wrangler.jsonc` with namespace ID
- ✅ Validates namespace name format and length
- ✅ Verifies Cloudflare API token permissions
- ✅ Supports optional namespace creation (skips if variable not set)
- ✅ Always recreates namespace for clean state (configurable)

## Usage

### Basic Example

```yaml
- name: Manage Ephemeral KV Namespace
  uses: algtools/actions/.github/actions/manage-ephemeral-kv@main
  with:
    repository_name: 'bff-template'
    kv_namespace_name_base: 'bff-template-cache'
    pr_number: ${{ github.event.pull_request.number }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### With Optional Configuration

```yaml
- name: Manage Ephemeral KV Namespace
  uses: algtools/actions/.github/actions/manage-ephemeral-kv@main
  with:
    repository_name: 'bff-template'
    kv_namespace_name_base: 'bff-template-cache'
    pr_number: ${{ github.event.pull_request.number }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    wrangler_config: 'wrangler.jsonc'
    kv_binding: 'CACHE'
    working_directory: '.'
    force_create: 'true'
```

## Inputs

### Required Inputs

| Input                   | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `repository_name`       | Repository name (used for logging and fallback naming) |
| `pr_number`             | Pull request number                                    |
| `cloudflare_api_token`  | Cloudflare API token with KV permissions               |
| `cloudflare_account_id` | Cloudflare account ID                                  |

### Optional Inputs

| Input                    | Description                                                                                                                                     | Default                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `kv_namespace_name_base` | Base name for KV namespace (e.g., 'bff-template-cache'). If not provided, uses repository_name. Namespace will be named '{base}-pr-{pr_number}' | (uses repository_name) |
| `wrangler_config`        | Path to wrangler.jsonc file to update                                                                                                           | `wrangler.jsonc`       |
| `kv_binding`             | KV binding name in wrangler config                                                                                                              | `CACHE`                |
| `working_directory`      | Working directory for running scripts                                                                                                           | `.`                    |
| `wrangler_version`       | Version of Wrangler to install                                                                                                                  | `latest`               |
| `force_create`           | Force namespace creation (always recreates)                                                                                                     | `true`                 |

## Outputs

| Output              | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `namespace_created` | Whether an ephemeral namespace was created (always true)          |
| `namespace_name`    | Name of the ephemeral namespace (e.g., 'bff-template-cache-pr-4') |
| `namespace_id`      | ID of the ephemeral namespace                                     |

## How It Works

### 1. Namespace Creation

The action always creates an ephemeral KV namespace for PR previews:

1. **Check for existing namespace**: `wrangler kv:namespace list`
2. **Delete if exists**: Ensures clean state for testing (if `force_create=true`)
3. **Create fresh namespace**: `wrangler kv:namespace create {name}`
4. **Extract namespace ID**: Store ID for wrangler config update

**Namespace naming**: `{namespace_name_base}-pr-{pr_number}`

- Example: `bff-template-cache-pr-4` for PR #4
- Example: `bff-template-cache-pr-42` for PR #42

### 2. Wrangler Config Update

The action automatically updates `wrangler.jsonc`:

- Parses JSONC (strips comments)
- Updates both root-level and `env.preview` kv_namespaces configs
- Sets the namespace ID for the specified binding
- Preserves existing structure

### 3. Validation

- **Name format**: Lowercase, alphanumeric, hyphens only (no underscores)
- **Name length**: Maximum 63 characters
- **Permissions**: Verifies API token has KV permissions
- **Authentication**: Checks wrangler authentication before operations

## Integration with PR Preview Workflows

### Example Workflow Integration

```yaml
jobs:
  manage-kv-namespace:
    name: Manage Ephemeral KV Namespace
    needs: build
    runs-on: ubuntu-latest
    outputs:
      namespace_created: ${{ steps.manage-kv.outputs.namespace_created }}
      namespace_name: ${{ steps.manage-kv.outputs.namespace_name }}
      namespace_id: ${{ steps.manage-kv.outputs.namespace_id }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: 'pr-preview-${{ github.event.pull_request.number }}'
          path: .

      - name: Manage Ephemeral KV Namespace
        id: manage-kv
        uses: algtools/actions/.github/actions/manage-ephemeral-kv@main
        with:
          repository_name: ${{ vars.KV_NAMESPACE_NAME }}
          kv_namespace_name_base: ${{ vars.KV_NAMESPACE_NAME }}
          pr_number: ${{ github.event.pull_request.number }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wrangler_config: 'wrangler.jsonc'
          kv_binding: 'CACHE'

      - name: Re-upload artifact with updated config
        if: steps.manage-kv.outputs.namespace_created == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: 'pr-preview-${{ github.event.pull_request.number }}'
          path: .
          retention-days: 3
          overwrite: true

  deploy:
    name: Deploy Preview
    needs: [build, manage-kv-namespace]
    # ... deploy steps
```

## Cleanup

Ephemeral KV namespaces should be deleted when PRs are closed. Add this to your cleanup workflow:

```yaml
- name: Check and Delete Ephemeral KV Namespace
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    KV_NAMESPACE_NAME_BASE: ${{ vars.KV_NAMESPACE_NAME }}
    PR_NUMBER: ${{ github.event.pull_request.number }}
  run: |
    NAMESPACE_NAME="${KV_NAMESPACE_NAME_BASE}-pr-${PR_NUMBER}"

    # List namespaces and find the one to delete
    wrangler kv:namespace list > namespace-list.txt 2>&1

    if grep -q "${NAMESPACE_NAME}" namespace-list.txt; then
      NAMESPACE_ID=$(grep "${NAMESPACE_NAME}" namespace-list.txt | sed -n 's/.*id = "\([^"]*\)".*/\1/p')
      wrangler kv:namespace delete --namespace-id "$NAMESPACE_ID"
      echo "✅ Deleted ephemeral KV namespace: ${NAMESPACE_NAME}"
    fi
```

## Troubleshooting

### Error: "API token does not have KV permissions"

**Possible causes**:

- Invalid API token
- Insufficient permissions on Cloudflare API token

**Solution**:

- Check token has `Cloudflare Workers:Edit` permission
- Verify token has access to the correct account
- Visit https://dash.cloudflare.com/profile/api-tokens

### Error: "Failed to create KV namespace"

**Possible causes**:

- Invalid namespace name (must be lowercase, alphanumeric, hyphens allowed)
- Insufficient permissions on Cloudflare API token
- Account has reached KV namespace limit

**Solution**:

- Check namespace name follows Cloudflare naming rules
- Verify API token has Cloudflare Workers:Edit permissions
- Check account limits in Cloudflare dashboard

### Error: "wrangler.jsonc not found"

**Possible causes**:

- File doesn't exist in working directory
- Working directory path is incorrect

**Solution**:

- Ensure `wrangler.jsonc` exists in working directory
- Check file is valid JSONC (comments are allowed)

## Related Actions

- [`manage-ephemeral-database`](../manage-ephemeral-database/README.md) - Manages ephemeral D1 databases
- [`manage-ephemeral-vectorize`](../manage-ephemeral-vectorize/README.md) - Manages ephemeral Vectorize indexes

## License

Part of the algtools/actions repository.
