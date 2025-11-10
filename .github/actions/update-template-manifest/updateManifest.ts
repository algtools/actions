/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

interface TemplateManifest {
  templateVersion: string;
  templateName: string;
  templateType?: string;
  description?: string;
  variables?: Record<string, unknown>;
  files: Record<string, { checksum: string; wrapped: boolean }>;
  managedSections: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// Files and directories to exclude from manifest
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'coverage',
  '.git',
  '.github',
  '.template-manifest.json',
  '.template-app/exclude.json',
  '.template-build',
  'template-dist',
  'app-dist',
  '.test-app-dist',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '.env',
  '.env.local',
  '.env.production',
  '.dev.vars',
  '.wrangler',
  '.vscode',
  '.idea',
  '.next',
  '.open-next',
  'storybook-static',
  'CHANGELOG.md',
  'AUTOMATED_VERSIONING_IMPLEMENTATION.md',
  'SEMANTIC_RELEASE_CONFLICT_FIX.md',
  'DEPLOYMENT_ISSUES_FIX.md',
  'STORYBOOK_INTEGRATION.md',
];

// File extensions to include in manifest
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
  '.toml',
];

/**
 * Calculate SHA-256 checksum of content
 */
function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath: string, templateRoot: string): boolean {
  const relativePath = path.relative(templateRoot, filePath);

  // Check if path matches any exclude pattern
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.includes('*')) {
      // Handle wildcard patterns
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if file extension is wrappable
 */
function isWrappableFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return WRAPPABLE_EXTENSIONS.includes(ext);
}

/**
 * Recursively find all files in directory
 */
function findFiles(dir: string, templateRoot: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (shouldExclude(fullPath, templateRoot)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && isWrappableFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Update template manifest with fresh checksums
 */
async function updateManifest(templateRoot: string): Promise<void> {
  console.log('🔄 Updating template manifest...\n');

  const manifestPath = path.join(templateRoot, '.template-manifest.json');

  // Load existing manifest
  let manifest: TemplateManifest;
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
    console.log(`📋 Loaded existing manifest for: ${manifest.templateName}`);
  } catch (error) {
    console.error('❌ Failed to load template manifest:', error);
    throw error;
  }

  // Get version from package.json
  const packageJsonPath = path.join(templateRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    manifest.templateVersion = packageJson.version;
    console.log(`📌 Version: ${manifest.templateVersion}`);
  }

  // Find all files to include
  const files = findFiles(templateRoot, templateRoot);
  console.log(`📁 Found ${files.length} files to checksum\n`);

  // Reset files section
  manifest.files = {};

  // Calculate checksums
  let processedCount = 0;
  for (const filePath of files) {
    const relativePath = path.relative(templateRoot, filePath).replace(/\\/g, '/');

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const checksum = calculateChecksum(content);

      manifest.files[relativePath] = {
        checksum: checksum,
        wrapped: false, // Will be set to true during packaging
      };

      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`  Processed ${processedCount}/${files.length} files...`);
      }
    } catch (error) {
      console.error(`⚠️  Error processing ${relativePath}:`, error);
    }
  }

  console.log(`\n✅ Processed ${processedCount} files`);

  // Update metadata
  const existingMetadata = typeof manifest.metadata === 'object' ? manifest.metadata : {};
  manifest.metadata = {
    ...existingMetadata,
    updatedAt: new Date().toISOString(),
  };

  // Write updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`\n✨ Manifest updated successfully!`);
  console.log(`📄 File: ${manifestPath}`);
  console.log(`📊 Total files tracked: ${Object.keys(manifest.files).length}`);
}

// Main execution
const args = process.argv.slice(2);
const templateRoot = args[0] || process.cwd();

updateManifest(path.resolve(templateRoot))
  .then(() => {
    console.log('\n✅ Manifest update completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Manifest update failed:', error);
    process.exit(1);
  });
