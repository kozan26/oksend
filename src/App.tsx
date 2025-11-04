import { useState, useEffect, useMemo, useRef } from 'react';
import Dropzone, { DropzoneHandle } from './components/Dropzone';
import FileRow from './components/FileRow';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import { hasPassword, setPassword } from './lib/auth';
import type { ToastMessage } from './components/Toast';
import {
  MdAutoAwesome,
  MdCloudUpload,
  MdInsights,
  MdLock,
  MdSettings,
  MdSpeed,
} from 'react-icons/md';

export interface UploadedFile {
  key: string;
  filename: string;
  size: number;
  contentType: string;
  url: string;
  fullUrl?: string;
  shortUrl?: string;
  slug?: string;
  progress?: number;
  status?: 'uploading' | 'success' | 'error';
  error?: string;
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [validating, setValidating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentView, setCurrentView] = useState<'upload' | 'admin'>('upload');
  const dropzoneRef = useRef<DropzoneHandle | null>(null);

  useEffect(() => {
    setAuthenticated(hasPassword());
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Parola gerekli');
      return;
    }

    setValidating(true);
    setPasswordError('');

    // Validate password by making a test API call
    try {
      const response = await fetch('/api/list', {
        headers: {
          'X-Auth': password,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setPasswordError(errorData.reason || errorData.error || 'Geçersiz parola');
        return;
      }

      // Password is correct
      setPassword(password);
      setAuthenticated(true);
      setPasswordError('');
      showToast('Başarıyla doğrulandı', 'success');
    } catch (error) {
      setPasswordError('Parola doğrulanamadı. Lütfen tekrar deneyin.');
    } finally {
      setValidating(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...files, ...prev]);
  };

  const handleUploadError = (message: string) => {
    showToast(message, 'error');
  };

  const stats = useMemo(() => {
    const success = uploadedFiles.filter((file) => file.status === 'success').length;
    const errors = uploadedFiles.filter((file) => file.status === 'error').length;
    const pending = uploadedFiles.filter((file) => file.status === 'uploading').length;
    return { success, errors, pending };
  }, [uploadedFiles]);

  const handleOpenUpload = () => {
    dropzoneRef.current?.openFileDialog();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--m3-surface)] text-[var(--m3-on-surface)] px-4">
        <div
          className="w-full max-w-md bg-[var(--m3-surface-container)] rounded-[var(--m3-radius-lg)] px-8 py-10 space-y-8"
          style={{ boxShadow: 'var(--m3-elev-3)' }}
        >
          <div className="text-center space-y-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]">
              <MdCloudUpload className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--m3-on-surface)]">
              ozan.cloud
            </h1>
            <p className="text-sm text-[var(--m3-on-surface-variant)]">
              Yönetim ve yükleme ekranına erişmek için parolanızı girin.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--m3-on-surface)]"
              >
                Parolayı Gir
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full rounded-xl border border-transparent bg-[var(--m3-surface)] px-4 py-3 text-[var(--m3-on-surface)] shadow-inner focus:border-[var(--m3-primary)] focus:ring-2 focus:ring-[color:rgba(37,99,235,0.3)]"
                  placeholder="Yükleme parolası"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-[var(--m3-error)]">
                    {passwordError}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={validating}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--m3-primary)] px-6 py-3 text-sm font-semibold text-[var(--m3-on-primary)] transition-colors hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--m3-primary)] disabled:cursor-not-allowed disabled:bg-[#1d4ed8]/60"
            >
              {validating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--m3-on-primary)] border-t-transparent" />
                  Doğrulanıyor...
                </>
              ) : (
                'Doğrula'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--m3-surface)] text-[var(--m3-on-surface)]">
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        {currentView === 'upload' ? (
          <div className="space-y-12">
            <section
              className="grid gap-6 rounded-[var(--m3-radius-lg)] bg-gradient-to-br from-[var(--m3-primary-container)] via-[var(--m3-surface-container)] to-[var(--m3-surface-container-high)] px-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)] md:px-10"
              style={{ boxShadow: 'var(--m3-elev-2)' }}
            >
              <div className="order-2 space-y-5 md:order-1">
                <div className="flex items-center gap-3 text-[var(--m3-on-primary-container)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)]">
                    <MdAutoAwesome className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] opacity-80">Akışta kalın</p>
                    <h2 className="text-2xl font-semibold md:text-3xl">
                      Gelişmiş paylaşım deneyimi, tek tıkla hazır
                    </h2>
                  </div>
                </div>
                <p className="max-w-xl text-sm text-[var(--m3-on-surface-variant)]">
                  Material 3 prensipleriyle yeniden tasarlanan yüzeyler; daha okunabilir tipografi,
                  rafine boşluklar ve güven veren renk hiyerarşisi ile yükleme sürecinizi bir üst
                  seviyeye taşıyor.
                </p>
                <div className="flex flex-wrap gap-3 text-sm font-medium">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-primary)]/15 px-4 py-2 text-[var(--m3-on-primary-container)]">
                    <MdSpeed className="h-4 w-4" />
                    Hızlı aktarım
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-secondary)]/25 px-4 py-2 text-[var(--m3-on-secondary-container)]">
                    <MdLock className="h-4 w-4" />
                    Parola korumalı
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-surface-variant)]/70 px-4 py-2 text-[var(--m3-on-surface-variant)]">
                    <MdInsights className="h-4 w-4" />
                    Anlık linkler
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleOpenUpload}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--m3-on-primary)] transition hover:bg-[#1d4ed8] focus-visible:outline-none"
                  >
                    <MdCloudUpload className="h-5 w-5" />
                    Yüklemeye başla
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('admin')}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--m3-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--m3-primary)] transition hover:bg-[var(--m3-primary)] hover:text-[var(--m3-on-primary)] focus-visible:outline-none"
                  >
                    <MdSettings className="h-5 w-5" />
                    Yönetim paneli
                  </button>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <Dropzone
                  ref={dropzoneRef}
                  onFilesUploaded={handleFilesUploaded}
                  onError={handleUploadError}
                  variant="compact"
                />
              </div>
            </section>

            <section className="grid gap-3 rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface-container-low)] p-4 text-sm sm:grid-cols-3"
              style={{ boxShadow: 'var(--m3-elev-1)' }}
            >
              <div className="rounded-[var(--m3-radius-md)] border border-[color:rgba(148,163,184,0.2)] bg-[var(--m3-primary-container)]/60 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--m3-on-primary-container)]">Başarılı</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--m3-on-primary-container)]">{stats.success}</p>
                <span className="text-[11px] text-[var(--m3-on-primary-container)]/70">Son yüklemeler</span>
              </div>
              <div className="rounded-[var(--m3-radius-md)] border border-[color:rgba(148,163,184,0.2)] bg-[var(--m3-surface-variant)]/70 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--m3-on-surface-variant)]">Bekleyen</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--m3-on-surface-variant)]">{stats.pending}</p>
                <span className="text-[11px] text-[var(--m3-on-surface-variant)]/70">Sıra bekleyenler</span>
              </div>
              <div className="rounded-[var(--m3-radius-md)] border border-[color:rgba(148,163,184,0.2)] bg-[var(--m3-error-container)]/70 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--m3-on-error-container)]">Hata</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--m3-on-error-container)]">{stats.errors}</p>
                <span className="text-[11px] text-[var(--m3-on-error-container)]/70">Dikkat gerektiren</span>
              </div>
            </section>

            {uploadedFiles.length > 0 && (
              <section
                className="rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.15)] bg-[var(--m3-surface-container)]/70 backdrop-blur"
                style={{ boxShadow: 'var(--m3-elev-2)' }}
              >
                <header className="flex flex-col gap-1 border-b border-[color:rgba(148,163,184,0.15)] px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--m3-on-surface)]">
                      Son yüklenenler
                    </h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-surface-variant)]">
                      {uploadedFiles.length} dosya
                    </p>
                  </div>
                </header>
                <div className="grid gap-4 p-4 md:p-6">
                  {uploadedFiles.map((file) => (
                    <FileRow key={file.key} file={file} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <AdminPanel onBackToUpload={() => setCurrentView('upload')} />
        )}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;

