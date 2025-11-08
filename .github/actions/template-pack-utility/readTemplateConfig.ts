/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Default exclusion patterns if exclude.json is not found
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  '.github/workflows/release-template.yml',
  '.github/workflows/retry-release.yml',
  '.github/workflows/provision-template.yml',
  '.cursorrules',
  'scripts/templateWrap.ts',
  'scripts/templateTokenize.ts',
  'scripts/templatePack.ts',
  'scripts/templateRelease.ts',
];

/**
 * Read and parse .template-app/exclude.json from template root
 * @param templateRoot - Path to the template root directory
 * @returns Array of exclusion patterns
 */
export function readTemplateConfig(templateRoot: string): string[] {
  const configPath = path.join(templateRoot, '.template-app', 'exclude.json');

  // If config file doesn't exist, return default patterns
  if (!fs.existsSync(configPath)) {
    console.warn(
      `⚠️  .template-app/exclude.json not found at ${configPath}, using default exclusion patterns`,
    );
    return DEFAULT_EXCLUDE_PATTERNS;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    // Trim whitespace and check for empty content
    const trimmedContent = configContent.trim();
    if (!trimmedContent) {
      console.warn(`⚠️  .template-app/exclude.json is empty, using default exclusion patterns`);
      return DEFAULT_EXCLUDE_PATTERNS;
    }

    const excludePatterns = JSON.parse(trimmedContent) as unknown;

    // Validate that it's an array of strings
    if (!Array.isArray(excludePatterns)) {
      console.warn(
        `⚠️  .template-app/exclude.json is not an array, using default exclusion patterns`,
      );
      console.warn(`   Config path: ${configPath}`);
      console.warn(`   Parsed content type: ${typeof excludePatterns}`);
      console.warn(`   Parsed content: ${JSON.stringify(excludePatterns)}`);
      console.warn(`   Raw content (first 200 chars): ${trimmedContent.substring(0, 200)}`);
      return DEFAULT_EXCLUDE_PATTERNS;
    }

    if (!excludePatterns.every((pattern) => typeof pattern === 'string')) {
      console.warn(
        `⚠️  .template-app/exclude.json contains non-string values, using default exclusion patterns`,
      );
      return DEFAULT_EXCLUDE_PATTERNS;
    }

    console.log(
      `✓ Loaded ${excludePatterns.length} exclusion patterns from .template-app/exclude.json`,
    );
    return excludePatterns as string[];
  } catch (error) {
    console.error(
      `❌ Error reading .template-app/exclude.json: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.warn('Using default exclusion patterns');
    return DEFAULT_EXCLUDE_PATTERNS;
  }
}
