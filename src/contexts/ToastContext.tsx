import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[70] space-y-2">
        {toasts.map(toast => {
          const accentClass =
            toast.type === 'success' ? 'border-l-4 border-success' :
            toast.type === 'error' ? 'border-l-4 border-danger' :
            toast.type === 'warning' ? 'border-l-4 border-warning' :
            'border-l-4 border-primary';

          const iconColor =
            toast.type === 'success' ? 'text-success' :
            toast.type === 'error' ? 'text-danger' :
            toast.type === 'warning' ? 'text-warning' :
            'text-primary';

          return (
            <div
              key={toast.id}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border border-border bg-white ${accentClass}`}
            >
              <span className={`text-xs font-bold flex-1 text-text-primary`}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-bg-app transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
};
