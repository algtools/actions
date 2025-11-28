# Rule System Guide

The template update action uses a flexible rule system to process files during updates. This guide explains how to configure rules and create custom handlers.

## Rule Configuration

Rules are defined in `.template-app/merge-rules.yml` in your template repository.

### Basic Structure

```yaml
version: 1

# Files that should never be updated
exclude:
  - '.github/template-updates.yml'
  - 'CHANGELOG.md'
  - '*.lock'
  - '.env*'

# Custom processing rules
rules:
  - pattern: 'package.json'
    handler: 'builtin:package-json'
    description: 'Smart merge for package.json'
    config:
      preserve: ['name', 'version']
      merge_dependencies: true
```

### Exclude Patterns

Files matching exclude patterns are never updated:

- Supports glob patterns
- Case-sensitive
- Applies to all file operations

**Example:**

```yaml
exclude:
  - '*.lock' # All lock files
  - '.github/template-updates.yml' # Specific file
  - '**/*.env*' # Environment files anywhere
```

### Rules

Each rule defines how to process matching files:

| Field         | Description                             | Required |
| ------------- | --------------------------------------- | -------- |
| `pattern`     | Glob pattern to match files             | Yes      |
| `handler`     | Handler to use (builtin:name or custom) | Yes      |
| `description` | What this rule does                     | No       |
| `config`      | Configuration for the handler           | No       |

## Built-in Handlers

### package-json

Smart merge for `package.json` files.

**Configuration:**

```yaml
- pattern: 'package.json'
  handler: 'builtin:package-json'
  config:
    preserve: ['name', 'version', 'description', 'author']
    merge_dependencies: true
    merge_scripts: true
```

**What it does:**

- Validates JSON syntax
- Checks for placeholder syntax (`{{PLACEHOLDER}}`)
- Warns if placeholders detected in preserved fields
- Ensures app-specific fields are not overwritten

### wrangler-jsonc

Smart merge for Cloudflare `wrangler.jsonc` files.

**Configuration:**

```yaml
- pattern: 'wrangler.jsonc'
  handler: 'builtin:wrangler-jsonc'
  config:
    preserve_binding_ids: true
    merge_bindings: true
```

**What it does:**

- Strips JSONC comments for parsing
- Validates binding configurations
- Checks for placeholders in database_id, id, bucket_name
- Warns if any binding has placeholder syntax
- Preserves app's actual IDs during updates

### preserve-files

Keeps files unchanged.

**Configuration:**

```yaml
- pattern: 'CHANGELOG.md'
  handler: 'builtin:preserve-files'
```

**What it does:**

- Returns file content unchanged
- Useful for app-specific files that should never update

### strip-placeholders

Detects and warns about placeholder syntax.

**Configuration:**

```yaml
- pattern: '**/*.{json,jsonc,js}'
  handler: 'builtin:strip-placeholders'
  config:
    action: 'warn' # or "error"
```

**What it does:**

- Scans for `{{PLACEHOLDER}}` patterns
- Warns or errors based on config
- Prevents placeholder pollution in provisioned apps

## Creating Custom Handlers

You can create custom handlers for specialized processing.

### Handler Structure

Create a JavaScript file that exports:

```javascript
module.exports = {
  name: 'my-custom-handler',
  description: 'What this handler does',

  async process(context) {
    // context.filePath - path to the file
    // context.appContent - current file content
    // context.config - config from YAML

    // Process the file
    const processed = doSomething(context.appContent);

    return {
      content: processed,
      applied: true,
      warnings: [],
      message: 'Custom processing applied',
    };
  },
};
```

### Handler Context

The `context` object provides:

| Property      | Type   | Description             |
| ------------- | ------ | ----------------------- |
| `filePath`    | string | Relative path to file   |
| `appContent`  | string | Current file content    |
| `appFilePath` | string | Absolute path to file   |
| `config`      | object | Configuration from YAML |

### Return Value

Handlers should return:

