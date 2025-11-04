import { useCallback, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { MdCloudUpload } from 'react-icons/md';
import { getAuthHeaders } from '../lib/auth';
import type { UploadedFile } from '../App';

interface DropzoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onError: (message: string) => void;
  variant?: 'default' | 'compact';
}

export interface DropzoneHandle {
  openFileDialog: () => void;
}

const Dropzone = forwardRef<DropzoneHandle, DropzoneProps>(
  ({ onFilesUploaded, onError, variant = 'default' }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const isCompact = variant === 'compact';
    const containerPadding = isCompact ? 'px-8 py-12 md:px-10 md:py-14' : 'px-8 py-16 md:px-12 md:py-20';
    const restingShadow = 'var(--shadow-level2)';
    const activeShadow = 'var(--shadow-level3)';

    useImperativeHandle(
      ref,
      () => ({
        openFileDialog: () => {
          if (!uploading) {
            fileInputRef.current?.click();
          }
        },
      }),
      [uploading]
    );

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
      <section aria-label="Dosya yükleme alanı">
        <div
          role="button"
          tabIndex={0}
          aria-busy={uploading}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative overflow-hidden rounded-[32px] border-2 border-dashed ${
            isDragging
              ? 'border-[var(--m3-primary)] bg-[var(--m3-primary-container)]/30'
              : 'border-[var(--m3-outline)]/40 hover:border-[var(--m3-primary)]'
          } bg-[radial-gradient(circle_at_top,var(--m3-surface-container) 0%,var(--m3-surface) 60%,var(--m3-surface-container-high) 100%)] text-center transition-all duration-300 ease-out ${
            uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
          } ${containerPadding}`}
          style={{
            boxShadow: isDragging ? activeShadow : restingShadow,
            outline: isDragging ? '2px solid var(--m3-primary)' : 'none',
            outlineOffset: '4px',
            backgroundColor: isDragging 
              ? 'var(--m3-primary-container)' 
              : undefined,
          }}
        >
          {/* Hover background overlay */}
          {!isDragging && !uploading && (
            <div
              className="absolute inset-0 z-0 rounded-[32px] bg-[var(--m3-primary-container)] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-30"
              aria-hidden="true"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            id="app-file-input"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-8">
            <div
              className={`relative flex ${isCompact ? 'h-16 w-16 md:h-20 md:w-20' : 'h-24 w-24'} items-center justify-center rounded-[26px] bg-[var(--m3-primary-container)] transition-transform duration-300`}
              style={{ boxShadow: 'inset 0 -4px 12px rgba(30, 99, 213, 0.15)', transform: isDragging ? 'scale(1.05)' : 'scale(1)' }}
            >
              <MdCloudUpload
                className={`${isCompact ? 'h-9 w-9 md:h-10 md:w-10' : 'h-12 w-12'} text-[var(--m3-primary)]`}
              />
            </div>

            <div className="space-y-3 px-4 text-center">
              <h3 className={`${isCompact ? 'text-headline' : 'text-title'} text-[var(--m3-on-surface)]`}>
                {uploading
                  ? 'Dosyalar yükleniyor...'
                  : isDragging
                    ? 'Bırakın, biz hallederiz'
                    : 'Dosyalarınızı buraya bırakın'}
              </h3>
              <p className="text-body text-[var(--m3-on-surface-variant)] max-w-xl">
                {uploading
                  ? 'Dosyalarınız güvenli bir şekilde aktarılıyor. Bu pencereyi kapatmayın.'
                  : 'Sürükleyip bırakın veya bilgisayarınızdaki dosyalara göz atmak için dokunun. Şifre korumalı paylaşımınız saniyeler içinde hazır.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--m3-primary)] px-6 py-3 text-sm font-semibold text-[var(--m3-on-primary)] transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--m3-primary)] focus-visible:ring-offset-2 disabled:opacity-70"
                style={{ boxShadow: '0 12px 24px rgba(30, 99, 213, 0.24)' }}
              >
                <MdCloudUpload className="h-5 w-5" />
                {uploading ? 'Bekleyin' : 'Yükleme Başlat'}
              </button>
            </div>

          </div>

          {uploading && (
            <div className="absolute inset-0 rounded-[32px] bg-[var(--m3-surface)]/82 backdrop-blur-xl">
              <div className="flex h-full flex-col items-center justify-center space-y-6 text-[var(--m3-on-surface-variant)]">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--m3-primary)] border-t-transparent" />
                <div className="w-full max-w-xs overflow-hidden rounded-full bg-[var(--m3-surface-variant)]/60">
                  <div className="h-1.5 w-full animate-[progress_1.5s_linear_infinite] bg-[var(--m3-primary)]" />
                </div>
                <p className="text-body font-medium">Yükleme devam ediyor…</p>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
);

Dropzone.displayName = 'Dropzone';

export default Dropzone;
