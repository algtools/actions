/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readTemplateConfig } from './readTemplateConfig';

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
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
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  // For patterns with slashes (like .github/workflows/release-template.yml)
  // Check if the pattern appears in the path
  if (normalizedPattern.includes('/')) {
    // Exact match or path ends with pattern
    if (normalizedPath === normalizedPattern || normalizedPath.endsWith('/' + normalizedPattern)) {
      return true;
    }
    // Pattern appears anywhere in the path
    if (normalizedPath.includes(normalizedPattern)) {
      return true;
    }
    // Also check if path ends with just the filename part
    const patternFileName = normalizedPattern.split('/').pop();
    if (patternFileName && normalizedPath.endsWith('/' + patternFileName)) {
      // Check if the directory structure matches
      const pathParts = normalizedPath.split('/');
      const patternParts = normalizedPattern.split('/');
      // Check if the last N parts of the path match the pattern
      if (pathParts.length >= patternParts.length) {
        const pathSuffix = pathParts.slice(-patternParts.length).join('/');
        if (pathSuffix === normalizedPattern) {
          return true;
        }
      }
    }
  }

  // For patterns starting with '.', match at path boundaries
  if (normalizedPattern.startsWith('.')) {
    const escapedPattern = normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match pattern at start, after /, or at end, and also match wrapped versions (e.g., .cursorrules.-packed)
    const regex = new RegExp(`(^|[/\\\\])${escapedPattern}([/\\\\]|$|\\..*$)`);
    return regex.test(normalizedPath) || normalizedPath.endsWith(normalizedPattern);
  }

  // General pattern matching
  return normalizedPath.includes(normalizedPattern);
}

/**
 * Recursively remove excluded files from build directory
 */
function removeExcludedFiles(dir: string, excludePatterns: string[], buildDirRoot: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      // Use forward slashes for consistent path matching
      const relativePath = path.relative(buildDirRoot, fullPath).replace(/\\/g, '/');

      // Ensure relative path starts with ./ for root-level files/dirs, or keep as-is
      const normalizedRelativePath = relativePath || entry.name;

      // Check if this file/directory should be excluded
      const shouldExclude = excludePatterns.some((pattern) => {
        const matches = matchesExcludePattern(normalizedRelativePath, pattern);
        if (matches) {
          console.log(`    🎯 Pattern "${pattern}" matches "${normalizedRelativePath}"`);
        }
        return matches;
      });

      if (shouldExclude) {
        try {
          if (entry.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`    ✓ Removed directory: ${normalizedRelativePath}`);
          } else {
            fs.unlinkSync(fullPath);
            console.log(`    ✓ Removed file: ${normalizedRelativePath}`);
          }
        } catch (error) {
          console.warn(`    ⚠️  Failed to remove ${normalizedRelativePath}: ${error}`);
        }
        continue;
      }

      // Recursively process subdirectories (including hidden ones like .github)
      if (entry.isDirectory()) {
        removeExcludedFiles(fullPath, excludePatterns, buildDirRoot);
      }
    }
  } catch (error) {
    console.warn(`    ⚠️  Error reading directory ${dir}: ${error}`);
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
  const excludePatterns = templateRoot ? readTemplateConfig(templateRoot) : [];

  // 1. Remove excluded files FIRST (before copying from include)
  // This removes template-specific files from the tokenized template
  if (excludePatterns.length > 0) {
    console.log('  🗑️  Removing excluded template files...');
    removeExcludedFiles(buildDir, excludePatterns, buildDir);
    console.log('  ✓ Excluded template files removed');
  }

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

  // 2. Copy app workflows from .github/workflows/app/ to .github/workflows/
  const templateAppWorkflowsDir = path.join(buildDir, '.github', 'workflows', 'app');
  if (fs.existsSync(templateAppWorkflowsDir)) {
    console.log('  📋 Copying app workflows from .github/workflows/app/...');

    const appWorkflowFiles = fs.readdirSync(templateAppWorkflowsDir);
    for (const file of appWorkflowFiles) {
      const sourcePath = path.join(templateAppWorkflowsDir, file);
      const destPath = path.join(workflowsDir, file);
      fs.copyFileSync(sourcePath, destPath);
    }

    // Remove the app subdirectory
    fs.rmSync(templateAppWorkflowsDir, { recursive: true, force: true });
    console.log(`  ✓ Copied ${appWorkflowFiles.length} app workflow(s) to .github/workflows/`);
  }

  // 3. Copy app actions from .github/actions/app/ to .github/actions/ (if they exist)
  const templateAppActionsDir = path.join(buildDir, '.github', 'actions', 'app');
  if (fs.existsSync(templateAppActionsDir)) {
    console.log('  📋 Copying app actions from .github/actions/app/...');

    const actionsDir = path.join(buildDir, '.github', 'actions');
    const appActionDirs = fs.readdirSync(templateAppActionsDir, { withFileTypes: true });
    for (const actionDir of appActionDirs) {
      if (actionDir.isDirectory()) {
        const sourcePath = path.join(templateAppActionsDir, actionDir.name);
        const destPath = path.join(actionsDir, actionDir.name);
        copyDirectorySync(sourcePath, destPath);
      }
    }

    // Remove the app subdirectory
    fs.rmSync(templateAppActionsDir, { recursive: true, force: true });
    console.log(`  ✓ Copied ${appActionDirs.length} app action(s) to .github/actions/`);
  }

  // 4. Copy files from .template-app/include/ to build directory root
  if (templateRoot) {
    const includeDir = path.join(templateRoot, '.template-app', 'include');
    if (fs.existsSync(includeDir)) {
      console.log('  📋 Copying provision-only files from .template-app/include/...');

      copyDirectorySync(includeDir, buildDir);
      console.log('  ✓ Copied provision-only files from include folder');

      // Verify .cursor directory was copied
      const targetCursorDir = path.join(buildDir, '.cursor');
      if (fs.existsSync(targetCursorDir)) {
        const rulesDir = path.join(targetCursorDir, 'rules');
        if (fs.existsSync(rulesDir)) {
          const ruleFiles = fs.readdirSync(rulesDir);
          console.log(`  ✓ Copied .cursor/rules/ with ${ruleFiles.length} rule file(s)`);
        }
      }
    } else {
      console.log('  ⚠️  .template-app/include/ folder not found, skipping include copy');
    }
  }

  // 5. Verify .github/workflows directory
  if (fs.existsSync(workflowsDir)) {
    const workflowFiles = fs.readdirSync(workflowsDir);
    console.log(`  ✓ App .github/workflows directory has ${workflowFiles.length} workflow(s)`);
    workflowFiles.forEach((file) => console.log(`    - ${file}`));
  } else {
    console.log(
      '  ⚠️  No .github/workflows directory found (this may be expected for some templates)',
    );
  }

  // 6. Remove .template-app/ folder from build directory (it shouldn't appear in final package)
  const templateAppDir = path.join(buildDir, '.template-app');
  if (fs.existsSync(templateAppDir)) {
    fs.rmSync(templateAppDir, { recursive: true, force: true });
    console.log('  ✓ Removed .template-app/ folder from build');
  }

  // 7. Ensure appPack.ts exists
  const appPackPath = path.join(scriptsDir, 'appPack.ts');
  if (!fs.existsSync(appPackPath)) {
    // Check if source template has appPack.ts
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

  // 8. Update package.json to ensure app:pack script exists
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
