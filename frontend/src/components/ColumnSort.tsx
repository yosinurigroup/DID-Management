import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export type SortDirection = 'asc' | 'desc' | 'none';

interface ColumnSortProps {
  columnKey: string;
  currentSort: { column: string; direction: SortDirection };
  onSortChange: (columnKey: string, direction: SortDirection) => void;
}

const ColumnSort: React.FC<ColumnSortProps> = ({
  columnKey,
  currentSort,
  onSortChange,
}) => {
  const isActive = currentSort.column === columnKey;
  const currentDirection = isActive ? currentSort.direction : 'none';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let newDirection: SortDirection;
    
    switch (currentDirection) {
      case 'none':
        newDirection = 'asc'; // A-Z
        break;
      case 'asc':
        newDirection = 'desc'; // Z-A
        break;
      case 'desc':
        newDirection = 'none'; // No sort
        break;
      default:
        newDirection = 'asc';
    }

    onSortChange(columnKey, newDirection);
  };

  const getIcon = () => {
    if (!isActive || currentDirection === 'none') {
      // A-Z icon for no sort state
      return (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 2h2l2.5 7h-1l-.5-1.5H1.5L1 9H0l1-7zm1 5h1.5L3 5.5 2 7z"/>
          <path d="M14 2v1l-2 2h2v1H10V5l2-2h-2V2h4z"/>
          <path d="M8 10l1 2 1-2h.5l-1.5 3 1.5 3H10l-1-2-1 2h-.5l1.5-3L7.5 10H8z"/>
        </svg>
      );
    }
    
    if (currentDirection === 'asc') {
      // A with up arrow (A-Z)
      return (
        <div className="flex items-center">
          <span className="text-xs font-bold mr-0.5">A</span>
          <ChevronUpIcon className="w-3 h-3" />
        </div>
      );
    }
    
    // Z with down arrow (Z-A)
    return (
      <div className="flex items-center">
        <span className="text-xs font-bold mr-0.5">Z</span>
        <ChevronDownIcon className="w-3 h-3" />
      </div>
    );
  };

  const getTitle = () => {
    switch (currentDirection) {
      case 'none':
        return `Sort ${columnKey} A-Z`;
      case 'asc':
        return `Sort ${columnKey} Z-A`;
      case 'desc':
        return `Remove ${columnKey} sort`;
      default:
        return `Sort ${columnKey}`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`ml-1 p-1 rounded hover:bg-gray-200 transition-colors ${
        isActive && currentDirection !== 'none' ? 'text-blue-600' : 'text-gray-400'
      }`}
      title={getTitle()}
      type="button"
    >
      {getIcon()}
    </button>
  );
};

export default ColumnSort;