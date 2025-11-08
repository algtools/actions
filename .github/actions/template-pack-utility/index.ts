/* eslint-disable no-console */
import * as path from 'node:path';
import { wrapTemplate } from './templateWrap';
import { tokenizeTemplate } from './templateTokenize';
import { transformTemplateToApp } from './transformTemplateToApp';

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
