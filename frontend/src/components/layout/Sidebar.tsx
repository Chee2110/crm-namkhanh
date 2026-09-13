import React from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  isSidebarOpen = true,
  onToggleSidebar
}) => {
  const { user, logout } = useAuth();

  const menuItems: MenuGroup[] = [
    {
      group: 'TỔNG QUAN & ĐIỀU HÀNH',
      items: [
        { id: 'dashboard', label: 'Dashboard điều hành', icon: LayoutDashboard }
      ]
    },
    {
      group: 'KINH DOANH & BÁN HÀNG',
      items: [
        { id: 'customers', label: 'Khách hàng & Bàn giao', icon: Contact },
        { id: 'quotations', label: 'Quản lý Báo giá', icon: FileSpreadsheet },
        { id: 'orders', label: 'Quản lý Đơn hàng', icon: ShoppingCart },
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
        { id: 'products', label: 'Quản lý sản phẩm SKU', icon: Barcode },
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
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 998,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Thanh Sidebar chính */}
      <aside
        style={{
          width: '260px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #F3F4F6',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}
        className={`${
          isOpenMobile ? 'sidebar-open' : 'sidebar-responsive'
        } ${isSidebarOpen ? 'sidebar-desktop-open' : 'sidebar-desktop-closed'}`}
      >
        {/* Header Logo */}
        <div
          style={{
            padding: '1.25rem 1rem',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(229, 57, 53, 0.2)',
                border: '1px solid #F3F4F6',
                flexShrink: 0
              }}
            >
              <img
                src="/logo.png"
                alt="Logo NK"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '700', fontSize: '14.5px', color: '#111827', letterSpacing: '-0.02em', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                NK NAM KHÁNH
              </div>
              <div style={{ fontSize: '11px', color: '#E53935', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Văn phòng phẩm & Thiết bị VP</div>
            </div>
          </div>

          {/* Nút đóng Sidebar: X trên mobile, ChevronLeft trên desktop */}
          {isOpenMobile ? (
            <button
              onClick={onCloseMobile}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
              title="Đóng thanh điều hướng"
            >
              <X size={20} />
            </button>
          ) : (
            onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex items-center justify-center p-1.5 text-gray-400 hover:text-[#E53935] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Thu gọn / Đóng thanh điều hướng (Ctrl + B)"
                style={{ background: 'none', border: 'none', flexShrink: 0 }}
              >
                <ChevronLeft size={18} />
              </button>
            )
          )}
        </div>

        {/* Danh sách Menu điều hướng */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {menuItems.map((group, idx) => (
            <div key={idx} style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '0.5rem 0.75rem'
                }}
              >
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? '#C62828' : '#374151',
                        backgroundColor: isActive ? '#FFEBEE' : 'transparent',
                        borderLeft: isActive ? '3px solid #E53935' : '3px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Icon size={17} color={isActive ? '#E53935' : '#6B7280'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '500',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '9999px',
                            backgroundColor: '#F3F4F6',
                            color: '#6B7280'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: User Profile & Đăng xuất */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid #F3F4F6',
            backgroundColor: '#FAFAFA',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem'
          }}
        >
          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9999px',
                  backgroundColor: '#E53935',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '13px',
                  flexShrink: 0
                }}
              >
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '12.5px',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {user?.fullName}
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#9CA3AF',
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
              <button
                onClick={() => {
                  onSelectTab('settings');
                  if (isOpenMobile) onCloseMobile();
                }}
                title="Cài đặt hệ thống"
                style={{
                  background: currentTab === 'settings' ? '#FEE2E2' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: currentTab === 'settings' ? '#DC2626' : '#6B7280',
                  padding: '0.375rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <Settings size={17} />
              </button>
              <button
                onClick={logout}
                title="Đăng xuất"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#DC2626',
                  padding: '0.375rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>

          <div
            style={{
              paddingTop: '0.4rem',
              borderTop: '1px solid #E5E7EB',
              textAlign: 'center',
              fontSize: '10px',
              color: '#9CA3AF'
            }}
          >
            © 2026 Công ty TNHH NK Nam Khánh
          </div>
        </div>
      </aside>
    </>
  );
};
