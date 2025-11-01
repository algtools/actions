/**
 * Simple Cloudflare Worker for testing deploy-cloudflare-from-artifact action
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: env.VERSION || 'test',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Default response
    return new Response(
      JSON.stringify({
        message: 'Hello from Cloudflare Worker!',
        path: url.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Version': env.VERSION || 'test',
        },
      },
    );
  },
};
