import { useState } from 'react';
import { formatBytes, getShareUrl } from '../lib/utils';
import { copyToClipboard } from '../lib/copy';
import type { UploadedFile } from '../App';

interface FileRowProps {
  file: UploadedFile;
  baseUrl?: string;
}

export default function FileRow({ file, baseUrl }: FileRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    // Use short URL if available, otherwise use full URL
    const urlToCopy = file.shortUrl 
      ? (file.shortUrl.startsWith('http') ? file.shortUrl : window.location.origin + file.shortUrl)
      : file.url.startsWith('http') 
        ? file.url 
        : window.location.origin + file.url;
    
    const success = await copyToClipboard(urlToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Use short URL if available, otherwise fall back to full URL or generate from key
  const displayUrl = file.shortUrl || file.url || getShareUrl(file.key, baseUrl);
  const fullDisplayUrl = displayUrl.startsWith('http') 
    ? displayUrl 
    : window.location.origin + displayUrl;
  
  // For the "Open" link, use the same URL
  const openUrl = file.shortUrl || getShareUrl(file.key, baseUrl);

  return (
    <div className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.filename}
            </p>
            {file.status === 'uploading' && (
              <span className="text-xs text-blue-600">Uploading...</span>
            )}
            {file.status === 'success' && (
              <span className="text-xs text-green-600">✓ Uploaded</span>
            )}
            {file.status === 'error' && (
              <span className="text-xs text-red-600">✗ Failed</span>
            )}
          </div>
          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
            <span>{file.contentType}</span>
            <span>{formatBytes(file.size)}</span>
          </div>
          {file.status === 'error' && file.error && (
            <p className="mt-1 text-sm text-red-600">{file.error}</p>
          )}
          {file.status === 'success' && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={fullDisplayUrl}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {file.shortUrl && file.fullUrl && (
                <p className="text-xs text-gray-500">
                  Short link: <span className="font-mono">{file.shortUrl.replace(window.location.origin, '')}</span>
                </p>
              )}
            </div>
          )}
        </div>
        {file.status === 'success' && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Open
          </a>
        )}
      </div>
      {file.status === 'uploading' && file.progress !== undefined && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

