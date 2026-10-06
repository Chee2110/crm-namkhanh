import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Wifi } from 'lucide-react';
import { useApiLoading } from '../../hooks/useApiLoading';

export const GlobalLoadingIndicator: React.FC = () => {
  const { isLoading, isMutating, slowRequestDetected, activeRequests, activeMutations, lastSuccessTimestamp } = useApiLoading();

  // Trạng thái thanh tiến trình chạy trên đỉnh màn hình (Top Progress Bar)
  const [progress, setProgress] = useState(0);
  const [barVisible, setBarVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Hiệu ứng thanh tiến trình đỉnh trang kiểu NProgress
  useEffect(() => {
    let interval: any = null;
    let fadeTimer: any = null;

    if (isLoading) {
      setBarVisible(true);
      setProgress((prev) => (prev === 0 ? 25 : prev));

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 65) return prev + Math.random() * 15;
          if (prev < 85) return prev + Math.random() * 6;
          if (prev < 95) return prev + Math.random() * 2;
          return prev;
        });
      }, 250);
    } else {
      if (barVisible) {
        setProgress(100);
        fadeTimer = setTimeout(() => {
          setBarVisible(false);
          setProgress(0);
        }, 350);
      }
    }

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
    };
  }, [isLoading]);

  // Hiệu ứng thông báo ngắn khi hoàn tất thao tác lưu/sửa/xóa (Mutation)
  useEffect(() => {
    if (lastSuccessTimestamp && lastSuccessTimestamp > 0 && !isMutating) {
      setShowSuccessToast(true);
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [lastSuccessTimestamp, isMutating]);

  return (
    <>
      {/* 1. THANH TIẾN TRÌNH CHẠY TRÊN ĐỈNH MÀN HÌNH (TOP PRECISION PROGRESS BAR) */}
      {barVisible && (
        <div
          className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
          style={{ opacity: progress === 100 ? 0 : 1 }}
        >
          <div
            className="h-[3px] bg-gradient-to-r from-[#E53935] via-amber-500 to-[#E53935] shadow-[0_0_12px_rgba(229,57,53,0.85)] transition-all ease-out duration-250"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 2. LỚP BẢO VỆ CHỐNG CLICK ĐÚP KHI ĐANG LƯU DỮ LIỆU (MUTATION LOCK) */}
      {isMutating && (
        <div
          className="fixed inset-0 z-[99998] cursor-wait bg-black/[0.03] backdrop-blur-[0.5px] select-none pointer-events-auto"
          title="Hệ thống đang xử lý yêu cầu, vui lòng đợi..."
        />
      )}

      {/* 3. KHỐI THÔNG BÁO TÁC VỤ NỔI GÓC DƯỚI MÀN HÌNH (FLOATING ACTION / SLOW NETWORK PILL) */}
      {(isMutating || slowRequestDetected || showSuccessToast) && (
        <aside
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[99999] pointer-events-auto max-w-sm"
        >
          {/* Trường hợp 1: Mạng yếu hoặc phản hồi chậm (> 1.2s) */}
          {slowRequestDetected && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-amber-500/95 text-white rounded-xl shadow-xl border border-amber-400 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs leading-snug">
                <div className="font-bold">Đường truyền mạng đang chậm</div>
                <div className="text-[11px] text-amber-100">
                  Hệ thống vẫn đang xử lý, vui lòng không tắt trang...
                </div>
              </div>
            </div>
          )}

          {/* Trường hợp 2: Đang thực hiện tác vụ thay đổi dữ liệu (POST, PUT, DELETE) */}
          {isMutating && !slowRequestDetected && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-900/90 text-white rounded-xl shadow-2xl border border-gray-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Loader2 className="w-4 h-4 text-[#E53935] animate-spin shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-gray-100">Đang lưu và đồng bộ dữ liệu...</div>
                <div className="text-[10.5px] text-gray-400">Vui lòng đợi trong giây lát</div>
              </div>
            </div>
          )}

          {/* Trường hợp 3: Vừa hoàn tất lưu thành công */}
          {showSuccessToast && !isMutating && !slowRequestDetected && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/95 text-white rounded-xl shadow-xl border border-emerald-500 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="text-xs font-semibold">Đã cập nhật dữ liệu thành công</span>
            </div>
          )}
        </aside>
      )}
    </>
  );
};
