import { useMemo, useState } from 'react';
import { MdCloudDownload, MdContentCopy, MdError, MdSchedule, MdTaskAlt } from 'react-icons/md';
import { formatBytes, getShareUrl } from '../lib/utils';
import { copyToClipboard } from '../lib/copy';
import type { UploadedFile } from '../App';

interface FileRowProps {
  file: UploadedFile;
  baseUrl?: string;
}

export default function FileRow({ file, baseUrl }: FileRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const urlToCopy = file.shortUrl
      ? file.shortUrl.startsWith('http')
        ? file.shortUrl
        : window.location.origin + file.shortUrl
      : file.url.startsWith('http')
        ? file.url
        : window.location.origin + file.url;

    const success = await copyToClipboard(urlToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayUrl = file.shortUrl || file.url || getShareUrl(file.key, baseUrl);
  const fullDisplayUrl = displayUrl.startsWith('http')
    ? displayUrl
    : window.location.origin + displayUrl;

  const openUrl = file.shortUrl || getShareUrl(file.key, baseUrl);

  const statusMeta = useMemo(() => {
    if (file.status === 'success') {
      return {
        iconBg: 'bg-gray-100',
        iconColor: 'text-apple-primary',
        icon: <MdTaskAlt className="h-5 w-5" />,
        label: 'Yüklendi',
      };
    }
    if (file.status === 'error') {
      return {
        iconBg: 'bg-red-50',
        iconColor: 'text-apple-error',
        icon: <MdError className="h-5 w-5" />,
        label: 'Hata',
      };
    }
    return {
      iconBg: 'bg-gray-100',
      iconColor: 'text-apple-gray-6',
      icon: <MdSchedule className="h-5 w-5" />,
      label: 'Yükleniyor',
    };
  }, [file.status]);

  return (
    <article
      className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-apple-sm md:px-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className={`mt-1 inline-flex h-12 w-12 items-center justify-center rounded-xl ${statusMeta.iconBg} ${statusMeta.iconColor}`}>
            {statusMeta.icon}
          </span>
          <div className="space-y-2">
            <div>
              <p className="truncate text-headline font-semibold text-apple-label">
                {file.filename}
              </p>
              <p className="text-body text-apple-label-secondary">
                {formatBytes(file.size)} · {file.contentType || 'Tanımsız tür'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-gray-100 border border-gray-200 px-3 py-1 text-caption text-apple-label-secondary">
                Durum: <span className="font-semibold text-apple-label">{statusMeta.label}</span>
              </span>
              {file.slug && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-gray-100 border border-gray-200 px-3 py-1 text-caption text-apple-label">
                  slug · {file.slug}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {file.status === 'error' && file.error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-body text-apple-error">
          {file.error}
        </p>
      )}

      {file.status === 'success' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-caption text-apple-label-secondary">
            <p className="font-semibold text-apple-label">Paylaşım Bağlantısı</p>
            <p className="mt-1 break-all font-mono text-apple-label text-subhead">{fullDisplayUrl}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-apple-primary px-6 py-3 text-body font-semibold text-white shadow-apple-md transition-all duration-200 hover:bg-apple-primary-hover hover:shadow-apple-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
            >
              <MdCloudDownload className="h-5 w-5" />
              Dosyayı Aç
            </a>
            <button
              onClick={handleCopyLink}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-body font-semibold text-apple-label shadow-apple-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-primary focus-visible:ring-offset-2"
            >
              <MdContentCopy className="h-5 w-5" />
              {copied ? 'Kopyalandı' : 'Bağlantıyı Kopyala'}
            </button>
          </div>
        </div>
      )}

      {file.status === 'uploading' && file.progress !== undefined && (
        <div className="overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-apple-primary transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
    </article>
  );
}
