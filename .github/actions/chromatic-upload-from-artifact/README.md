# Upload Storybook to Chromatic from Artifact

A composite GitHub Action that uploads a pre-built Storybook to Chromatic from an already uploaded artifact. This action enables secure visual regression testing without rebuilding Storybook in the trusted deployment job.

## Features

- 🎨 **Artifact-Based Upload**: Upload Storybook from pre-built artifacts stored in GitHub Actions
- 🔒 **Secure Token Handling**: Automatic masking of Chromatic project tokens
- 📊 **Detailed Logging**: Comprehensive upload information with security-filtered output
- ✅ **Pre-Upload Validation**: Validates artifacts and Storybook contents before upload
- 🔗 **Build URL Output**: Extracts and provides the Chromatic build URL for downstream steps
- ⚡ **No Rebuild Required**: Uses existing Storybook build, saving time and resources
- 🛡️ **Exit Zero Option**: Optionally continue workflow even if visual changes are detected

## Usage

### Basic Example

```yaml
- name: Upload Storybook to Chromatic
  uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
  with:
    artifact_name: 'storybook-build'
    project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### Complete Build and Upload Workflow

```yaml
name: Build and Upload Storybook to Chromatic

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  actions: write

jobs:
  build-storybook:
    name: Build Storybook
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: algtools/actions/.github/actions/setup-node@v1
        with:
          node-version: '20'

      - name: Build Storybook without secrets
        uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build-storybook'
          output_dir: 'storybook-static'

      - name: Upload Storybook artifacts
        uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'storybook-${{ github.event.pull_request.number }}'
          artifact_paths: 'storybook-static'
          retention_days: '30'

  chromatic-upload:
    name: Upload to Chromatic
    needs: build-storybook
    runs-on: ubuntu-latest
    steps:
      - name: Upload to Chromatic from artifact
        id: chromatic
        uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
        with:
          artifact_name: 'storybook-${{ github.event.pull_request.number }}'
          project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}

      - name: Comment PR with Chromatic link
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🎨 **Chromatic Build Ready!**\n\nView your visual changes: ${{ steps.chromatic.outputs.chromatic_url }}`
            })
```

### PR Preview with Chromatic

```yaml
name: PR Preview with Chromatic

on:
  pull_request:
    branches: [main]

jobs:
  build-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for Chromatic

      - uses: algtools/actions/.github/actions/setup-node@v1
        with:
          node-version: '20'

      - name: Build Storybook
        run: npm run build-storybook

      - name: Upload Storybook artifact
        uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'storybook-pr-${{ github.event.pull_request.number }}'
          artifact_paths: 'storybook-static'

      - name: Upload to Chromatic
        id: chromatic
        uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
        with:
          artifact_name: 'storybook-pr-${{ github.event.pull_request.number }}'
          project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exit_zero_on_changes: 'true'

      - name: Output build details
        run: |
          echo "Chromatic Build URL: ${{ steps.chromatic.outputs.chromatic_url }}"
          echo "Build Status: ${{ steps.chromatic.outputs.build_status }}"
```

### Custom Storybook Directory

```yaml
- name: Upload to Chromatic with custom directory
  uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
  with:
    artifact_name: 'storybook-build'
    project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
    storybook_dir: 'build/storybook'
    working_dir: './frontend'
```

### Zipped Artifact Upload

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Storybook
        run: npm run build-storybook

      - name: Create zip archive
        run: |
          cd storybook-static
          zip -r ../storybook.zip .
          cd ..

      - name: Upload zip artifact
        uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'storybook-archive'
          artifact_paths: 'storybook.zip'

  chromatic:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Upload to Chromatic
        uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
        with:
          artifact_name: 'storybook-archive'
          project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          # Action automatically detects and extracts zip files
