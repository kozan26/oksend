/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bayt';
  const k = 1024;
  const sizes = ['Bayt', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get MIME type category for display
 */
export function getMimeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Görsel';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Ses';
  if (mimeType.startsWith('text/')) return 'Metin';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Arşiv';
  if (mimeType.includes('json')) return 'JSON';
  return 'Dosya';
}

/**
 * Format MIME type to a more readable format
 */
export function formatMimeType(mimeType: string): string {
  // Common MIME type mappings
  const mimeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint (.pptx)',
    'application/vnd.ms-excel': 'Excel (.xls)',
    'application/vnd.ms-powerpoint': 'PowerPoint (.ppt)',
    'application/msword': 'Word (.doc)',
    'application/vnd.ms-word.document.macroEnabled.12': 'Word (.docm)',
    'application/vnd.ms-excel.sheet.macroEnabled.12': 'Excel (.xlsm)',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12': 'PowerPoint (.pptm)',
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

  // Check if we have a mapping
  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  // If it's a known category, format it nicely
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
    // Try to extract extension or format from common patterns
    if (subtype.includes('vnd.')) {
      // Try to extract meaningful part
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

  // Fallback: return first part of MIME type
  return mimeType.split('/')[0].charAt(0).toUpperCase() + mimeType.split('/')[0].slice(1);
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Generate a shareable URL from key
 */
export function getShareUrl(key: string, baseUrl?: string): string {
  const path = `/d/${key}`;
  if (baseUrl) {
    return `${baseUrl}${path}`;
  }
  return path;
}

