#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { minimatch } = require('minimatch');

/**
 * Rule Engine for Template Updates
 * Processes files according to custom rules defined in merge-rules.yml
 */

class RuleEngine {
  constructor() {
    this.rules = null;
    this.handlers = new Map();
    this.loadBuiltinHandlers();
  }

  /**
   * Load built-in rule handlers
   */
  loadBuiltinHandlers() {
    const builtinDir = path.join(__dirname, 'builtin');

    if (!fs.existsSync(builtinDir)) {
      return;
    }

    const files = fs.readdirSync(builtinDir).filter((f) => f.endsWith('.js'));

    for (const file of files) {
      try {
        const handler = require(path.join(builtinDir, file));
        if (handler && handler.name) {
          this.handlers.set(`builtin:${handler.name}`, handler);
        }
      } catch (error) {
        console.error(`Failed to load handler ${file}:`, error.message);
      }
    }
  }

  /**
   * Load rules from YAML file
   */
  loadRules(rulesPath) {
    if (!fs.existsSync(rulesPath)) {
      console.warn(`Rules file not found: ${rulesPath}`);
      return null;
    }

    try {
      const content = fs.readFileSync(rulesPath, 'utf8');
      this.rules = yaml.load(content);

      // Validate version
      if (this.rules.version !== 1) {
        throw new Error(`Unsupported rules version: ${this.rules.version}`);
      }

      console.log(`✓ Loaded ${this.rules.rules?.length || 0} rule(s)`);
      return this.rules;
    } catch (error) {
      console.error(`Failed to load rules: ${error.message}`);
      return null;
    }
  }

  /**
   * Find matching rule for a file
   */
  matchFile(filePath) {
    if (!this.rules || !this.rules.rules) {
      return null;
    }

    for (const rule of this.rules.rules) {
      if (minimatch(filePath, rule.pattern)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Check if file is excluded
   */
  isExcluded(filePath) {
    if (!this.rules || !this.rules.exclude) {
      return false;
    }

    for (const pattern of this.rules.exclude) {
      if (minimatch(filePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Execute handler for a file
   */
  async executeHandler(rule, context) {
    const handler = this.handlers.get(rule.handler);

    if (!handler) {
      console.warn(`Handler not found: ${rule.handler}`);
      return {
        applied: false,
        error: `Handler not found: ${rule.handler}`,
      };
    }

    try {
      const result = await handler.process({
        ...context,
        config: rule.config || {},
      });

      return {
        applied: true,
        ...result,
      };
    } catch (error) {
      return {
        applied: false,
        error: error.message,
      };
    }
  }

  /**
   * Process a file through the rule engine
   */
  async processFile(filePath) {
    // Check if file is excluded
    if (this.isExcluded(filePath)) {
      console.log(`  ⊘ Excluded: ${filePath}`);
      return { excluded: true };
    }

    // Find matching rule
    const rule = this.matchFile(filePath);

    if (!rule) {
      console.log(`  ℹ No rule: ${filePath}`);
      return { noRule: true };
    }

    console.log(`  ⚙ Processing: ${filePath} (${rule.handler})`);

    // Read files
    const appFilePath = filePath;

    if (!fs.existsSync(appFilePath)) {
      console.log(`    File not found, skipping`);
      return { skipped: true };
    }

    const appContent = fs.readFileSync(appFilePath, 'utf8');

    // Execute handler
    const result = await this.executeHandler(rule, {
      filePath,
      appContent,
      appFilePath,
    });

    if (result.applied && result.content) {
      // Write back the processed content
      fs.writeFileSync(appFilePath, result.content, 'utf8');
      console.log(`    ✓ Applied`);
    }

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((w) => console.log(`    ⚠ ${w}`));
    }

    return result;
  }
}

// CLI Interface
if (require.main === module) {
  const engine = new RuleEngine();

  const command = process.argv[2];

  if (command === 'process-file') {
    const filePath = process.argv[3];

    if (!filePath) {
      console.error('Usage: rule-engine.js process-file <file-path>');
      process.exit(1);
    }

    // Try to load rules from .template-app/merge-rules.yml
    const rulesPath = path.join(process.cwd(), '.template-app', 'merge-rules.yml');
    engine.loadRules(rulesPath);

    engine.processFile(filePath).catch((error) => {
      console.error('Error processing file:', error);
      process.exit(1);
    });
  } else {
    console.error('Unknown command:', command);
    console.error('Available commands: process-file');
    process.exit(1);
  }
}

module.exports = RuleEngine;
