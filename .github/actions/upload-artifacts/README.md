# Upload Artifacts Action

A composite GitHub Action that uploads build artifacts to GitHub Actions storage with detailed logging and support for multiple file paths. This action provides comprehensive insights into what's being uploaded and simplifies artifact management.

## Features

- 📦 **Multiple Path Support**: Upload multiple files or directories in a single action
- 📊 **Detailed Logging**: See exactly what files are being uploaded, their sizes, and counts
- ✅ **Pre-Upload Validation**: Validates paths and provides warnings before upload
- 🔧 **Configurable**: Control retention, compression, and error handling
- 📈 **Output Metrics**: Get artifact ID, URL, file count, and total size as outputs

## Usage

### Basic Example

```yaml
- name: Upload build artifacts
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'build-output'
    artifact_paths: 'dist'
```

### Multiple Paths Example

```yaml
- name: Upload multiple artifacts
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'project-artifacts'
    artifact_paths: 'dist, coverage, logs'
```

### Complete Build and Upload Workflow

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
    output_dir: 'dist'

- name: Upload build artifacts
  id: upload
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'build-${{ github.sha }}'
    artifact_paths: 'dist'
    retention_days: '30'

- name: Display upload info
  run: |
    echo "Artifact ID: ${{ steps.upload.outputs.artifact_id }}"
    echo "Artifact URL: ${{ steps.upload.outputs.artifact_url }}"
    echo "Total files: ${{ steps.upload.outputs.total_files }}"
    echo "Total size: ${{ steps.upload.outputs.total_size }} bytes"
```

### Advanced Example with Custom Settings

```yaml
- name: Upload with custom settings
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'release-bundle'
    artifact_paths: |
      dist/bundle.js,
      dist/styles.css,
      public/assets,
      README.md
    retention_days: '90'
    if_no_files_found: 'error'
    compression_level: '9'
```

### Multiple Artifact Uploads

```yaml
- name: Upload application bundle
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'app-bundle'
    artifact_paths: 'dist/app'

- name: Upload documentation
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'docs'
    artifact_paths: 'docs/build'

- name: Upload test coverage
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'coverage'
    artifact_paths: 'coverage'
    retention_days: '7'
```

## Inputs

| Input               | Description                                                  | Required | Default                |
| ------------------- | ------------------------------------------------------------ | -------- | ---------------------- |
| `artifact_name`     | Name of the artifact to upload                               | Yes      | -                      |
| `artifact_paths`    | Comma-separated list of file paths or directories to upload  | Yes      | -                      |
| `retention_days`    | Number of days to retain the artifact (1-90 days)            | No       | Repository/org default |
| `if_no_files_found` | Behavior if no files are found: `warn`, `error`, or `ignore` | No       | `warn`                 |
| `compression_level` | Compression level (0-9): 0 for no compression, 9 for maximum | No       | `6`                    |

### Input Details

#### `artifact_name`

The name that will be used for the uploaded artifact. This name will appear in the GitHub Actions UI and can be used to download the artifact later.

**Examples:**

- `'build-output'`
- `'release-v1.0.0'`
- `'build-${{ github.sha }}'`

#### `artifact_paths`

A comma-separated list of paths to files or directories to include in the artifact. Paths can be:

- **Files**: Individual files to upload
- **Directories**: Entire directories (recursively uploaded)
- **Mixed**: Combination of files and directories

**Examples:**

```yaml
# Single path
artifact_paths: 'dist'

# Multiple paths (comma-separated)
artifact_paths: 'dist, coverage, logs'

# Multiple paths (multiline for readability)
artifact_paths: |
  dist/bundle.js,
  dist/styles.css,
  public/assets,
  README.md
