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
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          uploadedFiles.push(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Yükleme başarısız oldu';
          uploadedFiles.push({
            key: '',
            filename: file.name,
            size: file.size,
            contentType: file.type || 'application/octet-stream',
            url: '',
            status: 'error',
            error: errorMessage,
          });
          onError(`${file.name} yüklenemedi: ${errorMessage}`);
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
          } catch {
            reject(new Error('Sunucudan geçersiz yanıt alındı'));
          }
        } else {
          let errorMessage =
            xhr.responseText || `Yükleme başarısız: ${xhr.statusText}`;
          try {
            const errorJson = JSON.parse(xhr.responseText);
            if (errorJson.reason) {
              errorMessage = errorJson.reason;
            } else if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch {
            // ignore parse errors
          }
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Yükleme sırasında ağ hatası oluştu'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Yükleme iptal edildi'));
      });

      xhr.open('POST', '/api/upload');
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  };

  return (
    <section>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.2)] bg-[var(--m3-surface-container)] px-6 py-16 text-center transition-all duration-200 ease-out ${
          uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
        style={{
          boxShadow: isDragging ? 'var(--m3-elev-4)' : 'var(--m3-elev-2)',
          outline: isDragging ? '2px solid var(--m3-primary)' : 'none',
          outlineOffset: '4px',
        }}
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
          className="flex w-full max-w-2xl flex-col items-center space-y-4"
        >
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[var(--m3-primary-container)]" />
            <div className="absolute inset-2 rounded-full bg-[var(--m3-primary)]/10" />
            <svg
              className="relative h-12 w-12 text-[var(--m3-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {isDragging && (
              <span className="absolute inset-0 rounded-full bg-[var(--m3-primary)]/20" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-[var(--m3-on-surface)]">
              {uploading
                ? 'Dosyalar yükleniyor...'
                : isDragging
                  ? 'Dosyaları bırakın'
                  : 'Dosya yükle'}
            </h3>
            <p className="text-sm text-[var(--m3-on-surface-variant)]">
              {uploading
                ? 'Dosyalarınız işlenirken lütfen bekleyin.'
                : 'Sürükleyip bırakın veya bilgisayarınızdaki dosyalara göz atmak için dokunun.'}
            </p>
            {!uploading && (
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-surface-variant)]/80">
                Çoklu seçim · Sınır yok · %100 şifre korumalı
              </p>
            )}
          </div>
        </label>

        {uploading && (
          <div className="absolute inset-0 rounded-[var(--m3-radius-lg)] bg-[color:rgba(15,23,42,0.04)] backdrop-blur-sm">
            <div className="flex h-full flex-col items-center justify-center space-y-3 text-[var(--m3-on-surface-variant)]">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--m3-primary)] border-t-transparent" />
              <p className="text-sm font-medium">Yükleme devam ediyor…</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
