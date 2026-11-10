import { createContext, useCallback, useContext, useState } from 'react';

// Small pop-up messages in the corner ("Post published!", "Something went wrong").
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            {t.type === 'error' ? '⚠ ' : '✓ '}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Usage: const showToast = useToast(); showToast('Saved!');  or  showToast('Oops', 'error');
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
