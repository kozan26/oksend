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
          className={`min-w-[320px] rounded-[24px] px-5 py-4 flex items-center gap-4 border ${
            toast.type === 'success'
              ? 'bg-[var(--m3-surface)] border-[var(--m3-outline)]/40 text-[var(--m3-on-surface)]'
              : 'bg-[var(--m3-error-container)] border-[var(--m3-error)]/30 text-[var(--m3-on-error-container)]'
          }`}
          style={{ boxShadow: toast.type === 'success' ? 'var(--shadow-level2)' : 'var(--shadow-level2)' }}
        >
          <p className="text-body font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-4 text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] transition-colors duration-200"
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
