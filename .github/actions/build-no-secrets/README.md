# Build Without Secrets Action

A composite GitHub Action that builds a project in a clean, secure environment without exposing secrets. This action is designed for PR previews, public builds, or any scenario where you need to ensure sensitive information is not leaked during the build process.

## Features

- 🔒 **Secure Build Environment**: Filters out all sensitive environment variables
- 🚫 **No Secret Exposure**: Prevents secrets from appearing in build logs
- 📦 **Deterministic Builds**: Produces reproducible artifacts in a clean environment
- ✅ **Validation**: Automatically validates inputs and outputs
- 📊 **Build Metrics**: Provides size and path information about build artifacts

## Usage

### Basic Example

```yaml
- name: Build project without secrets
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npm run build'
    output_dir: 'dist'
```

### Advanced Example

```yaml
- name: Checkout repository
  uses: actions/checkout@v4

- name: Setup Node.js
  uses: algtools/actions/.github/actions/setup-node@v1
  with:
    node-version: '20'

- name: Build without secrets
  id: build
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npm run build'
    working_dir: './packages/frontend'
    output_dir: 'dist'

- name: Display build info
  run: |
    echo "Build status: ${{ steps.build.outputs.build_status }}"
    echo "Output path: ${{ steps.build.outputs.output_path }}"
    echo "Artifact size: ${{ steps.build.outputs.artifact_size }}"
```

### With TypeScript

```yaml
- name: Build TypeScript project
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npx tsc'
    working_dir: '.'
    output_dir: 'dist'
```

### With Custom Build Tool

```yaml
- name: Build with Vite
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npx vite build'
    working_dir: './web'
    output_dir: 'web/dist'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `build_cmd` | Build command to execute (e.g., "npm run build", "tsc", "yarn build") | Yes | - |
| `working_dir` | Working directory where the build command will be executed | No | `.` |
| `output_dir` | Directory where build output/artifacts will be produced (e.g., "dist", "build") | Yes | - |

## Outputs

| Output | Description |
|--------|-------------|
| `build_status` | Status of the build (success or failure) |
| `output_path` | Absolute path to the build output directory |
| `artifact_size` | Size of the build artifacts in bytes |

## Security Features

This action implements several security measures:

1. **Environment Filtering**: Filters out all sensitive environment variables including:
   - `GITHUB_TOKEN`
   - `GITHUB_SECRET`
   - Any variable containing `_TOKEN`
   - Any variable containing `_KEY`
   - Any variable containing `_PASSWORD`

2. **Clean Build Environment**: Only exposes safe environment variables:
   - `NODE_ENV=production`
   - `CI=true`

3. **No Secret Leakage**: Build logs are carefully filtered to prevent accidental secret exposure

4. **Validation**: Validates all inputs and outputs to ensure build integrity

## Use Cases

### PR Previews

Build pull request previews without exposing production secrets:

```yaml
name: PR Preview Build

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: algtools/actions/.github/actions/setup-node@v1
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build:preview'
          output_dir: 'dist'
```

### Public Artifact Builds

Create public-facing builds that are safe to share:

```yaml
- name: Build public artifact
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npm run build'
    output_dir: 'public'

- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: public-build
    path: public
```

### Secure Documentation Builds

Build documentation sites without exposing internal secrets:

```yaml
- name: Build docs
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npm run docs:build'
    output_dir: 'docs/.vitepress/dist'
```

## Required Permissions

```yaml
permissions:
  contents: read
```

## Compatibility

- ✅ Linux runners (ubuntu-latest)
- ✅ macOS runners (macos-latest)
- ✅ Windows runners (windows-latest)

## Best Practices

1. **Always specify output_dir**: Ensure your build command creates files in a predictable location
2. **Use with setup-node**: Combine with the `setup-node` action for Node.js projects
3. **Validate builds locally**: Test your build command locally before using in CI
4. **Monitor artifact size**: Use the `artifact_size` output to track build output size over time

## Troubleshooting

### Build fails with "Output directory does not exist"

Ensure your build command actually creates the directory specified in `output_dir`:

```yaml
# Bad: output_dir doesn't match build output
build_cmd: 'npm run build'  # Creates 'dist' folder
output_dir: 'build'  # ❌ Wrong directory

# Good: output_dir matches build output
build_cmd: 'npm run build'  # Creates 'dist' folder
output_dir: 'dist'  # ✅ Correct
```

### Build fails with "Working directory does not exist"

Make sure to checkout the repository first and that the path exists:

```yaml
- name: Checkout
  uses: actions/checkout@v4

- name: Build
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npm run build'
    working_dir: '.'  # Ensure this path exists
    output_dir: 'dist'
```

### Build command not found

Install dependencies before running the build:

```yaml
- name: Setup Node.js
  uses: algtools/actions/.github/actions/setup-node@v1

- name: Build
  uses: algtools/actions/.github/actions/build-no-secrets@v1
  with:
    build_cmd: 'npm run build'
    output_dir: 'dist'
```

## License

MIT License - see [LICENSE](../../../LICENSE) for details

## Support

For questions or issues, please open an issue in the [algtools/actions](https://github.com/algtools/actions) repository.