```

#### `retention_days`

How long GitHub should keep the artifact before automatically deleting it. Must be between 1-90 days. If not specified, uses the repository or organization default retention setting.

#### `if_no_files_found`

Controls what happens if no files match the specified paths:

- `warn` (default): Issue a warning but continue
- `error`: Fail the action
- `ignore`: Silently continue

#### `compression_level`

Controls the compression applied to the artifact:

- `0`: No compression (fastest, larger size)
- `6`: Default compression (balanced)
- `9`: Maximum compression (slowest, smallest size)

## Outputs

| Output         | Description                                 |
| -------------- | ------------------------------------------- |
| `artifact_id`  | GitHub artifact ID of the uploaded artifact |
| `artifact_url` | URL to download the artifact                |
| `total_files`  | Total number of files uploaded              |
| `total_size`   | Total size of uploaded files in bytes       |

### Using Outputs

```yaml
- name: Upload artifacts
  id: upload
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'my-artifact'
    artifact_paths: 'dist'

- name: Use outputs
  run: |
    echo "Artifact uploaded with ID: ${{ steps.upload.outputs.artifact_id }}"
    echo "Download from: ${{ steps.upload.outputs.artifact_url }}"
    echo "Contains ${{ steps.upload.outputs.total_files }} files"
    echo "Total size: ${{ steps.upload.outputs.total_size }} bytes"
```

## Detailed Logging

This action provides comprehensive logging during the upload process:

### Pre-Upload Analysis

For each path, the action logs:

- Whether it's a file or directory
- Size information (human-readable format)
- File count (for directories)
- Sample of files (first 5 files for directories)

### Upload Summary

After upload completes:

- Total number of files uploaded
- Total size of all files
- Artifact ID and download URL
- Retention period

### Example Log Output

```
📁 Analyzing: dist
  Type: Directory
  Files: 42
  Total size: 1048576 bytes (1.0 MiB)
  Contents (first 5 files):
    - index.html
    - bundle.js
    - styles.css
    - manifest.json
    - favicon.ico
    ... and 37 more files

==================================
📊 Upload Summary
==================================
Total files: 42
Total size: 1048576 bytes (1.0 MiB)
Artifact name: build-output

✓ Artifact uploaded successfully

Artifact Details:
  Name: build-output
  ID: 123456789
  URL: https://github.com/.../actions/runs/.../artifacts/...
  Files: 42
  Size: 1048576 bytes
  Retention: 30 days

✓ Upload complete
```

## Use Cases

### CI/CD Build Artifacts

Store build outputs for later deployment or analysis:

```yaml
name: Build and Store Artifacts

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: algtools/actions/.github/actions/setup-node@v1
      - uses: algtools/actions/.github/actions/build-no-secrets@v1
        with:
          build_cmd: 'npm run build'
          output_dir: 'dist'
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'production-build-${{ github.sha }}'
          artifact_paths: 'dist'
          retention_days: '90'
```

### Test Coverage Reports

Upload test coverage for analysis:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage reports
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'coverage-${{ github.run_id }}'
    artifact_paths: 'coverage'
    retention_days: '14'
```

### Multi-Platform Builds

Upload artifacts from different platforms:

```yaml
name: Multi-Platform Build

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: algtools/actions/.github/actions/setup-node@v1
      - run: npm run build
      - uses: algtools/actions/.github/actions/upload-artifacts@v1
        with:
          artifact_name: 'build-${{ matrix.os }}'
          artifact_paths: 'dist'
```

### Release Bundles

Create comprehensive release artifacts:

```yaml
- name: Build release bundle
  run: npm run build:release

- name: Upload release artifacts
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'release-v${{ github.ref_name }}'
    artifact_paths: |
      dist,
      docs,
      CHANGELOG.md,
      LICENSE
    retention_days: '90'
    compression_level: '9'
```

## Required Permissions

```yaml
permissions:
  contents: read
  actions: write # Required for uploading artifacts
```

## Compatibility

- ✅ Linux runners (ubuntu-latest)
- ✅ macOS runners (macos-latest)
- ✅ Windows runners (windows-latest)

## Best Practices

