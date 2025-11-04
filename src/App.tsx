import { useState, useEffect, useRef } from 'react';
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
  MdShield,
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
        const errorData = (await response.json().catch(() => ({}))) as {
          reason?: string;
          error?: string;
        };
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


  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--m3-background)] text-[var(--m3-on-surface)] px-4">
        <div
          className="w-full max-w-md rounded-[24px] px-8 py-12 space-y-8 bg-[var(--m3-surface)]"
          style={{ boxShadow: 'var(--shadow-level2)' }}
        >
          <div className="text-center space-y-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--m3-primary-container)]/80">
              <MdCloudUpload className="h-7 w-7 text-[var(--m3-primary)]" />
            </span>
            <h1 className="text-title text-[var(--m3-on-surface)]">ozan.cloud</h1>
            <p className="text-body text-[var(--m3-on-surface-variant)]">
              Yönetim ve yükleme ekranına erişmek için parolanızı girin.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label
                htmlFor="password"
                className="block text-subhead font-semibold text-[var(--m3-on-surface)]"
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
                  className="w-full rounded-[16px] border border-[var(--m3-outline)] bg-[var(--m3-surface)] px-4 py-3 text-body text-[var(--m3-on-surface)] focus-visible:outline-none"
                  style={{ boxShadow: 'var(--shadow-level1)' }}
                  placeholder="Yükleme parolası"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-subhead text-[var(--m3-error)]">
                    {passwordError}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={validating}
              className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[var(--m3-primary)] px-6 py-3 text-body font-semibold text-[var(--m3-on-primary)] transition-transform duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ boxShadow: 'var(--shadow-level2)' }}
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
    <div className="min-h-screen bg-[var(--m3-background)] text-[var(--m3-on-surface)]">
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-12">
        {currentView === 'upload' ? (
          <div className="space-y-12">
            <section
              className="grid gap-6 rounded-2xl bg-[var(--m3-surface)] px-3 py-6 md:gap-8 md:rounded-[28px] md:px-6 md:py-12 md:grid-cols-[minmax(0,1fr)_1fr] lg:px-8"
              style={{ boxShadow: 'var(--shadow-level2)' }}
            >
              <div className="space-y-4 md:space-y-6 min-w-0">
                <div className="flex items-start gap-3 md:items-center md:gap-4">
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--m3-primary-container)]/80 md:h-12 md:w-12">
                    <MdAutoAwesome className="h-5 w-5 text-[var(--m3-primary)] md:h-6 md:w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-headline font-semibold text-[var(--m3-on-surface)] md:text-title">
                      Gelişmiş paylaşım deneyimi, tek tıkla hazır
                    </h2>
                  </div>
                </div>
                <p className="text-sm text-[var(--m3-on-surface-variant)] md:text-body md:max-w-xl">
                  Tüm yüklenen dosyalarınızı görüntüleyin, paylaşın ve yönetin. Bağlantıları kopyalayın,
                  dosyaları önizleyin veya silin.
                </p>
                <div className="flex gap-1 md:gap-2.5 min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-primary-container)]/70 px-2 py-1 text-[10px] font-medium text-[var(--m3-on-primary-container)] md:gap-1.5 md:px-3 md:py-1.5 md:text-xs whitespace-nowrap flex-shrink-0">
                    <MdSpeed className="h-3 w-3 text-[var(--m3-primary)] md:h-3.5 md:w-3.5" />
                    Hızlı aktarım
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-primary-container)]/70 px-2 py-1 text-[10px] font-medium text-[var(--m3-on-primary-container)] md:gap-1.5 md:px-3 md:py-1.5 md:text-xs whitespace-nowrap flex-shrink-0">
                    <MdLock className="h-3 w-3 text-[var(--m3-primary)] md:h-3.5 md:w-3.5" />
                    Parola korumalı
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m3-primary-container)]/70 px-2 py-1 text-[10px] font-medium text-[var(--m3-on-primary-container)] md:gap-1.5 md:px-3 md:py-1.5 md:text-xs whitespace-nowrap flex-shrink-0">
                    <MdInsights className="h-3 w-3 text-[var(--m3-primary)] md:h-3.5 md:w-3.5" />
                    Anlık linkler
                  </span>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('admin')}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--m3-outline)] bg-[var(--m3-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--m3-on-surface)] transition-all duration-200 hover:border-[var(--m3-primary)] hover:bg-[var(--m3-primary-container)]/50 hover:text-[var(--m3-primary)] hover:shadow-apple-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--m3-primary)] focus-visible:ring-offset-2 md:min-h-[48px] md:px-6 md:py-3 md:text-body"
                    style={{ boxShadow: 'var(--shadow-level1)' }}
                  >
                    <MdShield className="h-4 w-4 md:h-5 md:w-5" />
                    Yönetim paneli
                  </button>
                </div>
              </div>
              <div className="self-center w-full md:w-auto">
                <Dropzone
                  ref={dropzoneRef}
                  onFilesUploaded={handleFilesUploaded}
                  onError={handleUploadError}
                  variant="compact"
                />
              </div>
            </section>

            {uploadedFiles.length > 0 && (
              <section
                className="rounded-[24px] border border-[var(--m3-outline)]/50 bg-[var(--m3-surface)] px-6 py-6"
                style={{ boxShadow: 'var(--shadow-level1)' }}
              >
                <header className="mb-4 flex flex-col gap-1 border-b border-[var(--m3-outline)]/40 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-headline font-semibold text-[var(--m3-on-surface)]">
                      Son yüklenenler
                    </h2>
                    <p className="mt-1 text-caption text-[var(--m3-on-surface-variant)]">
                      {uploadedFiles.length} dosya
                    </p>
                  </div>
                </header>
                <div className="grid gap-4">
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
