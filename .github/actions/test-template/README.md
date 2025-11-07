# Test Template Action

A composite GitHub Action that tests template packaging and provision regression. This action validates that templates are properly packaged, extract correctly, and contain the expected files and workflows for provisioned applications.

## Features

- 📦 **Template Packaging Tests**: Validates template packaging scripts
- 🔍 **Structure Validation**: Verifies extracted template structure
- ✅ **Workflow Verification**: Ensures correct workflows are included/excluded
- 🧪 **Provision Regression**: Tests that provisioned apps have correct structure
- 🚀 **Integrated Testing**: Runs as part of the main test job

## Usage

### Basic Example

```yaml
- name: Test template
  uses: algtools/actions/.github/actions/test-template@main
  with:
    working_directory: '.'
```

### In Build-Test-Artifact Workflow

This action is typically used through the `build-test-artifact-reusable` workflow:

```yaml
jobs:
  build:
    name: Build and Test
    uses: algtools/actions/.github/workflows/build-test-artifact-reusable.yml@main
    with:
      test_cmd: 'pnpm test'
      lint_cmd: 'pnpm lint && pnpm format:check'
      type_check_cmd: 'pnpm type-check'
      build_cmd: 'pnpm build'
      working_directory: '.'
      output_dir: 'dist'

      # Enable template testing
      enable_template_tests: true

      artifact_name: 'build-${{ github.sha }}'
      artifact_paths: 'dist'
      retention_days: 7
```

### Standalone Usage

```yaml
name: Test Template

on:
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test Template
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Test template
        uses: algtools/actions/.github/actions/test-template@main
        with:
          working_directory: '.'
```

## Inputs

| Input               | Description                       | Required | Default |
| ------------------- | --------------------------------- | -------- | ------- |
| `working_directory` | Directory containing the template | No       | `"."`   |

## What It Tests

### 1. Template Packaging

Runs the template packaging tests if available:

- Executes `test:template-packaging` script if defined
- Validates packaging process

### 2. Template Pack

Packages the template using `template:pack`:

- Creates template tarball
- Verifies tarball creation
- Validates tarball contents

### 3. Template Extraction

Extracts and validates the template:

- Extracts tarball to test directory
- Finds extracted package
- Validates directory structure

### 4. Provisioned App Structure

Validates that the extracted template has correct structure:

- ✅ **Should have**: `release-app.yml` workflow
- ✅ **Should have**: Deployment workflows (deploy-dev, deploy-qa, deploy-prod)
- ✅ **Should have**: `appPack.ts` script
- ✅ **Should have**: `app:pack` npm script
- ✅ **Should have**: `src/` directory
- ❌ **Should NOT have**: `release-template.yml` workflow
- ❌ **Should NOT have**: `retry-release.yml` workflow
- ❌ **Should NOT have**: `provision-template.yml` workflow
- ❌ **Should NOT have**: Template build scripts (templateWrap.ts, templateTokenize.ts, etc.)

### 5. Workflow Verification

Ensures correct workflows are included/excluded:

- Verifies application workflows are present
- Verifies template-specific workflows are excluded
- Validates workflow configuration

## How It Works

1. **Setup Environment**: Installs Node.js and pnpm
2. **Install Dependencies**: Runs `pnpm install --frozen-lockfile`
3. **Run Packaging Tests**: Executes template packaging tests if available
4. **Package Template**: Runs `pnpm run template:pack`
5. **Extract Archive**: Extracts the generated tarball
6. **Validate Structure**: Runs validation script on extracted template
7. **Verify Workflows**: Checks workflow files are correct
8. **Cleanup**: Removes test extraction directory

## Template Requirements

For this action to work properly, your template should:

### 1. Have Packaging Scripts

```json
{
  "scripts": {
    "template:pack": "tsx scripts/templatePack.ts",
    "test:template-packaging": "tsx scripts/testTemplatePackaging.ts"
  }
}
```

### 2. Create Template Tarball

The `template:pack` script should:

- Create a tarball in `template-dist/` directory
- Name format: `{template-name}-v{version}.tgz`
- Include all necessary files

### 3. Have Correct Workflows

Templates should include:

- **For Apps**: `release-app.yml`, deployment workflows
- **Not For Apps**: `release-template.yml`, `provision-template.yml`

### 4. Have Proper Scripts

Provisioned apps should have:

- `appPack.ts` for application packaging
- No template build scripts

## Example Validation Output

```
🔍 Validating provisioned app structure at: .test-extract

✅ Has release-app.yml workflow
✅ Does NOT have release-template.yml
✅ Does NOT have retry-release.yml
✅ Does NOT have provision-template.yml
✅ Has appPack.ts script
✅ Does NOT have templateWrap.ts
✅ Does NOT have templateTokenize.ts
✅ Does NOT have templatePack.ts
✅ Does NOT have templateRelease.ts
✅ Has app:pack script in package.json
✅ Has deploy-dev.yml workflow
✅ Has deploy-qa.yml workflow
✅ Has deploy-prod.yml workflow
✅ Has src/ directory

==================================================
✅ Passed: 14
❌ Failed: 0
==================================================

✅ All validations passed!
```

## Troubleshooting

### No Tarball Found

```
❌ No tarball found in template-dist/
```

**Solution**: Ensure `template:pack` script creates tarball in `template-dist/` directory.

### Package.json Not Found

```
❌ Could not find extracted directory with package.json
```

**Solution**: Verify tarball contains package.json at root or in subdirectory.

### Validation Failed

```
❌ Should NOT have release-template.yml
```

**Solution**: Ensure template packaging excludes template-specific workflows.

### Missing Scripts

```
❌ Missing app:pack script in package.json
```

**Solution**: Add required scripts to package.json in the template.

## Integration with CI/CD

This action integrates seamlessly with the build-test-artifact workflow:

```yaml
# In deploy-dev.yml, deploy-qa.yml, deploy-prod.yml, pr-preview.yml
jobs:
  build:
    uses: algtools/actions/.github/workflows/build-test-artifact-reusable.yml@main
    with:
      # ... other configuration ...
      enable_template_tests: true
```

This ensures template tests run automatically with every build, providing continuous validation of template packaging.

## Related

- [Build Test Artifact Reusable Workflow](../../workflows/build-test-artifact-reusable.yml)
- [Template System Documentation](../../../README.md)
- [Provision Template Action](../provision-template/README.md)
