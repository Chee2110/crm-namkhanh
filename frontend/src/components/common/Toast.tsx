import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  show,
  message,
  type = 'success',
  onClose,
  duration = 3500
}) => {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-600',
          border: 'border-red-500',
          icon: <AlertCircle className="w-5 h-5 text-white shrink-0" />,
          title: 'Lỗi'
        };
      case 'info':
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-500',
          icon: <Info className="w-5 h-5 text-white shrink-0" />,
          title: 'Thông báo'
        };
      case 'success':
      default:
        return {
          bg: 'bg-emerald-600',
          border: 'border-emerald-500',
          icon: <CheckCircle2 className="w-5 h-5 text-white shrink-0" />,
          title: 'Thành công'
        };
    }
  };

  const { bg, border, icon, title } = getColors();

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl text-white ${bg} ${border} border animate-in slide-in-from-top-3 fade-in duration-200`}
      style={{
        maxWidth: '420px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
      }}
    >
      {icon}
      <div className="flex-1 pr-2">
        <p className="text-xs font-bold uppercase tracking-wider opacity-90 leading-tight">
          {title}
        </p>
        <p className="text-sm font-medium leading-snug mt-0.5">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
        title="Đóng thông báo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
