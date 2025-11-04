import type { PagesFunctionContext } from '../types';

interface Env {
  BUCKET: R2Bucket;
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
 * List endpoint - returns recent files
 */
export const onRequestGet = async (context: PagesFunctionContext<Env>) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': new URL(request.url).origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'X-Auth',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Validate authentication
  if (!validateAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Yetkisiz erişim' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get limit from query parameter (default 100)
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    // List objects from R2
    const listResult = await env.BUCKET.list({
      limit: Math.min(limit, 1000), // Cap at 1000
    });

    // Generate base URL for share links
    const baseUrl = env.BASE_URL || '';

    // Format response
    const items = listResult.objects.map((obj: any) => ({
      key: obj.key,
      size: obj.size,
      contentType:
        obj.httpMetadata?.contentType || 'application/octet-stream',
      lastModified: obj.uploaded.toISOString(),
      url: baseUrl ? `${baseUrl}/d/${obj.key}` : `/d/${obj.key}`,
      originalFilename: obj.customMetadata?.originalFilename || obj.key.split('/').pop() || 'dosya',
    }));

    // Sort by lastModified (newest first)
    items.sort((a: any, b: any) => {
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    return new Response(
      JSON.stringify({ items }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Listeleme hatası:', error);
    return new Response(
      JSON.stringify({
        error: 'Dosyalar listelenemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

