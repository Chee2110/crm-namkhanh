import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Thanh trang trí gradient Nam Khánh */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#22BB4E] via-[#1A7FED] to-[#F9BB12]"></div>

        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 inline-flex items-center justify-center mb-4 shadow-xs">
            <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>

          <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2">
            BẢO TRÌ HOÀN TẤT THÀNH CÔNG
          </span>

          <h3 className="text-xl font-black text-slate-900">
            Chào Mừng Bạn Quay Lại!
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống CRM Công ty TNHH NK Nam Khánh đã mở cửa trở lại
          </p>
        </div>

        <div className="mt-5 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-xs text-slate-700 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Hệ thống máy chủ đã được nâng cấp, tối ưu hóa tốc độ và bảo mật dữ liệu.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Tất cả dữ liệu đơn hàng, sản phẩm, tồn kho và công nợ của bạn đã sẵn sàng.</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full btn btn-primary !py-2.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
          >
            <span>Bắt đầu làm việc</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
