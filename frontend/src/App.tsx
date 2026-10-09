import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { Layout } from './components/layout/Layout';
import { GlobalLoadingIndicator } from './components/common/GlobalLoadingIndicator';
import { ConcurrentLoginModal } from './components/common/ConcurrentLoginModal';
import { MaintenanceModal } from './components/common/MaintenanceModal';
import { WelcomeBackModal } from './components/common/WelcomeBackModal';

// Phân hệ Quản trị nền tảng
import { DepartmentsPage } from './pages/system/DepartmentsPage';
import { UsersPage } from './pages/system/UsersPage';
import { RolesPage } from './pages/system/RolesPage';
import { PermissionsPage } from './pages/system/PermissionsPage';
import { DocumentsPage } from './pages/system/DocumentsPage';

// Phân hệ Kinh doanh & Bán hàng VPP
import { CustomersPage } from './pages/sales/CustomersPage';
import { QuotationsPage } from './pages/sales/QuotationsPage';
import { OrdersPage } from './pages/sales/OrdersPage';
import { SalesOverviewPage } from './pages/sales/SalesOverviewPage';
import { SalesReportsPage } from './pages/sales/SalesReportsPage';
import { SalesPlansPage } from './pages/sales/SalesPlansPage';

// Phân hệ Kho & Hàng hóa VPP
import { InventoryOverviewPage } from './pages/inventory/InventoryOverviewPage';
import { WarehousesPage } from './pages/inventory/WarehousesPage';
import { CategoriesPage } from './pages/inventory/CategoriesPage';
import { ProductTypesPage } from './pages/inventory/ProductTypesPage';
import { ProductsPage } from './pages/inventory/ProductsPage';
import { SuppliersPage } from './pages/inventory/SuppliersPage';
import { InventoryReportsPage } from './pages/inventory/InventoryReportsPage';

// Phân hệ Thu - Chi & Tài chính Doanh nghiệp
import { FinancesPage } from './pages/finances/FinancesPage';

// Phân hệ Dashboard Điều hành (Sprint 6)
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Cài đặt hệ thống
import { SettingsPage } from './pages/settings/SettingsPage';

// Lộ trình
import { RoadmapPlaceholderPage } from './pages/roadmap/RoadmapPlaceholderPage';

const VALID_TABS = [
  'dashboard',
  'customers',
  'quotations',
  'orders',
  'sales-overview',
  'sales-reports',
  'sales-plans',
  'inventory-overview',
  'warehouses',
  'categories',
  'product-types',
  'products',
  'suppliers',
  'inventory-reports',
  'departments',
  'users',
  'roles',
  'permissions',
  'documents',
  'finances',
  'settings'
];

const getTabFromUrl = (): string => {
  try {
    // 1. Kiểm tra hash (ví dụ: #/products hoặc #products)
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
    }
    // 2. Kiểm tra pathname fallback (ví dụ: /products)
    const path = window.location.pathname.replace(/^\//, '').split('?')[0];
    if (path && VALID_TABS.includes(path)) {
      return path;
    }
  } catch (e) {
    console.error('Error parsing route from URL:', e);
  }
  return 'dashboard';
};

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard điều hành',
  customers: 'Khách hàng',
  quotations: 'Quản lý Báo giá',
  orders: 'Quản lý Đơn hàng',
  'sales-overview': 'Doanh thu & Sản lượng',
  'sales-reports': 'Báo cáo Doanh thu & Nợ',
  'sales-plans': 'Kế hoạch Kinh doanh',
  'inventory-overview': 'Tổng quan kho',
  warehouses: 'Quản lý kho vật lý',
  categories: 'Danh mục hàng hóa',
  'product-types': 'Loại hàng hóa',
  products: 'Quản lý sản phẩm SKU Master',
  suppliers: 'Nhà cung cấp',
  'inventory-reports': 'Báo cáo tồn kho',
  departments: 'Cơ cấu tổ chức phòng ban',
  users: 'Quản lý người dùng',
  roles: 'Danh mục vai trò',
  permissions: 'Ma trận phân quyền',
  documents: 'Hồ sơ giấy tờ & CO-CQ',
  finances: 'Quản lý Thu - Chi & Dòng tiền',
  settings: 'Cài đặt hệ thống'
};