1. **Use Descriptive Names**: Include version, commit SHA, or run ID in artifact names for easy identification:

   ```yaml
   artifact_name: 'build-${{ github.sha }}'
   ```

2. **Set Appropriate Retention**: Use shorter retention for temporary artifacts, longer for releases:

   ```yaml
   retention_days: '7'   # For PR builds
   retention_days: '90'  # For releases
   ```

3. **Validate Before Upload**: Ensure build artifacts exist before uploading:

   ```yaml
   - name: Build
     uses: algtools/actions/.github/actions/build-no-secrets@v1
     with:
       build_cmd: 'npm run build'
       output_dir: 'dist'

   - name: Upload
     uses: algtools/actions/.github/actions/upload-artifacts@v1
     with:
       artifact_name: 'build'
       artifact_paths: 'dist'
       if_no_files_found: 'error' # Fail if nothing to upload
   ```

4. **Use Outputs for Downstream Jobs**: Pass artifact information to other jobs:

   ```yaml
   - name: Upload
     id: upload
     uses: algtools/actions/.github/actions/upload-artifacts@v1
     with:
       artifact_name: 'build'
       artifact_paths: 'dist'

   - name: Notify
     run: |
       echo "Uploaded ${{ steps.upload.outputs.total_files }} files"
       echo "Download: ${{ steps.upload.outputs.artifact_url }}"
   ```

5. **Optimize Large Uploads**: For large artifacts, adjust compression:

   ```yaml
   # Faster upload, larger size
   compression_level: '0'

   # Slower upload, smaller size
   compression_level: '9'
   ```

## Troubleshooting

### No files found warning

If you see "No files found to upload", check:

1. The path exists after your build step
2. The path is relative to the repository root
3. Your build command actually produces output

```yaml
# Bad: Path doesn't exist
artifact_paths: 'build'  # ❌ Your build outputs to 'dist'

# Good: Correct path
artifact_paths: 'dist'  # ✅ Matches build output
```

### Path not found

Ensure paths are relative to the repository root:

```yaml
# Bad: Absolute path
artifact_paths: '/home/runner/work/dist'  # ❌

# Good: Relative path
artifact_paths: 'dist'  # ✅
```

### Multiple paths not working

Ensure paths are comma-separated or use multiline format:

```yaml
# Bad: Space-separated
artifact_paths: 'dist coverage logs'  # ❌

# Good: Comma-separated
artifact_paths: 'dist, coverage, logs'  # ✅

# Good: Multiline
artifact_paths: |
  dist,
  coverage,
  logs
```

### Artifact size too large

GitHub has a 10 GB limit per artifact. If you hit this:

1. Split into multiple artifacts
2. Increase compression level
3. Exclude unnecessary files

```yaml
# Split large artifacts
- name: Upload application
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'app'
    artifact_paths: 'dist/app'

- name: Upload assets
  uses: algtools/actions/.github/actions/upload-artifacts@v1
  with:
    artifact_name: 'assets'
    artifact_paths: 'dist/assets'
    compression_level: '9'
```

## Differences from `actions/upload-artifact@v4`

This action wraps `actions/upload-artifact@v4` with additional features:

| Feature             | `actions/upload-artifact@v4` | This Action |
| ------------------- | ---------------------------- | ----------- |
| Basic upload        | ✅                           | ✅          |
| Pre-upload analysis | ❌                           | ✅          |
| Detailed logging    | ❌                           | ✅          |
| File count output   | ❌                           | ✅          |
| Total size output   | ❌                           | ✅          |
| Path validation     | ❌                           | ✅          |
| Summary reports     | ❌                           | ✅          |

## Related Actions

- [`build-no-secrets`](../build-no-secrets/README.md): Build projects without exposing secrets
- [`setup-node`](../setup-node/README.md): Set up Node.js environment

## License

MIT License - see [LICENSE](../../../LICENSE) for details

## Support

For questions or issues, please open an issue in the [algtools/actions](https://github.com/algtools/actions) repository.
