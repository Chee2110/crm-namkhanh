import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Bell,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Wrench,
  Rocket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminMaintenanceDialog } from '../common/AdminMaintenanceDialog';

interface HeaderProps {
  currentTab: string;
  onOpenMobile: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'WARNING' | 'ORDER' | 'DEBT' | 'HANDOVER';
  title: string;
  desc: string;
  time: string;
  read: boolean;
  targetTab?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'WARNING',
    title: 'Cảnh báo tồn kho an toàn',
    desc: 'Giấy in Bãi Bằng A4 70gsm tại Tổng kho Gia Lâm còn 8 ream (Dưới mức tối thiểu 20 ream).',
    time: '10 phút trước',
    read: false,
    targetTab: 'products'
  },
  {
    id: '2',
    type: 'ORDER',
    title: 'Đơn hàng mới cần duyệt giao',
    desc: 'Đơn hàng #DH-2609-008 của Khách hàng FPT Software đã chốt, chờ xuất kho.',
    time: '45 phút trước',
    read: false,
    targetTab: 'orders'
  },
  {
    id: '3',
    type: 'DEBT',
    title: 'Nhắc hạn công nợ khách hàng',
    desc: 'Khoản nợ 24.500.000đ của Công ty Xây dựng Delta quá hạn 5 ngày.',
    time: '2 giờ trước',
    read: false,
    targetTab: 'customers'
  },
  {
    id: '4',
    type: 'HANDOVER',
    title: 'Bàn giao khách hàng mới',
    desc: 'Bạn vừa nhận quyền quản trị 3 khách hàng VIP từ Giám đốc kinh doanh.',
    time: '1 ngày trước',
    read: true,
    targetTab: 'customers'
  }
];

const getStorageKeys = (userId?: string) => {
  const uid = userId || 'default';
  return {
    readKey: `namkhanh_read_notifications_${uid}`,
    deletedKey: `namkhanh_deleted_notifications_${uid}`
  };
};

