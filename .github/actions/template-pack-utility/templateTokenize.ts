/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readTemplateConfig } from './readTemplateConfig';

interface TokenReplacement {
  pattern: RegExp | string;
  token: string;
  description: string;
}

/**
 * Generate token replacements based on template name
 */
function generateTokenReplacements(templateName: string): TokenReplacement[] {
  return [
    {
      pattern: new RegExp(templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      token: '{{SLUG}}',
      description: 'Project slug',
    },
    {
      pattern: new RegExp(
        `"name":\\s*"${templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
        'g',
      ),
      token: '"name": "{{SLUG}}"',
      description: 'Package name',
    },
    {
      pattern: /"slug":\s*"template"/g,
      token: '"slug": "{{SLUG}}"',
      description: 'Algtools slug',
    },
    {
      pattern: /"description":\s*".*?"/g,
      token: '"description": "{{DESCRIPTION}}"',
      description: 'Package description',
    },
    {
      pattern: /"prepareCmd":\s*"pnpm run template:pack"/g,
      token: '"prepareCmd": "pnpm run app:pack"',
      description: 'Semantic release prepare command for apps',
    },
    {
      pattern: new RegExp(
        `"path":\\s*"template-dist/${templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-v\\$\\{nextRelease\\.version\\}\\.tgz"`,
        'g',
      ),
      token: '"path": "app-dist/{{SLUG}}-v${nextRelease.version}.tgz"',
      description: 'Semantic release asset path for apps',
    },
    {
      pattern: new RegExp(
        `"label":\\s*"${templateName
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())} Package v\\$\\{nextRelease\\.version\\}"`,
        'g',
      ),
      token: '"label": "{{SLUG}} Package v${nextRelease.version}"',
      description: 'Semantic release asset label for apps',
    },
  ];
}

/**
 * Check if path should be excluded
 */
function shouldExclude(filePath: string, excludePatterns: string[], templateRoot: string): boolean {
  // Always exclude .template-app/exclude.json (config file shouldn't be in final package)
  const excludeJsonPath = path.join(templateRoot, '.template-app', 'exclude.json');
  if (filePath === excludeJsonPath || filePath.includes('.template-app/exclude.json')) {
    return true;
  }

  // Standard build exclusions (always exclude these)
  const standardExcludes = [
    'node_modules',
    'dist',
    'coverage',
    '.git',
    'pnpm-lock.yaml',
    '.template-build',
    'template-dist',
    'app-dist',
  ];

  // Check standard exclusions first
  for (const pattern of standardExcludes) {
    if (pattern.startsWith('.')) {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`[/\\\\]${escapedPattern}([/\\\\]|$|\\..*$)`);
      if (regex.test(filePath) || filePath.endsWith(pattern) || filePath === pattern) {
        return true;
      }
    } else if (filePath.includes(pattern)) {
      return true;
    }
  }

  // Check config-based exclusions
  return excludePatterns.some((pattern) => {
    // Normalize path separators for comparison
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // For patterns starting with '.', match at path boundaries or end of path
    // Also match wrapped versions (e.g., .cursorrules.-packed)
    if (normalizedPattern.startsWith('.')) {
      const escapedPattern = normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match pattern at start, after /, or at end, and also match wrapped versions
      const regex = new RegExp(`(^|[/\\\\])${escapedPattern}([/\\\\]|$|\\..*$)`);
      if (regex.test(normalizedPath) || normalizedPath.endsWith(normalizedPattern)) {
        return true;
      }
    }

    // For workflow patterns, match the full path
    if (normalizedPattern.includes('/')) {
      // Match exact path or path ending with pattern
      if (
        normalizedPath === normalizedPattern ||
        normalizedPath.endsWith('/' + normalizedPattern)
      ) {
        return true;
      }
      // Also match if pattern appears anywhere in the path
      if (normalizedPath.includes(normalizedPattern)) {
        return true;
      }
    }

    // General pattern matching
    return normalizedPath.includes(normalizedPattern);
  });
}

