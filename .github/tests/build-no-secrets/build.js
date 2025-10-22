#!/usr/bin/env node

/**
 * Mock build script for testing build-no-secrets action
 * This simulates a typical build process that:
 * 1. Creates an output directory
 * 2. Generates some build artifacts
 * 3. Validates the environment is clean (no secrets)
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 Starting build process...\n');

// Validate that secrets are not present in environment
console.log('🔍 Checking for secret exposure...');
const sensitiveKeys = ['GITHUB_TOKEN', 'GITHUB_SECRET', 'NPM_TOKEN', 'AWS_SECRET_ACCESS_KEY'];
let secretsFound = false;

for (const key of sensitiveKeys) {
  if (process.env[key]) {
    console.error(`❌ ERROR: Sensitive variable ${key} is exposed!`);
    secretsFound = true;
  }
}

if (secretsFound) {
  console.error('\n❌ Build failed: Secrets detected in environment');
  process.exit(1);
}

console.log('✓ No secrets detected in environment\n');

// Create output directory
const outputDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('✓ Created output directory: dist/');
}

// Generate deterministic build artifacts
const timestamp = new Date().toISOString();
const buildInfo = {
  buildTime: timestamp,
  environment: {
    nodeEnv: process.env.NODE_ENV || 'development',
    ci: process.env.CI || 'false',
  },
  version: '1.0.0',
  status: 'success'
};

// Write build info
fs.writeFileSync(
  path.join(outputDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);
console.log('✓ Generated build-info.json');

// Create a mock index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Build Test</title>
</head>
<body>
  <h1>Build Successful</h1>
  <p>Build completed at: ${timestamp}</p>
  <p>Environment: ${buildInfo.environment.nodeEnv}</p>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
console.log('✓ Generated index.html');

// Create a mock JavaScript bundle
const bundleJs = `// Mock bundle generated at ${timestamp}
(function() {
  'use strict';
  console.log('Application loaded successfully');
  console.log('Build environment:', '${buildInfo.environment.nodeEnv}');
})();
`;

fs.writeFileSync(path.join(outputDir, 'bundle.js'), bundleJs);
console.log('✓ Generated bundle.js');

// Create a mock CSS file
const stylesCss = `/* Generated at ${timestamp} */
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

h1 {
  color: #333;
}
`;

fs.writeFileSync(path.join(outputDir, 'styles.css'), stylesCss);
console.log('✓ Generated styles.css');

// Create subdirectory with assets
const assetsDir = path.join(outputDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(assetsDir, 'manifest.json'),
  JSON.stringify({ name: 'Test App', version: '1.0.0' }, null, 2)
);
console.log('✓ Generated assets/manifest.json');

// Summary
console.log('\n✅ Build completed successfully!');
console.log(`📦 Artifacts created in: ${outputDir}`);

const files = fs.readdirSync(outputDir, { recursive: true });
console.log(`📊 Total artifacts: ${files.length} files`);

process.exit(0);
