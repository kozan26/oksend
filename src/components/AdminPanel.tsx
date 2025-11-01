import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../lib/auth';
import { formatBytes } from '../lib/utils';
import { copyToClipboard } from '../lib/copy';
import {
  MdImage,
  MdVideoLibrary,
  MdAudiotrack,
  MdDescription,
  MdPictureAsPdf,
  MdFolderZip,
  MdCode,
  MdAttachFile,
  MdCheckCircle,
  MdLink,
  MdDelete,
} from 'react-icons/md';

interface FileItem {
  key: string;
  filename: string;
  size: number;
  contentType: string;
  uploaded: string | null;
  url: string;
}

interface KVItem {
  slug: string;
  key: string;
  url: string;
}

export default function AdminPanel() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const authHeaders = getAuthHeaders();
      const response = await fetch('/api/admin/files', {
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.reason || 'Failed to load files');
      }

      const data = await response.json();
      setFiles(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!confirm(`Are you sure you want to delete this file?\n\n${key}`)) {
      return;
    }

    try {
      setDeleting(key);
      const authHeaders = getAuthHeaders();
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.key !== key));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const handleCopyUrl = async (url: string, key: string) => {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
    const success = await copyToClipboard(fullUrl);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const getFileIcon = (contentType: string, className: string = 'w-6 h-6') => {
    if (contentType.startsWith('image/')) return <MdImage className={className} />;
    if (contentType.startsWith('video/')) return <MdVideoLibrary className={className} />;
    if (contentType.startsWith('audio/')) return <MdAudiotrack className={className} />;
    if (contentType.startsWith('text/')) return <MdDescription className={className} />;
    if (contentType.includes('pdf')) return <MdPictureAsPdf className={className} />;
    if (contentType.includes('zip') || contentType.includes('archive')) return <MdFolderZip className={className} />;
    if (contentType.includes('json')) return <MdCode className={className} />;
    return <MdAttachFile className={className} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-600 mt-1">Manage uploaded files</p>
        </div>
        <button
          onClick={loadFiles}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && files.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No files uploaded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-3">{getFileIcon(file.contentType, 'w-6 h-6')}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs font-mono">
                            {file.key}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {file.contentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {file.uploaded
                        ? new Date(file.uploaded).toLocaleDateString() +
                          ' ' +
                          new Date(file.uploaded).toLocaleTimeString()
                        : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleCopyUrl(file.url, file.key)}
                        className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                        title="Copy URL"
                      >
                        {copiedKey === file.key ? (
                          <>
                            <MdCheckCircle className="w-4 h-4" /> Copied
                          </>
                        ) : (
                          <>
                            <MdLink className="w-4 h-4" /> Copy
                          </>
                        )}
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900 px-3 py-1 rounded hover:bg-green-50 transition-colors inline-block"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.key)}
                        disabled={deleting === file.key}
                        className="text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center gap-1"
                        title="Delete file"
                      >
                        <MdDelete className="w-4 h-4" />
                        {deleting === file.key ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total: <strong>{files.length}</strong> file{files.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

