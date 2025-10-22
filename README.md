# algtools/actions

Algenium common GitHub Actions and reusable workflows for all projects across the Algenium and Algtools ecosystem.

## Repository Structure

```
.github/
├── actions/         # Custom reusable actions
├── workflows/       # Reusable workflows and CI/CD pipelines
└── tests/          # Test files and fixtures
```

## Available Actions

### [build-no-secrets](/.github/actions/build-no-secrets)
Builds a project in a clean environment without exposing secrets. Perfect for PR previews or secure builds.

### [setup-node](/.github/actions/setup-node)
Sets up Node.js environment with caching support for faster builds.

### [upload-artifacts](/.github/actions/upload-artifacts)
Uploads build artifacts to GitHub Actions storage with detailed logging and support for multiple file paths.

### [deploy-cloudflare-from-artifact](/.github/actions/deploy-cloudflare-from-artifact)
Deploys Cloudflare Workers from pre-built artifacts with secure credential handling. Ensures safe and reproducible deployments without exposing code or secrets.

### [ensure-wildcard-certificate](/.github/actions/ensure-wildcard-certificate)
Ensures a wildcard SSL certificate exists in Cloudflare ACM. Idempotent action that creates certificates only when needed and waits for activation.

## Usage

### Using Custom Actions

To use a custom action from this repository in your workflow:

```yaml
- uses: algtools/actions/.github/actions/your-action@v1
  with:
    input-param: value
```

### Using Reusable Workflows

To use a reusable workflow:

```yaml
jobs:
  call-workflow:
    uses: algtools/actions/.github/workflows/your-workflow.yml@v1
    with:
      input-param: value
```

## Development

### Prerequisites

- Git
- GitHub CLI (optional, for testing)
- actionlint (for workflow validation)

### Test Configuration

**macOS Tests**: macOS runner tests are disabled by default to reduce CI costs, as macOS runners are significantly more expensive than Linux/Windows runners. Tests run on Ubuntu and Windows provide sufficient cross-platform coverage for most use cases.

To enable macOS tests when needed:
1. Edit the relevant workflow file (e.g., `.github/workflows/test-*.yml`)
2. Add `macos-latest` to the matrix `os` array
3. Look for comments like: `# macOS tests disabled by default (expensive)`

Example:
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]  # Add macos-latest here
```

### Adding New Actions

1. Create a new directory under `.github/actions/your-action-name/`
2. Add `action.yml` with your action definition
3. Include a comprehensive `README.md` documenting:
   - Purpose and use cases
   - All inputs and outputs
   - Required permissions
   - Usage examples
4. Ensure all workflows pass the CI lint checks

### Validation

All workflows are automatically validated using `actionlint` on push and pull requests. To run locally:

```bash
# Install actionlint
brew install actionlint  # macOS
# or
go install github.com/rhysd/actionlint/cmd/actionlint@latest

# Run validation
actionlint
```

## CI/CD

This repository uses the following CI workflows:

- **ci-lint.yml**: Validates all GitHub Actions workflows using actionlint

## Security

- All workflows use minimal required permissions
- Dependencies are pinned to specific versions (SHA or tag)
- Regular security audits of actions and dependencies

## Contributing

1. Create a new branch for your changes
2. Add or modify actions/workflows following the structure above
3. Ensure all CI checks pass
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

For questions or issues, please open an issue in this repository.
