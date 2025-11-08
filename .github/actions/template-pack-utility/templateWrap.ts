/* eslint-disable no-console */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface ManagedSection {
  file: string;
  startLine: number;
  endLine: number;
  checksum: string;
  content: string;
}

interface TemplateManifest {
  templateVersion: string;
  templateName: string;
  files: Record<string, { checksum: string; wrapped: boolean }>;
  managedSections: Record<string, ManagedSection[]>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// Files and directories to exclude from wrapping (build artifacts, not template files)
const WRAP_EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'coverage',
  '.git',
  '.template-manifest.json',
  '.template-app/exclude.json',
  'pnpm-lock.yaml',
  '.template-build',
  'template-dist',
  'app-dist',
];

// File extensions to wrap
const WRAPPABLE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.jsonc',
  '.yml',
  '.yaml',
  '.md',
  '.sql',
  '.prisma',
  '.cjs',
  '.mjs',
  '.mts',
  '.css',
];

/**
 * Calculate SHA-256 checksum of content
 */
function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Check if file should be excluded from wrapping
 * Note: .template-app folder should be wrapped (for checksum tracking)
 */
function shouldExclude(filePath: string): boolean {
  return WRAP_EXCLUDE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

/**
 * Check if file should be wrapped based on extension
 */
function shouldWrap(filePath: string): boolean {
  const ext = path.extname(filePath);
  return WRAPPABLE_EXTENSIONS.includes(ext);
}

/**
 * Get comment syntax for file type
 */
function getCommentSyntax(filePath: string): { start: string; end: string; line?: string } {
  const ext = path.extname(filePath);

  switch (ext) {
    case '.json':
    case '.jsonc':
      return { start: '', end: '', line: '' };
    case '.yml':
    case '.yaml':
      return { start: '', end: '', line: '#' };
    case '.md':
      return { start: '<!--', end: '-->', line: '' };
    case '.sql':
      return { start: '/*', end: '*/', line: '--' };
    default:
      return { start: '/*', end: '*/', line: '//' };
  }
}

/**
 * Wrap file content with template markers
 */
function wrapFileContent(filePath: string, content: string, templateRoot: string): string {
  const relativePath = path.relative(templateRoot, filePath);
  const checksum = calculateChecksum(content);
  const comments = getCommentSyntax(filePath);

  // Special handling for JSON files - add metadata at top level
  if (path.extname(filePath) === '.json') {
    try {
      const jsonContent = JSON.parse(content);
      // Don't wrap if it already has __template metadata
      if ('__template' in jsonContent) {
        return content;
      }
      const wrappedJson = {
        __template: {
          path: relativePath,
          checksum: checksum,
          version: 'v1',
        },
        ...jsonContent,
      };
      return JSON.stringify(wrappedJson, null, 2);
    } catch {
      return content;
    }
  }

  // For YAML files, use comment syntax
  if (comments.line) {
    const header = `${comments.line} @template-start:v1 ${relativePath} sha256:${checksum}\n`;
    const footer = `\n${comments.line} @template-end:v1`;
    return header + content + footer;
  }

  // For files with block comments
  if (comments.start && comments.end) {
    const header = `${comments.start} @template-start:v1 ${relativePath} sha256:${checksum} ${comments.end}\n`;
    const footer = `\n${comments.start} @template-end:v1 ${comments.end}`;
    return header + content + footer;
  }

  return content;
}

/**
 * Check if file is already wrapped
 */
function isAlreadyWrapped(content: string): boolean {
  return content.includes('@template-start:v1') || content.includes('__template');
}

/**
 * Recursively find all files to wrap
 */
function findFilesToWrap(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (shouldExclude(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && shouldWrap(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Wrap template files with template markers
 * @param templateRoot - Path to template root directory
 */
export function wrapTemplate(templateRoot: string): void {
  console.warn('🔄 Starting template wrapping process...\n');

  const manifestPath = path.join(templateRoot, '.template-manifest.json');

  // Load manifest
  let manifest: TemplateManifest;
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    console.error('❌ Failed to load template manifest:', error);
    throw error;
  }

  // Find all files to wrap (including .template-app folder)
  const filesToWrap = findFilesToWrap(templateRoot);
  console.warn(`📁 Found ${filesToWrap.length} files to process\n`);

  let wrappedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process each file
  for (const filePath of filesToWrap) {
    const relativePath = path.relative(templateRoot, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Skip if already wrapped
      if (isAlreadyWrapped(content)) {
        console.warn(`⏭️  Skipped (already wrapped): ${relativePath}`);
        skippedCount++;
        continue;
      }

      // Calculate checksum and wrap content
      const checksum = calculateChecksum(content);
      const wrappedContent = wrapFileContent(filePath, content, templateRoot);

      // Write wrapped content back to file
      fs.writeFileSync(filePath, wrappedContent, 'utf-8');

      // Update manifest
      if (!manifest.files) {
        manifest.files = {};
      }
      manifest.files[relativePath] = {
        checksum: checksum,
        wrapped: true,
      };

      console.warn(`✅ Wrapped: ${relativePath}`);
      wrappedCount++;
    } catch (error) {
      console.error(`❌ Error processing ${relativePath}:`, error);
      errorCount++;
    }
  }

  // Update manifest metadata
  const existingMetadata =
    typeof manifest.metadata === 'object' && manifest.metadata !== null
      ? (manifest.metadata as Record<string, unknown>)
      : {};
  manifest.metadata = {
    ...existingMetadata,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.warn('\n' + '='.repeat(50));
  console.warn(`✅ Wrapped: ${wrappedCount} files`);
  console.warn(`⏭️  Skipped: ${skippedCount} files`);
  console.warn(`❌ Errors: ${errorCount} files`);
  console.warn('='.repeat(50));
  console.warn('\n✨ Template wrapping completed!\n');
}
