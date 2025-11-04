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
    const containerPadding = isCompact ? 'px-8 py-12 md:px-10 md:py-14' : 'px-8 py-16 md:px-12 md:py-20';

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
          className={`group relative bg-white/90 backdrop-blur-xl border border-gray-300 rounded-2xl text-center transition-all duration-300 ease-out ${
            isDragging
              ? 'scale-[1.02] shadow-apple-lg border-apple-primary'
              : 'shadow-apple-sm hover:shadow-apple-md hover:scale-[1.01]'
          } ${
            uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
          } ${containerPadding}`}
          style={{
            outline: isDragging ? '2px solid var(--apple-primary)' : 'none',
            outlineOffset: '2px',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="app-file-input"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 mx-auto">
            {/* Icon */}
            <div
              className={`relative flex ${isCompact ? 'h-16 w-16 md:h-20 md:w-20' : 'h-24 w-24'} items-center justify-center rounded-full bg-gray-100 transition-all duration-300 ${
                isDragging ? 'scale-110 bg-gray-200' : ''
              }`}
            >
              <MdCloudUpload
                className={`${isCompact ? 'h-8 w-8 md:h-10 md:w-10' : 'h-12 w-12'} text-apple-primary`}
              />
            </div>

            {/* Text content */}
            <div className="space-y-3 px-2">
              <h3 className={`${isCompact ? 'text-headline' : 'text-title'} text-apple-label`}>
                {uploading
                  ? 'Dosyalar yükleniyor...'
                  : isDragging
                    ? 'Bırakın, biz hallederiz'
                    : 'Dosyalarınızı buraya bırakın'}
              </h3>
              <p className="text-body text-apple-label-secondary max-w-xl">
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
                className="inline-flex items-center gap-2 rounded-xl bg-apple-primary px-6 py-3 text-body font-semibold text-white shadow-apple-md transition-all duration-200 hover:bg-apple-primary-hover hover:shadow-apple-lg disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
              >
                <MdCloudUpload className="h-5 w-5" />
                {uploading ? 'Bekleyin' : 'Yükleme Başlat'}
              </button>
            </div>

            {/* Features list */}
            <dl className={`flex w-full flex-wrap items-center justify-center gap-3 ${isCompact ? 'md:gap-4' : 'gap-4'}`}>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 shadow-apple-sm">
                <MdSpeed className="h-4 w-4 text-apple-primary" />
                <div>
                  <dt className="text-subhead font-semibold text-apple-label">Hızlı transfer</dt>
                  <dd className="text-caption text-apple-label-secondary">Sunucuya anında ulaşır</dd>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 shadow-apple-sm">
                <MdLock className="h-4 w-4 text-apple-primary" />
                <div>
                  <dt className="text-subhead font-semibold text-apple-label">Parola korumalı</dt>
                  <dd className="text-caption text-apple-label-secondary">İzinsiz erişim yok</dd>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 shadow-apple-sm">
                <MdInsights className="h-4 w-4 text-apple-primary" />
                <div>
                  <dt className="text-subhead font-semibold text-apple-label">Anlık linkler</dt>
                  <dd className="text-caption text-apple-label-secondary">Paylaşım tek dokunuşla</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Upload overlay */}
          {uploading && (
            <div className="absolute inset-0 rounded-2xl bg-white/90 backdrop-blur-md">
              <div className="flex h-full flex-col items-center justify-center space-y-6 text-apple-label-secondary">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-apple-primary border-t-transparent" />
                <div className="w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                  <div className="h-1.5 w-full animate-[progress_1.5s_linear_infinite] bg-apple-primary" />
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
