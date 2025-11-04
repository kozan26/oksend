export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[320px] rounded-[var(--m3-radius-lg)] px-5 py-4 shadow-lg flex items-center gap-4 ${
            toast.type === 'success'
              ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]'
              : 'bg-[var(--m3-error-container)] text-[var(--m3-on-error-container)]'
          }`}
          style={{ boxShadow: 'var(--m3-elev-3)' }}
        >
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-4 text-[color:rgba(15,23,42,0.45)] hover:text-[color:rgba(15,23,42,0.75)]"
            aria-label="Kapat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

