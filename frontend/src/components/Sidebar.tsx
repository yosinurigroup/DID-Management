import React, { useState } from 'react';
import {
  PhoneIcon,
  MapIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onItemClick,
}) => {
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  const versionHistory = [
    {
      version: '1.0.4',
      date: 'October 3, 2025',
      title: 'Server Stability & Backup Management',
      features: [
        'Enhanced server startup and monitoring',
        'Improved frontend/backend connectivity',
        'Better error handling for server processes',
        'Automatic port detection and management',
        'Streamlined development workflow',
        'Comprehensive backup and version control',
        'Application stability improvements',
        'Development server optimization'
      ]
    },
    {
      version: '1.0.3',
      date: 'October 3, 2025',
      title: 'UI Simplification & Enhanced Export',
      features: [
        'Application rebranded to "DID Management"',
        'Removed sidebar collapse functionality for better UX',
        'Added statistics cards to Area Codes page',
        'New "Export DIDs Only" function with single column format',
        'Enhanced Export All with default rows and proper formatting',
        'Streamlined navigation with fixed sidebar',
        'Improved application stability and performance',
        'Clean, professional interface design'
      ]
    },
    {
      version: '1.0.2',
      date: 'September 29, 2025',
      title: 'Advanced Data Management',
      features: [
        'Complete DIDs CRUD operations with validation',
        'CSV import with duplicate detection & reporting',
        'Smart phone number cleaning (tel: format removal)',
        'Area code synchronization with state mapping',
        'Enhanced bulk operations (select all, delete all)',
        'Advanced CSV export with custom formatting',
        'Real-time DID count updates for area codes',
        'Comprehensive error handling and user feedback'
      ]
    },
    {
      version: '1.0.1',
      date: 'September 25, 2025',
      title: 'Enhanced User Experience',
      features: [
        'Improved table navigation and responsiveness',
        'Better form validation and error messages',
        'Streamlined data import workflow',
        'Enhanced search and filtering capabilities'
      ]
    },
    {
      version: '1.0.0',
      date: 'September 20, 2025',
      title: 'Initial Release',
      features: [
        'DIDs management system',
        'Area codes database',
        'Basic CRUD operations',
        'CSV import functionality'
      ]
    }
  ];

  const currentVersion = versionHistory[currentVersionIndex];

  const navigateVersion = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentVersionIndex > 0) {
      setCurrentVersionIndex(currentVersionIndex - 1);
    } else if (direction === 'next' && currentVersionIndex < versionHistory.length - 1) {
      setCurrentVersionIndex(currentVersionIndex + 1);
    }
  };

  const navigationItems = [
    { id: 'dids', label: 'DIDs', icon: PhoneIcon },
    { id: 'areacodes', label: 'Area Codes', icon: MapIcon },
    { id: 'companies', label: 'Companies', icon: BuildingOfficeIcon },
    { id: 'dialb', label: 'DialB', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="bg-gray-800 text-white h-screen flex flex-col w-64">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">DID Management</h1>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeItem === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Version info footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowVersionInfo(!showVersionInfo)}
            className="w-full text-left text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            v{currentVersion.version}
          </button>

          {/* Expanded Version Tooltip */}
          {showVersionInfo && (
            <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
              <div className="text-sm">
                {/* Version Navigation Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    DID Management v{currentVersion.version}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => navigateVersion('prev')}
                      disabled={currentVersionIndex === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous version"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-500 px-2">
                      {currentVersionIndex + 1} of {versionHistory.length}
                    </span>
                    <button
                      onClick={() => navigateVersion('next')}
                      disabled={currentVersionIndex === versionHistory.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next version"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Version Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{currentVersion.title}</span>
                    <span className="text-xs text-gray-500">{currentVersion.date}</span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Features:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {currentVersion.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;