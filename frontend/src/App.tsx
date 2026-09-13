import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { Layout } from './components/layout/Layout';

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

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
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
        <div style={{ color: '#E53935', fontSize: '15px', fontWeight: '600' }}>
          Đang khởi động CRM Công ty TNHH NK Nam Khánh...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigateToPermissions = (roleId: string) => {
    setSelectedRoleForPerms(roleId);
    setCurrentTab('permissions');
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
        return <DashboardPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
