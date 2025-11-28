/**
 * Built-in handler: strip-placeholders
 * Detects and warns about placeholder syntax in files
 */

module.exports = {
  name: 'strip-placeholders',
  description: 'Warns or errors if placeholder syntax is detected',

  async process(context) {
    const { appContent, config, filePath } = context;

    const action = config.action || 'warn'; // 'warn' or 'error'
    const warnings = [];
    const errors = [];

    // Check for {{PLACEHOLDER}} syntax
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches = [...appContent.matchAll(placeholderRegex)];

    if (matches.length > 0) {
      const placeholders = matches.map((m) => m[1]).join(', ');
      const message = `Found ${matches.length} placeholder(s) in ${filePath}: {{${placeholders}}}`;

      if (action === 'error') {
        errors.push(message);
        return {
          applied: false,
          errors,
          message: 'Placeholders detected (blocking)',
        };
      } else {
        warnings.push(message);
      }
    }

    return {
      content: appContent,
      applied: true,
      warnings,
      message:
        matches.length > 0
          ? `Detected ${matches.length} placeholder(s)`
          : 'No placeholders detected',
    };
  },
};
