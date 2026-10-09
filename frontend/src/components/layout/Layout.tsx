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
      className="relative min-h-[100dvh] flex flex-col selection:bg-[#EA332A] selection:text-white"
      style={{
        backgroundColor: 'transparent',
        minHeight: '100%',
        flex: 1
      }}
    >
      {/* Dynamic Ambient Red Blobs - Loang chéo góc trên bên trái và góc dưới bên phải */}
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
        {/* Góc trên bên trái: Loang màu hồng nhẹ nhàng, kích thước bằng ~65% hiện tại */}
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-rose-400/12 via-pink-300/08 to-transparent blur-[75px]" />

        {/* Góc dưới bên phải: Loang màu hồng nhẹ nhàng, kích thước bằng ~65% hiện tại */}
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-rose-400/12 via-pink-300/08 to-transparent blur-[75px]" />
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
