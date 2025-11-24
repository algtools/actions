# Fixed Workflow for Provisioned Apps

Copy this into your provisioned app's `.github/workflows/template-update-incremental.yml`:

## For BFF Template Apps:

```yaml
name: Update Template (Incremental)

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Target template version (or "latest")'
        required: false
        default: 'latest'
        type: string
      use_incremental:
        description: 'Use incremental diff-based updates'
        required: false
        default: true
        type: boolean
      dry_run:
        description: 'Dry run - simulate update without creating PR'
        required: false
        default: false
        type: boolean
  schedule:
    # Run weekly on Monday at 00:00 UTC (optional - remove if you prefer manual only)
    - cron: '0 0 * * 1'

permissions:
  contents: write
  pull-requests: write

jobs:
  update-template:
    name: Update from BFF Template
    runs-on: ubuntu-latest

    steps:
      - name: Update Template Incrementally
        uses: algtools/actions/.github/actions/update-provisioned-app-incremental@main
        with:
          source_repo: 'algtools/bff-template'
          target_repo: ${{ github.repository }}
          version: ${{ inputs.version || 'latest' }}
          base_branch: 'main'
          use_incremental: ${{ inputs.use_incremental }}
          dry_run: ${{ inputs.dry_run }}
          github_token: ${{ secrets.TEMPLATE_UPDATES_TOKEN || secrets.GITHUB_TOKEN }}

      - name: Update Summary
        if: always()
        run: |
          {
            echo "## Template Update Complete"
            echo ""
            echo "Check the workflow logs above for details."
          } >> "$GITHUB_STEP_SUMMARY"

          if [ "${{ inputs.dry_run }}" = "true" ]; then
            {
              echo ""
              echo "⚠️ **Dry Run Mode** - No PR was created"
            } >> "$GITHUB_STEP_SUMMARY"
          fi
```

## For Core Template Apps:

```yaml
name: Update Template (Incremental)

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Target template version (or "latest")'
        required: false
        default: 'latest'
        type: string
      use_incremental:
        description: 'Use incremental diff-based updates'
        required: false
        default: true
        type: boolean
      dry_run:
        description: 'Dry run - simulate update without creating PR'
        required: false
        default: false
        type: boolean
  schedule:
    # Run weekly on Monday at 00:00 UTC (optional - remove if you prefer manual only)
    - cron: '0 0 * * 1'

permissions:
  contents: write
  pull-requests: write

jobs:
  update-template:
    name: Update from Core Template
    runs-on: ubuntu-latest

    steps:
      - name: Update Template Incrementally
        uses: algtools/actions/.github/actions/update-provisioned-app-incremental@main
        with:
          source_repo: 'algtools/core-template'
          target_repo: ${{ github.repository }}
          version: ${{ inputs.version || 'latest' }}
          base_branch: 'dev'
          use_incremental: ${{ inputs.use_incremental }}
          dry_run: ${{ inputs.dry_run }}
          github_token: ${{ secrets.TEMPLATE_UPDATES_TOKEN || secrets.GITHUB_TOKEN }}

      - name: Update Summary
        if: always()
        run: |
          {
            echo "## Template Update Complete"
            echo ""
            echo "Check the workflow logs above for details."
          } >> "$GITHUB_STEP_SUMMARY"

          if [ "${{ inputs.dry_run }}" = "true" ]; then
            {
              echo ""
              echo "⚠️ **Dry Run Mode** - No PR was created"
            } >> "$GITHUB_STEP_SUMMARY"
          fi

          {
            echo ""
            echo "### 💡 Core Template Tips"
            echo "- Review database migrations in the PR carefully"
            echo "- Test migrations locally: \`pnpm db:migrate:local\`"
            echo "- Backup production data before applying schema changes"
          } >> "$GITHUB_STEP_SUMMARY"
```

## For Web Template Apps:

```yaml
name: Update Template (Incremental)

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Target template version (or "latest")'
        required: false
        default: 'latest'
        type: string
      use_incremental:
        description: 'Use incremental diff-based updates'
        required: false
        default: true
        type: boolean
      dry_run:
        description: 'Dry run - simulate update without creating PR'
        required: false
        default: false
        type: boolean
  schedule:
    # Run weekly on Monday at 00:00 UTC (optional - remove if you prefer manual only)
    - cron: '0 0 * * 1'

permissions:
  contents: write
  pull-requests: write

jobs:
  update-template:
    name: Update from Web Template
    runs-on: ubuntu-latest

    steps:
      - name: Update Template Incrementally
        uses: algtools/actions/.github/actions/update-provisioned-app-incremental@main
        with:
          source_repo: 'algtools/web-template'
          target_repo: ${{ github.repository }}
          version: ${{ inputs.version || 'latest' }}
          base_branch: 'main'
          use_incremental: ${{ inputs.use_incremental }}
          dry_run: ${{ inputs.dry_run }}
          github_token: ${{ secrets.TEMPLATE_UPDATES_TOKEN || secrets.GITHUB_TOKEN }}

      - name: Update Summary
        if: always()
        run: |
          {
            echo "## Template Update Complete"
            echo ""
            echo "Check the workflow logs above for details."
          } >> "$GITHUB_STEP_SUMMARY"

          if [ "${{ inputs.dry_run }}" = "true" ]; then
            {
              echo ""
              echo "⚠️ **Dry Run Mode** - No PR was created"
            } >> "$GITHUB_STEP_SUMMARY"
          fi
```

## What Was Fixed

- ✅ All `$GITHUB_STEP_SUMMARY` variables are now quoted
- ✅ Multiple echo statements grouped with braces `{ ... } >> "$FILE"`
- ✅ Passes actionlint and shellcheck validation

## For Future Provisions

Once you commit the updated `.template-app` workflows to the template repositories, all **new** provisioned apps will automatically get the fixed version.
