import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentTab, onSelectTab }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_sidebar_open');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('namkhanh_sidebar_open', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Phím tắt Ctrl + B / Cmd + B để đóng/mở nhanh Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col selection:bg-[#0284C7] selection:text-white"
      style={{
        backgroundColor: 'transparent',
        minHeight: '100%',
        flex: 1
      }}
    >
      {/* Dynamic Ambient Ocean Breeze Blobs - Loang chéo góc trên bên trái và góc dưới bên phải */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        {/* 1. Góc trên bên trái: Loang màu xanh Sky/Ocean thanh khiết */}
        <div className="absolute -top-20 -left-20 w-[440px] h-[440px] rounded-full bg-gradient-to-br from-sky-400/16 via-cyan-300/10 to-transparent blur-[80px]" />

        {/* 2. Góc trên bên phải: Loang màu hồng đào Rose-Peach nhẹ nhàng */}
        <div className="absolute -top-16 -right-16 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-rose-300/15 via-pink-200/10 to-transparent blur-[80px]" />

        {/* 3. Trung tâm phải: Loang tím Lavender thanh thoát */}
        <div className="absolute top-[38%] right-[12%] w-[360px] h-[360px] rounded-full bg-gradient-to-tl from-violet-300/12 via-indigo-200/08 to-transparent blur-[85px]" />

        {/* 4. Góc dưới bên trái: Loang vàng nắng Amber dịu ấm */}
        <div className="absolute -bottom-16 left-[10%] w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-amber-300/12 via-yellow-200/08 to-transparent blur-[80px]" />

        {/* 5. Góc dưới bên phải: Loang màu xanh Ngọc Mint/Emerald tươi mới */}
        <div className="absolute -bottom-20 -right-20 w-[440px] h-[440px] rounded-full bg-gradient-to-tl from-emerald-300/16 via-teal-300/10 to-transparent blur-[80px]" />
      </div>

      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <div
        className={`main-content-layout relative z-10 ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        style={{ minHeight: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Header
          currentTab={currentTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          onOpenMobile={() => setIsOpenMobile(true)}
          onNavigateTab={onSelectTab}
        />
        <main style={{ padding: '0.85rem 1rem 1.5rem 1rem', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};
