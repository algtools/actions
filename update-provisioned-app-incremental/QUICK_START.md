# Quick Start: Incremental Template Updates

This guide shows you how to enable incremental template updates in your provisioned app.

## What You'll Get

✅ Version-by-version change tracking
✅ Better conflict resolution
✅ Clearer release notes in PRs
✅ Ability to identify which version introduced breaking changes

## Prerequisites

- Your app must be provisioned from a template (has `.template.config.json`)
- Template repository must have versioned releases
- GitHub token with `repo` permissions

## Setup (5 minutes)

### Step 1: Update Your Workflow File

Edit `.github/workflows/template-update.yml` in your app:

```yaml
name: Update Template

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Target version (or "latest")'
        required: false
        default: 'latest'
      use_incremental:
        description: 'Use incremental updates'
        type: boolean
        default: true
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Update Template
        uses: algtools/actions/.github/actions/update-provisioned-app-incremental@v1
        with:
          source_repo: 'algtools/YOUR-TEMPLATE-NAME' # e.g., bff-template, core-template
          target_repo: ${{ github.repository }}
          version: ${{ inputs.version || 'latest' }}
          use_incremental: ${{ inputs.use_incremental }}
          github_token: ${{ secrets.TEMPLATE_UPDATES_TOKEN || secrets.GITHUB_TOKEN }}
```

Replace `YOUR-TEMPLATE-NAME` with your template:

- `bff-template` for BFF apps
- `core-template` for Core apps
- `web-template` for Web apps
- `npm-pkg-template` for NPM packages

### Step 2: Test with Dry Run

Before creating actual PRs, test the system:

1. Go to **Actions** tab in your repository
2. Select **Update Template** workflow
3. Click **Run workflow**
4. Set:
   - Version: `latest`
   - Use incremental: `true`
   - (Add `dry_run: true` input if you modified the workflow)
5. Click **Run workflow**

Check the workflow logs to see what would be updated.

### Step 3: Run Real Update

When ready:

1. Go to **Actions** → **Update Template**
2. Click **Run workflow**
3. Set version to `latest` and incremental to `true`
4. Click **Run workflow**

Wait for the workflow to complete (1-10 minutes depending on versions).

### Step 4: Review the PR

The action will create a PR with:

- 📊 Summary table showing versions applied
- 📋 Version-by-version breakdown with release notes
- ⚠️ Conflict information (if any)
- ✅ Testing checklist

Review the changes and merge when satisfied.

## Common Scenarios

### Scenario 1: First-Time Setup

```bash
# Your app is on v1.5.0, latest is v1.8.0
```

**Result**: PR will show changes from v1.5.1, v1.5.2, ... v1.7.9, v1.8.0 (all versions in between)

### Scenario 2: Small Update (1-2 versions)

```bash
# Your app is on v1.7.0, latest is v1.7.2
```

**Result**: Quick update, similar speed to simple update

### Scenario 3: Large Gap (10+ versions)

```bash
# Your app is on v1.0.0, latest is v2.5.0
```

**Option 1**: Use incremental update (10-15 minutes, but very clear)
**Option 2**: Update to intermediate version first (v2.0.0), then to v2.5.0

### Scenario 4: Conflict Resolution

If conflicts occur:

```bash
# Clone the PR branch
git fetch origin
git checkout algtools/TEMPLATE-NAME-VERSION

# Review conflicting files (listed in PR)
code src/middleware/auth.ts

# Fix conflicts, test, and push
pnpm install && pnpm test && pnpm build
git add . && git commit -m "fix: resolve conflicts"
git push
```

## Troubleshooting

### "No intermediate versions found"

**Cause**: Only 1-2 versions between current and target
**Solution**: System automatically uses simple update mode (this is fine!)

### "Some versions skipped"

**Cause**: Conflicts in those versions
**Solution**: Check PR description for details, resolve manually

### "Workflow timeout"

**Cause**: Too many versions (20+)
**Solution**: Update to intermediate version first, or increase workflow timeout

### "API rate limit"

**Cause**: Too many requests without authentication
**Solution**: Use `TEMPLATE_UPDATES_TOKEN` instead of `GITHUB_TOKEN`

## Tips for Success

### 1. Keep Apps Updated

Update regularly (weekly/monthly) to avoid large version gaps:

```yaml
on:
  schedule:
    - cron: '0 0 * * 1' # Every Monday
```

### 2. Test in Dev First

For production apps:

1. Test update in dev environment
2. Review thoroughly
3. Then apply to staging/production

### 3. Review Release Notes

Each version in the PR includes release notes. **Read them!** They explain:

- What changed
- Why it changed
- Breaking changes
- Migration steps

### 4. Backup Before Major Updates

For Core template with database:

```bash
# Backup before merging major updates
wrangler d1 export DB --remote --env production > backup.sql
```

### 5. Use Dry Run for Big Updates

When updating across 5+ versions:

1. Run with dry-run first
2. Review what will change
3. Plan time for testing
4. Run actual update

## Advanced Configuration

### Custom Branch Names

```yaml
with:
  branch_name: 'template-update-my-custom-name'
```

### Custom PR Title/Body

```yaml
with:
  pr_title: 'feat: major template update'
  pr_body: 'Custom description here'
```

### Target Specific Version

```yaml
with:
  version: 'v1.8.0' # Instead of 'latest'
```

### Disable Incremental Mode

```yaml
with:
  use_incremental: false # Use simple update
```

## When to Use Incremental vs Simple

| Update Type          | Incremental             | Simple         |
| -------------------- | ----------------------- | -------------- |
| 1-2 versions ahead   | Optional                | ✅ Recommended |
| 3-5 versions ahead   | ✅ Recommended          | Optional       |
| 6+ versions ahead    | ✅ Strongly Recommended | ❌ Risky       |
| Heavy customizations | ✅ Recommended          | ❌ Risky       |
| Database migrations  | ✅ Strongly Recommended | Optional       |

## Getting Help

- **Documentation**: Check [TEMPLATE_UPDATES.md](../../bff-template/docs/TEMPLATE_UPDATES.md)
- **Workflow Logs**: Review failed action logs for detailed errors
- **PR Comments**: Ask questions in the update PR
- **Template Issues**: Report issues in template repository

---

## Next Steps

1. ✅ Set up the workflow (5 minutes)
2. ✅ Run test update (10 minutes)
3. ✅ Review and merge PR (30 minutes)
4. ✅ Enable weekly schedule (1 minute)

**Total setup time**: ~45 minutes
**Ongoing maintenance**: Automated (just review PRs)

🎉 **You're all set!**
