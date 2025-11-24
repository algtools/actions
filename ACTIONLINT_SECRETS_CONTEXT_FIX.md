# Actionlint Secrets Context Error - Fix Summary

## Issue

Actionlint was reporting errors like:

```
.github/workflows/deploy-dev.yml:221:50: context "secrets" is not allowed here.
available contexts are "github", "inputs", "matrix", "needs", "strategy", "vars"
```

## Root Cause

The documentation was showing **invalid examples** that attempted to use the `secrets` context in the `with:` block when calling reusable workflows. This violates GitHub Actions security restrictions.

### The Problem

**GitHub Actions has different context availability rules:**

| Location                           | Can Use `secrets` Context? |
| ---------------------------------- | -------------------------- |
| Within job steps (calling actions) | ✅ Yes                     |
| Reusable workflow `with:` block    | ❌ No                      |
| Reusable workflow `secrets:` block | ✅ Yes                     |

### Invalid Pattern (Was in Documentation)

```yaml
jobs:
  deploy:
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      # ❌ ERROR: Cannot use secrets context in with: block
      secrets_json: ${{ toJSON({
        "OPENAI_API_KEY": secrets.OPENAI_API_KEY,
        "DATABASE_URL": secrets.DATABASE_URL
      }) }}
    secrets:
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**Why this fails:** When calling a reusable workflow at the `jobs:` level, only these contexts are available in the `with:` block: `github`, `inputs`, `matrix`, `needs`, `strategy`, `vars`. The `secrets` context is intentionally excluded.

## Changes Made

### 1. Fixed `actions/README.md`

**Before:**

- Showed examples using `secrets` context in `with:` block
- Claimed `toJSON()` would fix actionlint errors (it doesn't for reusable workflows)
- Encouraged using `secrets_json` with secrets

**After:**

- Removed invalid `secrets_json` examples with `secrets` context
- Added clear warnings about the restriction
- Added new **Troubleshooting** section explaining the error
- Updated documentation to clarify `secrets_json`/`vars_json` are advanced/internal features
- Added context availability table

### 2. Fixed `actions/.github/actions/deploy-cloudflare-from-artifact/README.md`

**Before:**

- Claimed actionlint errors could be fixed by using `toJSON()`
- Didn't distinguish between actions and reusable workflows

**After:**

- Clarified the difference between calling **actions** vs **reusable workflows**
- Explained when `secrets` context CAN be used (in action inputs)
- Explained when it CANNOT be used (in reusable workflow `with:` blocks)
- Added note to "Complete Build and Deploy Workflow" section

### 3. Template Workflows

**Verified:** All template workflows (web-template, core-template, bff-template) correctly pass secrets through the `secrets:` block, not through `secrets_json` in the `with:` block.

No changes needed to template workflows - they were already correct.

## Solution for Users

If you're getting this error in your provisioned apps, update your workflows to follow this pattern:

### ✅ Correct Pattern

```yaml
jobs:
  deploy:
    uses: algtools/actions/.github/workflows/env-deploy-reusable.yml@main
    with:
      environment: 'production'
      slug: '${{ vars.SLUG }}'
      app_name: 'my-app'
      artifact_name: 'production-build'
      # ... other inputs (NO secrets here)
    secrets:
      # ✅ Pass secrets through secrets: block
      cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### What About `secrets_json` and `vars_json`?

**For reusable workflows:**

- ❌ Do NOT use `secrets_json` with secrets - leave it as default `{}`
- ✅ You CAN use `vars_json` with the `vars` context (not `secrets`)

```yaml
with:
  # ✅ This works - vars context IS allowed
  vars_json: ${{ toJSON({
    "ENVIRONMENT": vars.ENVIRONMENT,
    "API_URL": vars.API_URL
  }) }}
```

**For direct action calls in steps:**

- ✅ You CAN use both `secrets_json` and `vars_json` with `secrets`/`vars` contexts

```yaml
steps:
  - uses: algtools/actions/.github/actions/deploy-cloudflare-from-artifact@main
    with:
      # ✅ This works when calling an action directly
      secrets_json: ${{ toJSON({
        "KEY": secrets.MY_SECRET
      }) }}
```

## References

- [GitHub Docs: Context Availability](https://docs.github.com/en/actions/learn-github-actions/contexts#context-availability)
- [GitHub Docs: Reusing Workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- See `actions/README.md` Troubleshooting section for full details

## Additional Issue: Action Definition Template Expressions

After fixing the documentation, another error was discovered in the action definition itself:

```
Error: algtools/actions/main/.github/actions/deploy-cloudflare-from-artifact/action.yml (Line: 46, Col: 18):
Unrecognized named-value: 'secrets'. Located at position 1 within expression: secrets.GITHUB_SECRET_NAME
```

### Root Cause

The `action.yml` file had template expressions in the description fields:

```yaml
secrets_json:
  description: 'Example: {"SECRET_NAME": "${{ secrets.GITHUB_SECRET_NAME }}"}' # ❌ ERROR
```

GitHub Actions tries to evaluate `${{ ... }}` expressions when loading action definitions, but the `secrets` and `vars` contexts aren't available during this phase. These were just meant to be documentation examples, not actual template expressions.

### Fix

Changed the descriptions to use plain text examples instead:

```yaml
secrets_json:
  description: 'Example: {"SECRET_NAME": "value_from_secret"}' # ✅ Fixed
vars_json:
  description: 'Example: {"VAR_NAME": "value_from_var"}' # ✅ Fixed
```

## Files Changed

- `actions/README.md` - Fixed examples, added troubleshooting section
- `actions/.github/actions/deploy-cloudflare-from-artifact/README.md` - Clarified action vs workflow usage
- `actions/.github/actions/deploy-cloudflare-from-artifact/action.yml` - Fixed invalid template expressions in descriptions
- `actions/ACTIONLINT_SECRETS_CONTEXT_FIX.md` - This summary document
