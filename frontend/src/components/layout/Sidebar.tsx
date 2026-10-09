import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  KeyRound,
  FileText,
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Receipt,
  LogOut,
  X,
  LucideIcon,
  Contact,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  Target,
  Warehouse,
  Layers,
  Package,
  Barcode,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isSidebarOpen = false,
  onToggleSidebar
}) => {
  const { user, logout } = useAuth();
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);

  // Trạng thái hiển thị tooltip bay ngoài thanh cuộn (dùng khi ở chế độ đóng)
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    groupName: string;
    label: string;
    badge?: string;
    top: number;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    // Tải số lượng đơn hàng đang chờ giao
    api.get('/orders?deliveryStatus=PENDING')
      .then((res: any) => {
        if (isMounted && Array.isArray(res.data)) {
          setPendingOrdersCount(res.data.length);
        }
      })
      .catch(() => {});

    // Tải số lượng sản phẩm sắp hết tồn kho
    api.get('/products')
      .then((res: any) => {
        if (isMounted && Array.isArray(res.data)) {
          const count = res.data.filter((p: any) => Number(p.stockQuantity) <= (Number(p.minStockLevel) || 20)).length;
          setLowStockCount(count);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user, currentTab]);

  // NGUỒN DỮ LIỆU DUY NHẤT: ĐẦY ĐỦ 5 PHÂN HỆ & 20 TRANG NGHIỆP VỤ
  const menuGroups: MenuGroup[] = [
    {
      group: 'TỔNG QUAN & ĐIỀU HÀNH',
      items: [
        { id: 'dashboard', label: 'Dashboard điều hành', icon: LayoutDashboard }
      ]
    },
    {
      group: 'KINH DOANH & BÁN HÀNG',
      items: [
        { id: 'customers', label: 'Khách hàng', icon: Contact },
        { id: 'quotations', label: 'Quản lý Báo giá', icon: FileSpreadsheet },
        {
          id: 'orders',
          label: 'Quản lý Đơn hàng',
          icon: ShoppingCart,
          badge: pendingOrdersCount && pendingOrdersCount > 0 ? `${pendingOrdersCount} đơn chờ` : undefined
        },
        { id: 'sales-overview', label: 'Doanh thu & Sản lượng', icon: TrendingUp },
        { id: 'sales-reports', label: 'Báo cáo Doanh thu & Nợ', icon: BarChart3 },
        { id: 'sales-plans', label: 'Kế hoạch Kinh doanh', icon: Target }
      ]
    },
    {
      group: 'KHO & HÀNG HÓA',
      items: [
        { id: 'inventory-overview', label: 'Tổng quan kho', icon: Boxes },
        { id: 'warehouses', label: 'Quản lý kho vật lý', icon: Warehouse },
        { id: 'categories', label: 'Danh mục hàng hóa', icon: Layers },
        { id: 'product-types', label: 'Loại hàng hóa', icon: Package },
        {
          id: 'products',
          label: 'Quản lý sản phẩm SKU',
          icon: Barcode,
          badge: lowStockCount && lowStockCount > 0 ? `${lowStockCount} sắp hết` : undefined
        },
        { id: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
        { id: 'inventory-reports', label: 'Báo cáo tồn kho', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'QUẢN TRỊ NỀN TẢNG',
      items: [
        { id: 'departments', label: 'Cơ cấu tổ chức', icon: Building2 },
        { id: 'users', label: 'Quản lý người dùng', icon: Users },
        { id: 'roles', label: 'Danh mục vai trò', icon: ShieldAlert },
        { id: 'permissions', label: 'Ma trận phân quyền', icon: KeyRound },
        { id: 'documents', label: 'Hồ sơ giấy tờ & CO-CQ', icon: FileText }
      ]
    },
    {
      group: 'TÀI CHÍNH & THU CHI',
      items: [
        { id: 'finances', label: 'Quản lý Thu - Chi & Dòng tiền', icon: Receipt }
      ]
    }
  ];

  // Trạng thái hiển thị mở rộng (Desktop mở hoặc Mobile mở)
  const isExpanded = isSidebarOpen || isOpenMobile;

  return (
    <>
      {/* Lớp nền mờ trên Mobile */}
      {isOpenMobile && (
        <div
          id="bonci-overlay"
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            zIndex: 998,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* =========================================================================
          THANH SIDEBAR DẠNG CÁC KHỐI HÌNH ĐƠN RỜI NHAU (DISCRETE FLOATING ISLANDS)
          - CẢ BẢN ĐÓNG LẪN BẢN MỞ ĐỀU LÀ CÁC KHỐI RỜI NHAU (CÓ KHOẢNG TRỐNG THÔNG SUỐT)
          - BẢN ĐÓNG: Các viên nang tròn nhỏ (w-52px)
          - BẢN MỞ: Các thẻ kính mờ bo tròn (w-260px)
         ========================================================================= */}
      <aside
        aria-label="Thanh điều hướng dạng các khối rời nhau"
        onScroll={() => {
          if (hoveredTooltip) setHoveredTooltip(null);
        }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: isExpanded ? (isOpenMobile ? 'calc(100vw - 24px)' : '280px') : '82px',
          maxWidth: isOpenMobile ? '300px' : undefined,
          zIndex: 990,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px', // KHOẢNG TRỐNG GIỮA CÁC KHỐI RỜI
          padding: '14px 10px 28px 10px',
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          scrollBehavior: 'smooth',
          backgroundColor: 'transparent', // Nền khung trong suốt để thấy rõ các khối rời nhau
          border: 'none',
          boxShadow: 'none',
          pointerEvents: 'auto',
          transition: 'width 0.32s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        className={`no-scrollbar ${isOpenMobile ? 'sidebar-open' : 'sidebar-responsive'} ${
          isSidebarOpen ? 'sidebar-desktop-open' : 'sidebar-desktop-closed'
        }`}
      >
        {/* ===================================================================
            KHỐI 0 (RỜI): LOGO THƯƠNG HIỆU & NÚT THU GỌN / MỞ RỘNG
           =================================================================== */}
        <div
          onClick={!isExpanded ? onToggleSidebar : undefined}
          onMouseEnter={!isExpanded ? (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredTooltip({
              groupName: 'HỆ THỐNG',
              label: 'NK Nam Khánh • Mở rộng menu đầy đủ (Ctrl + B)',
              top: rect.top + rect.height / 2
            });
          } : undefined}
          onMouseLeave={!isExpanded ? () => setHoveredTooltip(null) : undefined}
          title={!isExpanded ? "NK Nam Khánh • Mở rộng menu đầy đủ (Ctrl + B)" : undefined}
          className={!isExpanded ? "group cursor-pointer hover:scale-105" : ""}
          style={{
            width: isExpanded ? '100%' : '52px',
            height: isExpanded ? '54px' : '52px',
            borderRadius: isExpanded ? '20px' : '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.07), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'space-between' : 'center',
            padding: isExpanded ? '0.65rem 0.85rem' : '7px',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'all 0.32s cubic-bezier(0.25, 1, 0.5, 1)',
            cursor: !isExpanded ? 'pointer' : 'default'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isExpanded ? '0.75rem' : '0', overflow: 'hidden', transition: 'gap 0.32s cubic-bezier(0.25, 1, 0.5, 1)' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: isExpanded ? '12px' : '9999px',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                border: '1px solid #F1F5F9',
                flexShrink: 0,
                transition: 'border-radius 0.32s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            >
              <img
                src="/logo.png"
                alt="Logo Nam Khánh"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: isExpanded ? 1 : 0,
                maxWidth: isExpanded ? '160px' : '0px',
                transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'opacity 0.22s ease, max-width 0.32s cubic-bezier(0.25, 1, 0.5, 1), transform 0.28s ease',
                pointerEvents: isExpanded ? 'auto' : 'none'
              }}
            >
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                NK NAM KHÁNH
              </div>
              <div style={{ fontSize: '10.5px', color: '#EA332A', fontWeight: '600', whiteSpace: 'nowrap' }}>
                Văn phòng phẩm & Thiết bị VP
              </div>
            </div>
          </div>

          {/* Nút Thu gọn / Đóng */}
          <div
            style={{
              opacity: isExpanded ? 1 : 0,
              maxWidth: isExpanded ? '40px' : '0px',
              overflow: 'hidden',
              pointerEvents: isExpanded ? 'auto' : 'none',
              transition: 'opacity 0.2s ease, max-width 0.32s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          >
            {isOpenMobile ? (
              <button
                onClick={onCloseMobile}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '6px' }}
                title="Đóng menu"
              >
                <X size={18} />
              </button>
            ) : (
              onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="hidden md:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Thu gọn thành các khối hình đơn (Ctrl + B)"
                  style={{ background: 'none', border: 'none', flexShrink: 0 }}
                >
                  <ChevronLeft size={18} />
                </button>
              )
            )}
          </div>
        </div>

        {/* ===================================================================
            KHỐI 1 ĐẾN 5 (RỜI): 5 PHÂN HỆ NGHIỆP VỤ (MỖI NHÓM LÀ 1 KHỐI ĐỘC LẬP)
           =================================================================== */}
        {menuGroups.map((group, groupIdx) => {
          return (
            <div
              key={groupIdx}
              style={{
                width: isExpanded ? '100%' : '52px',
                borderRadius: isExpanded ? '20px' : '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(24px) saturate(190%)',
                WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.07), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
                padding: isExpanded ? '0.65rem 0.65rem 0.75rem 0.65rem' : '7px 5px',
                flexShrink: 0,
                overflow: 'hidden',
                transition: 'all 0.32s cubic-bezier(0.25, 1, 0.5, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isExpanded ? 'stretch' : 'center',
                gap: isExpanded ? '3px' : '6px'
              }}
            >
              {/* Tiêu đề nhóm (chỉ hiện khi mở rộng) */}
              <div
                style={{
                  maxHeight: isExpanded ? '28px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: isExpanded ? '0.2rem 0.6rem 0.35rem 0.6rem' : '0 0.6rem',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}
              >
                {group.group}
              </div>

              {/* Danh sách các mục trong nhóm */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isExpanded ? 'stretch' : 'center',
                  gap: isExpanded ? '3px' : '6px',
                  width: '100%'
                }}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <a
                      key={item.id}
                      href={`#/${item.id}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          onSelectTab(item.id);
                          if (isOpenMobile) onCloseMobile();
                        }
                      }}
                      onMouseEnter={!isExpanded ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredTooltip({
                          groupName: group.group,
                          label: item.label,
                          badge: item.badge,
                          top: rect.top + rect.height / 2
                        });
                      } : undefined}
                      onMouseLeave={!isExpanded ? () => setHoveredTooltip(null) : undefined}
                      title={!isExpanded ? `${group.group}: ${item.label}` : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isExpanded ? 'space-between' : 'center',
                        width: isExpanded ? '100%' : '42px',
                        height: '42px',
                        padding: isExpanded ? '0.55rem 0.75rem' : '0',
                        borderRadius: isExpanded ? '0.75rem' : '9999px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: isActive ? '600' : '450',
                        // Nền khi active:
                        // Collapsed: hình tròn đặc màu đỏ #EA332A, icon trắng
                        // Expanded: thẻ nền đỏ nhạt #FEF2F2, chữ đỏ #EA332A, viền #FECACA
                        backgroundColor: isActive
                          ? (isExpanded ? '#FEF2F2' : '#EA332A')
                          : 'transparent',
                        color: isActive
                          ? (isExpanded ? '#EA332A' : '#FFFFFF')
                          : '#64748B',
                        boxShadow: isActive
                          ? (isExpanded ? '0 2px 6px 0 rgba(234, 51, 42, 0.08)' : '0 4px 14px 0 rgba(234, 51, 42, 0.42)')
                          : 'none',
                        border: isActive
                          ? (isExpanded ? '1px solid #FECACA' : '1px solid transparent')
                          : '1px solid transparent',
                        transition: 'width 0.32s cubic-bezier(0.25, 1, 0.5, 1), border-radius 0.32s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.25s ease, color 0.25s ease, padding 0.32s cubic-bezier(0.25, 1, 0.5, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                      className={!isActive ? (isExpanded ? 'hover:bg-slate-100/70 hover:text-slate-900' : 'hover:bg-slate-100 hover:text-slate-900') : ''}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isExpanded ? '0.625rem' : '0',
                          transition: 'gap 0.32s cubic-bezier(0.25, 1, 0.5, 1)',
                          minWidth: 0,
                          flex: isExpanded ? 1 : 'none',
                          justifyContent: isExpanded ? 'flex-start' : 'center'
                        }}
                      >
                        <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon
                            size={isExpanded ? 17 : 19}
                            strokeWidth={isActive ? 2.3 : 1.8}
                            color={isActive ? (isExpanded ? '#EA332A' : '#FFFFFF') : undefined}
                            style={{ transition: 'all 0.2s ease' }}
                          />
                        </div>

                        {/* Tên mục (hiển thị mượt mà khi mở rộng) */}
                        <span
                          style={{
                            opacity: isExpanded ? 1 : 0,
                            maxWidth: isExpanded ? '150px' : '0px',
                            transform: isExpanded ? 'translateX(0)' : 'translateX(-6px)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            transition: 'opacity 0.22s ease, max-width 0.32s cubic-bezier(0.25, 1, 0.5, 1), transform 0.28s ease',
                            pointerEvents: isExpanded ? 'auto' : 'none'
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* Badge khi mở rộng: Pill text đầy đủ */}
                      <div
                        style={{
                          opacity: isExpanded && item.badge ? 1 : 0,
                          maxWidth: isExpanded && item.badge ? '90px' : '0px',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          pointerEvents: isExpanded ? 'auto' : 'none',
                          transition: 'opacity 0.2s ease, max-width 0.32s cubic-bezier(0.25, 1, 0.5, 1)',
                          flexShrink: 0
                        }}
                      >
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '0.12rem 0.5rem',
                              borderRadius: '9999px',
                              backgroundColor: item.id === 'orders' ? '#FEF3C7' : item.id === 'products' ? '#FEF2F2' : '#F1F5F9',
                              color: item.id === 'orders' ? '#B45309' : item.id === 'products' ? '#EA332A' : '#64748B',
                              border: `1px solid ${item.id === 'orders' ? '#FDE68A' : item.id === 'products' ? '#FECACA' : '#E2E8F0'}`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Dấu chấm badge khi đóng: Red dot góc phải icon */}
                      {item.badge && !isActive && !isExpanded && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '9999px',
                            backgroundColor: '#EA332A',
                            border: '2px solid #FFFFFF'
                          }}
                        />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ===================================================================
            KHỐI 6 (RỜI): CÀI ĐẶT, CÔNG CỤ & CÁ NHÂN (KHỐI THỨ 6 RỜI BIỆT LẬP)
           =================================================================== */}
        <div
          style={{
            width: isExpanded ? '100%' : '52px',
            borderRadius: isExpanded ? '20px' : '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.07), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
            padding: isExpanded ? '0.85rem 1rem' : '7px 5px',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'all 0.32s cubic-bezier(0.25, 1, 0.5, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isExpanded ? 'stretch' : 'center',
            gap: isExpanded ? '0.625rem' : '6px'
          }}
        >
          {!isExpanded ? (
            /* Khối 6 khi Đóng: Dạng cột viên nang tròn */
            <div className="flex flex-col items-center gap-1.5 w-full">
              {/* Nút Cài đặt hệ thống */}
              <a
                href="#/settings"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onSelectTab('settings');
                  }
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({
                    groupName: 'HỆ THỐNG',
                    label: 'Cài đặt hệ thống',
                    top: rect.top + rect.height / 2
                  });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                title="Cài đặt hệ thống"
                className="flex items-center justify-center transition-all duration-200 cursor-pointer"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '9999px',
                  backgroundColor: currentTab === 'settings' ? '#EA332A' : 'transparent',
                  color: currentTab === 'settings' ? '#FFFFFF' : '#64748B',
                  boxShadow: currentTab === 'settings' ? '0 4px 14px 0 rgba(234, 51, 42, 0.42)' : 'none',
                  textDecoration: 'none'
                }}
              >
                <Settings size={19} strokeWidth={currentTab === 'settings' ? 2.3 : 1.8} />
              </a>

              {/* Nút Mở rộng thanh điều hướng */}
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredTooltip({
                      groupName: 'ĐIỀU HƯỚNG',
                      label: 'Mở rộng menu đầy đủ (Ctrl + B)',
                      top: rect.top + rect.height / 2
                    });
                  }}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  title="Mở rộng menu đầy đủ (Ctrl + B)"
                  className="flex items-center justify-center transition-all duration-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-full cursor-pointer"
                  style={{ width: '40px', height: '40px', border: 'none', background: 'transparent' }}
                >
                  <ChevronRight size={19} />
                </button>
              )}

              {/* Avatar Người dùng */}
              <div
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({
                    groupName: 'TÀI KHOẢN',
                    label: `${user?.fullName || 'Người dùng'} (${user?.email || ''})`,
                    top: rect.top + rect.height / 2
                  });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                title={user?.fullName || 'Tài khoản'}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #EA332A 0%, #D32F2F 100%)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(234, 51, 42, 0.28)'
                }}
              >
                {user?.fullName?.charAt(0) || 'U'}
              </div>

              {/* Nút Đăng xuất */}
              <button
                onClick={logout}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({
                    groupName: 'TÀI KHOẢN',
                    label: 'Đăng xuất tài khoản',
                    top: rect.top + rect.height / 2
                  });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                title="Đăng xuất"
                className="flex items-center justify-center transition-all duration-200 text-red-500 hover:bg-red-50 rounded-full cursor-pointer"
                style={{ width: '38px', height: '38px', border: 'none', background: 'transparent' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            /* Khối 6 khi Mở: Thẻ bo tròn rời độc lập hiển thị thông tin User, Cài đặt & Đăng xuất */
            <div className="flex flex-col gap-2.5 w-full">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden', flex: 1 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #EA332A 0%, #D32F2F 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(234, 51, 42, 0.28)',
                      flexShrink: 0
                    }}
                  >
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '13.5px',
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      {user?.fullName}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                      title={user?.email}
                    >
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <a
                    href="#/settings"
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onSelectTab('settings');
                        if (isOpenMobile) onCloseMobile();
                      }
                    }}
                    title="Cài đặt hệ thống"
                    style={{
                      background: currentTab === 'settings' ? '#FEF2F2' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: currentTab === 'settings' ? '#EA332A' : '#64748B',
                      padding: '0.4rem',
                      borderRadius: '0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none'
                    }}
                    className="hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Settings size={17} />
                  </a>
                  <button
                    onClick={logout}
                    title="Đăng xuất"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#EA332A',
                      padding: '0.4rem',
                      borderRadius: '0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    className="hover:bg-red-50"
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  paddingTop: '0.35rem',
                  borderTop: '1px solid #F1F5F9',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#94A3B8'
                }}
              >
                © 2026 Công ty TNHH NK Nam Khánh
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* TOOLTIP BAY TỰ DO (FLOATING PORTAL TOOLTIP) - Khi ở chế độ đóng */}
      {hoveredTooltip && !isExpanded && (
        <div
          style={{
            position: 'fixed',
            left: '92px',
            top: hoveredTooltip.top,
            transform: 'translateY(-50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.35)'
          }}
          className="px-3.5 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-xl whitespace-nowrap flex items-center gap-2 border border-white/15 animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
            {hoveredTooltip.groupName} •
          </span>
          <span className="font-semibold text-white">{hoveredTooltip.label}</span>
          {hoveredTooltip.badge && (
            <span className="text-[10px] bg-[#EA332A] text-white font-bold px-1.5 py-0.5 rounded-full">
              {hoveredTooltip.badge}
            </span>
          )}
        </div>
      )}
    </>
  );
};
