import { useCallback, useState, forwardRef, useImperativeHandle, useRef } from 'react';
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
    const containerPadding = isCompact ? 'px-5 py-10 md:px-6 md:py-12' : 'px-6 py-16';

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
        className={`group relative overflow-hidden rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.2)] bg-gradient-to-br from-[var(--m3-surface-container)] via-[var(--m3-surface)] to-[color:rgba(57,96,143,0.12)] text-center transition-all duration-200 ease-out ${containerPadding} ${
          uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
        style={{
          boxShadow: isDragging ? 'var(--m3-elev-4)' : 'var(--m3-elev-2)',
          outline: isDragging ? '2px solid var(--m3-primary)' : 'none',
          outlineOffset: '4px',
        }}
      >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden="true"
          >
            <div className="absolute -inset-px bg-[radial-gradient(circle_at_top,var(--m3-primary)/12,transparent_55%)]" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            id="app-file-input"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center space-y-8">
            <div className={`relative flex ${isCompact ? 'h-20 w-20' : 'h-24 w-24'} items-center justify-center`}>
              <div className="absolute inset-0 rounded-[28px] bg-[var(--m3-primary-container)]" />
              <div className="absolute inset-3 rounded-[24px] bg-[var(--m3-primary)]/12" />
              <svg
                className={`relative ${isCompact ? 'h-10 w-10' : 'h-12 w-12'} text-[var(--m3-primary)]`}
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
                <span className="absolute inset-0 rounded-[28px] border-2 border-[var(--m3-primary)]/50 bg-[var(--m3-primary)]/10" />
              )}
            </div>

            <div className="space-y-3">
              <h3 className={`${isCompact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-semibold text-[var(--m3-on-surface)]`}>
                {uploading
                  ? 'Dosyalar yükleniyor...'
                  : isDragging
                    ? 'Bırakın, biz hallederiz'
                    : 'Dosyalarınızı buraya bırakın'}
              </h3>
              <p className={`${isCompact ? 'text-sm md:text-base' : 'text-sm md:text-base'} text-[var(--m3-on-surface-variant)]`}>
                {uploading
                  ? 'Dosyalarınız güvenli bir şekilde aktarılıyor. Bu pencereyi kapatmayın.'
                  : 'Sürükleyip bırakın veya bilgisayarınızdaki dosyalara göz atmak için dokunun. Şifre korumalı paylaşımınız saniyeler içinde hazır.'}
              </p>
            </div>

            <dl className={`grid w-full gap-3 text-xs text-[var(--m3-on-surface-variant)]/90 ${isCompact ? 'sm:grid-cols-3' : 'md:grid-cols-3'}`}>
              <div className="rounded-full bg-[var(--m3-primary-container)]/60 px-4 py-2">
                <dt className="font-semibold text-[var(--m3-on-primary-container)]">Çoklu seçim</dt>
                <dd className="mt-1 text-[color:rgba(15,23,42,0.55)]">
                  Aynı anda onlarca dosya sürükleyin.
                </dd>
              </div>
              <div className="rounded-full bg-[var(--m3-surface-variant)]/80 px-4 py-2">
                <dt className="font-semibold text-[var(--m3-on-surface-variant)]">Limitsiz boyut</dt>
                <dd className="mt-1 text-[color:rgba(15,23,42,0.55)]">
                  Yapay sınırlar olmadan paylaşın.
                </dd>
              </div>
              <div className="rounded-full bg-[var(--m3-secondary-container)]/60 px-4 py-2">
                <dt className="font-semibold text-[var(--m3-on-secondary-container)]">Şifreli aktarım</dt>
                <dd className="mt-1 text-[color:rgba(15,23,42,0.55)]">
                  Parolanız olmadan kimse erişemez.
                </dd>
              </div>
            </dl>
          </div>

          {uploading && (
            <div className="absolute inset-0 rounded-[var(--m3-radius-lg)] bg-[color:rgba(15,23,42,0.04)] backdrop-blur-sm">
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-[var(--m3-on-surface-variant)]">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--m3-primary)] border-t-transparent" />
                <div className="w-full max-w-xs overflow-hidden rounded-full bg-[var(--m3-surface-variant)]/80">
                  <div className="h-1.5 w-full animate-[progress_1.5s_linear_infinite] bg-[var(--m3-primary)]" />
                </div>
                <p className="text-sm font-medium tracking-wide">Yükleme devam ediyor…</p>
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
