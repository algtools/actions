# Manage Ephemeral D1 Database Action

Manages ephemeral D1 databases for PR preview environments. Automatically detects new migrations, creates isolated test databases, applies migrations, and seeds data.

## Features

- **Smart Migration Detection**: Compares current branch with base branch using git
- **Automatic Database Lifecycle**: Creates, migrates, and seeds databases automatically
- **Clean State Guarantee**: Always deletes and recreates to ensure migrations work from scratch
- **Flexible Configuration**: Supports custom migration directories, seed scripts, and wrangler configs
- **Safe Fallback**: Uses dev database when no new migrations are detected

## Usage

### Basic Usage

```yaml
- name: Manage Ephemeral Database
  uses: algtools/actions/.github/actions/manage-ephemeral-database@main
  with:
    repository_name: ${{ github.event.repository.name }}
    pr_number: ${{ github.event.pull_request.number }}
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Advanced Usage

```yaml
- name: Manage Ephemeral Database
  id: ephemeral-db
  uses: algtools/actions/.github/actions/manage-ephemeral-database@main
  with:
    # Repository configuration
    repository_name: ${{ github.event.repository.name }}
    pr_number: ${{ github.event.pull_request.number }}
    base_branch: 'origin/dev'

    # Cloudflare credentials
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

    # Migration configuration
    migrations_dir: 'migrations'
    working_directory: '.'

    # Database configuration
    wrangler_config: 'wrangler.jsonc'
    database_binding: 'DB'

    # Seeding configuration
    enable_seeding: true
    seed_script: 'pnpm run db:seed:sql'
    seed_file: 'seeds.sql'

    # Wrangler configuration
    wrangler_version: 'latest'

    # Behavior
    force_create: false
    skip_comparison: false

- name: Use database outputs
  run: |
    if [ "${{ steps.ephemeral-db.outputs.database_created }}" = "true" ]; then
      echo "Using ephemeral database: ${{ steps.ephemeral-db.outputs.database_name }}"
      echo "Database ID: ${{ steps.ephemeral-db.outputs.database_id }}"
    else
      echo "Using dev database (no new migrations)"
    fi
```

## Inputs

### Required Inputs

| Input                   | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `repository_name`       | Repository name (used for database naming)        |
| `pr_number`             | Pull request number                               |
| `cloudflare_api_token`  | Cloudflare API token with D1 database permissions |
| `cloudflare_account_id` | Cloudflare account ID                             |

### Optional Inputs

| Input               | Description                                         | Default                |
| ------------------- | --------------------------------------------------- | ---------------------- |
| `base_branch`       | Base branch to compare migrations against           | `origin/dev`           |
| `migrations_dir`    | Directory containing migration files                | `migrations`           |
| `working_directory` | Working directory for running scripts               | `.`                    |
| `wrangler_config`   | Path to wrangler.jsonc file to update               | `wrangler.jsonc`       |
| `database_binding`  | Database binding name in wrangler config            | `DB`                   |
| `enable_seeding`    | Whether to seed the database after migrations       | `true`                 |
| `seed_script`       | Script to generate seed SQL                         | `pnpm run db:seed:sql` |
| `seed_file`         | Path to generated seed SQL file                     | `seeds.sql`            |
| `wrangler_version`  | Version of Wrangler to install                      | `latest`               |
| `force_create`      | Force database creation even without new migrations | `false`                |
| `skip_comparison`   | Skip comparison and always create database          | `false`                |

## Outputs

| Output                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `has_new_migrations`  | Whether new migrations were detected (true/false)      |
| `new_migration_count` | Number of new migrations detected                      |
| `new_migrations`      | Comma-separated list of new migration files            |
| `database_created`    | Whether an ephemeral database was created (true/false) |
| `database_name`       | Name of the ephemeral database (empty if using dev)    |
| `database_id`         | ID of the ephemeral database (empty if using dev)      |
| `migrations_applied`  | Whether migrations were applied (true/false)           |
| `seeding_status`      | Status of seeding (success/skipped/failed)             |

## How It Works

### 1. Migration Detection

The action compares migration files between the current branch and the base branch using git:

```bash
# Get migrations in base branch
git ls-tree -r --name-only origin/dev migrations/

# Get migrations in current branch
find migrations/ -name "*.sql"

# Find new migrations = current - base
```

**Why git comparison?**

- Independent of database state
- Accurate detection of new migrations
- Works even if dev database is out of sync
- Prevents false positives

### 2. Database Creation

If new migrations are detected:

1. **Check for existing database**: `wrangler d1 list`
2. **Delete if exists**: Ensures clean state for migration testing
3. **Create fresh database**: `wrangler d1 create <repo>-<pr-number>`
4. **Extract database ID**: Parse from wrangler JSON output (supports both old and new formats)

**Database naming**: `{repository-name}-{pr-number}`

- Example: `core-template-42` for PR #42

### 3. Configuration Update

Updates `wrangler.jsonc` with ephemeral database info:

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "core-template-42",
      "database_id": "uuid-from-cloudflare"
    }
  ],
  "env": {
    "preview": {
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "core-template-42",
          "database_id": "uuid-from-cloudflare"
        }
      ]
    }
  }
}
```

### 4. Migration Application

Applies all migrations to the ephemeral database:

```bash
wrangler d1 migrations apply DB --remote
```

