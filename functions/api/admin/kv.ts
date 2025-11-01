import type { PagesFunctionContext } from '../../types';

interface Env {
  LINKS?: KVNamespace;
  UPLOAD_PASSWORD?: string;
}

/**
 * Validate authentication
 */
function validateAuth(request: Request, env: Env): { valid: boolean; reason?: string } {
  const authHeader = request.headers.get('X-Auth');
  if (!env.UPLOAD_PASSWORD || !authHeader) {
    return { valid: false, reason: !env.UPLOAD_PASSWORD ? 'UPLOAD_PASSWORD not set' : 'X-Auth header missing' };
  }
  if (authHeader !== env.UPLOAD_PASSWORD) {
    return { valid: false, reason: 'Password mismatch' };
  }
  return { valid: true };
}

/**
 * Admin endpoint - list all KV entries (short links)
 */
export const onRequestGet = async (context: PagesFunctionContext<Env>) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': new URL(request.url).origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Validate authentication
  const authResult = validateAuth(request, env);
  if (!authResult.valid) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', reason: authResult.reason }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if KV is configured
  if (!env.LINKS) {
    return new Response(
      JSON.stringify({
        error: 'KV namespace not configured',
        items: [],
        total: 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Note: KV doesn't have a native list() method, so we can't list all keys
    // This is a limitation of Cloudflare KV - we can only read keys we know
    // Return empty list with a note about this limitation
    return new Response(
      JSON.stringify({
        items: [],
        total: 0,
        message: 'KV namespace does not support listing all keys. Keys can only be accessed if the slug is known.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Admin KV list error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to list KV entries',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Admin endpoint - delete a KV entry by slug
 */
export const onRequestDelete = async (context: PagesFunctionContext<Env>) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': new URL(request.url).origin,
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Validate authentication
  const authResult = validateAuth(request, env);
  if (!authResult.valid) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', reason: authResult.reason }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if KV is configured
  if (!env.LINKS) {
    return new Response(
      JSON.stringify({ error: 'KV namespace not configured' }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the KV entry
    await env.LINKS.delete(slug);

    return new Response(
      JSON.stringify({ ok: true, slug }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Admin KV delete error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete KV entry',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

