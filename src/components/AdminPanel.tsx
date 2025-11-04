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
  MdOpenInNew,
} from 'react-icons/md';

interface FileItem {
  key: string;
  filename: string;
  size: number;
  contentType: string;
  uploaded: string | null;
  url: string;
  shortUrl?: string | null;
  slug?: string | null;
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
        throw new Error(errorData.reason || 'Dosyalar yüklenemedi');
      }

      const data = await response.json();
      setFiles(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dosyalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!confirm(`Bu dosyayı silmek istediğinize emin misiniz?\n\n${key}`)) {
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
        throw new Error(errorData.error || 'Dosya silinemedi');
      }

      setFiles((prev) => prev.filter((f) => f.key !== key));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Dosya silinemedi');
    } finally {
      setDeleting(null);
    }
  };

  const handleCopyUrl = async (file: FileItem) => {
    const urlToCopy = file.shortUrl
      ? file.shortUrl.startsWith('http')
        ? file.shortUrl
        : window.location.origin + file.shortUrl
      : file.url.startsWith('http')
        ? file.url
        : window.location.origin + file.url;

    const success = await copyToClipboard(urlToCopy);
    if (success) {
      setCopiedKey(file.key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const getFileIcon = (contentType: string, className: string = 'h-5 w-5') => {
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
    <div className="space-y-8 text-[var(--m3-on-surface)]">
      <div
        className="flex flex-col gap-4 rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface)]/60 p-4 md:flex-row md:items-center md:justify-between md:p-6"
        style={{ boxShadow: 'var(--m3-elev-1)' }}
      >
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--m3-on-surface-variant)]">
            Yönetim
          </p>
          <h2 className="text-2xl font-semibold text-[var(--m3-on-surface)]">
            Dosya kontrol merkezi
          </h2>
          <p className="text-sm text-[var(--m3-on-surface-variant)]">
            Yüklenen varlıkları görüntüleyin, bağlantıları paylaşın ve gerekirse dosyaları kaldırın.
          </p>
        </div>
        <button
          onClick={loadFiles}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--m3-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--m3-on-primary)] transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#1d4ed8]/60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Yükleniyor...' : 'Yenile'}
        </button>
      </div>

      {error && (
        <div
          className="rounded-[var(--m3-radius-md)] border border-transparent bg-[var(--m3-error-container)] px-4 py-3 text-[var(--m3-on-error-container)]"
          style={{ boxShadow: 'var(--m3-elev-1)' }}
        >
          {error}
        </div>
      )}

      {loading && files.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface)]/50 py-12 text-center"
          style={{ boxShadow: 'var(--m3-elev-1)' }}
        >
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--m3-primary)] border-t-transparent" />
          <p className="mt-4 text-sm text-[var(--m3-on-surface-variant)]">Dosyalar yükleniyor…</p>
        </div>
      ) : files.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface)]/50 py-12 text-center"
          style={{ boxShadow: 'var(--m3-elev-1)' }}
        >
          <p className="text-sm font-medium text-[var(--m3-on-surface)]">Henüz dosya yüklenmedi</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--m3-on-surface-variant)]">
            Dosya geldiğinde burada görünecek
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {files.map((file) => (
            <article
              key={file.key}
              className="flex flex-col gap-4 rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.2)] bg-[var(--m3-surface-container)] p-4 md:flex-row md:items-start md:justify-between md:p-6"
              style={{ boxShadow: 'var(--m3-elev-2)' }}
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)]">
                  {getFileIcon(file.contentType)}
                </span>
                <div className="min-w-0 space-y-3">
                  <div>
                    <p className="truncate text-base font-semibold text-[var(--m3-on-surface)]">
                      {file.filename}
                    </p>
                    <p className="truncate text-xs font-mono text-[var(--m3-on-surface-variant)]">
                      {file.shortUrl
                        ? file.shortUrl.startsWith('http')
                          ? file.shortUrl
                          : window.location.origin + file.shortUrl
                        : file.url.startsWith('http')
                          ? file.url
                          : window.location.origin + file.url}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--m3-on-surface-variant)]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-surface-variant)]/60 px-3 py-1 font-medium">
                      {formatBytes(file.size)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-surface-variant)]/60 px-3 py-1 font-medium">
                      {file.contentType}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-surface-variant)]/60 px-3 py-1 font-medium">
                      {file.uploaded ? new Date(file.uploaded).toLocaleString() : 'Bilinmiyor'}
                    </span>
                    {file.slug && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-primary-container)] px-3 py-1 font-medium text-[var(--m3-on-primary-container)]">
                        slug · {file.slug}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:w-72">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {file.shortUrl ? (
                    <a
                      href={
                        file.shortUrl.startsWith('http')
                          ? file.shortUrl
                          : window.location.origin + file.shortUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--m3-primary)] px-4 py-2 text-xs font-semibold text-[var(--m3-primary)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)]"
                      title="Kısa URL landing page'ine git"
                    >
                      <MdLink className="h-4 w-4" /> Kısa URL
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCopyUrl(file)}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--m3-primary)] px-4 py-2 text-xs font-semibold text-[var(--m3-primary)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)]"
                      title="URL'i kopyala"
                    >
                      {copiedKey === file.key ? (
                        <>
                          <MdCheckCircle className="h-4 w-4" /> Kopyalandı
                        </>
                      ) : (
                        <>
                          <MdLink className="h-4 w-4" /> URL'i kopyala
                        </>
                      )}
                    </button>
                  )}
                  <a
                    href={file.url.startsWith('http') ? file.url : window.location.origin + file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-secondary)] px-4 py-2 text-xs font-semibold text-[var(--m3-on-secondary)] transition hover:brightness-110"
                    title="Dosyayı aç"
                  >
                    <MdOpenInNew className="h-4 w-4" /> Aç
                  </a>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.key)}
                  disabled={deleting === file.key}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--m3-error)] px-4 py-2 text-xs font-semibold text-[var(--m3-on-error)] transition hover:brightness-110 disabled:opacity-70"
                  title="Dosyayı sil"
                >
                  <MdDelete className="h-4 w-4" />
                  {deleting === file.key ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </article>
          ))}
          <footer className="rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface)]/50 px-6 py-4 text-sm text-[var(--m3-on-surface-variant)]"
            style={{ boxShadow: 'var(--m3-elev-1)' }}
          >
            Toplam: <span className="font-semibold text-[var(--m3-on-surface)]">{files.length}</span> dosya
          </footer>
        </section>
      )}
    </div>
  );
}
