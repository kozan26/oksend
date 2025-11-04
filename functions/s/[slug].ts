import type { PagesFunctionContext } from '../types';

interface Env {
  LINKS?: KVNamespace;
  BUCKET?: R2Bucket;
  BASE_URL?: string;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bayt';
  const k = 1024;
  const sizes = ['Bayt', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on MIME type (Material Icons name)
 */
function getFileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video_library';
  if (contentType.startsWith('audio/')) return 'audiotrack';
  if (contentType.startsWith('text/')) return 'description';
  if (contentType.includes('pdf')) return 'picture_as_pdf';
  if (contentType.includes('zip') || contentType.includes('archive')) return 'folder_zip';
  if (contentType.includes('json')) return 'code';
  return 'attach_file';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Slug resolution endpoint - shows a nice landing page with file info and download button
 */
export const onRequestGet = async (context: PagesFunctionContext<Env>) => {
  const { request, env, params } = context;
  const slug = params.slug as string;

  if (!slug) {
    return new Response('Geçersiz slug', { status: 400 });
  }

  // Check if KV is configured
  if (!env.LINKS) {
    return new Response(
      'Slug bağlantıları yapılandırılmamış',
      { status: 503 }
    );
  }

  try {
    // Look up key from slug
    const key = await env.LINKS.get(slug);

    if (!key) {
      return new Response(
        `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bağlantı Bulunamadı - oksend</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    h1 { color: #1f2937; margin-bottom: 16px; font-size: 28px; }
    p { color: #6b7280; margin-bottom: 24px; font-size: 16px; }
    .icon { font-size: 64px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <i class="material-icons" style="font-size: 64px; color: #6b7280; margin-bottom: 24px;">link_off</i>
    <h1>Bağlantı bulunamadı</h1>
    <p>Bu bağlantının süresi dolmuş olabilir ya da hiç oluşturulmamış olabilir.</p>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // If bucket is available, get file metadata
    let fileInfo: {
      filename: string;
      size: number;
      contentType: string;
      lastModified?: Date;
    } | null = null;

    if (env.BUCKET) {
      try {
        const object = await env.BUCKET.head(key);
        if (object) {
          fileInfo = {
            filename: object.customMetadata?.originalFilename || key.split('/').pop() || 'dosya',
            size: object.size,
            contentType: object.httpMetadata?.contentType || object.customMetadata?.contentType || 'application/octet-stream',
            lastModified: object.uploaded,
          };
        }
      } catch (error) {
        console.error('Dosya metaverisi alınırken hata oluştu:', error);
        // Continue without metadata
      }
    }

    // Generate download URL and redirect directly to file
    const url = new URL(request.url);
    const origin = url.origin;
    const downloadUrl = `${origin}/d/${key}`;

    // Redirect directly to the file (no landing page)
    return Response.redirect(downloadUrl, 302);
  } catch (error) {
    console.error('Slug çözümleme hatası:', error);
    return new Response(
      `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hata - oksend</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 64px; margin-bottom: 24px; }
    h1 { color: #1f2937; margin-bottom: 16px; font-size: 28px; }
    p { color: #6b7280; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <i class="material-icons" style="font-size: 64px; color: #ef4444; margin-bottom: 24px;">error_outline</i>
    <h1>Bir şeyler ters gitti</h1>
    <p>Bu dosyayı yüklerken bir hata ile karşılaştık.</p>
  </div>
</body>
</html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
};

