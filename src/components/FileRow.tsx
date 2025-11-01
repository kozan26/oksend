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
    const url = getShareUrl(file.key, baseUrl);
    const fullUrl = window.location.origin + url;
    const success = await copyToClipboard(fullUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = getShareUrl(file.key, baseUrl);
  const fullUrl = window.location.origin + shareUrl;

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
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
        {file.status === 'success' && (
          <a
            href={shareUrl}
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