```javascript
{
  content: string,      // Processed content (or original)
  applied: boolean,     // Whether processing was successful
  warnings: string[],   // Optional warnings
  errors: string[],     // Optional errors
  message: string       // Optional status message
}
```

### Example Custom Handler

```javascript
// .template-app/rules/custom-config-merger.js
module.exports = {
  name: 'custom-config-merger',
  description: 'Merges custom config files',

  async process(context) {
    const { appContent, config } = context;

    try {
      const appConfig = JSON.parse(appContent);

      // Custom merging logic
      const merged = {
        ...appConfig,
        // Preserve certain fields
        customField: appConfig.customField,
      };

      return {
        content: JSON.stringify(merged, null, 2),
        applied: true,
        message: 'Config merged successfully',
      };
    } catch (error) {
      return {
        applied: false,
        errors: [error.message],
      };
    }
  },
};
```

### Using Custom Handlers

Reference custom handlers in your rules:

```yaml
rules:
  - pattern: 'custom-config.json'
    handler: 'custom:.template-app/rules/custom-config-merger.js'
    config:
      someOption: value
```

## Best Practices

### 1. Use Specific Patterns

```yaml
# Good
- pattern: 'package.json'

# Less specific
- pattern: '*.json'
```

### 2. Document Your Rules

```yaml
- pattern: 'wrangler.jsonc'
  handler: 'builtin:wrangler-jsonc'
  description: 'Preserves database IDs and custom bindings'
  config:
    preserve_binding_ids: true
```

### 3. Handle Errors Gracefully

Custom handlers should catch errors and return useful messages.

### 4. Test Your Rules

Create test scenarios with:

- Clean files (no local changes)
- Modified files (local customizations)
- Files with conflicts

### 5. Keep Rules Simple

Complex logic belongs in custom handlers, not in YAML config.

## Troubleshooting

### Rule Not Matching

**Problem:** File isn't being processed by expected rule.

**Solutions:**

- Check glob pattern syntax
- Verify file path relative to repository root
- Ensure pattern is case-sensitive

### Handler Errors

**Problem:** Handler fails during processing.

**Solutions:**

- Check handler return format
- Validate file syntax before processing
- Add try-catch blocks in custom handlers

### Placeholders Detected

**Problem:** Warnings about placeholder syntax.

**Solutions:**

- Placeholders should only be in `.template-app/include/`
- Files in release package should have real values
- Review template packaging process

## Schema Reference

Full JSON schema for merge-rules.yml:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version"],
  "properties": {
    "version": {
      "type": "number",
      "const": 1
    },
    "exclude": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "rules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["pattern", "handler"],
        "properties": {
          "pattern": {
            "type": "string"
          },
          "handler": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "config": {
            "type": "object"
          }
        }
      }
    }
  }
}
```

## Examples

### Core Template

```yaml
version: 1
exclude:
  - '.github/template-updates.yml'
  - 'CHANGELOG.md'
  - '*.lock'
rules:
  - pattern: 'package.json'
    handler: 'builtin:package-json'
  - pattern: 'wrangler.jsonc'
    handler: 'builtin:wrangler-jsonc'
    config:
      preserve_binding_ids: true
```

### BFF Template

```yaml
version: 1
exclude:
  - '.github/template-updates.yml'
  - 'CHANGELOG.md'
  - '*.lock'
rules:
  - pattern: 'package.json'
    handler: 'builtin:package-json'
```

### Web Template

```yaml
version: 1
exclude:
  - '.github/template-updates.yml'
  - 'CHANGELOG.md'
  - '*.lock'
  - 'next-env.d.ts'
rules:
  - pattern: 'package.json'
    handler: 'builtin:package-json'
```

## Further Reading

- [Update Action README](../README.md) - Main action documentation
- [Template Architecture](../../../../TEMPLATE_PLACEHOLDER_STRATEGY.md) - System overview
- [Template Update System](../../../../core-template/.template-app/TEMPLATE_UPDATE_SYSTEM.md) - How updates work
