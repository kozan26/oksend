import { useCallback, useState } from 'react';
import { getAuthHeaders } from '../lib/auth';
import type { UploadedFile } from '../App';

interface DropzoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onError: (message: string) => void;
}

export default function Dropzone({ onFilesUploaded, onError }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFiles(files);
      }
      // Reset input
      e.target.value = '';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFiles = async (files: File[]) => {
    if (uploading) return;

    setUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          uploadedFiles.push(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Upload failed';
          uploadedFiles.push({
            key: '',
            filename: file.name,
            size: file.size,
            contentType: file.type || 'application/octet-stream',
            url: '',
            status: 'error',
            error: errorMessage,
          });
          onError(`Failed to upload ${file.name}: ${errorMessage}`);
        }
      }

      onFilesUploaded(uploadedFiles);
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);

    const authHeaders = getAuthHeaders();
    
    // Debug: Log auth headers (remove in production)
    console.log('Auth headers:', authHeaders);

    // For progress tracking, we'll use XMLHttpRequest as fetch doesn't support progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              ...response,
              status: 'success',
              progress: 100,
            });
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          let errorMessage = xhr.responseText || `Upload failed: ${xhr.statusText}`;
          try {
            const errorJson = JSON.parse(xhr.responseText);
            if (errorJson.reason) {
              errorMessage = errorJson.reason;
            } else if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch {
            // Use the raw error text if JSON parsing fails
          }
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', '/api/upload');
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  };

  return (
    <div className="mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-[1.02] shadow-lg'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
        } ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          id="file-input"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer flex flex-col items-center"
        >
          {uploading ? (
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="mb-6 relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              {isDragging && (
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
              )}
            </div>
          )}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {uploading ? 'Uploading files...' : isDragging ? 'Drop files here' : 'Upload Files'}
          </h3>
          <p className="text-base text-gray-600 mb-1">
            {uploading 
              ? 'Please wait while your files are being uploaded'
              : 'Drag and drop your files here, or click to browse'}
          </p>
          {!uploading && (
            <p className="text-sm text-gray-500 mt-2">
              Supports multiple files • No file size limit
            </p>
          )}
        </label>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

