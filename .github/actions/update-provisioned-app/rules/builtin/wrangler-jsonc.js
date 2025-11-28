/**
 * Built-in handler: wrangler-jsonc
 * Smart merges wrangler.jsonc preserving binding IDs and app-specific config
 */

module.exports = {
  name: 'wrangler-jsonc',
  description: 'Smart merge for wrangler.jsonc files',

  /**
   * Strip JSONC comments to parse as JSON
   */
  stripComments(content) {
    // Remove block comments
    let cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove line comments
    cleaned = cleaned.replace(/\/\/.*/g, '');
    // Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    return cleaned;
  },

  async process(context) {
    const { appContent, config } = context;

    try {
      const cleaned = this.stripComments(appContent);
      const appConfig = JSON.parse(cleaned);

      const warnings = [];

      // Check for placeholder syntax in binding IDs
      const checkBindings = (bindings, type) => {
        if (!bindings) return;

        for (const binding of bindings) {
          // Check database_id, id, bucket_name
          const idFields = ['database_id', 'id', 'bucket_name', 'database_name'];

          for (const field of idFields) {
            if (binding[field] && typeof binding[field] === 'string') {
              if (binding[field].includes('{{') || binding[field].includes('}}')) {
                warnings.push(
                  `${type} binding "${binding.binding || binding.name || 'unknown'}" ` +
                    `has placeholder in ${field}: ${binding[field]}`,
                );
              }
            }
          }
        }
      };

      // Check root level bindings
      checkBindings(appConfig.d1_databases, 'D1');
      checkBindings(appConfig.kv_namespaces, 'KV');
      checkBindings(appConfig.r2_buckets, 'R2');

      // Check environment bindings
      if (appConfig.env) {
        for (const [envName, envConfig] of Object.entries(appConfig.env)) {
          checkBindings(envConfig.d1_databases, `D1 (${envName})`);
          checkBindings(envConfig.kv_namespaces, `KV (${envName})`);
          checkBindings(envConfig.r2_buckets, `R2 (${envName})`);
        }
      }

      // Check app name
      if (appConfig.name && (appConfig.name.includes('{{') || appConfig.name.includes('}}'))) {
        warnings.push(`Worker name contains placeholder: ${appConfig.name}`);
      }

      // Return content unchanged - git merge handles the merging
      // This handler validates and warns about placeholders
      return {
        content: appContent,
        applied: true,
        warnings,
        message: 'Validated binding IDs and configuration',
      };
    } catch (error) {
      return {
        applied: false,
        error: `Failed to parse wrangler.jsonc: ${error.message}`,
      };
    }
  },
};
