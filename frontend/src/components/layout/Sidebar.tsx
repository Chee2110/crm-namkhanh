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
  PackagePlus,
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

interface ItemColorTheme {
  accent: string;     // Màu chủ đạo riêng biệt của trang
  bgSoft: string;     // Nền pastel dịu nhẹ
  borderSoft: string; // Viền pastel
  glow: string;       // Đổ bóng phát sáng nhẹ theo màu trang
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  theme: ItemColorTheme;
}

interface MenuGroup {
  group: string;
  groupColor: string;
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
  const [pendingInboundCount, setPendingInboundCount] = useState<number | null>(null);

  // Trạng thái hiển thị tooltip bay ngoài thanh cuộn (dùng khi ở chế độ đóng)
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    groupName: string;
    label: string;
    badge?: string;
    accent?: string;
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

    // Tải số lượng phiếu nhập kho đang chờ kiểm/duyệt
    api.get('/inbound-receipts?status=CHECKING')
      .then((res: any) => {
        if (isMounted && res.data?.kpis) {
          setPendingInboundCount(res.data.kpis.pendingReceipts);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user, currentTab]);

  // NGUỒN DỮ LIỆU DUY NHẤT: ĐẦY ĐỦ 5 PHÂN HỆ & MỖI TRANG MỘT MÀU SẮC NHẬN DIỆN RIÊNG BIỆT
  const menuGroups: MenuGroup[] = [
    {
      group: 'TỔNG QUAN & ĐIỀU HÀNH',
      groupColor: '#0284C7',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard điều hành',
          icon: LayoutDashboard,
          theme: {
            accent: '#0284C7',     // 1. Ocean Blue (Xanh Đại Dương)
            bgSoft: '#E0F2FE',
            borderSoft: '#7DD3FC',
            glow: 'rgba(2, 132, 199, 0.35)'
          }
        }
      ]
    },
    {
      group: 'KINH DOANH & BÁN HÀNG',
      groupColor: '#0D9488',
      items: [
        {
          id: 'customers',
          label: 'Khách hàng',
          icon: Contact,
          theme: {
            accent: '#0D9488',     // 2. Teal (Xanh Ngọc Lam)
            bgSoft: '#CCFBF1',
            borderSoft: '#5EEAD4',
            glow: 'rgba(13, 148, 136, 0.35)'
          }
        },
        {
          id: 'quotations',
          label: 'Quản lý Báo giá',
          icon: FileSpreadsheet,
          theme: {
            accent: '#7C3AED',     // 3. Violet (Tím Oải Hương)
            bgSoft: '#EDE9FE',
            borderSoft: '#C4B5FD',
            glow: 'rgba(124, 58, 237, 0.35)'
          }
        },
        {
          id: 'orders',
          label: 'Quản lý Đơn hàng',
          icon: ShoppingCart,
          badge: pendingOrdersCount && pendingOrdersCount > 0 ? `${pendingOrdersCount} đơn chờ` : undefined,
          theme: {
            accent: '#D97706',     // 4. Amber (Cam Vàng Hổ Phách)
            bgSoft: '#FEF3C7',
            borderSoft: '#FCD34D',
            glow: 'rgba(217, 119, 6, 0.35)'
          }
        },
        {
          id: 'sales-overview',
          label: 'Doanh thu & Sản lượng',
          icon: TrendingUp,
          theme: {
            accent: '#059669',     // 5. Emerald (Xanh Ngọc Lục Bảo)
            bgSoft: '#D1FAE5',
            borderSoft: '#6EE7B7',
            glow: 'rgba(5, 150, 105, 0.35)'
          }
        },
        {
          id: 'sales-reports',
          label: 'Báo cáo Doanh thu & Nợ',
          icon: BarChart3,
          theme: {
            accent: '#E11D48',     // 6. Rose Coral (Đỏ Hồng San Hô)
            bgSoft: '#FFE4E6',
            borderSoft: '#FDA4AF',
            glow: 'rgba(225, 29, 72, 0.35)'
          }
        },
        {
          id: 'sales-plans',
          label: 'Kế hoạch Kinh doanh',
          icon: Target,
          theme: {
            accent: '#4F46E5',     // 7. Indigo (Xanh Chàm)
            bgSoft: '#E0E7FF',
            borderSoft: '#A5B4FC',
            glow: 'rgba(79, 70, 229, 0.35)'
          }
        }
      ]
    },
    {
      group: 'KHO & HÀNG HÓA',
      groupColor: '#0891B2',
      items: [
        {
          id: 'inventory-overview',
          label: 'Tổng quan kho',
          icon: Boxes,
          theme: {
            accent: '#0891B2',     // 8. Cyan (Xanh Băng)
            bgSoft: '#CFFAFE',
            borderSoft: '#67E8F9',
            glow: 'rgba(8, 145, 178, 0.35)'
          }
        },
        {
          id: 'inbound-receipts',
          label: 'Quản lý Nhập kho',
          icon: PackagePlus,
          badge: pendingInboundCount && pendingInboundCount > 0 ? `${pendingInboundCount} chờ duyệt` : undefined,
          theme: {
            accent: '#16A34A',     // 9. Fresh Green (Xanh Lá Tươi)
            bgSoft: '#DCFCE7',
            borderSoft: '#86EFAC',
            glow: 'rgba(22, 163, 74, 0.35)'
          }
        },
        {
          id: 'warehouses',
          label: 'Quản lý kho vật lý',
          icon: Warehouse,
          theme: {
            accent: '#2563EB',     // 10. Royal Blue (Xanh Dương Đậm)
            bgSoft: '#DBEAFE',
            borderSoft: '#93C5FD',
            glow: 'rgba(37, 99, 235, 0.35)'
          }
        },
        {
          id: 'products',
          label: 'Quản lý hàng hóa',
          icon: Package,
          badge: lowStockCount && lowStockCount > 0 ? `${lowStockCount} sắp hết` : undefined,
          theme: {
            accent: '#EA580C',     // 11. Tangerine Orange (Cam Quýt)
            bgSoft: '#FFEDD5',
            borderSoft: '#FDBA74',
            glow: 'rgba(234, 88, 12, 0.35)'
          }
        },
        {
          id: 'suppliers',
          label: 'Nhà cung cấp',
          icon: Truck,
          theme: {
            accent: '#9333EA',     // 12. Purple (Tím Hoàng Gia)
            bgSoft: '#F3E8FF',
            borderSoft: '#D8B4FE',
            glow: 'rgba(147, 51, 234, 0.35)'
          }
        },
        {
          id: 'inventory-reports',
          label: 'Báo cáo tồn kho',
          icon: FileSpreadsheet,
          theme: {
            accent: '#C026D3',     // 13. Fuchsia (Hồng Tím)
            bgSoft: '#FAE8FF',
            borderSoft: '#F0ABFC',
            glow: 'rgba(192, 38, 211, 0.35)'
          }
        }
      ]
    },
    {
      group: 'QUẢN TRỊ NỀN TẢNG',
      groupColor: '#6366F1',
      items: [
        {
          id: 'departments',
          label: 'Cơ cấu tổ chức',
          icon: Building2,
          theme: {
            accent: '#0369A1',     // 14. Deep Sky (Xanh Lam Đậm)
            bgSoft: '#E0F2FE',
            borderSoft: '#7DD3FC',
            glow: 'rgba(3, 105, 161, 0.35)'
          }
        },
        {
          id: 'users',
          label: 'Quản lý người dùng',
          icon: Users,
          theme: {
            accent: '#DB2777',     // 15. Pink (Hồng Cánh Sen)
            bgSoft: '#FCE7F3',
            borderSoft: '#F9A8D4',
            glow: 'rgba(219, 39, 119, 0.35)'
          }
        },
        {
          id: 'roles',
          label: 'Danh mục vai trò',
          icon: ShieldAlert,
          theme: {
            accent: '#DC2626',     // 16. Crimson Red (Đỏ Ngọc)
            bgSoft: '#FEE2E2',
            borderSoft: '#FCA5A5',
            glow: 'rgba(220, 38, 38, 0.35)'
          }
        },
        {
          id: 'permissions',
          label: 'Ma trận phân quyền',
          icon: KeyRound,
          theme: {
            accent: '#CA8A04',     // 17. Gold Yellow (Vàng Kim)
            bgSoft: '#FEF9C3',
            borderSoft: '#FDE047',
            glow: 'rgba(202, 138, 4, 0.35)'
          }
        },
        {
          id: 'documents',
          label: 'Hồ sơ giấy tờ & CO-CQ',
          icon: FileText,
          theme: {
            accent: '#65A30D',     // 18. Lime Green (Xanh Cốm)
            bgSoft: '#ECFCCB',
            borderSoft: '#BEF264',
            glow: 'rgba(101, 163, 13, 0.35)'
          }
        }
      ]
    },
    {
      group: 'TÀI CHÍNH & THU CHI',
      groupColor: '#10B981',
      items: [
        {
          id: 'finances',
          label: 'Quản lý Thu - Chi & Dòng tiền',
          icon: Receipt,
          theme: {
            accent: '#10B981',     // 19. Mint Emerald (Xanh Tài Chính)
            bgSoft: '#D1FAE5',
            borderSoft: '#6EE7B7',
            glow: 'rgba(16, 185, 129, 0.35)'
          }
        }
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
              <div style={{ fontSize: '10.5px', color: '#0284C7', fontWeight: '600', whiteSpace: 'nowrap' }}>
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
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: isExpanded ? '0.2rem 0.6rem 0.35rem 0.6rem' : '0 0.6rem',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '9999px',
                    backgroundColor: group.groupColor,
                    flexShrink: 0
                  }}
                />
                <span>{group.group}</span>
              </div>

