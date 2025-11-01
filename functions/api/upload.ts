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
    console.error('Turnstile verification error:', error);
    return false;
  }
}

/**
 * Validate authentication
 */
function validateAuth(request: Request, env: Env): { valid: boolean; reason?: string } {
  const authHeader = request.headers.get('X-Auth');
  // Debug logging (will appear in Cloudflare Functions logs)
  console.log('Auth check:', {
    hasPassword: !!env.UPLOAD_PASSWORD,
    hasHeader: !!authHeader,
    headerLength: authHeader?.length || 0,
    passwordLength: env.UPLOAD_PASSWORD?.length || 0,
    headerValue: authHeader ? `[${authHeader.substring(0, 3)}...]` : 'missing',
    passwordValue: env.UPLOAD_PASSWORD ? `[${env.UPLOAD_PASSWORD.substring(0, 3)}...]` : 'missing',
  });
  
  if (!env.UPLOAD_PASSWORD) {
    return { valid: false, reason: 'UPLOAD_PASSWORD environment variable not set' };
  }
  if (!authHeader) {
    return { valid: false, reason: 'X-Auth header missing' };
  }
  if (authHeader !== env.UPLOAD_PASSWORD) {
    return { valid: false, reason: 'Password mismatch' };
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
      error: `File size exceeds maximum of ${maxSizeMB}MB`,
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
        error: `File type ${mimeType} is blocked`,
      };
    }
  }

  // Check allowed list
  if (env.ALLOWED_MIME) {
    const allowed = env.ALLOWED_MIME.split(',').map((m) => m.trim());
    if (!allowed.some((allowedType) => mimeType.includes(allowedType))) {
      return {
        valid: false,
        error: `File type ${mimeType} is not allowed`,
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
    console.error('Authentication failed:', authResult.reason);
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized',
        reason: authResult.reason || 'Authentication failed'
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
        JSON.stringify({ error: 'Turnstile verification required' }),
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
        JSON.stringify({ error: 'Turnstile verification failed' }),
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
      JSON.stringify({ error: 'No file provided' }),
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
        JSON.stringify({ error: `File size exceeds maximum of ${maxSizeMB}MB` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await env.BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: mimeType,
      },
      customMetadata: {
        originalFilename: file.name,
      },
    });

    // Generate full download URL
    const baseUrl = env.BASE_URL || '';
    const fullUrl = baseUrl ? `${baseUrl}/d/${key}` : `/d/${key}`;

    // Generate short slug URL if KV is configured
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
          shortUrl = baseUrl ? `${baseUrl}/s/${generatedSlug}` : `/s/${generatedSlug}`;
        }
      } catch (error) {
        console.error('Failed to generate short URL:', error);
        // Continue without short URL if generation fails
      }
    }

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
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

