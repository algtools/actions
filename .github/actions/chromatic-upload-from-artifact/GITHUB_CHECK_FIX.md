# Chromatic GitHub Check Status Fix

## Issue

Chromatic visual testing uploads were succeeding but not appearing as GitHub Check statuses in pull requests. Users could see other checks (Build, Test, Lint, Deploy, etc.) but Chromatic checks were missing from the PR checks list.

## Root Cause

The `chromatic-upload-from-artifact` action was missing two critical requirements for Chromatic to create GitHub Check statuses:

1. **No Git Context**: The action wasn't checking out the repository, so Chromatic had no access to git history
2. **Missing Upload Flag**: The `--exit-once-uploaded` flag wasn't being used, which tells Chromatic to create the check status immediately

## Solution

### 1. Added Repository Checkout

Added checkout step with full git history to the action:

```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    # Chromatic needs full git history to create proper check statuses and compare builds
    fetch-depth: 0
```

**Why this is needed:**

- Chromatic uses git information to create GitHub Check runs
- Git history allows Chromatic to properly link builds to commits
- Without checkout, Chromatic operates in "anonymous" mode and can't create check statuses

### 2. Added --exit-once-uploaded Flag

Updated the Chromatic CLI command to include the `--exit-once-uploaded` flag:

```bash
npx chromatic \
  --project-token=$CHROMATIC_PROJECT_TOKEN \
  --storybook-build-dir=$STORYBOOK_DIR \
  --exit-once-uploaded  # <-- Added this flag
```

**Why this is needed:**

- Tells Chromatic to exit immediately after upload completes
- Ensures GitHub Check status is created right away
- Prevents the action from waiting for snapshot processing to complete

### 3. Added checks: write Permission

Updated workflow permissions in:

- `web-template/.github/workflows/pr-preview.yml`
- `actions/.github/workflows/preview-deploy-reusable.yml`

```yaml
permissions:
  contents: read
  pull-requests: write
  packages: read
  deployments: write
  checks: write # <-- Added this permission
```

**Why this is needed:**

- GitHub requires explicit permission for workflows to create check runs
- Without this permission, Chromatic can't write check statuses back to GitHub

## Files Changed

1. **actions/.github/actions/chromatic-upload-from-artifact/action.yml**
   - Added repository checkout with full git history
   - Added `--exit-once-uploaded` flag to Chromatic command

2. **actions/.github/actions/chromatic-upload-from-artifact/README.md**
   - Added feature documentation for GitHub Check Status
   - Added troubleshooting section for missing check statuses

3. **web-template/.github/workflows/pr-preview.yml**
   - Added `checks: write` permission

4. **actions/.github/workflows/preview-deploy-reusable.yml**
   - Added `checks: write` permission

## Testing

After these changes, Chromatic checks should now appear in the GitHub PR checks list alongside other checks like:

- ✓ Build and Test / Build (pull_request)
- ✓ Build and Test / Test (pull_request)
- ✓ Build and Test / Lint & Format (pull_request)
- ✓ Deploy PR Preview / Deploy Preview (pull_request)
- ✓ **Deploy PR Preview / Upload to Chromatic (pull_request)** ← Now visible!

## Benefits

1. **Better Visibility**: Chromatic status is now visible directly in PR without needing to check comments
2. **Branch Protection**: Can now require Chromatic checks before merging PRs
3. **Status Badges**: Chromatic status appears in PR status badges
4. **Integrated Experience**: Chromatic checks work like any other GitHub Action check

## Related Issues

This fix addresses a common issue where Chromatic uploads succeed but users don't see the check status in their PR. This typically manifests as:

- Chromatic build link works in PR comments
- Chromatic dashboard shows successful builds
- But no Chromatic check appears in the PR checks section

## Migration Notes

**For Existing Projects:**

If you're using the `chromatic-upload-from-artifact` action, you don't need to make any changes! The action now handles everything automatically.

Just ensure your workflow has the `checks: write` permission:

```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write # Make sure this is present
```

**No Breaking Changes:**

All changes are backward compatible. Existing workflows will continue to work and will now automatically get the benefit of visible GitHub Check statuses.

## References

- [Chromatic CLI Documentation](https://www.chromatic.com/docs/cli)
- [GitHub Checks API](https://docs.github.com/en/rest/checks)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions)
