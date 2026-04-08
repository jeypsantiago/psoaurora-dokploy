import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    toast: (type: ToastType, message: string) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toast, removeToast }}>
            {children}
            {/* Toast Container - Top Middle */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none items-center w-full max-w-sm px-4">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const config = {
        success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50/90 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
        error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50/90 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20' },
        warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50/90 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
        info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50/90 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
    }[toast.type];

    const Icon = config.icon;

    return (
        <div className={`
      pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${config.border} ${config.bg}
      backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300 w-full
    `}>
            <div className={`shrink-0 ${config.color}`}>
                <Icon size={18} />
            </div>
            <p className="flex-1 text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-400"
            >
                <X size={14} />
            </button>
        </div>
    );
};