/**
 * Copy directory recursively with exclusions
 */
function copyDirectorySync(
  source: string,
  destination: string,
  excludePatterns: string[],
  templateRoot: string,
): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (shouldExclude(sourcePath, excludePatterns, templateRoot)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectorySync(sourcePath, destPath, excludePatterns, templateRoot);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

/**
 * Apply token replacements to file content
 */
function tokenizeContent(content: string, tokenReplacements: TokenReplacement[]): string {
  let tokenizedContent = content;

  for (const replacement of tokenReplacements) {
    if (replacement.pattern instanceof RegExp) {
      tokenizedContent = tokenizedContent.replace(replacement.pattern, replacement.token);
    } else {
      tokenizedContent = tokenizedContent.split(replacement.pattern).join(replacement.token);
    }
  }

  return tokenizedContent;
}

/**
 * Process file for tokenization
 */
function processFile(
  filePath: string,
  tokenReplacements: TokenReplacement[],
): { modified: boolean; replacements: number } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tokenizedContent = tokenizeContent(content, tokenReplacements);

    if (content !== tokenizedContent) {
      fs.writeFileSync(filePath, tokenizedContent, 'utf-8');
      return { modified: true, replacements: 1 };
    }

    return { modified: false, replacements: 0 };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EISDIR') {
      return { modified: false, replacements: 0 };
    }
    throw error;
  }
}

/**
 * Recursively tokenize all files in directory
 */
function tokenizeDirectory(
  dir: string,
  excludePatterns: string[],
  templateRoot: string,
  tokenReplacements: TokenReplacement[],
): { filesModified: number; totalReplacements: number } {
  let filesModified = 0;
  let totalReplacements = 0;

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (shouldExclude(fullPath, excludePatterns, templateRoot)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const result = processFile(fullPath, tokenReplacements);
        if (result.modified) {
          const relativePath = path.relative(dir, fullPath);
          console.warn(`  ✓ Tokenized: ${relativePath}`);
          filesModified++;
          totalReplacements += result.replacements;
        }
      }
    }
  }

  walk(dir);
  return { filesModified, totalReplacements };
}

/**
 * Tokenize template
 * @param templateRoot - Path to template root directory
 * @param templateName - Name of the template (e.g., 'bff-template')
 * @param buildDir - Path to build directory (defaults to .template-build)
 */
export function tokenizeTemplate(
  templateRoot: string,
  templateName: string,
  buildDir?: string,
): void {
  const BUILD_DIR = buildDir || path.join(templateRoot, '.template-build');

  console.warn('🔄 Starting template tokenization process...\n');

  // Read exclude patterns from config
  const excludePatterns = readTemplateConfig(templateRoot);

  // Generate token replacements based on template name
  const tokenReplacements = generateTokenReplacements(templateName);

  // Clean build directory if it exists
  if (fs.existsSync(BUILD_DIR)) {
    console.warn('🗑️  Cleaning existing build directory...');
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }

  // Create build directory
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  console.warn('📁 Created build directory\n');

  // Copy template to build directory (including .template-app/include/)
  console.warn('📋 Copying template files...');
  copyDirectorySync(templateRoot, BUILD_DIR, excludePatterns, templateRoot);
  console.warn('✅ Files copied\n');

  // Tokenize files in build directory
  console.warn('🔧 Tokenizing files...');
  const result = tokenizeDirectory(BUILD_DIR, excludePatterns, templateRoot, tokenReplacements);

  console.warn('\n' + '='.repeat(50));
  console.warn(`✅ Files modified: ${result.filesModified}`);
  console.warn(`🔄 Total replacements: ${result.totalReplacements}`);
  console.warn('='.repeat(50));
  console.warn(`\n✨ Tokenization completed! Build available at:\n   ${BUILD_DIR}\n`);
}
