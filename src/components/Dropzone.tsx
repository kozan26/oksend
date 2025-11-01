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
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, number>
  >({});

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
      setUploadProgress({});
    }
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);

    const authHeaders = getAuthHeaders();
    const controller = new AbortController();

    // Create a file entry for progress tracking
    const fileId = `${file.name}-${file.size}`;
    const tempFile: UploadedFile = {
      key: '',
      filename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
      url: '',
      status: 'uploading',
      progress: 0,
    };

    // For progress tracking, we'll use XMLHttpRequest as fetch doesn't support progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [fileId]: percent }));
        }
      });

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
          const errorMessage =
            xhr.responseText || `Upload failed: ${xhr.statusText}`;
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
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
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
          <p className="text-lg font-medium text-gray-700 mb-2">
            {uploading ? 'Uploading...' : 'Drag and drop files here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to select files
          </p>
          {uploading && (
            <p className="text-xs text-gray-400">
              Please wait while files are being uploaded
            </p>
          )}
        </label>
      </div>
    </div>
  );
}

