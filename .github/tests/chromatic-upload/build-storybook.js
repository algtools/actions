#!/usr/bin/env node

/**
 * Mock Storybook build script
 * Creates a fake storybook-static directory with typical Storybook files
 */

const fs = require('fs');
const path = require('path');

const STORYBOOK_DIR = path.join(__dirname, 'storybook-static');

// Clean up old build
if (fs.existsSync(STORYBOOK_DIR)) {
  fs.rmSync(STORYBOOK_DIR, { recursive: true });
}

// Create storybook-static directory
fs.mkdirSync(STORYBOOK_DIR, { recursive: true });

// Create typical Storybook files
const files = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Storybook</title>
</head>
<body>
  <div id="root"></div>
  <script src="runtime.js"></script>
  <script src="main.js"></script>
</body>
</html>`,
  
  'iframe.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Storybook Preview</title>
</head>
<body>
  <div id="storybook-preview-iframe"></div>
  <script src="runtime.js"></script>
  <script src="preview.js"></script>
</body>
</html>`,

  'runtime.js': `// Mock runtime bundle
console.log('Storybook runtime loaded');`,

  'main.js': `// Mock main bundle
console.log('Storybook main loaded');
const stories = ['Button', 'Input', 'Card'];
console.log('Stories:', stories);`,

  'preview.js': `// Mock preview bundle
console.log('Storybook preview loaded');`,

  'project.json': JSON.stringify({
    "generatedAt": new Date().toISOString(),
    "builder": {
      "name": "@storybook/builder-webpack5"
    },
    "hasCustomBabel": false,
    "hasCustomWebpack": false,
    "hasStaticDirs": false,
    "hasStorybookEslint": false,
    "version": "7.0.0"
  }, null, 2),

  'stories.json': JSON.stringify({
    "v": 4,
    "stories": {
      "button--primary": {
        "id": "button--primary",
        "title": "Button",
        "name": "Primary",
        "importPath": "./Button.stories.js"
      },
      "input--default": {
        "id": "input--default",
        "title": "Input",
        "name": "Default",
        "importPath": "./Input.stories.js"
      },
      "card--basic": {
        "id": "card--basic",
        "title": "Card",
        "name": "Basic",
        "importPath": "./Card.stories.js"
      }
    }
  }, null, 2)
};

// Write all files
for (const [filename, content] of Object.entries(files)) {
  const filepath = path.join(STORYBOOK_DIR, filename);
  fs.writeFileSync(filepath, content);
  console.log(`✓ Created ${filename}`);
}

// Create a static assets directory
const assetsDir = path.join(STORYBOOK_DIR, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

fs.writeFileSync(
  path.join(assetsDir, 'logo.svg'),
  '<svg><text>Storybook Logo</text></svg>'
);
console.log('✓ Created assets/logo.svg');

// Create chunk files
for (let i = 1; i <= 3; i++) {
  const chunkFile = path.join(STORYBOOK_DIR, `chunk-${i}.js`);
  fs.writeFileSync(chunkFile, `// Chunk ${i}\nconsole.log('Chunk ${i} loaded');`);
  console.log(`✓ Created chunk-${i}.js`);
}

console.log('');
console.log('========================================');
console.log('Mock Storybook build complete!');
console.log('========================================');
console.log(`Output directory: ${STORYBOOK_DIR}`);

const fileCount = fs.readdirSync(STORYBOOK_DIR).length;
const assetCount = fs.readdirSync(assetsDir).length;
console.log(`Files created: ${fileCount - 1} (+ ${assetCount} assets)`);
console.log('');
console.log('✓ Ready for Chromatic upload');