```

## Inputs

| Input                  | Description                                              | Required | Default                |
| ---------------------- | -------------------------------------------------------- | -------- | ---------------------- |
| `artifact_name`        | Name of the artifact containing the built Storybook      | Yes      | -                      |
| `project_token`        | Chromatic project token (from repo/org secrets)          | Yes      | -                      |
| `working_dir`          | Directory where to run the chromatic command             | No       | `.`                    |
| `storybook_dir`        | Directory path where Storybook will be extracted/located | No       | `.out/storybook`       |
| `exit_zero_on_changes` | Do not fail if visual changes occur (exit with code 0)   | No       | `true`                 |
| `download_path`        | Directory path where the artifact will be downloaded     | No       | `./storybook-artifact` |

### Input Details

#### `artifact_name`

The name of the GitHub Actions artifact that contains your built Storybook. This should match the artifact name used in the `upload-artifacts` action.

**Examples:**

- `'storybook-build'`
- `'storybook-${{ github.sha }}'`
- `'storybook-pr-${{ github.event.pull_request.number }}'`

The artifact can contain either:

- A directory with Storybook static files
- A `.zip` file containing the Storybook (automatically extracted)

#### `project_token`

Your Chromatic project token. This should always be stored as a GitHub secret.

**Setup:**

1. Go to your Chromatic project settings
2. Navigate to "Manage" → "Configure"
3. Copy the project token
4. Add to GitHub repository secrets as `CHROMATIC_PROJECT_TOKEN`

**Usage:**

```yaml
project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

⚠️ **Never hardcode tokens in your workflow files!**

#### `working_dir`

The working directory where the Chromatic command will be executed. Useful for monorepos or when your Storybook is in a subdirectory.

**Example for monorepo:**

```yaml
working_dir: './packages/ui-components'
```

#### `storybook_dir`

The directory path (relative to `working_dir`) where Storybook files will be extracted or are located. This is passed to Chromatic's `--storybook-build-dir` flag.

**Default:** `.out/storybook`

**Examples:**

- `'storybook-static'` (common Storybook build output)
- `'build/storybook'`
- `'.storybook-out'`

#### `exit_zero_on_changes`

When set to `true`, the workflow will not fail even if Chromatic detects visual changes. This is useful for PR workflows where you want to see the changes without blocking the CI pipeline.

**Default:** `true`

Set to `false` if you want the workflow to fail when visual changes are detected:

```yaml
exit_zero_on_changes: 'false'
```

#### `download_path`

The directory where the artifact will be downloaded before processing. This is a temporary location used internally by the action.

**Default:** `./storybook-artifact`

## Outputs

| Output          | Description                                           |
| --------------- | ----------------------------------------------------- |
| `chromatic_url` | URL of the Chromatic build for viewing visual changes |
| `build_status`  | Status of the upload: `success` or `failure`          |

### Using Outputs

```yaml
- name: Upload to Chromatic
  id: chromatic
  uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
  with:
    artifact_name: 'storybook-build'
    project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}

- name: Add job summary
  run: |
    echo "## Chromatic Build" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "Status: ${{ steps.chromatic.outputs.build_status }}" >> $GITHUB_STEP_SUMMARY
    echo "URL: ${{ steps.chromatic.outputs.chromatic_url }}" >> $GITHUB_STEP_SUMMARY

- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `🎨 Chromatic build complete!\n\n[View changes](${{ steps.chromatic.outputs.chromatic_url }})`
      })
```

## Detailed Logging

The action provides comprehensive logging throughout the upload process:

### Input Validation

- Validates all required inputs
- Displays configuration (with sensitive data masked)
- Shows directory paths and settings

### Artifact Verification

- Lists downloaded artifact contents
- Shows file count and structure
- Verifies Storybook files exist

### Storybook Preparation

- Automatically detects and extracts zip files
- Shows extraction progress
- Lists Storybook directory contents

### Chromatic Upload

- Executes Chromatic CLI with proper token masking
- Captures and displays upload progress
- Extracts and displays build URL

### Security Features

- Automatically masks project tokens in all logs
- Filters sensitive information from Chromatic output
- Redacts credentials from error messages

### Example Log Output

```
==================================
🎨 Chromatic Upload Complete
==================================

Chromatic Build Details:
  Status: success
  Build URL: https://www.chromatic.com/build?appId=abc123&number=456

Artifact Details:
  Source artifact: storybook-pr-42
  Storybook directory: .out/storybook
  Working directory: .

Security:
  ✓ Project token redacted from logs
  ✓ Upload from verified artifact
  ✓ No secrets exposed

✓ Upload completed successfully
```

