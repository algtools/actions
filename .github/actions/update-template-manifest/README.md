# Update Template Manifest Action

This action regenerates the `.template-manifest.json` file with fresh checksums for all template files and updates the version from `package.json`.

## Purpose

During template releases, the manifest needs to be updated with:

- Current version from `package.json`
- Fresh checksums for all template files
- Updated timestamp

This ensures the manifest in the source repository always reflects the current state of the template.

## Usage

```yaml
- name: Update template manifest
  uses: algtools/actions/.github/actions/update-template-manifest@main
  with:
    working_directory: '.'
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input               | Description                         | Required | Default |
| ------------------- | ----------------------------------- | -------- | ------- |
| `working_directory` | Directory containing the template   | Yes      | -       |
| `github_token`      | GitHub token for committing changes | Yes      | -       |

## What It Does

1. **Scans template files**: Finds all wrappable files (`.ts`, `.js`, `.json`, `.yml`, `.md`, etc.)
2. **Calculates checksums**: Computes SHA-256 checksums for each file
3. **Updates manifest**: Regenerates the `files` section with fresh checksums
4. **Sets version**: Updates `templateVersion` from `package.json`
5. **Commits changes**: Commits and pushes the updated manifest (if changed)

## Files Excluded

The action automatically excludes:

- Build artifacts (`node_modules`, `dist`, `coverage`, etc.)
- Git directories (`.git`, `.github`)
- Lock files (`pnpm-lock.yaml`, `package-lock.json`)
- Environment files (`.env*`, `.dev.vars`)
- Build directories (`.template-build`, `template-dist`, `app-dist`)
- IDE files (`.vscode`, `.idea`)
- Temporary files (`.DS_Store`, `*.log`)

## Integration

This action is automatically called in the `template-release-reusable.yml` workflow after version bumping:

```yaml
- name: Bump Version
  uses: algtools/actions/.github/actions/bump-version@main

- name: Update template manifest
  uses: algtools/actions/.github/actions/update-template-manifest@main
  with:
    working_directory: ${{ inputs.working_directory }}
    github_token: ${{ secrets.gh_token }}

- name: Package Template
  uses: algtools/actions/.github/actions/package-template@main
```

## Output

The action:

- ✅ Updates `.template-manifest.json` in place
- ✅ Commits changes with message: `chore: update template manifest checksums [skip ci]`
- ✅ Pushes to remote repository
- ✅ Skips if no changes detected

## Example Manifest Update

Before:

```json
{
  "templateVersion": "1.7.0",
  "files": {
    "src/index.ts": {
      "checksum": "abc123...",
      "wrapped": true
    }
  }
}
```

After:

```json
{
  "templateVersion": "1.8.0",
  "files": {
    "src/index.ts": {
      "checksum": "def456...",
      "wrapped": false
    }
  },
  "metadata": {
    "updatedAt": "2025-01-27T12:00:00Z"
  }
}
```

Note: `wrapped` is set to `false` here and gets set to `true` during the packaging/wrapping step.