const AppContent: React.FC = () => {
  const {
    user,
    isLoading,
    concurrentLoginInfo,
    clearConcurrentLoginInfo,
    isMaintenanceActive,
    setIsMaintenanceActive,
    welcomeBackNotice,
    dismissWelcomeBackNotice
  } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => getTabFromUrl());
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string | undefined>(undefined);

  // Đồng bộ 2 chiều với URL trình duyệt (Hash routing & History)
  React.useEffect(() => {
    const handleUrlChange = () => {
      const tabFromUrl = getTabFromUrl();
      setCurrentTab(tabFromUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    // Khởi tạo hash ban đầu nếu URL chưa có hash
    if (!window.location.hash) {
      window.location.hash = `/${currentTab}`;
    }

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Cập nhật tiêu đề trang (document.title) theo từng phân hệ
  React.useEffect(() => {
    const pageName = TAB_TITLES[currentTab] || 'Quản trị điều hành';
    document.title = `${pageName} | CRM Nam Khánh`;
  }, [currentTab]);

  const handleSelectTab = (tab: string) => {
    if (VALID_TABS.includes(tab)) {
      if (window.location.hash !== `#/${tab}`) {
        window.location.hash = `/${tab}`;
      }
      setCurrentTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100%',
          height: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9FAFB',
          gap: '1rem'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            border: '1px solid #F3F4F6'
          }}
        >
          <img
            src="/logo.png"
            alt="Logo Nam Khánh"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ color: '#E53935', fontSize: '16.5px', fontWeight: '600' }}>
          Đang khởi động CRM Công ty TNHH NK Nam Khánh...
        </div>
      </div>
    );
  }

  const handleNavigateToPermissions = (roleId: string) => {
    setSelectedRoleForPerms(roleId);
    handleSelectTab('permissions');
  };

  const renderContent = () => {
    switch (currentTab) {
      // Phân hệ Kinh doanh & Bán hàng VPP
      case 'customers':
        return <CustomersPage />;
      case 'quotations':
        return <QuotationsPage />;
      case 'orders':
        return <OrdersPage />;
      case 'sales-overview':
        return <SalesOverviewPage />;
      case 'sales-reports':
        return <SalesReportsPage />;
      case 'sales-plans':
        return <SalesPlansPage />;

      // Phân hệ Kho & Hàng hóa VPP
      case 'inventory-overview':
        return <InventoryOverviewPage />;
      case 'warehouses':
        return <WarehousesPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'product-types':
        return <ProductTypesPage />;
      case 'products':
        return <ProductsPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'inventory-reports':
        return <InventoryReportsPage />;

      // Phân hệ Quản trị nền tảng
      case 'departments':
        return <DepartmentsPage />;
      case 'users':
        return <UsersPage />;
      case 'roles':
        return <RolesPage onNavigateToPermissions={handleNavigateToPermissions} />;
      case 'permissions':
        return <PermissionsPage initialRoleId={selectedRoleForPerms} />;
      case 'documents':
        return <DocumentsPage />;

      // Phân hệ Thu - Chi & Tài chính
      case 'finances':
        return <FinancesPage />;
      case 'dashboard':
        return <DashboardPage onNavigateTab={handleSelectTab} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigateTab={handleSelectTab} />;
    }
  };

  return (
    <>
      {/* Popup thông báo khi tài khoản bị đăng nhập từ thiết bị khác */}
      <ConcurrentLoginModal
        isOpen={Boolean(concurrentLoginInfo)}
        info={concurrentLoginInfo}
        onClose={clearConcurrentLoginInfo}
      />

      {/* Màn hình thông báo bảo trì hệ thống (cho nhân viên không phải ADMIN) */}
      <MaintenanceModal
        isOpen={isMaintenanceActive && (!user || !user.roles.includes('ADMIN'))}
        onMaintenanceEnded={() => {
          setIsMaintenanceActive(false);
          window.location.reload();
        }}
      />

      {/* Popup chào mừng quay trở lại sau khi bảo trì xong */}
      <WelcomeBackModal
        isOpen={welcomeBackNotice}
        onClose={dismissWelcomeBackNotice}
      />

      {!user ? (
        <LoginPage />
      ) : (
        <Layout currentTab={currentTab} onSelectTab={handleSelectTab}>
          <div key={currentTab} className="page-transition-enter">
            {renderContent()}
          </div>
        </Layout>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <GlobalLoadingIndicator />
      <AppContent />
    </AuthProvider>
  );
};

export default App;
