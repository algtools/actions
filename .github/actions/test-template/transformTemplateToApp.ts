/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Helper to create GitHub Actions expression syntax
 */
function ghaExpr(expr: string): string {
  return '${{ ' + expr + ' }}';
}

/**
 * Generate release-app.yml workflow content
 */
function generateReleaseAppWorkflow(): string {
  return `name: Release App

on:
  push:
    branches:
      - main
      - qa
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run mode'
        required: false
        type: boolean
        default: false

permissions:
  contents: write
  issues: write
  pull-requests: write
  packages: read
  deployments: write

jobs:
  # Check if this is a template repository
  check-template:
    name: Check Template
    runs-on: ubuntu-latest
    outputs:
      is_template: ${ghaExpr('steps.check.outputs.is_template')}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check if template repository
        id: check
        run: |
          if [ -f "scripts/templatePack.ts" ]; then
            echo "is_template=true" >> $GITHUB_OUTPUT
            echo "This is a template repository"
          else
            echo "is_template=false" >> $GITHUB_OUTPUT
            echo "This is a provisioned app"
          fi

  # Release app tarball
  release-app:
    name: Release App
    needs: check-template
    if: ${ghaExpr('needs.check-template.outputs.is_template')} == 'false'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check skip CI
        id: check-skip
        run: |
          if [[ "${ghaExpr('github.event.head_commit.message')}" == *"[skip ci]"* ]]; then
            echo "skip=true" >> $GITHUB_OUTPUT
          else
            echo "skip=false" >> $GITHUB_OUTPUT
          fi

      - name: Setup Node.js
        if: steps.check-skip.outputs.skip != 'true' || github.event_name == 'workflow_dispatch'
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        if: steps.check-skip.outputs.skip != 'true' || github.event_name == 'workflow_dispatch'
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Install dependencies
        if: steps.check-skip.outputs.skip != 'true' || github.event_name == 'workflow_dispatch'
        run: pnpm install --frozen-lockfile

      - name: Run semantic-release
        if: steps.check-skip.outputs.skip != 'true' || github.event_name == 'workflow_dispatch'
        env:
          GITHUB_TOKEN: ${ghaExpr('secrets.GITHUB_TOKEN')}
          NPM_TOKEN: ${ghaExpr('secrets.NPM_TOKEN')}
        run: |
          if [ "${ghaExpr('inputs.dry_run')}" = "true" ]; then
            pnpm exec semantic-release --dry-run
          else
            pnpm exec semantic-release
          fi
`;
}

/**
 * Generate appPack.ts script content
 * @param templateType - Type of template ('web', 'core', or 'bff')
 */
function generateAppPackScript(templateType: string): string {
  const webSpecificExcludes =
    templateType === 'web'
      ? `
            '.next',
            '.open-next',
            'storybook-static',
            'scripts/build-storybook.mjs',
            'scripts/copy-storybook-to-public.mjs',
            'scripts/build-worker-wrapper.mjs',`
      : '';

  return `/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tar from 'tar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'app-dist');

interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

/**
 * Get package version from package.json
 */
function getPackageVersion(): string {
  const packageJsonPath = path.join(APP_ROOT, 'package.json');
  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

/**
 * Get package name from package.json
 */
function getPackageName(): string {
  const packageJsonPath = path.join(APP_ROOT, 'package.json');
  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.name;
}

/**
 * Pack app into .tgz
 */
async function packApp(): Promise<void> {
  console.log('📦 Starting app packaging process...\\n');

  const version = getPackageVersion();
  const appName = getPackageName();
  console.log(\`📌 App: \${appName}\`);
  console.log(\`📌 Version: \${version}\\n\`);

  // Create dist directory
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Pack the app
  console.log('📦 Creating package archive...');
  const tarballName = \`\${appName}-v\${version}.tgz\`;
  const tarballPath = path.join(DIST_DIR, tarballName);

  try {
    // Create tarball using tar library
    console.log('  📦 Creating tarball archive...');

    await tar.create(
      {
        file: tarballPath,
        cwd: APP_ROOT,
        gzip: true,
        filter: (filePath: string) => {
          // Exclude development and build artifacts
          const excludePatterns = [
            'node_modules',
            'dist',
            '.git',
            'coverage',
            '.template-build',
            'template-dist',
            'app-dist',
            '.env',
            '.env.local',
            '.dev.vars',
            '.DS_Store',
            'Thumbs.db',
            '.vscode',
            '.idea',${webSpecificExcludes}
            // Exclude template-specific files
            'scripts/templateWrap.ts',
            'scripts/templateTokenize.ts',
            'scripts/templatePack.ts',
            'scripts/templateRelease.ts',
            // Exclude template-specific workflows
            '.github/workflows/release-template.yml',
            '.github/workflows/retry-release.yml',
            '.github/workflows/provision-template.yml',
          ];

          // Check exact matches and path contains
          for (const pattern of excludePatterns) {
            if (filePath.includes(pattern)) {
              return false;
            }
          }

          // Check wildcard patterns
          if (filePath.match(/\\.log$/)) {
            return false;
          }
          if (filePath.match(/\\.swp$/)) {
            return false;
          }
          if (filePath.match(/\\.swo$/)) {
            return false;
          }

          return true;
        },
      },
      ['.'],
    );

    console.log('  ✓ Created tarball');
  } catch (error) {
    console.error('❌ Packing failed');
    throw error;
  }

  // Calculate archive size
  const stats = fs.statSync(tarballPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\\n' + '='.repeat(50));
  console.log('✨ App packaging completed!');
  console.log('='.repeat(50));
  console.log(\`📦 Archive: \${tarballName}\`);
  console.log(\`📍 Location: \${tarballPath}\`);
  console.log(\`📊 Size: \${sizeMB} MB\`);
  console.log('='.repeat(50));
  console.log('\\n💡 Next steps:');
  console.log(
    '  The tarball will be uploaded to GitHub release automatically by semantic-release\\n',
  );
}

// Run the script
packApp().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
`;
}

