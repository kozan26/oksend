import type { PagesFunctionContext } from '../../types';

interface Env {
  BUCKET: R2Bucket;
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
 * Admin endpoint - list all files from R2 bucket
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

  try {
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '1000', 10);
    const cursor = url.searchParams.get('cursor') || undefined;

    // List all objects from R2
    const listResult = await env.BUCKET.list({
      limit: Math.min(limit, 1000),
      cursor,
    });

    // Map objects to response format
    // Note: R2.list() doesn't return customMetadata, so we need to use head() for each object
    const items = await Promise.all(
      listResult.objects.map(async (obj: any) => {
        const key = obj.key as string;
        const filename = key.split('/').pop() || key;
        
        // Get object metadata to read customMetadata (which includes slug)
        let slug: string | null = null;
        let shortUrl: string | null = null;
        let contentType = obj.httpMetadata?.contentType || 'application/octet-stream';
        
        try {
          const objectHead = await env.BUCKET.head(key);
          if (objectHead) {
            // Get slug from customMetadata
            slug = objectHead.customMetadata?.slug || null;
            contentType = objectHead.httpMetadata?.contentType || contentType;
            
            if (slug) {
              const baseUrl = new URL(request.url).origin;
              shortUrl = `${baseUrl}/s/${slug}`;
            }
          }
        } catch (error) {
          console.error(`Error reading metadata for ${key}:`, error);
          // Continue without metadata if head() fails
        }
        
        return {
          key,
          filename,
          size: obj.size || 0,
          contentType,
          uploaded: obj.uploaded ? new Date(obj.uploaded).toISOString() : null,
          etag: obj.etag || null,
          url: `/d/${key}`,
          shortUrl,
          slug,
        };
      })
    );

    return new Response(
      JSON.stringify({
        items,
        truncated: listResult.truncated || false,
        cursor: listResult.cursor || null,
        total: items.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Admin files list error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to list files',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

