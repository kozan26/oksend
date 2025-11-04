import { useCallback, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { MdCloudUpload, MdInsights, MdLock, MdSpeed } from 'react-icons/md';
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
          className={`group relative bg-[var(--m3-surface-container)] rounded-[var(--m3-radius-lg)] text-center transition-all duration-200 ${
            isDragging ? 'elev-4' : 'elev-1'
          } ${
            uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:elev-2'
          } ${containerPadding}`}
          style={{
            outline: isDragging ? '2px solid var(--m3-primary)' : 'none',
            outlineOffset: '2px',
          }}
        >
          {/* Hover state layer */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[var(--m3-radius-lg)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden="true"
            style={{
              backgroundColor: `rgba(${isDragging ? '57, 96, 143' : '0, 0, 0'}, ${isDragging ? 0.12 : 0.08})`,
            }}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            id="app-file-input"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          
          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-6 mx-auto">
            {/* Icon */}
            <div
              className={`relative flex ${isCompact ? 'h-16 w-16 md:h-18 w-18' : 'h-20 w-20'} items-center justify-center rounded-full bg-[var(--m3-primary-container)]`}
            >
              <MdCloudUpload
                className={`${isCompact ? 'h-8 w-8 md:h-9 md:w-9' : 'h-10 w-10'} text-[var(--m3-primary)]`}
              />
              {isDragging && (
                <span className="absolute inset-0 rounded-full border-2 border-[var(--m3-primary)]" />
              )}
            </div>

            {/* Text content */}
            <div className="space-y-2 px-2">
              <h3
                className={`${isCompact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-medium text-[var(--m3-on-surface)]`}
              >
                {uploading
                  ? 'Dosyalar yükleniyor...'
                  : isDragging
                    ? 'Bırakın, biz hallederiz'
                    : 'Dosyalarınızı buraya bırakın'}
              </h3>
              <p className="text-sm text-[var(--m3-on-surface-variant)] md:text-base">
                {uploading
                  ? 'Dosyalarınız güvenli bir şekilde aktarılıyor. Bu pencereyi kapatmayın.'
                  : 'Sürükleyip bırakın veya bilgisayarınızdaki dosyalara göz atmak için dokunun. Şifre korumalı paylaşımınız saniyeler içinde hazır.'}
              </p>
            </div>

            {/* Action button */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-primary)] px-6 py-3 text-sm font-medium text-[var(--m3-on-primary)] shadow-[var(--m3-elev-2)] transition-all hover:shadow-[var(--m3-elev-3)] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[var(--m3-primary)] focus-visible:outline-offset-2 disabled:opacity-70"
                style={{
                  backgroundColor: uploading ? undefined : 'var(--m3-primary)',
                }}
              >
                <MdCloudUpload className="h-5 w-5" />
                {uploading ? 'Bekleyin' : 'Yükleme Başlat'}
              </button>
            </div>

            {/* Features list */}
            <dl
              className={`flex w-full flex-wrap items-center justify-center gap-2 text-xs ${isCompact ? 'md:gap-3' : 'gap-3'}`}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-primary-container)] px-3 py-1.5">
                <MdSpeed className="h-4 w-4 text-[var(--m3-primary)]" />
                <div>
                  <dt className="font-medium text-[var(--m3-on-primary-container)]">Hızlı transfer</dt>
                  <dd className="text-[10px] text-[var(--m3-on-primary-container)]/70">Sunucuya anında ulaşır</dd>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-secondary-container)] px-3 py-1.5">
                <MdLock className="h-4 w-4 text-[var(--m3-secondary)]" />
                <div>
                  <dt className="font-medium text-[var(--m3-on-secondary-container)]">Parola korumalı</dt>
                  <dd className="text-[10px] text-[var(--m3-on-secondary-container)]/70">İzinsiz erişim yok</dd>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-surface-variant)] px-3 py-1.5">
                <MdInsights className="h-4 w-4 text-[var(--m3-primary)]" />
                <div>
                  <dt className="font-medium text-[var(--m3-on-surface-variant)]">Anlık linkler</dt>
                  <dd className="text-[10px] text-[var(--m3-on-surface-variant)]/70">Paylaşım tek dokunuşla</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Upload overlay */}
          {uploading && (
            <div className="absolute inset-0 rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface)]/80 backdrop-blur-sm">
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-[var(--m3-on-surface-variant)]">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--m3-primary)] border-t-transparent" />
                <div className="w-full max-w-xs overflow-hidden rounded-full bg-[var(--m3-surface-variant)]">
                  <div className="h-1.5 w-full animate-[progress_1.5s_linear_infinite] bg-[var(--m3-primary)]" />
                </div>
                <p className="text-sm font-medium">Yükleme devam ediyor…</p>
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
