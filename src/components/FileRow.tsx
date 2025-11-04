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
        iconBg: 'bg-[var(--m3-primary-container)]',
        iconColor: 'text-[var(--m3-primary)]',
        icon: <MdTaskAlt className="h-5 w-5" />,
        label: 'Yüklendi',
      };
    }
    if (file.status === 'error') {
      return {
        iconBg: 'bg-[var(--m3-error-container)]',
        iconColor: 'text-[var(--m3-on-error-container)]',
        icon: <MdError className="h-5 w-5" />,
        label: 'Hata',
      };
    }
    return {
      iconBg: 'bg-[var(--m3-secondary-container)]',
      iconColor: 'text-[var(--m3-secondary)]',
      icon: <MdSchedule className="h-5 w-5" />,
      label: 'Yükleniyor',
    };
  }, [file.status]);

  return (
    <article
      className="flex flex-col gap-4 rounded-[28px] border border-[var(--m3-surface-variant)]/60 bg-[var(--m3-surface)] px-6 py-5 shadow-[0_18px_32px_rgba(25,28,32,0.08)] md:px-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className={`mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${statusMeta.iconBg} ${statusMeta.iconColor}`}>
            {statusMeta.icon}
          </span>
          <div className="space-y-2">
            <div>
              <p className="truncate text-base font-semibold text-[var(--m3-on-surface)]">
                {file.filename}
              </p>
              <p className="text-sm text-[var(--m3-on-surface-variant)]">
                {formatBytes(file.size)} · {file.contentType || 'Tanımsız tür'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--m3-on-surface-variant)]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-surface-variant)]/60 px-3 py-1">
                Durum: <span className="font-semibold text-[var(--m3-on-surface)]">{statusMeta.label}</span>
              </span>
              {file.slug && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-primary-container)]/70 px-3 py-1 text-[var(--m3-on-primary-container)]">
                  slug · {file.slug}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {file.status === 'error' && file.error && (
        <p className="rounded-2xl bg-[var(--m3-error-container)]/60 px-4 py-3 text-sm text-[var(--m3-on-error-container)]">
          {file.error}
        </p>
      )}

      {file.status === 'success' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--m3-surface-variant)]/60 px-4 py-3 text-xs text-[var(--m3-on-surface-variant)]">
            <p className="font-semibold text-[var(--m3-on-surface)]">Paylaşım Bağlantısı</p>
            <p className="mt-1 break-all font-mono text-[var(--m3-on-surface)]">{fullDisplayUrl}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--m3-primary)] px-5 py-3 text-sm font-semibold text-[var(--m3-on-primary)] shadow-[0_12px_24px_rgba(57,96,143,0.2)] transition hover:brightness-110 focus-visible:outline-none"
            >
              <MdCloudDownload className="h-5 w-5" />
              Dosyayı Aç
            </a>
            <button
              onClick={handleCopyLink}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-5 py-3 text-sm font-semibold text-[var(--m3-on-primary-container)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)] focus-visible:outline-none"
            >
              <MdContentCopy className="h-5 w-5" />
              {copied ? 'Kopyalandı' : 'Bağlantıyı Kopyala'}
            </button>
          </div>
        </div>
      )}

      {file.status === 'uploading' && file.progress !== undefined && (
        <div className="overflow-hidden rounded-full bg-[var(--m3-surface-variant)]/80">
          <div
            className="h-2 rounded-full bg-[var(--m3-primary)] transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
    </article>
  );
}
