# Comment PR Action

A GitHub Action that posts or updates comments on Pull Requests with deployment info (e.g., preview URLs, environment details, Chromatic links). It avoids duplicating the same message across retries by using a dedupe key.

## Features

- ✅ Posts new comments or updates existing ones based on a dedupe key
- ✅ Supports full Markdown formatting (links, tables, code blocks, etc.)
- ✅ Works with `pull_request` and `workflow_run` contexts
- ✅ Automatic retry logic with exponential backoff for rate limits
- ✅ Graceful error handling for invalid PR numbers
- ✅ Minimal permissions required (only `issues: write` or `pull-requests: write`)
- ✅ Returns comment ID and URL as outputs

## Usage

### Basic Example: Post a Simple Comment

```yaml
- name: Comment on PR
  uses: algtools/actions/.github/actions/comment-pr@v1
  with:
    pr_number: ${{ github.event.pull_request.number }}
    message: |
      ## 🚀 Deployment Complete

      Your changes have been deployed successfully!
```

### Advanced Example: Update Comment with Dedupe Key

```yaml
- name: Comment preview URL
  uses: algtools/actions/.github/actions/comment-pr@v1
  with:
    pr_number: ${{ github.event.pull_request.number }}
    message: |
      ## 🔗 Preview Deployment

      **Environment:** `dev-pr-${{ github.event.pull_request.number }}`
      **Preview URL:** https://pr-${{ github.event.pull_request.number }}.preview.example.com
      **Status:** ✅ Deployed

      Last updated: ${{ github.event.head_commit.timestamp }}
    dedupe_key: preview-url
```

### Example: Post Chromatic Link

```yaml
- name: Comment Chromatic link
  uses: algtools/actions/.github/actions/comment-pr@v1
  with:
    pr_number: ${{ github.event.pull_request.number }}
    message: |
      ## 📚 Storybook Preview

      **Chromatic Build:** https://chromatic.com/build?appId=${{ env.CHROMATIC_APP_ID }}&number=${{ steps.chromatic.outputs.buildNumber }}

      Review visual changes and approve snapshots.
    dedupe_key: chromatic-build
```

### Example: Multiple Deployment Environments

```yaml
- name: Comment deployment status
  uses: algtools/actions/.github/actions/comment-pr@v1
  with:
    pr_number: ${{ github.event.pull_request.number }}
    message: |
      ## 🌍 Multi-Environment Deployment

      | Environment | Status | URL |
      |-------------|--------|-----|
      | Dev | ✅ Deployed | [View](https://dev.example.com) |
      | QA | ✅ Deployed | [View](https://qa.example.com) |
      | Staging | ⏳ Pending | - |

      **Commit:** ${{ github.sha }}
    dedupe_key: deploy-summary
```

### Example: Using in workflow_run Context

```yaml
name: Comment on PR from workflow_run

on:
  workflow_run:
    workflows: ['Build']
    types: [completed]

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - name: Get PR number
        id: pr
        uses: actions/github-script@v7
        with:
          script: |
            const { data: pullRequests } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              head: `${context.repo.owner}:${context.payload.workflow_run.head_branch}`
            });
            if (pullRequests.length > 0) {
              core.setOutput('number', pullRequests[0].number);
            }

      - name: Comment on PR
        if: steps.pr.outputs.number
        uses: algtools/actions/.github/actions/comment-pr@v1
        with:
          pr_number: ${{ steps.pr.outputs.number }}
          message: |
            ## ✅ Build Completed

            **Workflow:** ${{ github.workflow }}
            **Status:** ${{ github.event.workflow_run.conclusion }}
          dedupe_key: workflow-status
```

## Inputs

| Input          | Description                                                                                                                                                                                           | Required | Default               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------- |
| `pr_number`    | Target PR number                                                                                                                                                                                      | Yes      | -                     |
| `message`      | Markdown body to post in the comment                                                                                                                                                                  | Yes      | -                     |
| `dedupe_key`   | Short key used to detect/update an existing comment (e.g., `preview-url`, `deploy-summary`). If provided, the action will update an existing comment with the same key instead of creating a new one. | No       | `''`                  |
| `github_token` | GitHub token for API access                                                                                                                                                                           | No       | `${{ github.token }}` |

## Outputs

