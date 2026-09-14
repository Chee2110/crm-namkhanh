import React, { useState, useRef, useEffect } from 'react';
import { Menu, ShieldCheck, Bell, AlertTriangle, ShoppingCart, Clock, UserCheck, Check, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onOpenMobile: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const tabTitles: Record<string, { title: string; desc: string }> = {
  // Phân hệ Kinh doanh & Bán hàng
  customers: {
    title: 'Quản lý Khách hàng Doanh nghiệp & Đại lý VPP',
    desc: 'Bố cục 3 phần chuẩn: Thông tin doanh nghiệp ➔ Dòng thời gian giao dịch ➔ Thống kê công nợ & Bàn giao'
  },
  quotations: {
    title: 'Quản lý Báo giá Văn phòng phẩm',
    desc: 'Lập báo giá nhiều mặt hàng, xem & in mẫu A4 thương hiệu Nam Khánh, chuyển đổi thành Đơn hàng'
  },
  orders: {
    title: 'Quản lý Đơn hàng & Thu hồi Công nợ',
    desc: 'Theo dõi giao nhận, xuất hóa đơn VAT, tự động tính: Còn phải thu = Giá trị đơn - Thực thu'
  },
  'sales-overview': {
    title: 'Tổng quan Doanh thu & Sản lượng VPP',
    desc: '4 Thẻ KPI chủ lực, cơ cấu 5 nhóm ngành hàng VPP, xu hướng 12 tháng và Top khách hàng VIP'
  },
  'sales-reports': {
    title: 'Báo cáo Bán hàng & Công nợ Phải thu',
    desc: 'Phân tích doanh số theo nhóm hàng/mặt hàng/nhân viên, theo dõi số dư công nợ chi tiết từng khách'
  },
  'sales-plans': {
    title: 'Kế hoạch Kinh doanh & Giao Chỉ tiêu Doanh số',
    desc: 'Thiết lập hạn mức bán hàng theo Tháng/Quý/Năm và đối chiếu tỷ lệ hoàn thành thực tế'
  },

  // Phân hệ Kho & Hàng hóa VPP
  'inventory-overview': {
    title: 'Tổng quan Kho & Hàng hóa Văn Phòng Phẩm',
    desc: '4 Thẻ KPI chủ lực, cơ cấu giá trị tồn kho theo danh mục, quy mô kho và cảnh báo dưới định mức'
  },
  warehouses: {
    title: 'Quản lý Kho Vật Lý VPP',
    desc: 'Tổng kho Gia Lâm, Kho giao nhanh Hai Bà Trưng, định vị địa chỉ và bảo vệ tính toàn vẹn khi có tồn kho'
  },
  categories: {
    title: 'Danh mục Hàng hóa Văn Phòng Phẩm (Cấp 1)',
    desc: 'Phân loại nhóm ngành VPP chủ lực: Giấy in, Bút viết, File còng, Dụng cụ VP, Máy VP'
  },
  'product-types': {
    title: 'Loại Hàng hóa Văn Phòng Phẩm (Cấp 2)',
    desc: 'Phân loại chuyên sâu theo quy cách, liên kết danh mục cha và đơn vị tính chuẩn Ream/Hộp/Quyển'
  },
  products: {
    title: 'Quản lý Sản phẩm SKU & Master Data Hàng hóa',
    desc: 'Master SKU, mã vạch, giá vốn bình quân, định mức an toàn, quy cách kỹ thuật và tự động đồng bộ Nhà cung cấp'
  },
  suppliers: {
    title: 'Danh bạ Nhà Cung Cấp Văn Phòng Phẩm',
    desc: 'Double A, Thiên Long, King Jim, Bãi Bằng... quản lý thông tin đối tác và danh mục hàng hóa cung ứng'
  },
  'inventory-reports': {
    title: 'Báo cáo Tồn kho Đa chiều',
    desc: 'Thống kê tồn kho theo Danh mục, Loại hàng và chi tiết SKU, tính giá trị tồn kho và xuất Excel/In ấn'
  },

  // Phân hệ Quản trị nền tảng
  departments: {
    title: 'Cơ cấu tổ chức & Phòng ban',
    desc: 'Quản lý cây thư mục phân cấp đơn vị, chống vòng lặp, kiểm soát chức năng nhiệm vụ'
  },
  users: {
    title: 'Quản lý Người dùng & Nhân sự',
    desc: 'Hồ sơ nhân sự, phân cấp quản lý, bảo mật phân tầng cột Lương & Phụ cấp'
  },
  roles: {
    title: 'Danh mục Vai trò Hệ thống',
    desc: 'Thiết lập danh mục chức danh, phân loại vai trò cốt lõi và vai trò tùy chỉnh'
  },
  permissions: {
    title: 'Ma trận Phân quyền & Phạm vi Dữ liệu',
    desc: 'Cấu hình quyền 25 phân hệ x 4 thao tác CRUD kèm giới hạn Row-Level Data Scope'
  },
  documents: {
    title: 'Hồ sơ Giấy tờ Mẫu & CO-CQ Văn Phòng Phẩm',
    desc: 'Lưu trữ Hợp đồng cung ứng VPP, Chứng chỉ chất lượng CO-CQ Giấy & Bút, tải lên tối đa 25MB'
  },

  // Lộ trình tiếp theo
  finances: {
    title: 'Thu - Chi & Tài chính Doanh nghiệp',
    desc: 'Quản lý Phiếu thu, Phiếu chi, Phân bổ công nợ FIFO, Sổ quỹ tiền mặt & tiền gửi'
  },
  dashboard: {
    title: 'Dashboard Điều hành Doanh nghiệp',
    desc: 'Biểu đồ doanh thu VPP, sản lượng giấy in, cảnh báo công nợ và KPI tài chính tổng quan'
  },
  settings: {
    title: 'Cài đặt Hệ thống & Tùy biến Cá nhân',
    desc: 'Hồ sơ người dùng, đổi mật khẩu, cấu hình hiển thị và thông tin bản quyền Nam Khánh'
  }
};

interface NotificationItem {
  id: string;
  type: 'WARNING' | 'ORDER' | 'DEBT' | 'HANDOVER';
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobile,
  isSidebarOpen = true,
  onToggleSidebar
}) => {
  const { user } = useAuth();
  const [isOpenNotifications, setIsOpenNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'WARNING',
      title: 'Cảnh báo tồn kho an toàn',
      desc: 'Giấy in Bãi Bằng A4 70gsm tại Tổng kho Gia Lâm còn 8 ream (Dưới mức tối thiểu 20 ream).',
      time: '10 phút trước',
      read: false
    },
    {
      id: '2',
      type: 'ORDER',
      title: 'Đơn hàng mới cần duyệt giao',
      desc: 'Đơn hàng #DH-2609-008 của Khách hàng FPT Software đã chốt, chờ xuất kho.',
      time: '45 phút trước',
      read: false
    },
    {
      id: '3',
      type: 'DEBT',
      title: 'Nhắc hạn công nợ khách hàng',
      desc: 'Khoản nợ 24.500.000đ của Công ty Xây dựng Delta quá hạn 5 ngày.',
      time: '2 giờ trước',
      read: false
    },
    {
      id: '4',
      type: 'HANDOVER',
      title: 'Bàn giao khách hàng mới',
      desc: 'Bạn vừa nhận quyền quản trị 3 khách hàng VIP từ Giám đốc kinh doanh.',
      time: '1 ngày trước',
      read: true
    }
  ]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsOpenNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const filteredNotifs =
    notificationFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const currentInfo = tabTitles[currentTab] || {
    title: 'Công ty TNHH NK Nam Khánh - CRM',
    desc: 'Hệ thống Quản trị Doanh nghiệp & Cung ứng Văn phòng phẩm'
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Nút Hamburger trên Mobile */}
        <button
          id="bonci-ham"
          onClick={onOpenMobile}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#E53935',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(229, 57, 53, 0.3)'
          }}
          className="hamburger-mobile"
          title="Mở menu điều hướng"
        >
          <Menu size={20} />
        </button>

        {/* Nút Đóng / Mở Sidebar trên Desktop */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="desktop-toggle-btn text-gray-600 hover:text-[#E53935] hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-gray-200"
            title={isSidebarOpen ? 'Thu gọn / Đóng thanh điều hướng (Ctrl + B)' : 'Mở rộng thanh điều hướng (Ctrl + B)'}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              backgroundColor: isSidebarOpen ? '#FFFFFF' : '#FEF2F2',
              borderColor: isSidebarOpen ? '#E5E7EB' : '#FCA5A5'
            }}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} color="#E53935" />}
          </button>
        )}

        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            {currentInfo.title}
          </h1>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
            {currentInfo.desc}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Chuông thông báo thông minh (Mục 1.3) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsOpenNotifications(!isOpenNotifications)}
            className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Trung tâm thông báo điều hành"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-red-600 rounded-full border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Notification Panel */}
          {isOpenNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">Thông báo điều hành</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold text-red-600 bg-red-50 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 px-4 py-2 border-b border-gray-50 bg-gray-50/50 text-xs">
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    notificationFilter === 'all'
                      ? 'bg-white text-red-600 shadow-xs font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Tất cả ({notifications.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('unread')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    notificationFilter === 'unread'
                      ? 'bg-white text-red-600 shadow-xs font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {filteredNotifs.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    Không có thông báo nào
                  </div>
                ) : (
                  filteredNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleToggleRead(n.id)}
                      className={`flex items-start gap-3 p-3.5 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          n.type === 'WARNING'
                            ? 'bg-amber-100 text-amber-600'
                            : n.type === 'ORDER'
                            ? 'bg-blue-100 text-blue-600'
                            : n.type === 'DEBT'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {n.type === 'WARNING' ? (
                          <AlertTriangle size={16} />
                        ) : n.type === 'ORDER' ? (
                          <ShoppingCart size={16} />
                        ) : n.type === 'DEBT' ? (
                          <Clock size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.desc}</p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thẻ quyền hạn của người dùng hiện tại */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '12px',
            color: '#E53935',
            backgroundColor: '#FFEBEE',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            fontWeight: '600'
          }}
        >
          <ShieldCheck size={14} />
          <span>Vai trò: {user?.roles?.[0]}</span>
        </div>
      </div>
    </header>
  );
};

