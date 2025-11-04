import type { PagesFunctionContext } from '../types';

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
export const onRequestPost = async (context: PagesFunctionContext<Env>) => {
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
      JSON.stringify({ error: 'Yetkisiz erişim' }),
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
        error: 'KV namespace yapılandırılmamış',
        message: 'Slug tabanlı bağlantılar için KV bağlaması gerekir',
      }),
      {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = (await request.json()) as {
      key: string;
      ttl?: number; // TTL in seconds (default 24 hours)
    };

    if (!body || !body.key) {
      return new Response(
        JSON.stringify({ error: 'Anahtar bilgisi gerekli' }),
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
        JSON.stringify({ error: 'Dosya bulunamadı' }),
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
        JSON.stringify({ error: 'Benzersiz slug üretilemedi' }),
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
    console.error('Paylaşım hatası:', error);
    
    // Handle JSON parse error
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz istek gövdesi' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Paylaşım bağlantısı oluşturulamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

