/* eslint-disable no-console */
import * as fs from 'node:fs';
import * as path from 'node:path';

interface ValidationResult {
  passed: boolean;
  message: string;
}

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Validate provisioned app structure
 */
export function validateProvisionedApp(appRoot: string = process.cwd()): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check workflows
  const workflowsDir = path.join(appRoot, '.github', 'workflows');

  // Should have release-app.yml
  const releaseAppPath = path.join(workflowsDir, 'release-app.yml');
  if (fs.existsSync(releaseAppPath)) {
    results.push({ passed: true, message: '✅ Has release-app.yml workflow' });
  } else {
    results.push({ passed: false, message: '❌ Missing release-app.yml workflow' });
  }

  // Should NOT have release-template.yml
  const releaseTemplatePath = path.join(workflowsDir, 'release-template.yml');
  if (!fs.existsSync(releaseTemplatePath)) {
    results.push({ passed: true, message: '✅ Does NOT have release-template.yml' });
  } else {
    results.push({ passed: false, message: '❌ Should NOT have release-template.yml' });
  }

  // Should NOT have retry-release.yml
  const retryReleasePath = path.join(workflowsDir, 'retry-release.yml');
  if (!fs.existsSync(retryReleasePath)) {
    results.push({ passed: true, message: '✅ Does NOT have retry-release.yml' });
  } else {
    results.push({ passed: false, message: '❌ Should NOT have retry-release.yml' });
  }

  // Should NOT have provision-template.yml
  const provisionTemplatePath = path.join(workflowsDir, 'provision-template.yml');
  if (!fs.existsSync(provisionTemplatePath)) {
    results.push({ passed: true, message: '✅ Does NOT have provision-template.yml' });
  } else {
    results.push({ passed: false, message: '❌ Should NOT have provision-template.yml' });
  }

  // Should have template-update.yml
  const templateUpdatePath = path.join(workflowsDir, 'template-update.yml');
  if (fs.existsSync(templateUpdatePath)) {
    results.push({ passed: true, message: '✅ Has template-update.yml workflow' });
  } else {
    results.push({ passed: false, message: '❌ Missing template-update.yml workflow' });
  }

  // Check template update configuration
  const templateUpdatesConfigPath = path.join(appRoot, '.github', 'template-updates.yml');
  if (fs.existsSync(templateUpdatesConfigPath)) {
    results.push({ passed: true, message: '✅ Has template-updates.yml configuration' });
  } else {
    results.push({ passed: false, message: '❌ Missing template-updates.yml configuration' });
  }

  // Check scripts
  const scriptsDir = path.join(appRoot, 'scripts');
  const appPackPath = path.join(scriptsDir, 'appPack.ts');
  if (fs.existsSync(appPackPath)) {
    results.push({ passed: true, message: '✅ Has appPack.ts script' });
  } else {
    results.push({ passed: false, message: '❌ Missing appPack.ts script' });
  }

  // Should NOT have template build scripts
  const templateScripts = [
    'templateWrap.ts',
    'templateTokenize.ts',
    'templatePack.ts',
    'templateRelease.ts',
  ];

  for (const script of templateScripts) {
    const scriptPath = path.join(scriptsDir, script);
    if (!fs.existsSync(scriptPath)) {
      results.push({ passed: true, message: `✅ Does NOT have ${script}` });
    } else {
      results.push({ passed: false, message: `❌ Should NOT have ${script}` });
    }
  }

  // Check package.json scripts
  const packageJsonPath = path.join(appRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (packageJson.scripts?.['app:pack']) {
      results.push({ passed: true, message: '✅ Has app:pack script in package.json' });
    } else {
      results.push({ passed: false, message: '❌ Missing app:pack script in package.json' });
    }
  } else {
    results.push({ passed: false, message: '❌ Missing package.json' });
  }

  // Check deployment workflows exist
  const deploymentWorkflows = ['deploy-dev.yml', 'deploy-qa.yml', 'deploy-prod.yml'];
  for (const workflow of deploymentWorkflows) {
    const workflowPath = path.join(workflowsDir, workflow);
    if (fs.existsSync(workflowPath)) {
      results.push({ passed: true, message: `✅ Has ${workflow} workflow` });
    } else {
      results.push({ passed: false, message: `❌ Missing ${workflow} workflow` });
    }
  }

  // Check source files exist
  const srcDir = path.join(appRoot, 'src');
  if (fs.existsSync(srcDir)) {
    results.push({ passed: true, message: '✅ Has src/ directory' });
  } else {
    results.push({ passed: false, message: '❌ Missing src/ directory' });
  }

  return results;
}

/**
 * Main validation function
 */
function main(): void {
  const appRoot = process.argv[2] || process.cwd();
  console.log(`🔍 Validating provisioned app structure at: ${appRoot}\n`);

  const results = validateProvisionedApp(appRoot);

  let passedCount = 0;
  let failedCount = 0;

  for (const result of results) {
    console.log(result.message);
    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log('='.repeat(50));

  if (failedCount > 0) {
    console.log('\n❌ Validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All validations passed!');
  }
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