/**
 * Check if a file path matches an exclude pattern
 */
function matchesExcludePattern(filePath: string, pattern: string): boolean {
  if (pattern.startsWith('.')) {
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[/\\\\]${escapedPattern}([/\\\\]|$)`);
    return regex.test(filePath) || filePath.endsWith(pattern) || filePath === pattern;
  }
  return filePath.includes(pattern);
}

/**
 * Read exclude patterns from .template-app/exclude.json
 */
function readExcludePatterns(templateRoot: string): string[] {
  const configPath = path.join(templateRoot, '.template-app', 'exclude.json');
  const defaultPatterns = [
    '.github/workflows/release-template.yml',
    '.github/workflows/retry-release.yml',
    '.github/workflows/provision-template.yml',
    '.cursorrules',
    'scripts/templateWrap.ts',
    'scripts/templateTokenize.ts',
    'scripts/templatePack.ts',
    'scripts/templateRelease.ts',
  ];

  if (!fs.existsSync(configPath)) {
    return defaultPatterns;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const excludePatterns = JSON.parse(configContent) as unknown;
    if (Array.isArray(excludePatterns) && excludePatterns.every((p) => typeof p === 'string')) {
      return excludePatterns as string[];
    }
  } catch {
    // Fall through to default
  }

  return defaultPatterns;
}

/**
 * Copy directory recursively
 */
function copyDirectorySync(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

/**
 * Transform template structure to app structure
 * @param buildDir - Path to the build directory (where tokenized template is)
 * @param templateRoot - Path to the template root (for reading exclude.json and include folder)
 * @param templateType - Type of template ('web', 'core', or 'bff')
 */
export function transformTemplateToApp(
  buildDir: string,
  templateRoot?: string,
  templateType: string = 'bff',
): void {
  console.log('🔄 Step 3: Transforming template to app structure...');

  const workflowsDir = path.join(buildDir, '.github', 'workflows');
  const scriptsDir = path.join(buildDir, 'scripts');
  const packageJsonPath = path.join(buildDir, 'package.json');

  // Read exclude patterns from template root
  const excludePatterns = templateRoot ? readExcludePatterns(templateRoot) : [];

  // Ensure workflows directory exists
  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
    console.log('  ✓ Created .github/workflows directory');
  }

  // Ensure scripts directory exists
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log('  ✓ Created scripts directory');
  }

  // 1. Copy files from .template-app/include/ to build directory root
  if (templateRoot) {
    const includeDir = path.join(templateRoot, '.template-app', 'include');
    if (fs.existsSync(includeDir)) {
      console.log('  📋 Copying files from .template-app/include/...');

      // Delete ENTIRE .github directory to ensure template .github is completely replaced
      const buildGithubDir = path.join(buildDir, '.github');
      if (fs.existsSync(buildGithubDir)) {
        console.log('  🗑️  Removing template .github directory before copying app .github...');
        fs.rmSync(buildGithubDir, { recursive: true, force: true });
      }

      copyDirectorySync(includeDir, buildDir);
      console.log('  ✓ Copied files from include folder (including app .github)');

      // Ensure .cursorrules is in the right place
      const includeCursorRules = path.join(includeDir, '.cursorrules');
      const targetCursorRules = path.join(buildDir, '.cursorrules');
      if (fs.existsSync(includeCursorRules)) {
        // Remove existing .cursorrules if it exists (template dev version)
        if (fs.existsSync(targetCursorRules)) {
          fs.unlinkSync(targetCursorRules);
        }
        fs.copyFileSync(includeCursorRules, targetCursorRules);
        console.log('  ✓ Copied .cursorrules from include folder');
      }
    } else {
      console.log('  ⚠️  .template-app/include/ folder not found, using fallback');
      // Fallback: Generate release-app.yml if include folder doesn't exist
      const releaseAppPath = path.join(workflowsDir, 'release-app.yml');
      if (!fs.existsSync(releaseAppPath)) {
        const releaseAppContent = generateReleaseAppWorkflow();
        fs.writeFileSync(releaseAppPath, releaseAppContent, 'utf-8');
        console.log('  ✓ Created release-app.yml (fallback)');
      }
    }
  } else {
    // Fallback: Generate release-app.yml if templateRoot not provided
    const releaseAppPath = path.join(workflowsDir, 'release-app.yml');
    if (!fs.existsSync(releaseAppPath)) {
      const releaseAppContent = generateReleaseAppWorkflow();
      fs.writeFileSync(releaseAppPath, releaseAppContent, 'utf-8');
      console.log('  ✓ Created release-app.yml (fallback)');
    }
  }

  // 2. Remove .template-app/ folder from build directory (it shouldn't appear in final package)
  const templateAppDir = path.join(buildDir, '.template-app');
  if (fs.existsSync(templateAppDir)) {
    fs.rmSync(templateAppDir, { recursive: true, force: true });
    console.log('  ✓ Removed .template-app/ folder from build');
  }

  // 3. Verify .github directory is from include
  if (fs.existsSync(workflowsDir)) {
    const workflowFiles = fs.readdirSync(workflowsDir);
    console.log(`  ✓ App .github/workflows directory has ${workflowFiles.length} workflow(s)`);
    workflowFiles.forEach((file) => console.log(`    - ${file}`));
  } else {
    console.log(
      '  ⚠️  No .github/workflows directory found (this may be expected for some templates)',
    );
  }

  // 4. Ensure appPack.ts exists
  const appPackPath = path.join(scriptsDir, 'appPack.ts');
  if (!fs.existsSync(appPackPath)) {
    // Check if source template has appPack.ts (for bff-template)
    if (templateRoot) {
      const sourceAppPackPath = path.join(templateRoot, 'scripts', 'appPack.ts');
      if (fs.existsSync(sourceAppPackPath)) {
        fs.copyFileSync(sourceAppPackPath, appPackPath);
        console.log('  ✓ Copied appPack.ts from source');
      } else {
        // Generate appPack.ts
        const appPackContent = generateAppPackScript(templateType);
        fs.writeFileSync(appPackPath, appPackContent, 'utf-8');
        console.log('  ✓ Created appPack.ts');
      }
    } else {
      // Generate appPack.ts
      const appPackContent = generateAppPackScript(templateType);
      fs.writeFileSync(appPackPath, appPackContent, 'utf-8');
      console.log('  ✓ Created appPack.ts');
    }
  } else {
    console.log('  ✓ appPack.ts already exists');
  }

  // 5. Update package.json to ensure app:pack script exists
  if (fs.existsSync(packageJsonPath)) {
    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (packageJson.scripts && typeof packageJson.scripts === 'object') {
      const scripts = packageJson.scripts as Record<string, string>;
      if (!scripts['app:pack']) {
        scripts['app:pack'] = 'tsx scripts/appPack.ts';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
        console.log('  ✓ Added app:pack script to package.json');
      } else {
        console.log('  ✓ app:pack script already exists in package.json');
      }
    }
  }

  console.log('✅ Template to app transformation complete');
}
