import type { PagesFunctionContext } from '../types';

interface Env {
  BUCKET: R2Bucket;
  LINKS?: KVNamespace;
  UPLOAD_PASSWORD?: string;
  MAX_SIZE_MB?: string;
  ALLOWED_MIME?: string;
  BLOCKED_MIME?: string;
  BASE_URL?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
}

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyTurnstile(
  token: string,
  secret: string,
  remoteip?: string
): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  if (remoteip) {
    formData.append('remoteip', remoteip);
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json<{ success: boolean }>();
    return result.success === true;
  } catch (error) {
    console.error('Turnstile doğrulama hatası:', error);
    return false;
  }
}

/**
 * Validate authentication
 */
function validateAuth(request: Request, env: Env): { valid: boolean; reason?: string } {
  const authHeader = request.headers.get('X-Auth');
  if (!env.UPLOAD_PASSWORD) {
    return { valid: false, reason: 'UPLOAD_PASSWORD ortam değişkeni ayarlanmamış' };
  }
  if (!authHeader) {
    return { valid: false, reason: 'X-Auth başlığı eksik' };
  }
  if (authHeader !== env.UPLOAD_PASSWORD) {
    return { valid: false, reason: 'Parola eşleşmiyor' };
  }
  return { valid: true };
}

/**
 * Validate file size
 */
function validateSize(
  contentLength: string | null,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  if (!contentLength) {
    // Can't validate without Content-Length, will check during streaming
    return { valid: true };
  }

  const sizeBytes = parseInt(contentLength, 10);
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (isNaN(sizeBytes)) {
    return { valid: true }; // Unknown size, check during stream
  }

  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      error: `Dosya boyutu en fazla ${maxSizeMB}MB olabilir`,
    };
  }

  return { valid: true };
}

/**
 * Validate MIME type
 */
function validateMimeType(
  mimeType: string,
  env: Env
): { valid: boolean; error?: string } {
  // Check blocked list first
  if (env.BLOCKED_MIME) {
    const blocked = env.BLOCKED_MIME.split(',').map((m) => m.trim());
    if (blocked.some((blockedType) => mimeType.includes(blockedType))) {
      return {
        valid: false,
        error: `Dosya türü ${mimeType} engellendi`,
      };
    }
  }

  // Check allowed list
  if (env.ALLOWED_MIME) {
    const allowed = env.ALLOWED_MIME.split(',').map((m) => m.trim());
    if (!allowed.some((allowedType) => mimeType.includes(allowedType))) {
      return {
        valid: false,
        error: `Dosya türü ${mimeType} izin verilenler arasında değil`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generate R2 key with date prefix and UUID
 */
function generateKey(filename: string): string {
  const date = new Date();
  const datePrefix = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const uuid = crypto.randomUUID();
  
  // Sanitize filename
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);

  return `${datePrefix}/${uuid}/${sanitized}`;
}

/**
 * Upload endpoint
 */
export const onRequestPost = async (
  context: PagesFunctionContext<Env>
) => {
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
  const authResult = validateAuth(request, env);
  if (!authResult.valid) {
    console.error('Kimlik doğrulama başarısız:', authResult.reason);
    return new Response(
      JSON.stringify({ 
        error: 'Yetkisiz erişim',
        reason: authResult.reason || 'Kimlik doğrulama başarısız'
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse FormData (only once)
  const formData = await request.formData();

  // Optional Turnstile verification
  if (env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET) {
    const turnstileToken = formData.get('cf-turnstile-response') as string;
    
    if (!turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'Turnstile doğrulaması gerekli' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const clientIP = request.headers.get('CF-Connecting-IP');
    const isValid = await verifyTurnstile(
      turnstileToken,
      env.TURNSTILE_SECRET,
      clientIP || undefined
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Turnstile doğrulaması başarısız oldu' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Get file from FormData
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(
      JSON.stringify({ error: 'Dosya gönderilmedi' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate file size
  const maxSizeMB = parseInt(env.MAX_SIZE_MB || '200', 10);
  const contentLength = request.headers.get('Content-Length');
  const sizeValidation = validateSize(contentLength, maxSizeMB);
  
  if (!sizeValidation.valid) {
    return new Response(
      JSON.stringify({ error: sizeValidation.error }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate MIME type
  const mimeType = file.type || 'application/octet-stream';
  const mimeValidation = validateMimeType(mimeType, env);
  
  if (!mimeValidation.valid) {
    return new Response(
      JSON.stringify({ error: mimeValidation.error }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Generate key
  const key = generateKey(file.name);

  try {
    // Stream file to R2
    // Note: Cloudflare Workers has a 100MB body limit, so very large files
    // should use presigned uploads (implemented in v1.1)
    const arrayBuffer = await file.arrayBuffer();
    const maxBytes = maxSizeMB * 1024 * 1024;
    
    if (arrayBuffer.byteLength > maxBytes) {
      return new Response(
        JSON.stringify({ error: `Dosya boyutu en fazla ${maxSizeMB}MB olabilir` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate short slug URL if KV is configured (before storing to R2)
    let shortUrl: string | undefined;
    let slug: string | undefined;
    
    console.log('KV namespace check:', {
      hasKV: !!env.LINKS,
      kvType: env.LINKS ? typeof env.LINKS : 'undefined',
    });
    
    if (env.LINKS) {
      try {
        // Generate a unique 8-character slug
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let generatedSlug = '';
        for (let i = 0; i < 8; i++) {
          generatedSlug += chars[Math.floor(Math.random() * chars.length)];
        }

        // Check if slug exists and regenerate if needed (up to 5 attempts)
        let attempts = 0;
        while (attempts < 5) {
          const existing = await env.LINKS.get(generatedSlug);
          if (!existing) {
            break;
          }
          generatedSlug = '';
          for (let i = 0; i < 8; i++) {
            generatedSlug += chars[Math.floor(Math.random() * chars.length)];
          }
          attempts++;
        }

        if (attempts < 5) {
          // Store slug -> key mapping in KV (no expiration for permanent links)
          await env.LINKS.put(generatedSlug, key);
          slug = generatedSlug;
          const baseUrl = env.BASE_URL || '';
          shortUrl = baseUrl ? `${baseUrl}/s/${generatedSlug}` : `/s/${generatedSlug}`;
        }
      } catch (error) {
        console.error('Kısa URL oluşturulamadı:', error);
        // Continue without short URL if generation fails
      }
    }

    // Store file to R2 with metadata (including slug if available)
    await env.BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: mimeType,
      },
      customMetadata: {
        originalFilename: file.name,
        ...(slug ? { slug } : {}),
      },
    });

    // Generate full download URL
    const baseUrl = env.BASE_URL || '';
    const fullUrl = baseUrl ? `${baseUrl}/d/${key}` : `/d/${key}`;

    return new Response(
      JSON.stringify({
        key,
        filename: file.name,
        size: arrayBuffer.byteLength,
        contentType: mimeType,
        url: shortUrl || fullUrl, // Return short URL if available, otherwise full URL
        fullUrl, // Always include full URL for reference
        shortUrl: shortUrl || undefined, // Include short URL only if generated
        slug: slug || undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Yükleme hatası:', error);
    return new Response(
      JSON.stringify({
        error: 'Dosya yüklenemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