| Output        | Description                           |
| ------------- | ------------------------------------- |
| `comment_id`  | ID of the created or updated comment  |
| `comment_url` | URL of the created or updated comment |
| `action`      | Action taken: `created` or `updated`  |

## How It Works

### Dedupe Key Mechanism

When you provide a `dedupe_key`:

1. The action searches for existing comments on the PR
2. It looks for a comment containing an invisible HTML marker: `<!-- dedupe-key: your-key -->`
3. If found, it **updates** that comment with the new message
4. If not found, it **creates** a new comment with the marker

This ensures that repeated runs (e.g., during retries or multiple deployments) update the same comment instead of spamming the PR with duplicates.

### Retry Logic

The action includes built-in retry logic with exponential backoff to handle GitHub API rate limits:

- **Max attempts:** 3
- **Initial timeout:** 1 second
- **Backoff:** Doubles each attempt (1s → 2s → 4s)

### Error Handling

- **Invalid PR number:** Clear error message and immediate exit
- **PR not found:** Verifies PR exists before attempting to comment
- **API failures:** Retries with exponential backoff
- **Missing token:** Validation error with clear message

## Required Permissions

This action requires one of the following permissions:

```yaml
permissions:
  pull-requests: write
  # OR
  issues: write
```

### Example with Explicit Permissions

```yaml
jobs:
  comment-pr:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - name: Comment on PR
        uses: algtools/actions/.github/actions/comment-pr@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
          message: '🎉 Deployment successful!'
          dedupe_key: deploy-status
```

## Real-World Examples

### Preview Deployment Workflow

```yaml
name: Deploy PR Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to preview environment
        id: deploy
        run: |
          # Your deployment logic here
          echo "url=https://pr-${{ github.event.pull_request.number }}.preview.example.com" >> $GITHUB_OUTPUT

      - name: Comment preview URL
        uses: algtools/actions/.github/actions/comment-pr@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
          message: |
            ## 🚀 Preview Deployment Ready!

            **Preview URL:** ${{ steps.deploy.outputs.url }}
            **Commit:** ${{ github.event.pull_request.head.sha }}

            Changes will be automatically deployed on every push.
          dedupe_key: preview-url
```

### Integration with Chromatic

```yaml
name: Chromatic Build

on:
  pull_request:

jobs:
  chromatic:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Publish to Chromatic
        uses: chromaui/action@latest
        id: chromatic
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}

      - name: Comment Chromatic link
        uses: algtools/actions/.github/actions/comment-pr@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
          message: |
            ## 📚 Storybook Published to Chromatic

            **Build URL:** ${{ steps.chromatic.outputs.buildUrl }}
            **Storybook URL:** ${{ steps.chromatic.outputs.storybookUrl }}
            **Changes:** ${{ steps.chromatic.outputs.changeCount }} component(s)

            ${{ steps.chromatic.outputs.changeCount > 0 && '⚠️ Review visual changes before merging' || '✅ No visual changes detected' }}
          dedupe_key: chromatic-build
```

## Troubleshooting

### Comment not updating

**Problem:** New comment is created instead of updating existing one.

**Solution:** Ensure you're using the same `dedupe_key` across runs. The dedupe key is case-sensitive.

### Permission denied error

**Problem:** `Resource not accessible by integration` error.

**Solution:** Add the required permissions to your workflow:

```yaml
permissions:
  pull-requests: write
```

### PR not found error

**Problem:** `PR #123 not found in repository` error.

**Solution:**

- Verify the PR number is correct
- Ensure the PR exists in the repository
- Check that you're using the correct repository context

### Rate limit errors

**Problem:** GitHub API rate limit exceeded.

**Solution:** The action includes automatic retry logic. If rate limits persist:

- Reduce the frequency of workflow runs
- Use `dedupe_key` to update existing comments instead of creating new ones
- Consider using a GitHub App token with higher rate limits

## Development

### Testing Locally

You can test this action locally using `act`:

```bash
# Install act
brew install act

# Run the workflow
act pull_request -j comment-pr
```

### Testing in CI

See the [test workflow](../../../workflows/test-comment-pr.yml) for examples of how this action is tested in CI.

## Contributing

Contributions are welcome! Please follow the [contributing guidelines](../../../README.md#contributing) in the main repository.

## License

MIT License - see [LICENSE](../../../LICENSE) for details.

## Support

For questions or issues, please open an issue in the [algtools/actions](https://github.com/algtools/actions/issues) repository.
