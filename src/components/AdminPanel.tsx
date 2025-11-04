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
  MdInfo,
  MdFilterList,
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
    <div className="space-y-8 text-apple-label">
      {/* Header Section */}
      <section className="rounded-2xl bg-white border border-gray-200 px-8 py-10 shadow-apple-md">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <MdShield className="h-7 w-7 text-apple-primary" />
              </div>
              <div>
                <h1 className="text-title text-apple-label">Dosya Yönetimi</h1>
                <p className="text-body text-apple-label-secondary mt-1">
                  Yüklenen dosyalarınızı görüntüleyin ve yönetin
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToUpload}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-body font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
            >
              <MdArrowBack className="h-5 w-5" />
              Yüklemeye dön
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 lg:w-auto">
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center">
              <div className="text-headline font-bold text-apple-label">{summaries.totalFiles}</div>
              <div className="text-caption text-apple-label-secondary mt-1">Dosya</div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center">
              <div className="text-subhead font-semibold text-apple-label">{formatBytes(summaries.totalSize)}</div>
              <div className="text-caption text-apple-label-secondary mt-1">Toplam</div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center">
              <div className="text-headline font-bold text-apple-label">{summaries.withShortLink}</div>
              <div className="text-caption text-apple-label-secondary mt-1">Kısa URL</div>
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-body text-apple-error shadow-apple-sm flex items-center gap-3">
          <MdInfo className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-20 text-center shadow-apple-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-apple-primary border-t-transparent" />
          <p className="mt-6 text-body text-apple-label-secondary">Dosyalar yükleniyor…</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-20 text-center shadow-apple-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <MdInfo className="h-8 w-8 text-apple-label-secondary" />
          </div>
          <p className="text-body font-semibold text-apple-label">Henüz dosya yüklenmedi</p>
          <p className="mt-2 text-caption text-apple-label-secondary">
            Dosya geldiğinde burada görünecek
          </p>
        </div>
      ) : (
        <section className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-apple-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <MdSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-apple-label-secondary/60" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Dosya ismi veya slug ara..."
                  className="w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 py-3 text-body text-apple-label shadow-apple-sm transition-all duration-200 focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/30 focus-visible:outline-none"
                />
              </div>

              {/* Filter and View Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowShortLinksOnly((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-caption font-semibold transition-all duration-200 ${
                    showShortLinksOnly
                      ? 'border-apple-primary bg-apple-primary text-white shadow-apple-md'
                      : 'border-gray-300 bg-white text-apple-label-secondary hover:border-apple-primary hover:text-apple-primary shadow-apple-sm'
                  }`}
                >
                  <MdFilterList className="h-4 w-4" />
                  Kısa URL
                </button>

                <div className="flex rounded-xl bg-gray-100 border border-gray-200 p-1 shadow-apple-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-caption font-semibold transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-white text-apple-primary shadow-apple-sm'
                        : 'text-apple-label-secondary hover:text-apple-primary'
                    }`}
                  >
                    <MdViewModule className="h-4 w-4" />
                    Kart
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-caption font-semibold transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-white text-apple-primary shadow-apple-sm'
                        : 'text-apple-label-secondary hover:text-apple-primary'
                    }`}
                  >
                    <MdViewAgenda className="h-4 w-4" />
                    Liste
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Empty Results */}
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-20 text-center shadow-apple-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <MdSearch className="h-8 w-8 text-apple-label-secondary" />
              </div>
              <p className="text-body font-semibold text-apple-label">Sonuç bulunamadı</p>
              <p className="mt-2 text-caption text-apple-label-secondary">
                Arama kriterlerinizi değiştirip tekrar deneyin
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredFiles.map((file) => (
                <article
                  key={file.key}
                  className="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-apple-sm transition-all duration-200 hover:shadow-apple-md"
                >
                  {/* File Header */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-apple-primary">
                      {getFileIcon(file.contentType, 'h-7 w-7')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-subhead font-semibold text-apple-label">
                        {file.filename}
                      </h3>
                      <p className="mt-1 text-caption text-apple-label-secondary">
                        {file.uploaded
                          ? new Date(file.uploaded).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Tarih yok'}
                      </p>
                    </div>
                  </div>

                  {/* File Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                      <span className="text-caption text-apple-label-secondary">Boyut</span>
                      <span className="text-caption font-semibold text-apple-label">{formatBytes(file.size)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
                      <span className="text-caption text-apple-label-secondary">Tür</span>
                      <span className="text-caption font-semibold text-apple-label truncate max-w-[150px]" title={file.contentType}>
                        {file.contentType}
                      </span>
                    </div>
                    {file.slug && (
                      <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
                        <span className="text-caption text-apple-primary">Slug</span>
                        <span className="text-caption font-mono font-semibold text-apple-primary truncate max-w-[150px]" title={file.slug}>
                          {file.slug}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 mt-auto">
                    {file.shortUrl ? (
                      <a
                        href={
                          file.shortUrl.startsWith('http')
                            ? file.shortUrl
                            : window.location.origin + file.shortUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-caption font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                        title="Kısa URL'yi aç"
                      >
                        <MdLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleCopyUrl(file)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-caption font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                        title={copiedKey === file.key ? 'Kopyalandı' : 'URL\'i kopyala'}
                      >
                        {copiedKey === file.key ? (
                          <MdCheckCircle className="h-4 w-4 text-apple-success" />
                        ) : (
                          <MdLink className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <a
                      href={file.url.startsWith('http') ? file.url : window.location.origin + file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-apple-primary px-3 py-2.5 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:bg-apple-primary-hover hover:shadow-apple-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                      title="Dosyayı aç"
                    >
                      <MdOpenInNew className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.key)}
                      disabled={deleting === file.key}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-apple-error px-3 py-2.5 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:opacity-90 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-error focus-visible:ring-offset-2"
                      title="Dosyayı sil"
                    >
                      <MdDelete className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-apple-md">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-caption font-semibold text-apple-label-secondary">Dosya</th>
                      <th className="px-6 py-4 text-left text-caption font-semibold text-apple-label-secondary">Boyut</th>
                      <th className="px-6 py-4 text-left text-caption font-semibold text-apple-label-secondary">Tür</th>
                      <th className="px-6 py-4 text-left text-caption font-semibold text-apple-label-secondary">Yüklenme</th>
                      <th className="px-6 py-4 text-left text-caption font-semibold text-apple-label-secondary">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredFiles.map((file) => (
                      <tr key={file.key} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-apple-primary">
                              {getFileIcon(file.contentType, 'h-5 w-5')}
                            </div>
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
                        <td className="px-6 py-4 text-body text-apple-label-secondary">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-6 py-4 text-body text-apple-label-secondary">
                          <span className="truncate block max-w-[200px]" title={file.contentType}>
                            {file.contentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-body text-apple-label-secondary">
                          {file.uploaded
                            ? new Date(file.uploaded).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Bilinmiyor'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {file.shortUrl ? (
                              <a
                                href={
                                  file.shortUrl.startsWith('http')
                                    ? file.shortUrl
                                    : window.location.origin + file.shortUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-caption font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                                title="Kısa URL'yi aç"
                              >
                                <MdLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <button
                                onClick={() => handleCopyUrl(file)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-caption font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                                title={copiedKey === file.key ? 'Kopyalandı' : 'URL\'i kopyala'}
                              >
                                {copiedKey === file.key ? (
                                  <MdCheckCircle className="h-4 w-4 text-apple-success" />
                                ) : (
                                  <MdLink className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <a
                              href={file.url.startsWith('http') ? file.url : window.location.origin + file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-apple-primary px-3 py-2 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:bg-apple-primary-hover hover:shadow-apple-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
                              title="Dosyayı aç"
                            >
                              <MdOpenInNew className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteFile(file.key)}
                              disabled={deleting === file.key}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-apple-error px-3 py-2 text-caption font-semibold text-white shadow-apple-md transition-all duration-200 hover:opacity-90 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-error focus-visible:ring-offset-2"
                              title="Dosyayı sil"
                            >
                              <MdDelete className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="rounded-2xl bg-white border border-gray-200 px-6 py-4 text-body text-apple-label-secondary shadow-apple-sm">
            <span className="font-semibold text-apple-label">{filteredFiles.length}</span> dosya
            listeleniyor — toplam <span className="font-semibold text-apple-label">{files.length}</span>
          </div>
        </section>
      )}
    </div>
  );
}
