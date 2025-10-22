# algtools/actions

Algenium common GitHub Actions and reusable workflows for all projects across the Algenium and Algtools ecosystem.

## Repository Structure

```
.github/
├── actions/         # Custom reusable actions
├── workflows/       # Reusable workflows and CI/CD pipelines
└── tests/          # Test files and fixtures
```

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
