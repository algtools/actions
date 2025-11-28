/**
 * Built-in handler: preserve-files
 * Simply preserves app-specific files (like CHANGELOG.md)
 */

module.exports = {
  name: 'preserve-files',
  description: 'Preserves app-specific files that should never be updated',

  async process(context) {
    const { filePath } = context;

    // This handler is used when a file should be completely preserved
    // In practice, these files should be in the exclude list
    // But this handler can be used as an explicit preservation rule

    return {
      content: context.appContent,
      applied: true,
      message: `Preserved app-specific file: ${filePath}`,
    };
  },
};
