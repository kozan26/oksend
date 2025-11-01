import type { PagesFunctionContext } from '../types';

interface Env {
  LINKS?: KVNamespace;
  BASE_URL?: string;
}

/**
 * Slug resolution endpoint - redirects short slugs to full download URLs
 */
export const onRequestGet = async (context: PagesFunctionContext<Env>) => {
  const { env, params } = context;
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

    // Generate redirect URL - Response.redirect() requires absolute URL
    const { request } = context;
    const url = new URL(request.url);
    const origin = url.origin;
    const redirectUrl = `${origin}/d/${key}`;

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

