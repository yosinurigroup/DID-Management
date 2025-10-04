import React, { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import DIDs from './pages/DIDs';
import AreaCodes from './pages/AreaCodes';
import Companies from './pages/Companies';
import DialB from './pages/DialB';
import ImportDIDs from './pages/ImportDIDs';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dids');

  // Listen for navigation events from the sidebar
  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setCurrentPage(event.detail.page);
    };

    window.addEventListener('navigate', handleNavigation as EventListener);
    return () => window.removeEventListener('navigate', handleNavigation as EventListener);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dids':
        return <DIDs />;
      case 'areacodes':
        return <AreaCodes />;
      case 'companies':
        return <Companies />;
      case 'dialb':
        return <DialB />;
      case 'import-dids':
        return <ImportDIDs />;
      default:
        return <DIDs />;
    }
  };

  return (
    <div className="App">
      <MainLayout>
        {renderPage()}
      </MainLayout>
    </div>
  );
}

export default App;
