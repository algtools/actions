# Template Workflows Added

## Summary

Added the **Incremental Template Update** workflow to all three templates so that provisioned apps will have it available out of the box.

## Files Created

1. ✅ `bff-template/.github/workflows/template-update-incremental.yml`
2. ✅ `core-template/.github/workflows/template-update-incremental.yml`
3. ✅ `web-template/.github/workflows/template-update-incremental.yml`

## What This Means

### For New Apps (Provisioned After This Change)

When you provision a new app from any template, it will automatically include the incremental update workflow. Users can:

1. Go to **Actions** tab in their app
2. Select **Update Template (Incremental)**
3. Click **Run workflow**
4. Choose options:
   - **Version**: `latest` or specific (e.g., `v1.8.2`)
   - **Use incremental**: `true` (recommended) or `false`
   - **Dry run**: `true` (test first) or `false`
5. Review the PR created

### For Existing Apps (Already Provisioned)

Existing apps need to manually add the workflow file. Users can:

**Option 1: Copy from template**

- Go to the template repository
- Copy `.github/workflows/template-update-incremental.yml`
- Add it to their app
- Commit and push

**Option 2: Create manually** (see Quick Start guide in the action README)

## Workflow Features

Each workflow includes:

### ✅ Manual Triggers

- Run on-demand from Actions tab
- Configurable version, incremental mode, and dry-run

### ✅ Scheduled Updates (Optional)

- Runs weekly on Monday at 00:00 UTC
- Can be disabled by removing the `schedule` section

### ✅ Smart Defaults

- Uses `TEMPLATE_UPDATES_TOKEN` if available (for cross-org)
- Falls back to `GITHUB_TOKEN`
- Incremental mode enabled by default
- Targets correct source template automatically

### ✅ Template-Specific Configurations

**BFF Template:**

- Base branch: `main`
- Standard update workflow

**Core Template:**

- Base branch: `dev` (common for Core apps)
- Extra summary notes about database migrations
- Reminds users to test migrations locally

**Web Template:**

- Base branch: `main`
- Standard update workflow

## How Users Trigger It

### First Time (Dry Run Recommended)

```bash
# 1. Go to GitHub repository
# 2. Click "Actions" tab
# 3. Select "Update Template (Incremental)"
# 4. Click "Run workflow"
# 5. Set:
#    - Version: latest
#    - Use incremental: true
#    - Dry run: true
# 6. Click "Run workflow"
# 7. Review results in workflow logs
```

### Real Update

```bash
# Same steps, but set:
#    - Dry run: false
#
# This will create a PR with version-by-version changes
```

### Automatic Weekly Updates

If schedule is enabled (default), the workflow runs every Monday at midnight UTC automatically. It will:

1. Check for new template versions
2. Create PR if updates available
3. Skip if already on latest

Users can disable by:

- Removing the `schedule:` section from the workflow, or
- Disabling the workflow in GitHub Actions UI

## Next Steps

### To Deploy These Changes

1. **Commit the workflow files** to each template:

   ```bash
   git add bff-template/.github/workflows/template-update-incremental.yml
   git add core-template/.github/workflows/template-update-incremental.yml
   git add web-template/.github/workflows/template-update-incremental.yml
   git commit -m "feat: add incremental template update workflow"
   git push
   ```

2. **Create new template releases** (optional but recommended):
   - Tag the templates with new versions
   - Include in release notes: "Added incremental template update workflow"

3. **Notify users**:
   - Existing apps can manually add the workflow
   - New provisions will have it automatically

### To Use in Existing Apps

**For already provisioned apps**, users should:

1. Copy the workflow file from their template
2. Or create manually (see QUICK_START.md)
3. Commit and push
4. Trigger from Actions tab

## Testing

Before releasing, you can test by:

1. **Provision a test app** from updated template
2. **Verify workflow appears** in Actions tab
3. **Run dry-run** to test functionality
4. **Check PR generation** with real run

## Documentation References

- **Action README**: `actions/update-provisioned-app-incremental/README.md`
- **Quick Start**: `actions/update-provisioned-app-incremental/QUICK_START.md`
- **Implementation**: `actions/update-provisioned-app-incremental/IMPLEMENTATION_SUMMARY.md`
- **Template Docs**:
  - `bff-template/docs/TEMPLATE_UPDATES.md`
  - `core-template/docs/TEMPLATE_UPDATES.md`

---

## Example: What Users See

After provisioning an app, when they go to **Actions** tab, they'll see:

```
Workflows
├── Build and Deploy
├── Run Tests
├── Update Template (Incremental)  ← NEW!
└── ... other workflows
```

Click on it → **Run workflow** → Fill options → **Run**

That's it! The incremental update system takes care of the rest.

---

**Status**: ✅ Workflows added to all three templates
**Ready for**: Commit and push to template repositories
**User Impact**: Significantly easier template updates for all provisioned apps