### 5. Database Seeding

If enabled:

1. **Generate seed SQL**: Runs seed script (e.g., `pnpm run db:seed:sql`)
2. **Apply seed data**: `wrangler d1 execute DB --remote --file=seeds.sql`

## Decision Flow

```
PR Created/Updated
    ↓
Compare migrations with base branch (git)
    ↓
┌─────────────────┬─────────────────┐
│  New migrations │ No new migrations│
│     found       │      found       │
└────────┬────────┴────────┬─────────┘
         ↓                  ↓
    Create ephemeral    Use dev database
    database            (skip creation)
         ↓
    Apply migrations
         ↓
    Seed database
         ↓
    Output DB info
```

## Requirements

### Repository Structure

Your repository should have:

```
.
├── migrations/
│   ├── 0001_initial.sql
│   ├── 0002_add_users.sql
│   └── ...
├── scripts/
│   └── configurePrDatabase.ts (optional)
├── wrangler.jsonc
└── package.json
```

### Package Scripts (Optional)

For seeding support, add to `package.json`:

```json
{
  "scripts": {
    "db:seed:sql": "tsx scripts/generateSeedSql.ts"
  }
}
```

### Cloudflare Permissions

The API token needs:

- D1 Database Read/Write permissions
- Account-level access

## Examples

### Example 1: Basic PR Preview

```yaml
name: PR Preview

on:
  pull_request:
    branches: [dev]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for git comparison

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install

      - name: Manage Database
        id: db
        uses: algtools/actions/.github/actions/manage-ephemeral-database@main
        with:
          repository_name: ${{ github.event.repository.name }}
          pr_number: ${{ github.event.pull_request.number }}
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy
        run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Example 2: With Custom Configuration

```yaml
- name: Setup Database
  uses: algtools/actions/.github/actions/manage-ephemeral-database@main
  with:
    repository_name: 'my-api'
    pr_number: ${{ github.event.pull_request.number }}
    base_branch: 'origin/main'
    migrations_dir: 'database/migrations'
    wrangler_config: 'config/wrangler.toml'
    database_binding: 'DATABASE'
    seed_script: 'npm run seed:generate'
    seed_file: 'database/seeds.sql'
    cloudflare_api_token: ${{ secrets.CF_TOKEN }}
    cloudflare_account_id: ${{ secrets.CF_ACCOUNT }}
```

### Example 3: Force Database Creation

```yaml
- name: Always Create Ephemeral Database
  uses: algtools/actions/.github/actions/manage-ephemeral-database@main
  with:
    repository_name: ${{ github.event.repository.name }}
    pr_number: ${{ github.event.pull_request.number }}
    force_create: true
    skip_comparison: true
    cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Cleanup

This action only creates databases. For cleanup when PRs are closed, use:

```yaml
name: PR Cleanup

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Install Wrangler
        run: npm install -g wrangler

      - name: Delete Database
        run: |
          DB_NAME="${{ github.event.repository.name }}-${{ github.event.pull_request.number }}"
          wrangler d1 delete "$DB_NAME" --skip-confirmation || true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Troubleshooting

### No Migrations Detected (But PR Has Migrations)

**Cause**: Base branch not fetched or wrong base branch specified

**Solution**:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0 # Fetch all history

- run: git fetch origin dev # Ensure base branch is available
```

### Migration Already Applied Error

**Cause**: Database wasn't properly deleted before recreation

**Solution**: The action handles this automatically by always deleting before creating. If you see this error, it may be a race condition. Try again.

### Could Not Extract Database ID Error

**Error**: `Could not extract database ID from wrangler output`

**Cause**: Wrangler output format changed between versions (v3 vs v4+).

**Solution**: The action now supports both formats automatically:

- **New format** (Wrangler 4.x): JSON with `"database_id": "uuid"`
- **Old format** (Wrangler 3.x): Plain text with `database_id = "uuid"`

If you still see this error, check the wrangler output in the logs and ensure you're using a supported version.

### Database Not Found During Deployment

**Cause**: wrangler.jsonc wasn't updated properly

**Solution**: Ensure the action completes successfully and check that `database_created` output is `true`.

### Seeding Failed

**Cause**: Seed script command not available or seed file not generated

**Solution**:

1. Ensure dependencies are installed before this action
2. Check seed script exists in package.json
3. Verify seed file path is correct

## Best Practices

### 1. Always Fetch History

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### 2. Install Dependencies First

```yaml
- uses: actions/setup-node@v4
- run: pnpm install
- uses: manage-ephemeral-database@main
```

### 3. Use Outputs for Conditional Logic

```yaml
- id: db
  uses: manage-ephemeral-database@main

- name: Log database info
  if: steps.db.outputs.database_created == 'true'
  run: echo "Using ephemeral DB: ${{ steps.db.outputs.database_name }}"
```

### 4. Set Appropriate Base Branch

```yaml
with:
  base_branch: "origin/dev"  # For dev PRs
  # or
  base_branch: "origin/main" # For production PRs
```

## Related Documentation

- [Ephemeral Databases Guide](../../../core-template/docs/features/EPHEMERAL_DATABASES.md)
- [Database Migrations Guide](../../../core-template/docs/features/DATABASE_MIGRATIONS.md)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)

## License

MIT License - See [LICENSE](../../../LICENSE) for details.
