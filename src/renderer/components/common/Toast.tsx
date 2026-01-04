import { useEffect } from 'react';
import { ToastIcons } from '@renderer/lib/iconMap';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const TOAST_CONFIG: Record<ToastType, { icon: LucideIcon; bgColor: string; borderColor: string }> = {
  success: { icon: ToastIcons.success, bgColor: 'bg-emerald-950', borderColor: 'border-emerald-500' },
  error: { icon: ToastIcons.error, bgColor: 'bg-red-950', borderColor: 'border-red-500' },
  warning: { icon: ToastIcons.warning, bgColor: 'bg-amber-950', borderColor: 'border-amber-500' },
  info: { icon: ToastIcons.info, bgColor: 'bg-sky-950', borderColor: 'border-sky-500' },
};

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const config = TOAST_CONFIG[type];
  const ToastIcon = config.icon;

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed bottom-4 right-4 ${config.bgColor} border ${config.borderColor} text-slate-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}>
      <ToastIcon className="w-5 h-5" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
