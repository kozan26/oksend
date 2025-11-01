import { useState, useEffect } from 'react';
import Dropzone from './components/Dropzone';
import FileRow from './components/FileRow';
import Toast from './components/Toast';
import { hasPassword, setPassword } from './lib/auth';
import type { ToastMessage } from './components/Toast';

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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setAuthenticated(hasPassword());
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    setPassword(password);
    setAuthenticated(true);
    setPasswordError('');
    showToast('Authenticated successfully', 'success');
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
          <h1 className="text-2xl font-bold mb-6 text-center">oksend</h1>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Password
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
                placeholder="Upload password"
                autoFocus
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">oksend</h1>
          <p className="text-sm text-gray-600 mt-1">
            Simple drag-and-drop file sharing
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Dropzone
          onFilesUploaded={handleFilesUploaded}
          onError={handleUploadError}
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {uploadedFiles.map((file) => (
                  <FileRow key={file.key} file={file} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;

