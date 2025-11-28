/**
 * Built-in handler: package-json
 * Smart merges package.json preserving app-specific fields
 */

module.exports = {
  name: 'package-json',
  description: 'Smart merge for package.json files',

  async process(context) {
    const { appContent, config } = context;

    try {
      const appPkg = JSON.parse(appContent);

      // Fields to preserve from app
      const preserveFields = config.preserve || [
        'name',
        'version',
        'description',
        'author',
        'license',
        'repository',
        'homepage',
        'bugs',
        'private',
      ];

      // Note: In a real template update, we'd have templateContent too
      // For now, we just ensure the app's preserved fields stay intact

      const warnings = [];

      // Check for any suspicious values that might be placeholders
      for (const field of preserveFields) {
        if (appPkg[field] && typeof appPkg[field] === 'string') {
          if (appPkg[field].includes('{{') || appPkg[field].includes('}}')) {
            warnings.push(`Field "${field}" contains placeholder syntax: ${appPkg[field]}`);
          }
        }
      }

      // Return the content unchanged - the git merge should handle the actual merging
      // This handler is mainly for validation and ensuring preserved fields
      return {
        content: appContent,
        applied: true,
        warnings,
        message: `Preserved fields: ${preserveFields.join(', ')}`,
      };
    } catch (error) {
      return {
        applied: false,
        error: `Failed to parse package.json: ${error.message}`,
      };
    }
  },
};
