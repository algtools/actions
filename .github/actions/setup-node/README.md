# Setup Node.js Securely

A composite GitHub Action that sets up Node.js securely with caching and audit checks. This action ensures consistent, reproducible environments for all builds across the Algenium and Algtools ecosystem.

## Features

- 🔒 **Secure Setup**: Installs dependencies with `npm ci --ignore-scripts` to prevent malicious postinstall scripts
- 📦 **Smart Caching**: Caches npm dependencies using `actions/cache@v4` for faster builds
- 🔍 **Security Audits**: Runs `npm audit` to check for known vulnerabilities (non-blocking)
- 🎯 **Flexible Version Selection**: Reads Node.js version from `.nvmrc` or accepts explicit input
- 📊 **Clean Logging**: No tokens or secrets exposed in logs

## Usage

### Basic Usage (with .nvmrc)

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: algtools/actions/.github/actions/setup-node@v1
```

This will read the Node.js version from the `.nvmrc` file in your repository root.

### Specify Node.js Version

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: algtools/actions/.github/actions/setup-node@v1
    with:
      node-version: '20.x'
```

### Custom Working Directory

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: algtools/actions/.github/actions/setup-node@v1
    with:
      node-version: '18'
      working-directory: './my-app'
      cache-dependency-path: 'my-app/package-lock.json'
```

### Skip Security Audit

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: algtools/actions/.github/actions/setup-node@v1
    with:
      skip-audit: 'true'
```

## Inputs

| Input                   | Description                                                            | Required | Default               |
| ----------------------- | ---------------------------------------------------------------------- | -------- | --------------------- |
| `node-version`          | Node.js version to install. If not provided, reads from `.nvmrc` file. | No       | `''`                  |
| `cache-dependency-path` | Path to `package-lock.json` for cache key computation                  | No       | `'package-lock.json'` |
| `working-directory`     | Working directory for npm commands                                     | No       | `'.'`                 |
| `skip-audit`            | Skip npm audit step                                                    | No       | `'false'`             |

## Outputs

| Output         | Description                                                           |
| -------------- | --------------------------------------------------------------------- |
| `node-version` | The Node.js version that was installed                                |
| `cache-hit`    | Whether dependencies were restored from cache (`'true'` or `'false'`) |

## Required Permissions

This action requires the following permissions when used in a workflow:

```yaml
permissions:
  contents: read # Required to checkout repository
```

## How It Works

1. **Version Detection**: Reads Node.js version from `.nvmrc` file if no explicit version is provided
2. **Node.js Setup**: Uses `actions/setup-node@v4` to install the specified Node.js version
3. **Dependency Caching**: Caches `~/.npm` and `node_modules` directories for faster subsequent builds
4. **Secure Installation**: Runs `npm ci --ignore-scripts` to install dependencies without executing potentially malicious scripts
5. **Security Audit**: Runs `npm audit --audit-level=moderate` as a non-blocking check (can be skipped)

## Security Features

- **Ignore Scripts**: Uses `--ignore-scripts` flag to prevent execution of lifecycle scripts during installation
- **Non-blocking Audits**: Security audits are informational and won't fail the build
- **No Secret Exposure**: All commands are designed to avoid logging sensitive information
- **Minimal Permissions**: Requires only `contents: read` permission

## Cache Strategy

The action caches:

- `~/.npm`: npm's cache directory
- `node_modules`: Installed dependencies

**Cache Key**: `npm-{os}-{hash of package-lock.json}`

This ensures that:

- Dependencies are reused across builds with the same `package-lock.json`
- Different OS builds maintain separate caches
- Cache is invalidated when dependencies change

## Examples

### Complete Workflow Example

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: algtools/actions/.github/actions/setup-node@v1
        id: setup-node

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Show cache status
        run: |
          echo "Node version: ${{ steps.setup-node.outputs.node-version }}"
          echo "Cache hit: ${{ steps.setup-node.outputs.cache-hit }}"
```

### Multi-OS Matrix Example

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: ['18', '20']
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: algtools/actions/.github/actions/setup-node@v1
        with:
          node-version: ${{ matrix.node-version }}

      - name: Run tests
        run: npm test
```

### Monorepo Example

```yaml
jobs:
  build-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js for app
        uses: algtools/actions/.github/actions/setup-node@v1
        with:
          working-directory: './apps/web'
          cache-dependency-path: 'apps/web/package-lock.json'

      - name: Build app
        working-directory: ./apps/web
        run: npm run build
```

## Troubleshooting

### .nvmrc file not found

If you see the error "No .nvmrc file found and no node-version input provided", either:

- Add a `.nvmrc` file to your repository with the desired Node.js version
- Provide the `node-version` input explicitly

### Cache not working

Ensure that:

- Your repository has a `package-lock.json` file
- The `cache-dependency-path` points to the correct location
- You're not using different `working-directory` values between builds

### npm audit warnings

The `npm audit` step is non-blocking by design. If you see warnings:

- Review the reported vulnerabilities
- Update dependencies using `npm audit fix`
- Consider pinning specific versions if needed

## Contributing

Issues and pull requests are welcome! Please follow the [main repository guidelines](../../../README.md).

## License

MIT License - see [LICENSE](../../../LICENSE) for details.