              {/* Danh sách các mục trong nhóm */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isExpanded ? 'stretch' : 'center',
                  gap: isExpanded ? '4px' : '6px',
                  width: '100%'
                }}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const { accent, bgSoft, borderSoft, glow } = item.theme;
                  const isActive =
                    currentTab === item.id ||
                    (item.id === 'products' && (currentTab === 'categories' || currentTab === 'product-types' || currentTab === 'product-groups' || currentTab === 'products' || currentTab === 'goods-management'));
                  const targetTab =
                    item.id === 'products'
                      ? (localStorage.getItem('nk_goods_management_tab') || 'products')
                      : item.id;

                  return (
                    <a
                      key={item.id}
                      href={`#/${targetTab}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          onSelectTab(targetTab);
                          if (isOpenMobile) onCloseMobile();
                        }
                      }}
                      onMouseEnter={!isExpanded ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredTooltip({
                          groupName: group.group,
                          label: item.label,
                          badge: item.badge,
                          accent,
                          top: rect.top + rect.height / 2
                        });
                      } : undefined}
                      onMouseLeave={!isExpanded ? () => setHoveredTooltip(null) : undefined}
                      title={!isExpanded ? `${group.group}: ${item.label}` : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isExpanded ? 'space-between' : 'center',
                        width: isExpanded ? '100%' : '40px',
                        height: isExpanded ? '42px' : '40px',
                        padding: isExpanded ? '0.45rem 0.65rem' : '0',
                        borderRadius: isExpanded ? '0.8rem' : '9999px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '13.2px',
                        fontWeight: isActive ? '700' : '500',
                        // Mỗi trang mang màu nhận diện riêng biệt:
                        // - Khi đóng: nền pastel (chưa chọn) hoặc nền màu đặc (đang chọn)
                        // - Khi mở: nền pastel của trang khi đang chọn, icon luôn nằm trong khung màu riêng
                        backgroundColor: isActive
                          ? (isExpanded ? bgSoft : accent)
                          : (isExpanded ? 'transparent' : bgSoft),
                        color: isActive
                          ? (isExpanded ? accent : '#FFFFFF')
                          : '#334155',
                        boxShadow: isActive
                          ? (isExpanded ? `0 3px 10px -2px ${glow}` : `0 4px 14px 0 ${glow}`)
                          : 'none',
                        border: isActive
                          ? (isExpanded ? `1px solid ${borderSoft}` : '2px solid #FFFFFF')
                          : (isExpanded ? '1px solid transparent' : `1px solid ${borderSoft}`),
                        transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                      className={!isActive ? (isExpanded ? 'hover:bg-slate-100/80 hover:text-slate-900' : 'hover:scale-105') : ''}
                    >
                      {/* Thanh vạch chỉ báo bên trái khi đang chọn ở chế độ mở rộng */}
                      {isActive && isExpanded && (
                        <span
                          style={{
                            position: 'absolute',
                            left: '0px',
                            top: '8px',
                            bottom: '8px',
                            width: '3.5px',
                            borderRadius: '0 4px 4px 0',
                            backgroundColor: accent
                          }}
                        />
                      )}

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
                        {/* Khung chứa Icon mang màu sắc định danh riêng của từng trang */}
                        <div
                          style={{
                            width: isExpanded ? '28px' : '22px',
                            height: isExpanded ? '28px' : '22px',
                            borderRadius: isExpanded ? '8px' : '9999px',
                            backgroundColor: isExpanded
                              ? (isActive ? accent : bgSoft)
                              : 'transparent',
                            border: isExpanded && !isActive ? `1px solid ${borderSoft}` : 'none',
                            boxShadow: isExpanded && isActive ? `0 2px 6px ${glow}` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.22s ease'
                          }}
                        >
                          <Icon
                            size={isExpanded ? 15.5 : 18}
                            strokeWidth={isActive ? 2.4 : 2.0}
                            color={isActive ? '#FFFFFF' : accent}
                            style={{ transition: 'all 0.2s ease' }}
                          />
                        </div>

                        {/* Tên mục (hiển thị mượt mà khi mở rộng) */}
                        <span
                          style={{
                            opacity: isExpanded ? 1 : 0,
                            maxWidth: isExpanded ? '148px' : '0px',
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
                              fontSize: '10.5px',
                              fontWeight: '700',
                              padding: '0.12rem 0.5rem',
                              borderRadius: '9999px',
                              backgroundColor: bgSoft,
                              color: accent,
                              border: `1px solid ${borderSoft}`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Dấu chấm badge khi đóng: Chấm tròn màu trang góc phải icon */}
                      {item.badge && !isActive && !isExpanded && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '3px',
                            right: '3px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '9999px',
                            backgroundColor: accent,
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
                  backgroundColor: currentTab === 'settings' ? '#0284C7' : 'transparent',
                  color: currentTab === 'settings' ? '#FFFFFF' : '#64748B',
                  boxShadow: currentTab === 'settings' ? '0 4px 14px 0 rgba(2, 132, 199, 0.36)' : 'none',
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
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)'
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
                      background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
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
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.button) {
                        e.preventDefault();
                        onSelectTab('settings');
                        if (isOpenMobile) onCloseMobile();
                      }
                    }}
                    title="Cài đặt hệ thống"
                    style={{
                      background: currentTab === 'settings' ? '#F0F9FF' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: currentTab === 'settings' ? '#0284C7' : '#64748B',
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
            {hoveredTooltip.accent && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: hoveredTooltip.accent,
                  flexShrink: 0
                }}
              />
            )}
            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
              {hoveredTooltip.groupName} •
            </span>
            <span className="font-semibold text-white">{hoveredTooltip.label}</span>
            {hoveredTooltip.badge && (
              <span
                style={{ backgroundColor: hoveredTooltip.accent || '#0284C7' }}
                className="text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full"
              >
                {hoveredTooltip.badge}
              </span>
            )}
          </div>
        )}
    </>
  );
};
