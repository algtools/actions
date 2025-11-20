/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface DependabotConfig {
  version: number;
  updates: Array<{
    'package-ecosystem': string;
    directory: string;
    schedule?: {
      interval: string;
    };
    'target-branch'?: string;
    'open-pull-requests-limit'?: number;
    labels?: string[];
    ignore?: Array<{
      'dependency-name': string;
    }>;
  }>;
}

/**
 * Get js-yaml module, installing if necessary
 */
function getYamlModule(): {
  load: (content: string) => unknown;
  dump: (
    obj: unknown,
    options?: { lineWidth?: number; noRefs?: boolean; sortKeys?: boolean },
  ) => string;
} {
  // Try to require js-yaml (should be installed by action.yml step in utility directory)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('js-yaml');
  } catch (error) {
    // If not available, try installing it in the current directory (utility directory)
    console.log('Installing js-yaml in utility directory...');
    try {
      execSync('pnpm add js-yaml@^4.1.0', {
        stdio: 'pipe',
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('js-yaml');
    } catch (installError) {
      console.error('Failed to install js-yaml:', installError);
      throw new Error(
        'Could not load js-yaml. Please ensure it is installed in the utility directory.',
      );
    }
  }
}

/**
 * Parse YAML file using js-yaml
 */
function parseYaml(filePath: string): unknown {
  const yaml = getYamlModule();
  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Stringify object to YAML using js-yaml
 */
function stringifyYaml(obj: unknown): string {
  const yaml = getYamlModule();
  return yaml.dump(obj, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}

/**
 * Extract all dependency names from package.json
 */
function extractDependencies(packageJsonPath: string): string[] {
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson: PackageJson = JSON.parse(packageJsonContent);

  const dependencies: string[] = [];

  // Extract from dependencies
  if (packageJson.dependencies) {
    dependencies.push(...Object.keys(packageJson.dependencies));
  }

  // Extract from devDependencies
  if (packageJson.devDependencies) {
    dependencies.push(...Object.keys(packageJson.devDependencies));
  }

  // Sort alphabetically for consistency
  return dependencies.sort();
}

/**
 * Update dependabot.yml in build directory to ignore all template dependencies
 * This updates the dependabot.yml that will be packaged for provisioned apps,
 * NOT the template's own dependabot.yml (which should continue updating template dependencies)
 */
export function updateDependabotConfig(templateRoot: string, buildDir: string): void {
  // Update dependabot.yml in build directory (for provisioned apps)
  const dependabotPath = path.join(buildDir, '.github', 'dependabot.yml');
  // Read dependencies from template root package.json
  const packageJsonPath = path.join(templateRoot, 'package.json');

  // Check if files exist
  if (!fs.existsSync(packageJsonPath)) {
    console.log('⚠️  package.json not found, skipping dependabot update');
    return;
  }

  if (!fs.existsSync(dependabotPath)) {
    console.log('⚠️  .github/dependabot.yml not found, skipping update');
    return;
  }

  console.log('📦 Extracting dependencies from package.json...');
  const dependencies = extractDependencies(packageJsonPath);
  console.log(`   Found ${dependencies.length} dependencies`);

  console.log('📝 Reading dependabot.yml...');
  const dependabotConfig = parseYaml(dependabotPath) as DependabotConfig;

  // Find the npm package-ecosystem entry
  const npmUpdate = dependabotConfig.updates.find(
    (update) => update['package-ecosystem'] === 'npm',
  );

  if (!npmUpdate) {
    console.log('⚠️  No npm package-ecosystem found in dependabot.yml');
    return;
  }

  // Create ignore array with all dependencies
  const ignoreEntries = dependencies.map((dep) => ({
    'dependency-name': dep,
  }));

  // Update the ignore array
  npmUpdate.ignore = ignoreEntries;

  console.log(`✅ Updated ignore list with ${dependencies.length} dependencies`);

  // Write back to file
  console.log('💾 Writing updated dependabot.yml...');
  const updatedYaml = stringifyYaml(dependabotConfig);
  fs.writeFileSync(dependabotPath, updatedYaml, 'utf-8');

  console.log('✅ Successfully updated .github/dependabot.yml for provisioned apps\n');
}
