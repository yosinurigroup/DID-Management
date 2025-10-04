import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activeMenuItem, setActiveMenuItem] = useState('dids');

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    // Dispatch custom event for navigation
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: item } }));
  };

  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setActiveMenuItem(event.detail.page);
    };

    window.addEventListener('navigate', handleNavigation as EventListener);
    return () => window.removeEventListener('navigate', handleNavigation as EventListener);
  }, []);

  const getPageTitle = (page: string) => {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      dids: 'DIDs Management',
      areacodes: 'Area Codes',
      upload: 'Upload Data',
      'import-dids': 'Import DIDs'
    };
    return titles[page] || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-shrink-0">
        <Sidebar
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header/Breadcrumb */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {getPageTitle(activeMenuItem)}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Home / {getPageTitle(activeMenuItem)}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;