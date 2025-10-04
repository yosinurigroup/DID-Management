import React, { useState, useEffect, useRef } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface ColumnFilterProps {
  columnKey: string;
  data: any[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (columnKey: string, selectedValues: string[]) => void;
  getValueFromRow: (row: any) => string;
  isActive?: boolean;
}

const ColumnFilter: React.FC<ColumnFilterProps> = ({
  columnKey,
  data,
  activeFilters,
  onFilterChange,
  getValueFromRow,
  isActive = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique values for this column
  const uniqueValues = Array.from(new Set(
    data.map(row => getValueFromRow(row)).filter(value => value && value.trim() !== '')
  )).sort();

  // Filter unique values based on search term
  const filteredValues = uniqueValues.filter(value =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize selected values from active filters
  useEffect(() => {
    if (activeFilters[columnKey] && activeFilters[columnKey].length > 0) {
      setSelectedValues(activeFilters[columnKey]);
    } else {
      // If no active filter, start with all values selected (showing all data)
      setSelectedValues([...uniqueValues]);
    }
  }, [activeFilters, columnKey, uniqueValues.join(',')]); // Use join to compare array content

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectAll = () => {
    if (selectedValues.length === uniqueValues.length) {
      setSelectedValues([]);
    } else {
      setSelectedValues([...uniqueValues]);
    }
  };

  const handleValueToggle = (value: string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleApply = () => {
    // If all values are selected, remove the filter (show all data)
    if (selectedValues.length === uniqueValues.length) {
      onFilterChange(columnKey, []);
    } else {
      // Otherwise, apply the selected filter
      onFilterChange(columnKey, selectedValues);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    // Clear means select all values (show all data)
    setSelectedValues([...uniqueValues]);
    onFilterChange(columnKey, []);
    setIsOpen(false);
  };

  const isAllSelected = selectedValues.length === uniqueValues.length;
  const isNoneSelected = selectedValues.length === 0;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`ml-1 p-1 rounded hover:bg-gray-200 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-400'
        }`}
        title={`Filter ${columnKey}`}
        type="button"
      >
        <FunnelIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-80 flex flex-col ${
          // Position dropdown based on column position to avoid cutoff
          columnKey === 'provider' || columnKey === 'didNumber' || columnKey === 'code' || columnKey === 'companyId'
            ? 'left-0' 
            : 'right-0'
        }`}>
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Select All Option */}
          <div className="p-3 border-b border-gray-200">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>
          </div>

          {/* Values List */}
          <div className="flex-1 overflow-y-auto p-2 max-h-48">
            {filteredValues.length > 0 ? (
              <div className="space-y-1">
                {filteredValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(value)}
                      onChange={() => handleValueToggle(value)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 truncate" title={value}>
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No values found
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-3 border-t border-gray-200 flex justify-between space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
              type="button"
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApply();
              }}
              type="button"
              disabled={isNoneSelected}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnFilter;