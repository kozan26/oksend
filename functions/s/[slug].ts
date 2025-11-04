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
 * Format MIME type to a more readable format
 */
function formatMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint (.pptx)',
    'application/vnd.ms-excel': 'Excel (.xls)',
    'application/vnd.ms-powerpoint': 'PowerPoint (.ppt)',
    'application/msword': 'Word (.doc)',
    'application/zip': 'ZIP',
    'application/x-zip-compressed': 'ZIP',
    'application/json': 'JSON',
    'application/xml': 'XML',
    'text/plain': 'Metin',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JavaScript',
    'text/csv': 'CSV',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'image/svg+xml': 'SVG',
    'video/mp4': 'MP4',
    'video/mpeg': 'MPEG',
    'video/quicktime': 'QuickTime',
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
  };

  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  if (mimeType.startsWith('image/')) {
    return mimeType.split('/')[1].toUpperCase();
  }
  if (mimeType.startsWith('video/')) {
    return mimeType.split('/')[1].toUpperCase();
  }
  if (mimeType.startsWith('audio/')) {
    return mimeType.split('/')[1].toUpperCase();
  }
  if (mimeType.startsWith('text/')) {
    return `Metin (${mimeType.split('/')[1]})`;
  }
  if (mimeType.startsWith('application/')) {
    const subtype = mimeType.split('/')[1];
    if (subtype.includes('vnd.')) {
      const parts = subtype.split('.');
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (lastPart === 'document' || lastPart === 'sheet' || lastPart === 'presentation') {
          const appType = parts[parts.length - 2];
          if (appType === 'wordprocessingml') return 'Word';
          if (appType === 'spreadsheetml') return 'Excel';
          if (appType === 'presentationml') return 'PowerPoint';
        }
      }
    }
    return subtype.split('.')[0].toUpperCase();
  }

  return mimeType.split('/')[0].charAt(0).toUpperCase() + mimeType.split('/')[0].slice(1);
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
  <title>Bağlantı Bulunamadı - ozan.cloud</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --m3-primary: #1e63d5;
      --m3-background: #f5f6f9;
      --m3-surface: #ffffff;
      --m3-surface-container: #edf0f6;
      --m3-on-surface: #1b1c20;
      --m3-on-surface-variant: rgba(27, 28, 32, 0.6);
      --shadow-level2: 0 3px 12px rgba(17, 20, 24, 0.16);
      --radius-lg: 22px;
      --radius-xl: 28px;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --m3-primary: #3f8bff;
        --m3-background: #0f1115;
        --m3-surface: #15171c;
        --m3-surface-container: #1f2227;
        --m3-on-surface: #f4f5f8;
        --m3-on-surface-variant: rgba(244, 245, 248, 0.72);
        --shadow-level2: 0 3px 12px rgba(0, 0, 0, 0.4);
      }
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--m3-background);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--m3-on-surface);
    }
    
    .container {
      background: var(--m3-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-level2);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
      background: var(--m3-surface-container);
      border-radius: var(--radius-lg);
    }
    
    .icon {
      font-size: 48px;
      color: var(--m3-on-surface-variant);
    }
    
    h1 {
      color: var(--m3-on-surface);
      margin-bottom: 16px;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      color: var(--m3-on-surface-variant);
      font-size: 16px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon-container">
      <i class="material-icons icon">link_off</i>
    </div>
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

    // Generate download URL
    const url = new URL(request.url);
    const origin = url.origin;
    const downloadUrl = `${origin}/d/${key}`;

    // Get file info or use defaults
    const filename = fileInfo?.filename || key.split('/').pop() || 'dosya';
    const size = fileInfo?.size || 0;
    const contentType = fileInfo?.contentType || 'application/octet-stream';
    const fileIcon = getFileIcon(contentType);
    const formattedSize = size > 0 ? formatBytes(size) : 'Bilinmeyen boyut';
    const formattedMimeType = formatMimeType(contentType);

    // Escape user input to prevent XSS
    const escapedFilename = escapeHtml(filename);
    const escapedContentType = escapeHtml(contentType);
    const escapedFormattedSize = escapeHtml(formattedSize);
    const escapedFormattedMimeType = escapeHtml(formattedMimeType);

    // Generate HTML landing page
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedFilename} - ozan.cloud</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --m3-primary: #1e63d5;
      --m3-on-primary: #ffffff;
      --m3-primary-container: #e0ebff;
      --m3-on-primary-container: #12315f;
      --m3-primary-hover: #1b58c0;
      --m3-background: #f5f6f9;
      --m3-surface: #ffffff;
      --m3-surface-container: #edf0f6;
      --m3-surface-container-low: #f2f3fa;
      --m3-surface-variant: #dfe2eb;
      --m3-on-surface: #1b1c20;
      --m3-on-surface-variant: rgba(27, 28, 32, 0.6);
      --m3-outline: #d6dae2;
      --shadow-level1: 0 1px 6px rgba(17, 20, 24, 0.12);
      --shadow-level2: 0 3px 12px rgba(17, 20, 24, 0.16);
      --shadow-level3: 0 6px 24px rgba(17, 20, 24, 0.2);
      --radius-md: 12px;
      --radius-lg: 22px;
      --radius-xl: 28px;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --m3-primary: #3f8bff;
        --m3-on-primary: #0a1a33;
        --m3-primary-container: #103260;
        --m3-on-primary-container: #d3e4ff;
        --m3-primary-hover: #3579e0;
        --m3-background: #0f1115;
        --m3-surface: #15171c;
        --m3-surface-container: #1f2227;
        --m3-surface-container-low: #1b1d22;
        --m3-surface-variant: #43474e;
        --m3-on-surface: #f4f5f8;
        --m3-on-surface-variant: rgba(244, 245, 248, 0.72);
        --m3-outline: rgba(255, 255, 255, 0.08);
        --shadow-level1: 0 1px 6px rgba(0, 0, 0, 0.3);
        --shadow-level2: 0 3px 12px rgba(0, 0, 0, 0.4);
        --shadow-level3: 0 6px 24px rgba(0, 0, 0, 0.5);
      }
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--m3-background);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--m3-on-surface);
    }
    
    .container {
      background: var(--m3-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-level2);
      padding: 40px;
      max-width: 600px;
      width: 100%;
      text-align: center;
    }
    
    .file-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 120px;
      margin: 0 auto 32px;
      background: var(--m3-surface-container);
      border-radius: var(--radius-lg);
    }
    
    .file-icon {
      font-size: 64px;
      color: var(--m3-primary);
    }
    
    .file-preview {
      max-width: 100%;
      max-height: 400px;
      border-radius: var(--radius-md);
      margin: 0 auto 32px;
      display: block;
      box-shadow: var(--shadow-level1);
    }
    
    h1 {
      color: var(--m3-on-surface);
      margin-bottom: 24px;
      font-size: 24px;
      font-weight: 600;
      word-break: break-word;
      line-height: 1.4;
    }
    
    .file-info {
      background: var(--m3-surface-container-low);
      border-radius: var(--radius-md);
      padding: 20px;
      margin-bottom: 32px;
      text-align: left;
    }
    
    .file-info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--m3-outline);
      font-size: 14px;
    }
    
    .file-info-item:last-child {
      border-bottom: none;
    }
    
    .file-info-label {
      color: var(--m3-on-surface-variant);
      font-weight: 500;
    }
    
    .file-info-value {
      color: var(--m3-on-surface);
      font-weight: 600;
    }
    
    .download-btn {
      background: var(--m3-primary);
      color: var(--m3-on-primary);
      border: none;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: var(--radius-lg);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-level2);
    }
    
    .download-btn:hover {
      background: var(--m3-primary-hover);
      box-shadow: var(--shadow-level3);
      transform: translateY(-2px);
    }
    
    .download-btn:active {
      transform: translateY(0);
    }
    
    .brand {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--m3-outline);
      color: var(--m3-on-surface-variant);
      font-size: 12px;
    }
    
    .brand a {
      color: var(--m3-primary);
      text-decoration: none;
      font-weight: 500;
    }
    
    .brand a:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 640px) {
      .container {
        padding: 24px;
        border-radius: var(--radius-lg);
      }
      
      h1 {
        font-size: 20px;
      }
      
      .file-icon-container {
        width: 100px;
        height: 100px;
      }
      
      .file-icon {
        font-size: 48px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${contentType.startsWith('image/') ? `<img src="${downloadUrl}" alt="${escapedFilename}" class="file-preview" onerror="this.style.display='none'; document.querySelector('.file-icon-container').style.display='flex';">` : ''}
    <div class="file-icon-container" style="${contentType.startsWith('image/') ? 'display: none;' : 'display: flex;'}">
      <i class="material-icons file-icon">${fileIcon}</i>
    </div>
    <h1>${escapedFilename}</h1>
    <div class="file-info">
      <div class="file-info-item">
        <span class="file-info-label">Boyut</span>
        <span class="file-info-value">${escapedFormattedSize}</span>
      </div>
      <div class="file-info-item">
        <span class="file-info-label">Tür</span>
        <span class="file-info-value">${escapedFormattedMimeType}</span>
      </div>
      ${fileInfo?.lastModified ? `<div class="file-info-item">
        <span class="file-info-label">Yüklenme Tarihi</span>
        <span class="file-info-value">${escapeHtml(new Date(fileInfo.lastModified).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }))}</span>
      </div>` : ''}
    </div>
    <a href="${downloadUrl}" class="download-btn" download="${escapedFilename}">
      <i class="material-icons" style="font-size: 20px;">download</i>
      Dosyayı İndir
    </a>
    <div class="brand">
      Paylaşım: <a href="${origin}">ozan.cloud</a>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Slug çözümleme hatası:', error);
    return new Response(
      `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hata - ozan.cloud</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --m3-error: #d12f2f;
      --m3-background: #f5f6f9;
      --m3-surface: #ffffff;
      --m3-surface-container: #edf0f6;
      --m3-on-surface: #1b1c20;
      --m3-on-surface-variant: rgba(27, 28, 32, 0.6);
      --shadow-level2: 0 3px 12px rgba(17, 20, 24, 0.16);
      --radius-lg: 22px;
      --radius-xl: 28px;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --m3-error: #ff6b6b;
        --m3-background: #0f1115;
        --m3-surface: #15171c;
        --m3-surface-container: #1f2227;
        --m3-on-surface: #f4f5f8;
        --m3-on-surface-variant: rgba(244, 245, 248, 0.72);
        --shadow-level2: 0 3px 12px rgba(0, 0, 0, 0.4);
      }
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--m3-background);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--m3-on-surface);
    }
    
    .container {
      background: var(--m3-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-level2);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
      background: var(--m3-surface-container);
      border-radius: var(--radius-lg);
    }
    
    .icon {
      font-size: 48px;
      color: var(--m3-error);
    }
    
    h1 {
      color: var(--m3-on-surface);
      margin-bottom: 16px;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      color: var(--m3-on-surface-variant);
      font-size: 16px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon-container">
      <i class="material-icons icon">error_outline</i>
    </div>
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