## Use Cases

### Secure PR Visual Reviews

Upload Storybook for pull request visual reviews without exposing secrets in the build environment:

```yaml
name: PR Visual Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  build:
    name: Build Storybook
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build-storybook
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'storybook-pr-${{ github.event.pull_request.number }}'
          artifact_paths: 'storybook-static'

  chromatic:
    name: Chromatic Upload
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
        id: chromatic
        with:
          artifact_name: 'storybook-pr-${{ github.event.pull_request.number }}'
          project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}

      - name: Comment with Chromatic link
        uses: actions/github-script@v7
        with:
          script: |
            const url = '${{ steps.chromatic.outputs.chromatic_url }}';
            const body = `## 🎨 Visual Review Ready\n\n[View Chromatic build](${url})`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

### Main Branch Visual Baseline

Update visual baseline on main branch merges:

```yaml
name: Update Visual Baseline

on:
  push:
    branches: [main]

jobs:
  build-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build-storybook

      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'storybook-main-${{ github.sha }}'
          artifact_paths: 'storybook-static'

      - uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
        with:
          artifact_name: 'storybook-main-${{ github.sha }}'
          project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exit_zero_on_changes: 'false' # Fail if unexpected changes
```

### Monorepo Multi-Package Upload

Upload Storybooks from multiple packages in a monorepo:

```yaml
name: Monorepo Chromatic Upload

on:
  pull_request:

jobs:
  build-ui-lib:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm run build-storybook --workspace=@myapp/ui-lib
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'storybook-ui-lib'
          artifact_paths: 'packages/ui-lib/storybook-static'

  build-components:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm run build-storybook --workspace=@myapp/components
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'storybook-components'
          artifact_paths: 'packages/components/storybook-static'

  chromatic-ui-lib:
    needs: build-ui-lib
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
        with:
          artifact_name: 'storybook-ui-lib'
          project_token: ${{ secrets.CHROMATIC_TOKEN_UI_LIB }}

  chromatic-components:
    needs: build-components
    runs-on: ubuntu-latest
    steps:
      - uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
        with:
          artifact_name: 'storybook-components'
          project_token: ${{ secrets.CHROMATIC_TOKEN_COMPONENTS }}
```

## Required Permissions

```yaml
permissions:
  contents: read
  actions: write # Required for downloading artifacts
```

If you want to comment on PRs with the Chromatic URL:

```yaml
permissions:
  contents: read
  actions: write
  pull-requests: write # Required for PR comments
```

## Security Best Practices

1. **Store Tokens as Secrets**: Never hardcode Chromatic project tokens

   ```yaml
   project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
   ```

2. **Separate Build and Upload**: Build Storybook in a clean environment without secrets

   ```yaml
   jobs:
     build: # No secrets here
       - run: npm run build-storybook
     chromatic: # Secrets only in upload
       - uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
   ```

3. **Use Artifact-Based Workflow**: Prevents secret exposure in untrusted build environments

   ```yaml
   # Build job (untrusted, e.g., from fork PRs)
   build:
     - run: npm run build-storybook
     - uses: upload-artifacts

   # Upload job (trusted, with secrets)
   chromatic:
     - uses: chromatic-upload-from-artifact
   ```

4. **Enable Token Masking**: The action automatically masks tokens, but verify logs don't expose secrets

5. **Limit Artifact Retention**: Set appropriate retention days to minimize storage
   ```yaml
   retention_days: '30'
   ```

## Troubleshooting

### Artifact Not Found

**Error:** "Artifact not found: storybook-build"

**Solution:** Ensure the artifact name matches exactly between upload and download:

```yaml
# Build job
- uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'storybook-build' # ✅

# Chromatic job
- uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
  with:
    artifact_name: 'storybook-build' # ✅ Must match
```

### No Storybook Files Found

**Error:** "No files found in Storybook directory"

**Solution:** Verify your Storybook build output directory:

```yaml
# Check your Storybook build output
- run: npm run build-storybook
  # Usually outputs to: storybook-static

- uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'storybook-build'
    artifact_paths: 'storybook-static' # ✅ Match build output
```

### Invalid Chromatic Token

