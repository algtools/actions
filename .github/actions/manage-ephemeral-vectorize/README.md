# Manage Ephemeral Vectorize Index Action

Manages ephemeral Vectorize indexes for PR preview environments. Automatically creates isolated Vectorize indexes for each PR, updates wrangler config, and ensures clean state.

## Features

- **Automatic Index Lifecycle**: Creates and recreates Vectorize indexes automatically
- **Clean State Guarantee**: Always deletes and recreates to ensure clean index state
- **Flexible Configuration**: Supports custom dimensions, metrics, and wrangler configs
- **Simple Integration**: No migration detection needed - always creates ephemeral indexes for PRs

## Usage

### Basic Usage

```yaml
- name: Manage Ephemeral Vectorize Index
  uses: algtools/actions/.github/actions/manage-ephemeral-vectorize@main
  with:
    repository_name: ${{ github.event.repository.name }}
    vectorize_index_name_base: janovix-pep-names
    pr_number: ${{ github.event.pull_request.number }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Advanced Usage

```yaml
- name: Manage Ephemeral Vectorize Index
  id: ephemeral-vectorize
  uses: algtools/actions/.github/actions/manage-ephemeral-vectorize@main
  with:
    # Repository configuration
    repository_name: ${{ github.event.repository.name }}
    vectorize_index_name_base: janovix-pep-names
    pr_number: ${{ github.event.pull_request.number }}

    # Cloudflare credentials
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

    # Vectorize configuration
    dimensions: 1536
    metric: cosine

    # Wrangler configuration
    wrangler_config: 'wrangler.jsonc'
    vectorize_binding: 'VECTORIZE'
    working_directory: '.'
    wrangler_version: 'latest'

- name: Use index outputs
  run: |
    if [ "${{ steps.ephemeral-vectorize.outputs.index_created }}" = "true" ]; then
      echo "Using ephemeral Vectorize index: ${{ steps.ephemeral-vectorize.outputs.index_name }}"
      echo "Dimensions: ${{ steps.ephemeral-vectorize.outputs.index_dimensions }}"
      echo "Metric: ${{ steps.ephemeral-vectorize.outputs.index_metric }}"
    fi
```

## Inputs

### Required Inputs

| Input                   | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `repository_name`       | Repository name (used for logging and fallback naming) |
| `pr_number`             | Pull request number                                    |
| `cloudflare_api_token`  | Cloudflare API token with Vectorize permissions        |
| `cloudflare_account_id` | Cloudflare account ID                                  |

### Optional Inputs

| Input                       | Description                                                                                                                         | Default                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `vectorize_index_name_base` | Base name for index (e.g., 'janovix-pep-names'). If not provided, uses repository_name. Index will be named '{base}-pr-{pr_number}' | (uses repository_name) |
| `dimensions`                | Vector dimensions (common: 1536 for OpenAI embeddings)                                                                              | `1536`                 |
| `metric`                    | Similarity metric - cosine, euclidean, or dot-product                                                                               | `cosine`               |
| `wrangler_config`           | Path to wrangler.jsonc file to update                                                                                               | `wrangler.jsonc`       |
| `vectorize_binding`         | Vectorize binding name in wrangler config                                                                                           | `VECTORIZE`            |
| `working_directory`         | Working directory for running scripts                                                                                               | `.`                    |
| `wrangler_version`          | Version of Wrangler to install                                                                                                      | `latest`               |
| `force_create`              | Force index creation (always recreates)                                                                                             | `true`                 |

## Outputs

| Output             | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `index_created`    | Whether an ephemeral index was created (always true)         |
| `index_name`       | Name of the ephemeral index (e.g., 'janovix-pep-names-pr-4') |
| `index_dimensions` | Dimensions used for the index                                |
| `index_metric`     | Metric used for the index (cosine/euclidean/dot-product)     |

## How It Works

### 1. Index Creation

The action always creates an ephemeral Vectorize index for PR previews:

1. **Check for existing index**: `wrangler vectorize list`
2. **Delete if exists**: Ensures clean state for testing
3. **Create fresh index**: `wrangler vectorize create {name} --dimensions {dims} --metric {metric}`
4. **Extract index details**: Store dimensions and metric for outputs

**Index naming**: `{index_name_base}-pr-{pr_number}`

- Example: `janovix-pep-names-pr-4` for PR #4
- Example: `core-template-vectors-pr-42` for PR #42

### 2. Configuration Update

Updates `wrangler.jsonc` with ephemeral index name:

```json
{
  "vectorize": [
    {
      "binding": "VECTORIZE",
      "index_name": "janovix-pep-names-pr-4"
    }
  ],
  "env": {
    "preview": {
      "vectorize": [
        {
          "binding": "VECTORIZE",
          "index_name": "janovix-pep-names-pr-4"
        }
      ]
    }
  }
}
```

The action:

- Parses JSONC (strips comments)
- Updates both root-level and `env.preview` vectorize configs
- Preserves existing structure
- Creates vectorize arrays if they don't exist

## Decision Flow

```
PR Created/Updated
    ↓
Always create ephemeral index
    ↓
Check if index exists
    ↓
┌─────────────────┬─────────────────┐
│  Index exists   │  Index doesn't  │
│                 │     exist       │
└────────┬────────┴────────┬─────────┘
         ↓                  ↓
    Delete index      Create index
         ↓                  ↓
    Create index      Update config
         ↓                  ↓
    Update config     Output index info
         ↓
    Output index info
