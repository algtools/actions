/* eslint-disable no-console */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Create GitHub release for template
 */
export interface CreateReleaseOptions {
  templateName: string;
  version: string;
  tarballPath: string;
  workingDirectory?: string;
  draft?: boolean;
  githubToken?: string;
}

export async function createTemplateRelease(options: CreateReleaseOptions): Promise<void> {
  const {
    templateName,
    version,
    tarballPath,
    workingDirectory = process.cwd(),
    draft = false,
    githubToken,
  } = options;

  const tagName = `${templateName}-v${version}`;
  const fullTarballPath = path.isAbsolute(tarballPath)
    ? tarballPath
    : path.join(workingDirectory, tarballPath);

  // Verify tarball exists
  if (!fs.existsSync(fullTarballPath)) {
    throw new Error(`Tarball not found: ${fullTarballPath}`);
  }

  console.log('🚀 Creating GitHub release...\n');
  console.log(`  Template: ${templateName}`);
  console.log(`  Version: ${version}`);
  console.log(`  Tag: ${tagName}`);
  console.log(`  Tarball: ${fullTarballPath}`);
  console.log(`  Draft: ${draft}\n`);

  // Set GitHub token if provided
  const env = githubToken ? { ...process.env, GITHUB_TOKEN: githubToken } : process.env;

  // Generate release title
  const releaseTitle = `${templateName} v${version}`;

  // Create release using GitHub CLI
  const commandParts = [
    'gh release create',
    tagName,
    `"${fullTarballPath}"`,
    '--title',
    `"${releaseTitle}"`,
    '--notes',
    `"Template release ${version}"`,
  ];

  if (draft) {
    commandParts.push('--draft');
  }

  const releaseCommand = commandParts.join(' ');

  try {
    execSync(releaseCommand, {
      cwd: workingDirectory,
      stdio: 'inherit',
      env,
    });

    console.log(`\n✅ ${draft ? 'Draft release' : 'Release'} created successfully!`);

    if (draft) {
      console.log('\n💡 Next steps:');
      console.log('   1. Go to GitHub releases page');
      console.log('   2. Review the draft release');
      console.log('   3. Click "Publish release" when ready\n');
    }
  } catch (error) {
    console.error('\n❌ Failed to create release');
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const templateName = args[0];
  const version = args[1];
  const tarballPath = args[2];
  const isDraft = args.includes('--draft');
  const githubToken = process.env.GITHUB_TOKEN;

  if (!templateName || !version || !tarballPath) {
    console.error(
      'Usage: create-template-release <template-name> <version> <tarball-path> [--draft]',
    );
    process.exit(1);
  }

  await createTemplateRelease({
    templateName,
    version,
    tarballPath,
    draft: isDraft,
    githubToken,
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
