import { useState, useEffect } from 'react';
import Dropzone from './components/Dropzone';
import FileRow from './components/FileRow';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import { hasPassword, setPassword } from './lib/auth';
import type { ToastMessage } from './components/Toast';
import { MdCloudUpload, MdSettings } from 'react-icons/md';

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

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">ozan.cloud</h1>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Parolayı Gir
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yükleme parolası"
                autoFocus
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={validating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ozan.cloud
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Sürükle-bırak ile basit dosya paylaşımı
              </p>
            </div>
            <nav className="w-full max-w-md">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  role="tab"
                  aria-selected={currentView === 'upload'}
                  onClick={() => {
                    setCurrentView('upload');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 font-medium flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none rounded-m3-sm min-h-[40px] ${
                    currentView === 'upload'
                      ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:[&_svg]:text-primary bg-transparent'
                  }`}
                  aria-current={currentView === 'upload' ? 'page' : undefined}
                >
                  <MdCloudUpload className="w-5 h-5 transition-colors" />
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
                  className={`px-4 py-2 font-medium flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none rounded-m3-sm min-h-[40px] ${
                    currentView === 'admin'
                      ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:[&_svg]:text-primary bg-transparent'
                  }`}
                  aria-current={currentView === 'admin' ? 'page' : undefined}
                >
                  <MdSettings className="w-5 h-5 transition-colors" />
                  Yönetim
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'upload' ? (
          <>
            <Dropzone
              onFilesUploaded={handleFilesUploaded}
              onError={handleUploadError}
            />

            {uploadedFiles.length > 0 && (
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                      Son Yüklenenler ({uploadedFiles.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {uploadedFiles.map((file) => (
                      <FileRow key={file.key} file={file} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <AdminPanel />
        )}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;

