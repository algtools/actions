/* eslint-disable no-console */
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { wrapTemplate } from './templateWrap';
import { tokenizeTemplate } from './templateTokenize';
import { transformTemplateToApp } from './transformTemplateToApp';

/**
 * Format files with Prettier to ensure consistency
 * Skip formatting if files have template markers (they're wrapped)
 */
function formatFiles(directory: string, description: string): void {
  try {
    console.log(`🎨 Formatting ${description} with Prettier...`);

    // Run prettier on the directory, ignore errors from files with template markers
    execSync('pnpm exec prettier --write . --log-level=error', {
      cwd: directory,
      stdio: 'inherit',
    });

    console.log(`✅ ${description} formatted\n`);
  } catch (error) {
    // Don't log the full error, just note that some files couldn't be formatted
    // (this is expected for wrapped files with template markers)
    console.log(
      `⚠️  Some files could not be formatted (likely wrapped template files), continuing...\n`,
    );
  }
}

/**
 * Main entry point for template packaging
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const workingDirectory = args[0] || process.cwd();
  const templateName = args[1] || '';
  const templateType = (args[2] || 'bff') as 'web' | 'core' | 'bff';

  if (!templateName) {
    console.error('❌ Error: template_name is required');
    process.exit(1);
  }

  const templateRoot = path.resolve(workingDirectory);
  const buildDir = path.join(templateRoot, '.template-build');

  try {
    // Step 1: Wrap template files
    console.log('\n' + '='.repeat(50));
    console.log('Step 1: Wrapping template files');
    console.log('='.repeat(50) + '\n');
    wrapTemplate(templateRoot);

    // Step 1.5: Format wrapped files with Prettier
    console.log('\n' + '='.repeat(50));
    console.log('Step 1.5: Formatting wrapped files');
    console.log('='.repeat(50) + '\n');
    formatFiles(templateRoot, 'source template files');

    // Step 2: Tokenize template
    console.log('\n' + '='.repeat(50));
    console.log('Step 2: Tokenizing template');
    console.log('='.repeat(50) + '\n');
    tokenizeTemplate(templateRoot, templateName, buildDir);

    // Step 3: Transform template to app
    console.log('\n' + '='.repeat(50));
    console.log('Step 3: Transforming template to app');
    console.log('='.repeat(50) + '\n');
    transformTemplateToApp(buildDir, templateRoot, templateType);

    // Step 4: Format build directory files
    console.log('\n' + '='.repeat(50));
    console.log('Step 4: Formatting build directory');
    console.log('='.repeat(50) + '\n');
    formatFiles(buildDir, 'build directory files');

    console.log('\n' + '='.repeat(50));
    console.log('✨ Template packaging preparation completed!');
    console.log('='.repeat(50));
    console.log(`📁 Build directory: ${buildDir}\n`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
