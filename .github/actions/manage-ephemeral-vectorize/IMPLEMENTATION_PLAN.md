# Implementation Plan: Ephemeral Vectorize Indexes

## Overview

This plan covers Vectorize index management for all environments:

1. **Persistent Indexes (dev/qa/prod)**: Created during template provisioning via `provision-template` action
2. **Ephemeral Indexes (PR previews)**: Created per PR via new `manage-ephemeral-vectorize` action

Both follow the same pattern as D1 databases.

## Key Differences from D1 Databases

1. **No Migration Detection**: Vectorize indexes don't have migrations - they're created fresh each time
2. **Always Create**: For PR previews, we always create ephemeral indexes (no conditional logic based on migrations)
3. **Simpler Lifecycle**: Create → Use → Delete (no migration application or seeding)
4. **Configuration**: Only need `index_name`, `dimensions`, and `metric`

## Action Structure

### Inputs

**Required:**

- `repository_name`: Repository name (for logging and fallback naming)
- `vectorize_index_name_base`: Base name for index (e.g., `janovix-pep-names`). If not provided, uses repository name
- `pr_number`: Pull request number
- `cloudflare_api_token`: Cloudflare API token with Vectorize permissions
- `cloudflare_account_id`: Cloudflare account ID

**Optional:**

- `wrangler_config`: Path to wrangler.jsonc file (default: `wrangler.jsonc`)
- `vectorize_binding`: Binding name in wrangler config (default: `VECTORIZE`)
- `dimensions`: Vector dimensions (default: `1536` - common for OpenAI embeddings)
- `metric`: Similarity metric - `cosine`, `euclidean`, or `dot-product` (default: `cosine`)
- `wrangler_version`: Wrangler version to install (default: `latest`)
- `working_directory`: Working directory (default: `.`)
- `force_create`: Force creation even if index exists (default: `false`)

### Outputs

- `index_created`: Whether an ephemeral index was created (true/false)
- `index_name`: Name of the ephemeral index (e.g., `janovix-pep-names-pr-4`)
- `index_dimensions`: Dimensions used for the index
- `index_metric`: Metric used for the index

### Steps

1. **Display Action Version**: Show action name and version
2. **Validate Inputs**: Check required inputs are provided
3. **Install Wrangler**: Install specified version of Wrangler
4. **Create or Recreate Ephemeral Index**:
   - Determine index name: `{index_name_base}-pr-{pr_number}`
   - Check if index exists: `wrangler vectorize list`
   - Delete if exists (always recreate for clean state)
   - Create new index: `wrangler vectorize create {index_name} --dimensions {dimensions} --metric {metric}`
5. **Configure wrangler.jsonc**: Update config with ephemeral index name
6. **Summary**: Display creation status

## Index Naming Convention

- Format: `{index_name_base}-pr-{pr_number}`
- Example: `janovix-pep-names-pr-4` for PR #4
- Example: `core-template-vectors-pr-42` for PR #42

## Wrangler Config Update

The action will update `wrangler.jsonc` to use the ephemeral index:

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

## Cleanup Integration

Update `pr-preview-cleanup.yml` workflows to also delete Vectorize indexes:

```yaml
- name: Check and Delete Ephemeral Vectorize Index
  run: |
    INDEX_NAME="{index_name_base}-pr-${{ github.event.pull_request.number }}"

    echo "Checking for ephemeral Vectorize index: ${INDEX_NAME}"

    if wrangler vectorize list | grep -q "${INDEX_NAME}"; then
      echo "Deleting ephemeral Vectorize index..."
      wrangler vectorize delete "${INDEX_NAME}" || true
    fi
```

## Usage Example

```yaml
- name: Manage Ephemeral Vectorize Index
  id: vectorize
  uses: algtools/actions/.github/actions/manage-ephemeral-vectorize@main
  with:
    repository_name: ${{ github.event.repository.name }}
    vectorize_index_name_base: janovix-pep-names
    pr_number: ${{ github.event.pull_request.number }}
    dimensions: 1536
    metric: cosine
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

- name: Deploy
  uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@main
  # ... deployment config
```

## Implementation Notes

1. **Always Recreate**: Like D1 databases, always delete and recreate to ensure clean state
2. **Error Handling**: Gracefully handle cases where index doesn't exist or deletion fails
3. **Config Parsing**: Handle both JSONC (with comments) and JSON formats
4. **Environment Support**: Update both root-level and environment-specific configs (e.g., `env.preview`)
5. **Wrangler Commands**:
   - List: `wrangler vectorize list`
   - Create: `wrangler vectorize create {name} --dimensions {dims} --metric {metric}`
   - Delete: `wrangler vectorize delete {name}`

## Testing Checklist

- [ ] Create index with default dimensions (1536)
- [ ] Create index with custom dimensions
- [ ] Create index with different metrics (cosine, euclidean, dot-product)
- [ ] Handle existing index (delete and recreate)
- [ ] Update wrangler.jsonc correctly
- [ ] Update environment-specific config
- [ ] Cleanup workflow deletes index
- [ ] Error handling for missing permissions
- [ ] Error handling for invalid index names