const getStoredIds = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setStoredIds = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch (e) {
    console.error('Lỗi khi lưu localStorage thông báo:', e);
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobile,
  isSidebarOpen = false,
  onToggleSidebar,
  onNavigateTab
}) => {
  const { user, logout, isMaintenanceActive, setIsMaintenanceActive } = useAuth();
  const [isAdminMaintenanceOpen, setIsAdminMaintenanceOpen] = useState(false);
  const isAdmin = user?.roles?.includes('ADMIN');
  const [isOpenNotifications, setIsOpenNotifications] = useState(false);
  const [isOpenUserMenu, setIsOpenUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'read'>('all');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { readKey, deletedKey } = useMemo(
    () => getStorageKeys(user?.id || user?.email),
    [user?.id, user?.email]
  );

  // Khởi tạo danh sách thông báo và đối chiếu với danh sách đã đọc trong localStorage
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const readIds = getStoredIds(readKey);
    const deletedIds = getStoredIds(deletedKey);
    return DEFAULT_NOTIFICATIONS
      .filter((n) => !deletedIds.includes(n.id))
      .map((n) => ({
        ...n,
        read: n.read || readIds.includes(n.id)
      }));
  });

  // Đồng bộ lại khi thay đổi người dùng đăng nhập
  useEffect(() => {
    const readIds = getStoredIds(readKey);
    const deletedIds = getStoredIds(deletedKey);
    setNotifications(
      DEFAULT_NOTIFICATIONS
        .filter((n) => !deletedIds.includes(n.id))
        .map((n) => ({
          ...n,
          read: n.read || readIds.includes(n.id)
        }))
    );
  }, [readKey, deletedKey]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsOpenNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsOpenUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động focus vào ô tìm kiếm khi mở
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      const allReadIds = Array.from(new Set([...getStoredIds(readKey), ...updated.map((n) => n.id)]));
      setStoredIds(readKey, allReadIds);
      return updated;
    });
  };

  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
      const targetItem = updated.find((n) => n.id === id);
      const prevReadIds = getStoredIds(readKey);
      let nextReadIds: string[];
      if (targetItem?.read) {
        nextReadIds = Array.from(new Set([...prevReadIds, id]));
      } else {
        nextReadIds = prevReadIds.filter((itemId) => itemId !== id);
      }
      setStoredIds(readKey, nextReadIds);
      return updated;
    });
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === item.id ? { ...n, read: true } : n));
        const allReadIds = Array.from(new Set([...getStoredIds(readKey), item.id]));
        setStoredIds(readKey, allReadIds);
        return updated;
      });
    }

    if (item.targetTab && onNavigateTab) {
      onNavigateTab(item.targetTab);
      setIsOpenNotifications(false);
    }
  };

  const handleClearRead = () => {
    const readItems = notifications.filter((n) => n.read);
    if (readItems.length === 0) return;
    const readItemIds = readItems.map((n) => n.id);
    const prevDeleted = getStoredIds(deletedKey);
    const nextDeleted = Array.from(new Set([...prevDeleted, ...readItemIds]));
    setStoredIds(deletedKey, nextDeleted);
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prevDeleted = getStoredIds(deletedKey);
    const nextDeleted = Array.from(new Set([...prevDeleted, id]));
    setStoredIds(deletedKey, nextDeleted);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleResetNotifications = () => {
    try {
      localStorage.removeItem(readKey);
      localStorage.removeItem(deletedKey);
    } catch (e) {
      console.error(e);
    }
    setNotifications(DEFAULT_NOTIFICATIONS);
  };

  const filteredNotifs =
    notificationFilter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notificationFilter === 'read'
      ? notifications.filter((n) => n.read)
      : notifications;

  // Danh sách các Tab điều hướng nhanh ở trung tâm Navbar (Tương tự ảnh mẫu Quixotic)
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', match: ['dashboard'] },
    { id: 'orders', label: 'Đơn hàng', match: ['orders'] },
    { id: 'customers', label: 'Khách hàng', match: ['customers', 'quotations'] },
    {
      id: 'inventory-overview',
      label: 'Kho & SKU',
      match: ['inventory-overview', 'products', 'warehouses', 'categories', 'suppliers', 'product-types']
    },
    {
      id: 'sales-reports',
      label: 'Báo cáo',
      match: ['sales-reports', 'sales-overview', 'sales-plans', 'inventory-reports']
    },
    { id: 'finances', label: 'Thu - Chi', match: ['finances'] }
  ];

  return (
    <header className="navbar-sticky-wrapper transition-all duration-200">
      <div className="navbar-floating-pill">
        {/* ==========================================
            BÊN TRÁI: LOGO THƯƠNG HIỆU & NÚT TOGGLE
           ========================================== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {/* Nút Hamburger trên Mobile */}
        <button
          onClick={onOpenMobile}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #EA332A 0%, #D32F2F 100%)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(234, 51, 42, 0.28)'
          }}
          className="hamburger-mobile"
          title="Mở menu điều hướng"
        >
          <Menu size={18} />
        </button>

        {/* Nút Thu gọn / Mở rộng Sidebar trên Desktop */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="desktop-toggle-btn text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer border border-slate-200/80 shadow-xs"
            title={isSidebarOpen ? 'Thu gọn thành Dock hình đơn (Ctrl + B)' : 'Mở rộng thanh điều hướng (Ctrl + B)'}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              backgroundColor: isSidebarOpen ? '#FFFFFF' : '#FEF2F2',
              borderColor: isSidebarOpen ? '#E2E8F0' : '#FECACA'
            }}
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} color="#EA332A" />}
          </button>
        )}

        {/* Logo & Thương hiệu dạng Icon tròn */}
        <a
          href="#/dashboard"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
              e.preventDefault();
              onNavigateTab?.('dashboard');
            }
          }}
          className="flex items-center gap-2 cursor-pointer no-underline group"
          title="Về Dashboard điều hành"
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              border: '1px solid #F1F5F9',
              flexShrink: 0
            }}
          >
            <img
              src="/logo.png"
              alt="Logo NK"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <span className="font-extrabold text-[14.5px] text-slate-900 tracking-tight whitespace-nowrap group-hover:text-rose-600 transition-colors">
            NK Nam Khánh
          </span>
        </a>
      </div>

      {/* ==========================================
          TRUNG TÂM: CỤM TAB ĐIỀU HƯỚNG DẠNG HÌNH ĐƠN
          (Tương tự như cụm Dashboard, Reports, Documents trong ảnh mẫu)
         ========================================== */}
      <nav
        aria-label="Điều hướng nhanh"
        className="hidden md:flex items-center gap-1 bg-slate-100/60 p-1 rounded-full border border-slate-200/50"
      >
        {navTabs.map((tab) => {
          const isActive = tab.match.includes(currentTab);

          return (
            <button
              key={tab.id}
              onClick={() => onNavigateTab?.(tab.id)}
              className="text-xs transition-all duration-200 cursor-pointer"
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                border: isActive ? '1px solid rgba(226, 232, 240, 0.9)' : '1px solid transparent',
                // Nút Active: Trắng tinh nổi khối bo tròn như nút Dashboard trong ảnh mẫu
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#0F172A' : '#64748B',
                fontWeight: isActive ? '700' : '500',
                boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.07)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ==========================================
          BÊN PHẢI: TÌM KIẾM, THÔNG BÁO & USER AVATAR
          (Theo đúng bộ 3 icon: Search, Bell, Avatar như ảnh mẫu)
         ========================================== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* NÚT TÌM KIẾM (ICON KÍNH LÚP NHƯ ẢNH MẪU) */}
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-md text-xs w-48 sm:w-60 text-slate-700 animate-in fade-in zoom-in-95 duration-150">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm nhanh dữ liệu..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (onNavigateTab) {
                      onNavigateTab('orders');
                    }
                    setIsSearchOpen(false);
                  } else if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                  }
                }}
                onBlur={() => {
                  if (!searchValue) {
                    setIsSearchOpen(false);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-[11px] px-1 font-bold"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all cursor-pointer border border-transparent hover:border-slate-200/60"
              title="Tìm kiếm nhanh (Ctrl + K)"
            >
              <Search size={17} />
            </button>
          )}
        </div>

        {/* NÚT BẢO TRÌ DÀNH CHO ADMIN */}
        {isAdmin && (
          <div className="shrink-0">
            {isMaintenanceActive ? (
              <button
                type="button"
                onClick={() => setIsAdminMaintenanceOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 transition-all animate-pulse cursor-pointer"
                title="Hệ thống đang bảo trì. Bấm để mở lại web cho nhân viên"
              >
                <Wrench size={13} className="text-white shrink-0" />
                <span className="hidden sm:inline">ĐANG BẢO TRÌ (Mở web)</span>
                <span className="sm:hidden">Mở web</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdminMaintenanceOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all cursor-pointer"
                title="Đóng web để bảo trì hệ thống"
              >
                <Wrench size={13} className="text-amber-600 shrink-0" />
                <span>Bảo trì web</span>
              </button>
            )}
          </div>
        )}

        {/* NÚT CHUÔNG THÔNG BÁO (ICON BELL NHƯ ẢNH MẪU) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsOpenNotifications(!isOpenNotifications)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-[#EA332A] hover:bg-red-50/70 transition-all cursor-pointer relative border border-transparent hover:border-red-100"
            title="Trung tâm thông báo điều hành"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[15px] h-[15px] px-0.5 text-[9.5px] font-bold text-white bg-[#EA332A] rounded-full border-2 border-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Notification Panel */}
          {isOpenNotifications && (
            <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 py-3.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EA332A] animate-pulse" />
                  <span className="font-bold text-slate-800 text-sm">Thông báo vận hành</span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#EA332A] hover:text-[#D32F2F] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Đánh dấu tất cả thông báo là đã đọc"
                    >
                      <CheckCheck size={14} />
                      Đã đọc tất cả
                    </button>
                  )}
                  <button
                    onClick={handleResetNotifications}
                    className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Khôi phục danh sách thông báo mẫu"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Bộ lọc Thông báo: Tất cả / Chưa đọc / Đã đọc */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNotificationFilter('all')}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      notificationFilter === 'all'
                        ? 'bg-[#EA332A] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Tất cả ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotificationFilter('unread')}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      notificationFilter === 'unread'
                        ? 'bg-[#EA332A] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Chưa đọc ({unreadCount})
                  </button>
                  <button
                    onClick={() => setNotificationFilter('read')}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      notificationFilter === 'read'
                        ? 'bg-[#EA332A] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Đã đọc ({readCount})
                  </button>
                </div>

                {readCount > 0 && notificationFilter !== 'unread' && (
                  <button
                    onClick={handleClearRead}
                    className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    title="Xóa các thông báo đã đọc khỏi danh sách"
                  >
                    <Trash2 size={11} />
                    Xóa đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {filteredNotifs.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    {notificationFilter === 'unread'
                      ? 'Tuyệt vời! Không còn thông báo chưa đọc nào.'
                      : notificationFilter === 'read'
                      ? 'Chưa có thông báo nào đã đọc.'
                      : 'Không có thông báo mới nào.'}
                  </div>
                ) : (
                  filteredNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 cursor-pointer group relative ${
                        !n.read ? 'bg-rose-50/20' : 'opacity-85'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'WARNING' && (
                          <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-xs">
                            !
                          </div>
                        )}
                        {n.type === 'ORDER' && (
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
                            Đ
                          </div>
                        )}
                        {n.type === 'DEBT' && (
                          <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-xs">
                            $
                          </div>
                        )}
                        {n.type === 'HANDOVER' && (
                          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={`text-xs font-semibold truncate ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EA332A] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11.5px] text-gray-500 line-clamp-2 leading-relaxed">
                          {n.desc}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {n.time}
                          </span>
                          {n.targetTab && (
                            <span className="text-[10px] text-[#EA332A] font-medium flex items-center gap-0.5 group-hover:underline">
                              Xem ngay <ExternalLink size={9} />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Các nút thao tác nhanh */}
                      <div className="absolute right-3 top-3.5 flex items-center gap-1">
                        {!n.read ? (
                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(n.id, e)}
                            title="Bấm để đánh dấu đã đọc"
                            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Check size={12} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(n.id, e)}
                            title="Bấm để đánh dấu chưa đọc"
                            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Check size={12} className="text-gray-400" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(n.id, e)}
                          title="Bỏ qua thông báo này"
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* NÚT AVATAR NGƯỜI DÙNG (ICON AVATAR TRÒN NHƯ ẢNH MẪU) */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsOpenUserMenu(!isOpenUserMenu)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100/80 transition-all cursor-pointer border border-transparent"
            title={`${user?.fullName || 'Người dùng'} (${user?.roles?.[0] || 'ADMIN'})`}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #EA332A 0%, #D32F2F 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px',
                boxShadow: '0 2px 6px rgba(234, 51, 42, 0.28)'
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu Người dùng */}
          {isOpenUserMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {user?.fullName || 'Người dùng'}
                </div>
                <div className="text-[11px] text-slate-500 truncate" title={user?.email}>
                  {user?.email || 'admin@namkhanh.vn'}
                </div>
                <div className="mt-1.5">
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#EA332A',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                      fontWeight: '600'
                    }}
                  >
                    {user?.roles?.[0] || 'ADMIN'}
                  </span>
                </div>
              </div>

              <div className="p-1">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsAdminMaintenanceOpen(true);
                      setIsOpenUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-left ${
                      isMaintenanceActive
                        ? 'text-emerald-700 bg-emerald-50 font-bold'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    {isMaintenanceActive ? (
                      <Rocket size={15} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Wrench size={15} className="text-amber-600 shrink-0" />
                    )}
                    <span>
                      {isMaintenanceActive
                        ? 'Mở lại web (Hoàn tất bảo trì)'
                        : 'Đóng web để bảo trì'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onNavigateTab?.('settings');
                    setIsOpenUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <Settings size={15} className="text-slate-500" />
                  <span>Cài đặt hệ thống</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsOpenUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <LogOut size={15} className="text-red-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {isAdmin && (
        <AdminMaintenanceDialog
          isOpen={isAdminMaintenanceOpen}
          isMaintenanceActive={isMaintenanceActive}
          onClose={() => setIsAdminMaintenanceOpen(false)}
          onSuccess={(newState) => setIsMaintenanceActive(newState)}
        />
      )}
    </header>
  );
};
