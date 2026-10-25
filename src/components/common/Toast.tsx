import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

let toastListener: ((t: ToastMessage) => void) | null = null;

export const showToast = (type: ToastType, title: string, message?: string) => {
  if (toastListener) {
    toastListener({
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
    });
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== t.id));
      }, 4000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-60 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const config = {
          success: {
            icon: CheckCircle2,
            bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            iconColor: 'text-emerald-600',
          },
          error: {
            icon: XCircle,
            bg: 'bg-rose-50 border-rose-200 text-rose-900',
            iconColor: 'text-rose-600',
          },
          warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-50 border-amber-200 text-amber-900',
            iconColor: 'text-amber-600',
          },
          info: {
            icon: Info,
            bg: 'bg-sky-50 border-sky-200 text-sky-900',
            iconColor: 'text-sky-600',
          },
        }[t.type];

        const Icon = config.icon;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in slide-in-from-bottom-3 ${config.bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-tight">{t.title}</h4>
              {t.message && <p className="text-xs opacity-85 mt-0.5 leading-snug">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