**Error:** "Authentication failed" or "Invalid project token"

**Solution:**

1. Verify token is correct in Chromatic dashboard
2. Ensure secret is properly set in GitHub repository settings
3. Check secret name matches workflow:
   ```yaml
   project_token: ${{ secrets.CHROMATIC_PROJECT_TOKEN }} # Exact name
   ```

### Chromatic Build URL Not Extracted

**Issue:** Build succeeds but URL shows default value

**Solution:** The URL extraction uses pattern matching on Chromatic CLI output. Check the action logs for the actual Chromatic output. The build should still be visible in your Chromatic dashboard.

### Zip Extraction Fails

**Error:** "Failed to extract zip file"

**Solution:** Ensure zip file is properly created:

```yaml
- name: Create zip correctly
  run: |
    cd storybook-static
    zip -r ../storybook.zip .  # ✅ Create from inside directory
```

### Working Directory Issues

**Error:** "Directory not found" or "Cannot find Storybook files"

**Solution:** Ensure paths are relative to working_dir:

```yaml
- uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
  with:
    working_dir: './frontend'
    storybook_dir: 'storybook-static' # Relative to ./frontend
```

## Compatibility

- ✅ Linux runners (ubuntu-latest, ubuntu-22.04, ubuntu-20.04)
- ✅ macOS runners (macos-latest, macos-13, macos-12)
- ✅ Windows runners (windows-latest, windows-2022, windows-2019)

## Differences from Direct Chromatic CLI

| Feature                  | Direct Chromatic CLI | This Action      |
| ------------------------ | -------------------- | ---------------- |
| Upload from source       | ✅                   | ❌               |
| Upload from artifact     | ❌                   | ✅               |
| Automatic token masking  | ❌                   | ✅               |
| Pre-upload validation    | ❌                   | ✅               |
| Detailed logging         | ⚠️ Basic             | ✅ Comprehensive |
| Artifact verification    | ❌                   | ✅               |
| Security-filtered output | ❌                   | ✅               |
| Zip file support         | ❌                   | ✅               |
| Build URL output         | ⚠️ Manual            | ✅ Automatic     |

## Related Actions

- [`build-no-secrets`](../build-no-secrets/README.md): Build projects without exposing secrets
- [`upload-artifacts`](../upload-artifacts/README.md): Upload build artifacts with detailed logging
- [`setup-node`](../setup-node/README.md): Set up Node.js environment

## Workflow Integration

This action is designed to work seamlessly with other algtools actions:

```yaml
# Complete secure Storybook + Chromatic pipeline
jobs:
  build:
    steps:
      - uses: algtools/actions/.github/actions/setup-node@v1
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build-storybook'
      - uses: algtools/actions/.github/actions/upload-artifacts@v1

  chromatic:
    steps:
      - uses: algtools/actions/.github/actions/chromatic-upload-from-artifact@v1
```

## Chromatic Features Supported

This action supports most Chromatic features through npx chromatic:

- ✅ Visual regression testing
- ✅ Component baselines
- ✅ UI Review workflow
- ✅ Build comparisons
- ✅ TurboSnap (if configured in project)
- ✅ Multiple baselines
- ✅ Linked projects
- ❌ Git information (requires checkout in upload job if needed)

## Advanced Configuration

### With Additional Chromatic Flags

While the action provides the most common options, you can fork and customize it to add additional Chromatic CLI flags if needed. The core command is:

```bash
npx chromatic \
  --project-token=$CHROMATIC_PROJECT_TOKEN \
  --storybook-build-dir=$STORYBOOK_DIR \
  --exit-zero-on-changes
```

Common additional flags you might want:

- `--auto-accept-changes`: Automatically accept all changes
- `--only-changed`: Only test changed stories (requires git)
- `--branch-name`: Specify branch name
- `--patch-build`: Mark as patch build

## License

MIT License - see [LICENSE](../../../LICENSE) for details

## Support

For questions or issues:

- 📖 [Chromatic Documentation](https://www.chromatic.com/docs/)
- 🐛 [Report an issue](https://github.com/algtools/actions/issues)
- 💬 [Discussions](https://github.com/algtools/actions/discussions)
