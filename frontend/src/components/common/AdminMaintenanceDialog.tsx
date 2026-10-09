import React, { useState } from 'react';
import { Wrench, Rocket, AlertTriangle, X } from 'lucide-react';
import { api } from '../../services/api';

interface AdminMaintenanceDialogProps {
  isOpen: boolean;
  isMaintenanceActive: boolean;
  onClose: () => void;
  onSuccess: (newState: boolean) => void;
}

export const AdminMaintenanceDialog: React.FC<AdminMaintenanceDialogProps> = ({
  isOpen,
  isMaintenanceActive,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggle = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextState = !isMaintenanceActive;
      const res = await api.post('/system/maintenance/toggle', { enable: nextState });
      if (res.data) {
        onSuccess(nextState);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi thao tác bảo trì');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-2xl inline-flex items-center justify-center mb-4 shadow-xs border ${
              !isMaintenanceActive
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}
          >
            {!isMaintenanceActive ? (
              <Wrench className="w-8 h-8 text-amber-600" />
            ) : (
              <Rocket className="w-8 h-8 text-emerald-600" />
            )}
          </div>

          <h3 className="text-lg font-black text-slate-900">
            {!isMaintenanceActive ? 'Đóng Web Để Bảo Trì Hệ Thống' : 'Mở Lại Web (Hoàn Tất Bảo Trì)'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Quyền điều hành Quản trị viên (ADMIN)
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2 leading-relaxed">
          {!isMaintenanceActive ? (
            <>
              <div className="font-bold text-amber-700 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Lưu ý quan trọng khi đóng web:
              </div>
              <div>• Toàn bộ tài khoản nhân viên đang truy cập sẽ bị <strong>đăng xuất ngay lập tức</strong>.</div>
              <div>• Nhân viên sẽ thấy màn hình thông báo hệ thống đang bảo trì.</div>
              <div>• Chỉ tài khoản <strong>ADMIN</strong> mới có quyền truy cập để bảo trì.</div>
            </>
          ) : (
            <>
              <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                <Rocket size={14} />
                Kích hoạt mở lại hệ thống:
              </div>
              <div>• Cho phép toàn bộ nhân viên đăng nhập bình thường.</div>
              <div>• Lần đăng nhập sau đó của người dùng sẽ hiển thị <strong>thông báo chào mừng quay lại đã bảo trì xong</strong>.</div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 btn btn-secondary !py-2.5 text-xs font-bold cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            className={`flex-1 btn btn-primary !py-2.5 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-md ${
              !isMaintenanceActive
                ? '!bg-amber-600 hover:!bg-amber-700 !border-amber-600 shadow-amber-600/20'
                : '!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-emerald-600/20'
            }`}
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : !isMaintenanceActive ? (
              <>
                <Wrench size={14} />
                <span>Xác nhận đóng web</span>
              </>
            ) : (
              <>
                <Rocket size={14} />
                <span>Xác nhận mở web</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
