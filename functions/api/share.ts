import type { OnRequest } from '@cloudflare/workers-types';

interface Env {
  BUCKET: R2Bucket;
  LINKS?: KVNamespace;
  UPLOAD_PASSWORD?: string;
  BASE_URL?: string;
}

/**
 * Validate authentication
 */
function validateAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('X-Auth');
  if (!env.UPLOAD_PASSWORD || !authHeader) {
    return false;
  }
  return authHeader === env.UPLOAD_PASSWORD;
}

/**
 * Generate a short random slug
 */
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

/**
 * Share endpoint - creates a short slug link (optional, requires KV)
 */
export const onRequestPost: OnRequest<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': new URL(request.url).origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Validate authentication
  if (!validateAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
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
        message: 'Slug-based links require KV binding',
      }),
      {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json<{
      key: string;
      ttl?: number; // TTL in seconds (default 24 hours)
    }>();

    if (!body || !body.key) {
      return new Response(
        JSON.stringify({ error: 'Key is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify key exists in bucket
    const object = await env.BUCKET.head(body.key);
    if (!object) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate unique slug
    let slug = generateSlug();
    let attempts = 0;
    
    // Ensure slug is unique (retry up to 10 times)
    while (attempts < 10) {
      const existing = await env.LINKS.get(slug);
      if (!existing) {
        break;
      }
      slug = generateSlug();
      attempts++;
    }

    if (attempts >= 10) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique slug' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Store slug -> key mapping in KV with TTL
    const ttl = body.ttl || 86400; // Default 24 hours
    await env.LINKS.put(slug, body.key, { expirationTtl: ttl });

    // Generate share URL
    const baseUrl = env.BASE_URL || '';
    const url = baseUrl ? `${baseUrl}/s/${slug}` : `/s/${slug}`;

    return new Response(
      JSON.stringify({
        slug,
        key: body.key,
        url,
        expiresIn: ttl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Share error:', error);
    
    // Handle JSON parse error
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to create share link',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

