import React from 'react';
import { ShieldAlert, Laptop, Globe, Clock, ArrowRight } from 'lucide-react';

interface ConcurrentLoginModalProps {
  isOpen: boolean;
  info: {
    newDevice?: string;
    newIp?: string;
    loginAt?: string;
  } | null;
  onClose: () => void;
}

export const ConcurrentLoginModal: React.FC<ConcurrentLoginModalProps> = ({
  isOpen,
  info,
  onClose
}) => {
  if (!isOpen) return null;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
    try {
      const d = new Date(isoString);
      return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Đường viền gradient nhận diện thương hiệu */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#EA332A] via-[#1A7FED] to-[#F9BB12]"></div>

        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#EA332A] border border-red-100 inline-flex items-center justify-center mb-4 shadow-xs">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>

          <h3 className="text-lg font-black text-slate-900">
            Tài Khoản Đã Đăng Nhập Ở Thiết Bị Khác
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Chính sách bảo mật đơn phiên Công ty TNHH NK Nam Khánh
          </p>
        </div>

        {/* Khối chi tiết thiết bị mới */}
        <div className="mt-5 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-start gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Thiết bị đăng nhập mới
              </div>
              <div className="font-bold text-slate-800 mt-0.5">
                {info?.newDevice || 'Trình duyệt Web'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Địa chỉ IP
              </div>
              <div className="font-bold text-slate-800 font-mono mt-0.5">
                {info?.newIp || 'Địa chỉ IP mới'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Thời gian phát hiện
              </div>
              <div className="font-bold text-slate-800 mt-0.5">
                {formatDateTime(info?.loginAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-red-50/70 border border-red-100 rounded-xl text-xs text-red-700 leading-relaxed font-medium">
          Để đảm bảo tính bảo mật và ngăn chặn lộ lọt dữ liệu nội bộ, phiên làm việc trên thiết bị này đã được tự động đăng xuất.
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full btn btn-primary !py-2.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/20"
          >
            <span>Đã hiểu & Đăng nhập lại</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