```

## Requirements

### Repository Structure

Your repository should have:

```
.
├── wrangler.jsonc
└── package.json
```

### Cloudflare Permissions

The API token needs:

- Vectorize Index Read/Write permissions
- Account-level access

## Examples

### Example 1: Basic PR Preview

```yaml
name: PR Preview

on:
  pull_request:
    branches: [dev]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install

      - name: Manage Vectorize Index
        id: vectorize
        uses: algtools/actions/.github/actions/manage-ephemeral-vectorize@main
        with:
          repository_name: ${{ github.event.repository.name }}
          vectorize_index_name_base: janovix-pep-names
          pr_number: ${{ github.event.pull_request.number }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy
        run: wrangler deploy --env preview
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Example 2: With Custom Configuration

```yaml
- name: Setup Vectorize Index
  uses: algtools/actions/.github/actions/manage-ephemeral-vectorize@main
  with:
    repository_name: 'my-api'
    vectorize_index_name_base: 'my-vectors'
    pr_number: ${{ github.event.pull_request.number }}
    dimensions: 768
    metric: euclidean
    wrangler_config: 'config/wrangler.toml'
    vectorize_binding: 'VECTORS'
    cloudflare_api_token: ${{ secrets.CF_TOKEN }}
    cloudflare_account_id: ${{ secrets.CF_ACCOUNT }}
```

### Example 3: Integration with Database Management

```yaml
jobs:
  manage-resources:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Manage Database
        id: db
        uses: algtools/actions/.github/actions/manage-ephemeral-database@main
        with:
          repository_name: ${{ github.event.repository.name }}
          pr_number: ${{ github.event.pull_request.number }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Manage Vectorize Index
        id: vectorize
        uses: algtools/actions/.github/actions/manage-ephemeral-vectorize@main
        with:
          repository_name: ${{ github.event.repository.name }}
          vectorize_index_name_base: janovix-pep-names
          pr_number: ${{ github.event.pull_request.number }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy
        run: wrangler deploy --env preview
```

## Cleanup

This action only creates indexes. For cleanup when PRs are closed, use:

```yaml
name: PR Cleanup

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Install Wrangler
        run: npm install -g wrangler

      - name: Delete Index
        run: |
          INDEX_NAME="janovix-pep-names-pr-${{ github.event.pull_request.number }}"
          wrangler vectorize delete "$INDEX_NAME" || true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Or integrate with the PR preview cleanup workflow (see core-template for example).

## Troubleshooting

### Index Creation Failed

**Error**: `Failed to create Vectorize index`

**Possible causes**:

- Invalid index name (must be lowercase, alphanumeric, hyphens allowed)
- Insufficient permissions on Cloudflare API token
- Invalid dimensions or metric values

**Solution**:

- Check index name follows Cloudflare naming rules
- Verify API token has Vectorize permissions
- Ensure dimensions is a positive integer
- Ensure metric is one of: cosine, euclidean, dot-product

### Config Not Updated

**Error**: `wrangler.jsonc` doesn't show the ephemeral index name

**Cause**: Config parsing failed or file not found

**Solution**:

- Ensure `wrangler.jsonc` exists in working directory
- Check file is valid JSONC (comments are allowed)
- Verify `vectorize_binding` matches your config

### Index Already Exists Error

**Error**: Index creation fails because index already exists

**Cause**: Deletion step failed or index wasn't fully deleted

**Solution**: The action handles this automatically by deleting before creating. If you see this error, it may be a race condition. The action will retry.

### Invalid Metric Error

**Error**: `metric must be one of: cosine, euclidean, dot-product`

**Cause**: Invalid metric value provided

**Solution**: Use one of the supported metrics:

- `cosine` - Cosine similarity (default, most common)
- `euclidean` - Euclidean distance
- `dot-product` - Dot product similarity

## Best Practices

### 1. Use Descriptive Index Names

```yaml
vectorize_index_name_base: janovix-pep-names  # Good
vectorize_index_name_base: index1              # Avoid
```

### 2. Set Appropriate Dimensions

```yaml
dimensions: 1536  # OpenAI embeddings (ada-002, text-embedding-3-small)
dimensions: 768   # Smaller models
dimensions: 3072  # Larger models (text-embedding-3-large)
```

### 3. Choose the Right Metric

- **cosine**: Best for normalized vectors (most common)
- **euclidean**: Best for distance-based similarity
- **dot-product**: Best for unnormalized vectors

### 4. Integrate with Cleanup

Always set up cleanup workflows to delete ephemeral indexes when PRs close:

```yaml
- name: Cleanup Vectorize Index
  if: github.event.action == 'closed'
  run: |
    INDEX_NAME="${INDEX_BASE}-pr-${{ github.event.pull_request.number }}"
    wrangler vectorize delete "$INDEX_NAME" || true
```

## Related Documentation

- [Ephemeral Databases Guide](../../../core-template/docs/features/EPHEMERAL_DATABASES.md) - Similar pattern for D1 databases
- [Cloudflare Vectorize Documentation](https://developers.cloudflare.com/vectorize/)
- [Wrangler Vectorize Commands](https://developers.cloudflare.com/workers/wrangler/commands/#vectorize)

## License

MIT License - See [LICENSE](../../../LICENSE) for details.