## Part 1: Persistent Indexes for dev/qa/prod

### Integration with provision-template Action

Add Vectorize index creation to `actions/.github/actions/provision-template/action.yml`:

**Location**: After D1 database provisioning (around line 450)

**Implementation**:

```bash
# Function to get or create Vectorize index
get_or_create_vectorize_index() {
  local index_name=$1
  local index_env=$2
  local dimensions=${3:-1536}  # Default dimensions
  local metric=${4:-cosine}     # Default metric

  echo "Processing ${index_env} Vectorize index: ${index_name}" >&2

  # List existing indexes
  echo "  Checking if index exists..." >&2
  if ! INDEX_LIST=$(wrangler vectorize list 2>&1); then
    echo "::error::Failed to list Vectorize indexes. Wrangler error:" >&2
    echo "${INDEX_LIST}" >&2
    return 1
  fi

  # Check if index exists
  if echo "${INDEX_LIST}" | grep -qF "${index_name}"; then
    echo "  ✓ Found existing index: ${index_name}" >&2
    echo "exists"
  else
    echo "  Creating new index..." >&2
    if ! wrangler vectorize create "${index_name}" --dimensions "${dimensions}" --metric "${metric}" 2>&1; then
      echo "::error::Failed to create ${index_env} Vectorize index" >&2
      return 1
    fi
    echo "  ✓ Created new index: ${index_name}" >&2
    echo "created"
  fi
}

# Get or create dev index
echo "Starting dev Vectorize index provisioning..."
get_or_create_vectorize_index "${INDEX_NAME_BASE}-dev" "dev" "${DIMENSIONS}" "${METRIC}" || {
  echo "::error::Failed to provision dev Vectorize index"
  exit 1
}
echo ""

# Get or create qa index
echo "Starting qa Vectorize index provisioning..."
get_or_create_vectorize_index "${INDEX_NAME_BASE}-qa" "qa" "${DIMENSIONS}" "${METRIC}" || {
  echo "::error::Failed to provision qa Vectorize index"
  exit 1
}
echo ""

# Get or create prod index
echo "Starting prod Vectorize index provisioning..."
get_or_create_vectorize_index "${INDEX_NAME_BASE}-prod" "prod" "${DIMENSIONS}" "${METRIC}" || {
  echo "::error::Failed to provision prod Vectorize index"
  exit 1
}
echo ""

# Update wrangler.jsonc with index names
sed -i "s|{{VECTORIZE_INDEX_NAME}}-dev|${INDEX_NAME_BASE}-dev|g" wrangler.jsonc
sed -i "s|{{VECTORIZE_INDEX_NAME}}-qa|${INDEX_NAME_BASE}-qa|g" wrangler.jsonc
sed -i "s|{{VECTORIZE_INDEX_NAME}}-prod|${INDEX_NAME_BASE}-prod|g" wrangler.jsonc
```

**Template wrangler.jsonc Updates**:

Add Vectorize configuration to template with placeholders:

```json
{
  "vectorize": [
    {
      "binding": "VECTORIZE",
      "index_name": "{{VECTORIZE_INDEX_NAME}}-local"
    }
  ],
  "env": {
    "dev": {
      "vectorize": [
        {
          "binding": "VECTORIZE",
          "index_name": "{{VECTORIZE_INDEX_NAME}}-dev"
        }
      ]
    },
    "qa": {
      "vectorize": [
        {
          "binding": "VECTORIZE",
          "index_name": "{{VECTORIZE_INDEX_NAME}}-qa"
        }
      ]
    },
    "production": {
      "vectorize": [
        {
          "binding": "VECTORIZE",
          "index_name": "{{VECTORIZE_INDEX_NAME}}-prod"
        }
      ]
    }
  }
}
```

**Inputs to Add to provision-template**:

- `vectorize_index_name_base`: Base name for Vectorize indexes (optional, defaults to app name)
- `vectorize_dimensions`: Vector dimensions (default: 1536)
- `vectorize_metric`: Similarity metric (default: cosine)
- `enable_vectorize`: Whether to create Vectorize indexes (default: false)

**Naming Convention for Persistent Indexes**:

- Dev: `{index_name_base}-dev` (e.g., `janovix-pep-names-dev`)
- QA: `{index_name_base}-qa` (e.g., `janovix-pep-names-qa`)
- Prod: `{index_name_base}-prod` (e.g., `janovix-pep-names-prod`)

## Part 2: Ephemeral Indexes for PR Previews

See action structure below (already documented above).

## Related Files

- `actions/.github/actions/manage-ephemeral-database/action.yml` - Reference implementation for ephemeral resources
- `actions/.github/actions/provision-template/action.yml` - Where to add persistent index creation
- `actions/.github/actions/manage-ephemeral-database/README.md` - Documentation template
- `core-template/.github/workflows/pr-preview-cleanup.yml` - Cleanup workflow template
- `core-template/.template-app/include/wrangler.jsonc` - Template wrangler config
