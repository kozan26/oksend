import type { OnRequest } from '@cloudflare/workers-types';

interface Env {
  LINKS?: KVNamespace;
  BASE_URL?: string;
}

/**
 * Slug resolution endpoint - redirects short slugs to full download URLs
 */
export const onRequestGet: OnRequest<Env> = async (context) => {
  const { request, env, params } = context;
  const slug = params.slug as string;

  if (!slug) {
    return new Response('Invalid slug', { status: 400 });
  }

  // Check if KV is configured
  if (!env.LINKS) {
    return new Response(
      'Slug links not configured',
      { status: 503 }
    );
  }

  try {
    // Look up key from slug
    const key = await env.LINKS.get(slug);

    if (!key) {
      return new Response('Link not found or expired', { status: 404 });
    }

    // Generate redirect URL
    const baseUrl = env.BASE_URL || '';
    const redirectUrl = baseUrl
      ? `${baseUrl}/d/${key}`
      : `/d/${key}`;

    // Redirect to download endpoint
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Slug resolution error:', error);
    return new Response(
      'Internal server error',
      { status: 500 }
    );
  }
};

