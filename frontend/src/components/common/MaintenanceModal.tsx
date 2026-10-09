import React, { useEffect, useState } from 'react';
import { Wrench, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface MaintenanceModalProps {
  isOpen: boolean;
  onMaintenanceEnded?: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onMaintenanceEnded
}) => {
  const [checking, setChecking] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Tự động kiểm tra trạng thái bảo trì mỗi 5 giây
    const interval = setInterval(async () => {
      try {
        setChecking(true);
        const res = await api.get('/system/maintenance/status');
        if (res.data && !res.data.isMaintenance) {
          setHasEnded(true);
          clearInterval(interval);
        }
      } catch (e) {
        // network retry
      } finally {
        setChecking(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#EA332A] to-blue-500"></div>

        {!hasEnded ? (
          <>
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 inline-flex items-center justify-center mb-4 shadow-xs relative">
              <Wrench className="w-10 h-10 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white animate-ping"></span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold mb-3">
              <AlertTriangle className="w-3.5 h-3.5" />
              CHẾ ĐỘ BẢO TRÌ ĐANG BẬT
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Hệ Thống Đang Được Bảo Trì
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Quản trị viên đang tạm đóng hệ thống CRM Nam Khánh để bảo trì định kỳ, nâng cấp máy chủ và tối ưu hóa dữ liệu.
            </p>

            <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-2">
              <div className="font-bold text-slate-700">Thông tin bảo trì:</div>
              <div>• Toàn bộ tài khoản nhân viên đã được đăng xuất an toàn để đảm bảo tính toàn vẹn dữ liệu.</div>
              <div>• Hệ thống sẽ tự động thông báo ngay khi bảo trì kết thúc.</div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-amber-600' : ''}`} />
              <span>Đang tự động theo dõi trạng thái bảo trì...</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 inline-flex items-center justify-center mb-4 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              Bảo Trì Đã Hoàn Tất!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Hệ thống đã mở cửa trở lại. Bạn có thể đăng nhập để tiếp tục làm việc.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  if (onMaintenanceEnded) {
                    onMaintenanceEnded();
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full btn btn-primary !py-2.5 text-sm font-bold cursor-pointer !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-md shadow-emerald-500/20"
              >
                Đăng nhập ngay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
