import { useState, useEffect, useMemo } from 'react';
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
  MdArrowBack,
  MdViewAgenda,
  MdViewModule,
  MdSearch,
  MdShield,
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

interface AdminPanelProps {
  onBackToUpload: () => void;
}

export default function AdminPanel({ onBackToUpload }: AdminPanelProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showShortLinksOnly, setShowShortLinksOnly] = useState(false);

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

  const summaries = useMemo(() => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const lastUpload = files
      .map((file) => file.uploaded)
      .filter((uploaded): uploaded is string => Boolean(uploaded))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    const withShortLink = files.filter((file) => Boolean(file.shortUrl)).length;

    return {
      totalFiles: files.length,
      totalSize,
      lastUpload,
      withShortLink,
    };
  }, [files]);

  const filteredFiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return files.filter((file) => {
      const matchesTerm =
        !term ||
        file.filename.toLowerCase().includes(term) ||
        (file.slug && file.slug.toLowerCase().includes(term));
      const matchesShortLink = !showShortLinksOnly || Boolean(file.shortUrl);
      return matchesTerm && matchesShortLink;
    });
  }, [files, searchTerm, showShortLinksOnly]);

  return (
    <div className="space-y-10 text-[var(--m3-on-surface)]">
      <section
        className="rounded-[var(--m3-radius-lg)] bg-gradient-to-br from-[var(--m3-primary-container)] via-[var(--m3-surface-container)] to-[var(--m3-surface-container-high)] px-6 py-8 md:px-10"
        style={{ boxShadow: 'var(--m3-elev-2)' }}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-[var(--m3-on-primary-container)]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)]">
                <MdShield className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] opacity-80">Yönetim alanı</p>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  Dosyalarınızı yönetin
                </h2>
              </div>
            </div>
            <p className="max-w-xl text-sm text-[var(--m3-on-surface-variant)]">
              Tüm yüklenen dosyalarınızı görüntüleyin, paylaşın ve yönetin. Bağlantıları kopyalayın,
              dosyaları önizleyin veya silin.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onBackToUpload}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--m3-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--m3-primary)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)] focus-visible:outline-none"
              >
                <MdArrowBack className="h-5 w-5" />
                Yüklemeye dön
              </button>
            </div>
          </div>
          <div className="grid gap-3 self-start rounded-[var(--m3-radius-lg)] bg-white p-4"
            style={{ boxShadow: 'var(--m3-elev-2)' }}
          >
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-[var(--m3-radius-md)] bg-[var(--m3-primary-container)] px-4 py-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-primary-container)]">
                  Dosya
                </dt>
                <dd className="text-lg font-semibold text-[var(--m3-on-primary-container)]">
                  {summaries.totalFiles}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-[var(--m3-radius-md)] bg-[var(--m3-secondary-container)] px-4 py-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-secondary-container)]">
                  Boyut
                </dt>
                <dd className="text-lg font-semibold text-[var(--m3-on-secondary-container)]">
                  {formatBytes(summaries.totalSize)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-[var(--m3-radius-md)] bg-[var(--m3-primary-container)] px-4 py-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-primary-container)]">
                  Kısa URL
                </dt>
                <dd className="text-lg font-semibold text-[var(--m3-on-primary-container)]">
                  {summaries.withShortLink}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

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
        <section className="space-y-6">
          <div
            className="flex flex-col gap-4 rounded-[var(--m3-radius-lg)] bg-white p-4 md:flex-row md:items-center md:justify-between md:p-6"
            style={{ boxShadow: 'var(--m3-elev-2)' }}
          >
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--m3-on-surface-variant)]/70" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Dosya ismi veya slug ara"
                className="w-full rounded-full border border-[var(--m3-outline)]/30 bg-[var(--m3-surface-variant)]/60 px-10 py-2.5 text-sm text-[var(--m3-on-surface)] focus:border-[var(--m3-primary)] focus:ring-2 focus:ring-[var(--m3-primary)]/30 focus-visible:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowShortLinksOnly((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  showShortLinksOnly
                    ? 'border-[var(--m3-primary)] bg-[var(--m3-primary)] text-[var(--m3-on-primary)]'
                    : 'border-[var(--m3-outline)]/30 text-[var(--m3-on-surface-variant)] hover:border-[var(--m3-primary)] hover:text-[var(--m3-primary)]'
                }`}
              >
                <MdLink className="h-4 w-4" />
                Kısa URL olanlar
              </button>
              <div className="flex rounded-full bg-[var(--m3-surface-variant)]/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === 'grid'
                      ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)]'
                      : 'text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)]'
                  }`}
                >
                  <MdViewModule className="h-4 w-4" /> Kart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === 'list'
                      ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)]'
                      : 'text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)]'
                  }`}
                >
                  <MdViewAgenda className="h-4 w-4" /> Liste
                </button>
              </div>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.15)] bg-[var(--m3-surface)]/60 py-16 text-center"
              style={{ boxShadow: 'var(--m3-elev-1)' }}
            >
              <p className="text-sm font-medium text-[var(--m3-on-surface)]">Kriterlere uygun sonuç bulunamadı.</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--m3-on-surface-variant)]">
                Filtreden çıkıp tekrar deneyin
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredFiles.map((file) => (
                <article
                  key={file.key}
                  className="flex h-full flex-col gap-4 rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.2)] bg-[var(--m3-surface-container)] p-5"
                  style={{ boxShadow: 'var(--m3-elev-2)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)]">
                      {getFileIcon(file.contentType)}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-[var(--m3-on-surface)]">
                        {file.filename}
                      </p>
                      <p className="text-xs text-[var(--m3-on-surface-variant)]">
                        {file.uploaded
                          ? new Date(file.uploaded).toLocaleString()
                          : 'Tarih bilgisi yok'}
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-2 text-xs text-[var(--m3-on-surface-variant)]">
                    <div className="flex items-center justify-between rounded-[var(--m3-radius-sm)] bg-[var(--m3-surface-variant)]/60 px-3 py-2 font-medium">
                      <dt>Boyut</dt>
                      <dd>{formatBytes(file.size)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-[var(--m3-radius-sm)] bg-[var(--m3-surface-variant)]/40 px-3 py-2 font-medium">
                      <dt>Tür</dt>
                      <dd className="truncate">{file.contentType}</dd>
                    </div>
                    {file.slug && (
                      <div className="flex items-center justify-between rounded-[var(--m3-radius-sm)] bg-[var(--m3-primary-container)]/60 px-3 py-2 font-medium text-[var(--m3-on-primary-container)]">
                        <dt>Slug</dt>
                        <dd className="truncate">{file.slug}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="grid w-full gap-2 sm:grid-cols-3">
                    {file.shortUrl ? (
                      <a
                        href={
                          file.shortUrl.startsWith('http')
                            ? file.shortUrl
                            : window.location.origin + file.shortUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-4 py-2 text-xs font-semibold text-[var(--m3-on-primary-container)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)] focus-visible:outline-none"
                      >
                        <MdLink className="h-4 w-4" /> Kısa URL'yi aç
                      </a>
                    ) : (
                      <button
                        onClick={() => handleCopyUrl(file)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-4 py-2 text-xs font-semibold text-[var(--m3-on-primary-container)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)] focus-visible:outline-none"
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--m3-secondary)] px-4 py-2 text-xs font-semibold text-[var(--m3-on-secondary)] transition hover:brightness-110 focus-visible:outline-none"
                    >
                      <MdOpenInNew className="h-4 w-4" /> Önizle
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.key)}
                      disabled={deleting === file.key}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--m3-error)] px-4 py-2 text-xs font-semibold text-[var(--m3-on-error)] transition hover:brightness-110 disabled:opacity-70 focus-visible:outline-none"
                    >
                      <MdDelete className="h-4 w-4" />
                      {deleting === file.key ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.15)] bg-[var(--m3-surface-container)]"
              style={{ boxShadow: 'var(--m3-elev-2)' }}
            >
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead className="text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--m3-on-surface-variant)]">
                  <tr>
                    <th className="px-5 py-3">Dosya</th>
                    <th className="px-5 py-3">Boyut</th>
                    <th className="px-5 py-3">Tür</th>
                    <th className="px-5 py-3">Yüklenme</th>
                    <th className="px-5 py-3">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.key} className="align-top">
                      <td className="px-4">
                        <div className="flex items-start gap-3 rounded-[var(--m3-radius-md)] bg-[var(--m3-surface)]/80 px-4 py-3"
                          style={{ boxShadow: 'var(--m3-elev-1)' }}
                        >
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)]">
                            {getFileIcon(file.contentType)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--m3-on-surface)]">
                              {file.filename}
                            </p>
                            <p className="truncate text-xs text-[var(--m3-on-surface-variant)]">
                              {(file.shortUrl || file.url).replace(window.location.origin, '')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-[var(--m3-on-surface-variant)]">
                        {formatBytes(file.size)}
                      </td>
                      <td className="px-4 py-2 text-[var(--m3-on-surface-variant)]">{file.contentType}</td>
                      <td className="px-4 py-2 text-[var(--m3-on-surface-variant)]">
                        {file.uploaded ? new Date(file.uploaded).toLocaleString() : 'Bilinmiyor'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleCopyUrl(file)}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-3 py-1.5 text-xs font-semibold text-[var(--m3-on-primary-container)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)] focus-visible:outline-none"
                          >
                            {copiedKey === file.key ? (
                              <>
                                <MdCheckCircle className="h-4 w-4" /> Kopyalandı
                              </>
                            ) : (
                              <>
                                <MdLink className="h-4 w-4" /> URL
                              </>
                            )}
                          </button>
                          <a
                            href={file.url.startsWith('http') ? file.url : window.location.origin + file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--m3-on-secondary)] transition hover:brightness-110 focus-visible:outline-none"
                          >
                            <MdOpenInNew className="h-4 w-4" /> Önizle
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.key)}
                            disabled={deleting === file.key}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-error)] px-3 py-1.5 text-xs font-semibold text-[var(--m3-on-error)] transition hover:brightness-110 disabled:opacity-70 focus-visible:outline-none"
                          >
                            <MdDelete className="h-4 w-4" />
                            {deleting === file.key ? '...' : 'Sil'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface)]/60 px-6 py-4 text-sm text-[var(--m3-on-surface-variant)]"
            style={{ boxShadow: 'var(--m3-elev-1)' }}
          >
            <span className="font-semibold text-[var(--m3-on-surface)]">{filteredFiles.length}</span> dosya
            listeleniyor — toplam {files.length}.
          </footer>
        </section>
      )}
    </div>
  );
}
