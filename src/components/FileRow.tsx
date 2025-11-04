import { useMemo, useState } from 'react';
import { formatBytes, getShareUrl } from '../lib/utils';
import { copyToClipboard } from '../lib/copy';
import type { UploadedFile } from '../App';
import { MdCheckCircle, MdError, MdSchedule, MdContentCopy, MdOpenInNew } from 'react-icons/md';

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

  const { badgeIcon, badgeLabel, badgeClassName } = useMemo(() => {
    if (file.status === 'success') {
      return {
        badgeIcon: <MdCheckCircle className="h-4 w-4" />,
        badgeLabel: 'Yüklendi',
        badgeClassName:
          'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]',
      };
    }
    if (file.status === 'error') {
      return {
        badgeIcon: <MdError className="h-4 w-4" />,
        badgeLabel: 'Hata',
        badgeClassName:
          'bg-[var(--m3-error-container)] text-[var(--m3-on-error-container)]',
      };
    }
    return {
      badgeIcon: <MdSchedule className="h-4 w-4" />,
      badgeLabel: 'Yükleniyor',
      badgeClassName:
        'bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)]',
    };
  }, [file.status]);

  return (
    <article
      className="flex flex-col gap-4 rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.18)] bg-[var(--m3-surface)]/70 p-4 text-left shadow-sm md:flex-row md:items-center md:justify-between md:gap-6 md:p-5"
      style={{ boxShadow: 'var(--m3-elev-1)' }}
    >
      <div className="flex flex-1 items-start gap-4">
        <div
          className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${badgeClassName}`}
        >
          {badgeIcon}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-[var(--m3-on-surface)] truncate">
              {file.filename}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--m3-on-surface-variant)]">
              <span>{file.contentType || 'Tanımsız tür'}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--m3-on-surface-variant)]/50" />
              <span>{formatBytes(file.size)}</span>
              {file.status === 'success' && file.slug && (
                <>
                  <span className="h-1 w-1 rounded-full bg-[var(--m3-on-surface-variant)]/50" />
                  <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--m3-on-surface-variant)]">
                    {file.slug}
                  </span>
                </>
              )}
            </div>
          </div>

          {file.status === 'error' && file.error && (
            <p className="text-sm text-[var(--m3-error)]">{file.error}</p>
          )}

          {file.status === 'success' && (
            <div className="space-y-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  type="text"
                  readOnly
                  value={fullDisplayUrl}
                  className="flex-1 rounded-lg border border-transparent bg-[var(--m3-surface-variant)]/60 px-3 py-2 text-xs font-medium text-[var(--m3-on-surface)] shadow-inner focus:border-[var(--m3-primary)] focus:ring-2 focus:ring-[var(--m3-primary)]/30"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 rounded-full bg-[var(--m3-primary)] px-4 py-2 text-xs font-semibold text-[var(--m3-on-primary)] transition-colors hover:bg-[#1d4ed8] focus-visible:outline-none"
                >
                  <MdContentCopy className="h-4 w-4" />
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
              {file.shortUrl && file.fullUrl && (
                <p className="text-xs text-[var(--m3-on-surface-variant)]">
                  Kısa bağlantı:{' '}
                  <span className="font-mono text-[var(--m3-on-surface)]">
                    {file.shortUrl.replace(window.location.origin, '')}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {file.status === 'success' && (
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--m3-primary)] px-4 py-2 text-sm font-medium text-[var(--m3-primary)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)] focus-visible:outline-none"
        >
          <MdOpenInNew className="h-4 w-4" />
          Aç
        </a>
      )}

      {file.status === 'uploading' && file.progress !== undefined && (
        <div className="mt-1 w-full overflow-hidden rounded-full bg-[var(--m3-surface-variant)]/80 md:mt-0 md:w-60">
          <div
            className="h-2 rounded-full bg-[var(--m3-primary)] transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
    </article>
  );
}
