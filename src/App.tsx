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
              className="grid gap-8 rounded-[28px] bg-[var(--m3-surface)] px-8 py-12 md:grid-cols-[minmax(0,1fr)_1fr] md:px-12"
              style={{ boxShadow: 'var(--shadow-level2)' }}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--m3-primary-container)]/80">
                    <MdAutoAwesome className="h-6 w-6 text-[var(--m3-primary)]" />
                  </span>
                  <div>
                    <h2 className="text-title text-[var(--m3-on-surface)]">
                      Gelişmiş paylaşım deneyimi, tek tıkla hazır
                    </h2>
                  </div>
                </div>
                <p className="max-w-xl text-body text-[var(--m3-on-surface-variant)]">
                  Tüm yüklenen dosyalarınızı görüntüleyin, paylaşın ve yönetin. Bağlantıları kopyalayın,
                  dosyaları önizleyin veya silin.
                </p>
                <div className="flex gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-primary-container)]/70 px-4 py-2 text-subhead font-medium text-[var(--m3-on-primary-container)]">
                    <MdSpeed className="h-4 w-4 text-[var(--m3-primary)]" />
                    Hızlı aktarım
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-secondary-container)]/70 px-4 py-2 text-subhead font-medium text-[var(--m3-on-secondary-container)]">
                    <MdLock className="h-4 w-4 text-[var(--m3-secondary)]" />
                    Parola korumalı
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--m3-surface-variant)]/70 px-4 py-2 text-subhead font-medium text-[var(--m3-on-surface)]">
                    <MdInsights className="h-4 w-4 text-[var(--m3-primary)]" />
                    Anlık linkler
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('admin')}
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[var(--m3-outline)] bg-[var(--m3-surface)] px-6 py-3 text-body font-semibold text-[var(--m3-on-surface)] transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none"
                    style={{ boxShadow: 'var(--shadow-level1)' }}
                  >
                    <MdShield className="h-5 w-5" />
                    Yönetim paneli
                  </button>
                </div>
              </div>
              <div className="self-center">
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
