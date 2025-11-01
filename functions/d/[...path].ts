import type { PagesFunctionContext } from '../types';

interface Env {
  BUCKET: R2Bucket;
}

/**
 * Download endpoint - streams files from R2
 * Uses catch-all route [...] to handle keys with slashes
 */
export const onRequestGet = async (context: PagesFunctionContext<Env>) => {
  const { request, env, params } = context;
  
  // Get the full path from params - Cloudflare Pages uses 'path' for catch-all routes
  const path = params.path as string | string[];
  
  // Convert path to string if it's an array (multiple segments)
  const key = Array.isArray(path) ? path.join('/') : path;

  if (!key) {
    return new Response('Invalid key', { status: 400 });
  }

  try {
    // Fetch object from R2
    const object = await env.BUCKET.get(key);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Get download query parameter
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';

    // Get content type from object metadata or default
    const contentType =
      object.httpMetadata?.contentType ||
      object.customMetadata?.contentType ||
      'application/octet-stream';

    // Get original filename from metadata if available
    const originalFilename =
      object.customMetadata?.originalFilename || key.split('/').pop() || 'file';

    // Prepare headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', object.size.toString());

    // Set Content-Disposition based on download parameter
    if (isDownload) {
      headers.set(
        'Content-Disposition',
        `attachment; filename="${originalFilename}"`
      );
    } else {
      // For inline display, only set filename if it's safe
      if (contentType.startsWith('text/') || contentType.includes('image/')) {
        headers.set(
          'Content-Disposition',
          `inline; filename="${originalFilename}"`
        );
      }
    }

    // Cache headers (optional - adjust as needed)
    headers.set('Cache-Control', 'public, max-age=3600');

    // Stream the object body
    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download error:', error);
    return new Response(
      'Internal server error',
      { status: 500 }
    );
  }
};

