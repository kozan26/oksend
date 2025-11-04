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
    <div className="space-y-10 text-apple-label">
      <section
        className="rounded-2xl bg-white px-8 py-12 md:px-12 shadow-apple-md"
      >
        <div className="flex items-start justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <MdShield className="h-6 w-6 text-apple-primary" />
              </span>
              <div>
                <h2 className="text-title text-apple-label">
                  Dosyalarınızı yönetin
                </h2>
              </div>
            </div>
            <p className="max-w-xl text-body text-apple-label-secondary">
              Tüm yüklenen dosyalarınızı görüntüleyin, paylaşın ve yönetin. Bağlantıları kopyalayın,
              dosyaları önizleyin veya silin.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onBackToUpload}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-body font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
              >
                <MdArrowBack className="h-5 w-5" />
                Yüklemeye dön
              </button>
            </div>
          </div>
          <div className="grid gap-3 self-start rounded-2xl bg-white border border-gray-200 p-6 shadow-apple-md">
            <dl className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-100 border border-gray-200 px-4 py-3">
                <dt className="text-caption font-semibold text-apple-label-secondary">
                  Dosya
                </dt>
                <dd className="text-headline font-semibold text-apple-label">
                  {summaries.totalFiles}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-100 border border-gray-200 px-4 py-3">
                <dt className="text-caption font-semibold text-apple-label-secondary">
                  Boyut
                </dt>
                <dd className="text-headline font-semibold text-apple-label">
                  {formatBytes(summaries.totalSize)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-100 border border-gray-200 px-4 py-3">
                <dt className="text-caption font-semibold text-apple-label-secondary">
                  Kısa URL
                </dt>
                <dd className="text-headline font-semibold text-apple-label">
                  {summaries.withShortLink}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body text-apple-error shadow-apple-sm"
        >
          {error}
        </div>
      )}

      {loading && files.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-16 text-center shadow-apple-sm"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-apple-primary border-t-transparent" />
          <p className="mt-4 text-body text-apple-label-secondary">Dosyalar yükleniyor…</p>
        </div>
      ) : files.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-16 text-center shadow-apple-sm"
        >
          <p className="text-body font-medium text-apple-label">Henüz dosya yüklenmedi</p>
          <p className="mt-1 text-caption text-apple-label-secondary">
            Dosya geldiğinde burada görünecek
          </p>
        </div>
      ) : (
        <section className="space-y-6">
          <div
            className="flex flex-col gap-4 rounded-2xl bg-white border border-gray-200 p-6 md:flex-row md:items-center md:justify-between shadow-apple-md"
          >
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-apple-label-secondary/70" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Dosya ismi veya slug ara"
                className="w-full rounded-xl border border-gray-300 bg-white px-10 py-3 text-body text-apple-label shadow-apple-sm focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/30 focus-visible:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowShortLinksOnly((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-caption font-semibold transition-all duration-200 ${
                  showShortLinksOnly
                    ? 'border-apple-primary bg-apple-primary text-white shadow-apple-md'
                    : 'border-gray-300 bg-white text-apple-label-secondary hover:border-apple-primary hover:text-apple-primary shadow-apple-sm'
                }`}
              >
                <MdLink className="h-4 w-4" />
                Kısa URL olanlar
              </button>
              <div className="flex rounded-xl bg-gray-100 border border-gray-200 p-1 shadow-apple-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-caption font-semibold transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-apple-primary text-white shadow-apple-sm'
                      : 'text-apple-label-secondary hover:text-apple-primary'
                  }`}
                >
                  <MdViewModule className="h-4 w-4" /> Kart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-caption font-semibold transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-apple-primary text-white shadow-apple-sm'
                      : 'text-apple-label-secondary hover:text-apple-primary'
                  }`}
                >
                  <MdViewAgenda className="h-4 w-4" /> Liste
                </button>
              </div>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-apple-sm"
            >
              <p className="text-body font-medium text-apple-label">Kriterlere uygun sonuç bulunamadı.</p>
              <p className="mt-1 text-caption text-apple-label-secondary">
                Filtreden çıkıp tekrar deneyin
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredFiles.map((file) => (
                <article
                  key={file.key}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-apple-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-apple-primary">
                      {getFileIcon(file.contentType)}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-subhead font-semibold text-apple-label">
                        {file.filename}
                      </p>
                      <p className="text-caption text-apple-label-secondary">
                        {file.uploaded
                          ? new Date(file.uploaded).toLocaleString()
                          : 'Tarih bilgisi yok'}
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-2 text-caption text-apple-label-secondary">
                    <div className="flex items-center justify-between rounded-xl bg-gray-100 border border-gray-200 px-3 py-2 font-medium">
                      <dt>Boyut</dt>
                      <dd>{formatBytes(file.size)}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-100 border border-gray-200 px-3 py-2 font-medium">
                      <dt>Tür</dt>
                      <dd className="truncate">{file.contentType}</dd>
                    </div>
                    {file.slug && (
                      <div className="flex items-center justify-between rounded-xl bg-gray-100 border border-gray-200 px-3 py-2 font-medium text-apple-label">
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-caption font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                      >
                        <MdLink className="h-4 w-4" /> Kısa URL'yi aç
                      </a>
                    ) : (
                      <button
                        onClick={() => handleCopyUrl(file)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-caption font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-apple-primary px-4 py-2 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:bg-apple-primary-hover hover:shadow-apple-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                    >
                      <MdOpenInNew className="h-4 w-4" /> Önizle
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.key)}
                      disabled={deleting === file.key}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-apple-error px-4 py-2 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:opacity-90 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-error focus-visible:ring-offset-2"
                    >
                      <MdDelete className="h-4 w-4" />
                      {deleting === file.key ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-apple-md">
              <table className="min-w-full border-separate border-spacing-y-2 text-body">
                <thead className="text-left text-caption font-semibold text-apple-label-secondary">
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
                        <div className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 shadow-apple-sm">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-apple-primary">
                            {getFileIcon(file.contentType)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-subhead font-semibold text-apple-label">
                              {file.filename}
                            </p>
                            <p className="truncate text-caption text-apple-label-secondary">
                              {(file.shortUrl || file.url).replace(window.location.origin, '')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-apple-label-secondary">
                        {formatBytes(file.size)}
                      </td>
                      <td className="px-4 py-2 text-apple-label-secondary">{file.contentType}</td>
                      <td className="px-4 py-2 text-apple-label-secondary">
                        {file.uploaded ? new Date(file.uploaded).toLocaleString() : 'Bilinmiyor'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleCopyUrl(file)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-caption font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
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
                            className="inline-flex items-center gap-2 rounded-xl bg-apple-primary px-3 py-1.5 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:bg-apple-primary-hover hover:shadow-apple-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                          >
                            <MdOpenInNew className="h-4 w-4" /> Önizle
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.key)}
                            disabled={deleting === file.key}
                            className="inline-flex items-center gap-2 rounded-xl bg-apple-error px-3 py-1.5 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:opacity-90 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-error focus-visible:ring-offset-2"
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

          <footer className="rounded-2xl bg-white border border-gray-200 px-6 py-4 text-body text-apple-label-secondary shadow-apple-sm">
            <span className="font-semibold text-apple-label">{filteredFiles.length}</span> dosya
            listeleniyor — toplam {files.length}.
          </footer>
        </section>
      )}
    </div>
  );
}
