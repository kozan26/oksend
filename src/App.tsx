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
      <header className="sticky top-0 z-20 bg-[var(--m3-surface-container)]/90 backdrop-blur">
        <div className="border-b border-[color:rgba(148,163,184,0.18)] px-4"
          style={{ boxShadow: 'var(--m3-elev-2)' }}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--m3-on-surface-variant)]">
                ozan.cloud
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-[var(--m3-on-surface)] md:text-3xl">
                Tonal Material 3 yüzeyler ile daha rafine yükleme deneyimi
              </h1>
            </div>
            <nav aria-label="Ana görünüm" className="flex justify-end">
              <div className="flex gap-2 rounded-full bg-[var(--m3-surface-variant)]/60 p-1">
                <button
                  type="button"
                  role="tab"
                  aria-selected={currentView === 'upload'}
                  onClick={() => {
                    setCurrentView('upload');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none ${
                    currentView === 'upload'
                      ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)]'
                      : 'text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-primary-container)] hover:text-[var(--m3-on-primary-container)]'
                  }`}
                  aria-current={currentView === 'upload' ? 'page' : undefined}
                >
                  <MdCloudUpload className="h-5 w-5" />
                  Yükle
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={currentView === 'admin'}
                  onClick={() => {
                    setCurrentView('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none ${
                    currentView === 'admin'
                      ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)]'
                      : 'text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-primary-container)] hover:text-[var(--m3-on-primary-container)]'
                  }`}
                  aria-current={currentView === 'admin' ? 'page' : undefined}
                >
                  <MdSettings className="h-5 w-5" />
                  Yönetim
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 lg:pt-12">
        {currentView === 'upload' ? (
          <div className="space-y-12">
            <section
              className="grid gap-6 rounded-[var(--m3-radius-lg)] bg-gradient-to-br from-[var(--m3-primary-container)] via-[var(--m3-surface-container)] to-[color:rgba(37,99,235,0.08)] px-6 py-8 md:grid-cols-[minmax(0,1fr)_280px] md:px-10"
              style={{ boxShadow: 'var(--m3-elev-2)' }}
            >
              <div className="space-y-5">
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
              <div className="grid gap-3 self-start rounded-[var(--m3-radius-lg)] bg-[var(--m3-surface)]/70 p-4 text-sm"
                style={{ boxShadow: 'var(--m3-elev-2)' }}
              >
                <h3 className="text-sm font-semibold text-[var(--m3-on-surface)]">Upload içgörüleri</h3>
                <p className="text-xs text-[var(--m3-on-surface-variant)]">
                  Aktivite artık anlık raporlanıyor. Linkleriniz ve hatalarınız tek bakışta.
                </p>
                <dl className="grid gap-3">
                  <div className="flex items-center justify-between rounded-[var(--m3-radius-md)] bg-[var(--m3-primary-container)]/50 px-3 py-2">
                    <dt className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-primary-container)]">Başarılı</dt>
                    <dd className="text-lg font-semibold text-[var(--m3-on-primary-container)]">{stats.success}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-[var(--m3-radius-md)] bg-[var(--m3-surface-variant)]/80 px-3 py-2">
                    <dt className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-surface-variant)]">Bekleyen</dt>
                    <dd className="text-lg font-semibold text-[var(--m3-on-surface-variant)]">{stats.pending}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-[var(--m3-radius-md)] bg-[var(--m3-error-container)]/70 px-3 py-2">
                    <dt className="text-xs uppercase tracking-[0.2em] text-[var(--m3-on-error-container)]">Hata</dt>
                    <dd className="text-lg font-semibold text-[var(--m3-on-error-container)]">{stats.errors}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <Dropzone
              ref={dropzoneRef}
              onFilesUploaded={handleFilesUploaded}
              onError={handleUploadError}
            />

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
          <div className="rounded-[var(--m3-radius-lg)] border border-[color:rgba(148,163,184,0.15)] bg-[var(--m3-surface-container)]/80 p-4 md:p-6"
            style={{ boxShadow: 'var(--m3-elev-2)' }}
          >
            <AdminPanel />
          </div>
        )}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;

