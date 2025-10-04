import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { areaCodesData, AreaCode, addAreaCode, updateAreaCode, deleteAreaCode, getUniqueStatesFromAreaCodes } from '../data/areaCodesData';
import rawData from '../data/area-codes-data.json';
import { didsData, updateDIDRecord, getStateFromAreaCode } from '../data/didsData';
import ColumnFilter from '../components/ColumnFilter';
import ColumnSort, { SortDirection } from '../components/ColumnSort';
import { StandaloneInlineEdit } from '../components/InlineEdit';

const AreaCodes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaCodes, setAreaCodes] = useState<AreaCode[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAreaCode, setNewAreaCode] = useState({ code: '', state: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAreaCode, setEditingAreaCode] = useState<AreaCode | null>(null);
  const [selectedAreaCodes, setSelectedAreaCodes] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: SortDirection }>({
    column: '',
    direction: 'none'
  });

  // Load area codes data on component mount
  useEffect(() => {
    console.log('Initial loading of area codes data...');
    console.log('Raw areaCodesData import:', areaCodesData);
    console.log('Type of areaCodesData:', typeof areaCodesData);
    console.log('Is array:', Array.isArray(areaCodesData));
    
    let loadedAreaCodes = areaCodesData || [];
    
    // If we have very few area codes, load from raw JSON file
    if (loadedAreaCodes.length < 10) {
      console.log('Loading from raw JSON data as backup...');
      console.log('Raw JSON data:', rawData);
      loadedAreaCodes = rawData.areaCodes.map((areaCode: any) => ({
        ...areaCode,
        totalDIDs: 0,
        activeDIDs: 0
      })) as AreaCode[];
      console.log('Loaded from JSON:', loadedAreaCodes.length, 'area codes');
      
      // Save to localStorage for future use
      localStorage.setItem('areaCodesData', JSON.stringify(loadedAreaCodes));
    }
    
    console.log('Final loaded area codes:', loadedAreaCodes.length);
    console.log('First 3 area codes:', loadedAreaCodes.slice(0, 3));
    setAreaCodes(loadedAreaCodes);
  }, []);

  // Function to synchronize all DID states with current area codes
  const synchronizeAllDIDStates = useCallback(() => {
    console.log('Synchronizing all DID states with area codes...');
    
    let updatedCount = 0;
    didsData.forEach(did => {
      const correctState = getStateFromAreaCode(did.areaCode);
      if (correctState && did.state !== correctState) {
        console.log(`Updating DID ${did.didNumber} state from ${did.state} to ${correctState}`);
        const updatedDID = { ...did, state: correctState };
        updateDIDRecord(did.id, updatedDID);
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      // Dispatch event to notify DIDs component to refresh
      window.dispatchEvent(new CustomEvent('didsDataUpdated'));
      console.log(`Synchronized ${updatedCount} DID states`);
    }
  }, []);

  // Update DID counts after area codes are loaded
  useEffect(() => {
    if (areaCodes.length > 0) {
      console.log('Updating DID counts for', areaCodes.length, 'area codes');
      updateAreaCodeDIDCounts();
      
      // Also synchronize DID states
      synchronizeAllDIDStates();
    }
  }, [areaCodes.length]);

  // Listen for area codes data updates
  useEffect(() => {
    console.log('Setting up storage event listener');
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'areaCodesData') {
        console.log('Area codes storage changed, reloading...');
        const updatedData = JSON.parse(e.newValue || '[]');
        setAreaCodes(updatedData || []);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Get unique states from area codes
  const uniqueStates = useMemo(() => {
    return getUniqueStatesFromAreaCodes();
  }, [areaCodes]);

  // Function to update DID states when area codes change
  const updateDIDStatesForAreaCode = useCallback((areaCode: string, newState: string) => {
    console.log(`Updating DID states for area code ${areaCode} to ${newState}`);
    
    // Find all DIDs with this area code and update their state
    const updatedDIDs = didsData.map(did => {
      if (did.areaCode === areaCode && did.state !== newState) {
        console.log(`Updating DID ${did.didNumber} state from ${did.state} to ${newState}`);
        const updatedDID = { ...did, state: newState };
        updateDIDRecord(did.id, updatedDID);
        return updatedDID;
      }
      return did;
    });
    
    // Dispatch event to notify DIDs component to refresh
    window.dispatchEvent(new CustomEvent('didsDataUpdated'));
    
    console.log(`Updated ${updatedDIDs.filter(did => did.areaCode === areaCode).length} DIDs for area code ${areaCode}`);
  }, []);

  // Function to get DID count for a specific area code
  const getDIDCountForAreaCode = useCallback((areaCode: string): number => {
    return didsData.filter((did: any) => {
      const didAreaCode = did.did ? did.did.substring(2, 5) : did.didNumber?.substring(2, 5);
      return didAreaCode === areaCode;
    }).length;
  }, []);

  // Function to update DID counts for all area codes
  const updateAreaCodeDIDCounts = useCallback(() => {
    console.log('Starting DID count update...');
    const updatedAreaCodes = areaCodes.map(areaCode => {
      const didCount = getDIDCountForAreaCode(areaCode.code);
      console.log(`Area code ${areaCode.code}: ${didCount} DIDs`);
      return { ...areaCode, totalDIDs: didCount };
    });
    
    console.log('Updated area codes with DID counts:', updatedAreaCodes);
    setAreaCodes(updatedAreaCodes);
    
    // Also update localStorage using the correct key
    localStorage.setItem('areaCodesData', JSON.stringify(updatedAreaCodes));
  }, [areaCodes, getDIDCountForAreaCode]);

  // Filtered and sorted area codes
  const filteredAreaCodes = useMemo(() => {
    console.log('Filtering area codes. Total:', areaCodes.length, 'Search term:', searchTerm);
    
    let filtered = areaCodes.filter(areaCode => {
      const matchesSearch = !searchTerm || 
        areaCode.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areaCode.state.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesColumnFilters = Object.entries(columnFilters).every(([column, values]) => {
        if (values.length === 0) return true;
        const cellValue = (areaCode as any)[column]?.toString() || '';
        return values.includes(cellValue);
      });

      return matchesSearch && matchesColumnFilters;
    });

    if (sortConfig.column && sortConfig.direction !== 'none') {
      filtered.sort((a, b) => {
        const aValue = (a as any)[sortConfig.column];
        const bValue = (b as any)[sortConfig.column];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    console.log('Filtered area codes:', filtered.length);
    return filtered;
  }, [areaCodes, searchTerm, columnFilters, sortConfig]);

  const handleSort = (columnKey: string, direction: SortDirection) => {
    setSortConfig({ column: columnKey, direction });
  };

  const handleColumnFilter = (column: string, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleSelectAll = () => {
    if (selectedAreaCodes.length === filteredAreaCodes.length) {
      setSelectedAreaCodes([]);
    } else {
      setSelectedAreaCodes(filteredAreaCodes.map(ac => ac.id));
    }
  };

  const handleSelectAreaCode = (id: string) => {
    setSelectedAreaCodes(prev => 
      prev.includes(id) 
        ? prev.filter(acId => acId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedAreaCodes) {
        await deleteAreaCode(id);
      }
      
      const updatedAreaCodes = areaCodes.filter(ac => !selectedAreaCodes.includes(ac.id));
      setAreaCodes(updatedAreaCodes);
      setSelectedAreaCodes([]);
      
      alert(`Deleted ${selectedAreaCodes.length} area codes successfully!`);
    } catch (error) {
      console.error('Error deleting area codes:', error);
      alert('Error deleting area codes. Please try again.');
    }
  };

  const handleInlineEditSave = useCallback(async (id: string, field: string, value: string): Promise<boolean> => {
    try {
      console.log(`Saving inline edit: ${field} = ${value} for area code ${id}`);
      
      const areaCodeToUpdate = areaCodes.find(ac => ac.id === id);
      if (!areaCodeToUpdate) {
        throw new Error('Area code not found');
      }

      const updatedAreaCode = { ...areaCodeToUpdate, [field]: value };
      await updateAreaCode(id, updatedAreaCode);
      
      // If the state was updated, also update all DIDs with this area code
      if (field === 'state') {
        updateDIDStatesForAreaCode(areaCodeToUpdate.code, value);
      }
      
      setAreaCodes(prev => prev.map(ac => ac.id === id ? updatedAreaCode : ac));
      
      console.log('Inline edit saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving inline edit:', error);
      alert('Error saving changes. Please try again.');
      return false;
    }
  }, [areaCodes, updateDIDStatesForAreaCode]);

  const handleAddAreaCode = async () => {
    try {
      if (!newAreaCode.code || !newAreaCode.state) {
        alert('Please fill in all fields');
        return;
      }

      if (areaCodes.some(ac => ac.code === newAreaCode.code)) {
        alert('Area code already exists');
        return;
      }

      const newAreaCodeRecord: AreaCode = {
        id: Date.now().toString(),
        code: newAreaCode.code,
        state: newAreaCode.state,
        region: '',
        timezone: '',
        totalDIDs: getDIDCountForAreaCode(newAreaCode.code),
        activeDIDs: 0
      };

      await addAreaCode(newAreaCodeRecord);
      
      // Update DID states for this area code
      updateDIDStatesForAreaCode(newAreaCode.code, newAreaCode.state);
      
      setAreaCodes(prev => [...prev, newAreaCodeRecord]);
      setShowAddModal(false);
      setNewAreaCode({ code: '', state: '' });
      
      alert('Area code added successfully and DID states updated!');
    } catch (error) {
      console.error('Error adding area code:', error);
      alert('Error adding area code. Please try again.');
    }
  };

  const handleDeleteAreaCode = async (id: string) => {
    try {
      await deleteAreaCode(id);
      
      setAreaCodes(prev => prev.filter(ac => ac.id !== id));
      setShowDeleteModal(false);
      setEditingAreaCode(null);
      
      alert('Area code deleted successfully!');
    } catch (error) {
      console.error('Error deleting area code:', error);
      alert('Error deleting area code. Please try again.');
    }
  };

  const handleResetData = () => {
    console.log('Resetting data...');
    localStorage.removeItem('areaCodesData');
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Area Codes</h1>
        <div className="flex space-x-2">
          <button
            onClick={synchronizeAllDIDStates}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            Sync DID States
          </button>
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Reset Data
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Area Code
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Area Codes Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Area Codes</p>
              <p className="text-2xl font-bold text-gray-900">{filteredAreaCodes.length}</p>
            </div>
          </div>
        </div>

        {/* Area Codes in Use Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Area Codes in Use</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAreaCodes.filter(areaCode => areaCode.totalDIDs > 0).length}
              </p>
            </div>
          </div>
        </div>

        {/* Area Codes Not in Use Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Area Codes Not in Use</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAreaCodes.filter(areaCode => areaCode.totalDIDs === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search area codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {selectedAreaCodes.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-blue-700">
              {selectedAreaCodes.length} area code(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedAreaCodes.length === filteredAreaCodes.length && filteredAreaCodes.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-1">
                    <span>Area Code</span>
                    <ColumnSort
                      columnKey="code"
                      currentSort={sortConfig}
                      onSortChange={handleSort}
                    />
                    <ColumnFilter
                      columnKey="code"
                      data={areaCodes}
                      activeFilters={columnFilters}
                      onFilterChange={(columnKey: string, values: string[]) => handleColumnFilter(columnKey, values)}
                      getValueFromRow={(row: any) => row.code}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-1">
                    <span>State</span>
                    <ColumnSort
                      columnKey="state"
                      currentSort={sortConfig}
                      onSortChange={handleSort}
                    />
                    <ColumnFilter
                      columnKey="state"
                      data={areaCodes}
                      activeFilters={columnFilters}
                      onFilterChange={(columnKey: string, values: string[]) => handleColumnFilter(columnKey, values)}
                      getValueFromRow={(row: any) => row.state}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center space-x-1">
                    <span>DID Count</span>
                    <ColumnSort
                      columnKey="totalDIDs"
                      currentSort={sortConfig}
                      onSortChange={handleSort}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAreaCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="space-y-2">
                      <p>No area codes found.</p>
                      <p className="text-sm text-gray-400">
                        Total area codes loaded: {areaCodes.length} | 
                        Filtered area codes: {filteredAreaCodes.length} | 
                        Search term: "{searchTerm}"
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAreaCodes.map((areaCode) => {
                  return (
                    <tr key={areaCode.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedAreaCodes.includes(areaCode.id)}
                          onChange={() => handleSelectAreaCode(areaCode.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        <StandaloneInlineEdit
                          value={areaCode.code}
                          onSave={(value: string) => handleInlineEditSave(areaCode.id, 'code', value)}
                          type="text"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <StandaloneInlineEdit
                          value={areaCode.state}
                          onSave={(value: string) => handleInlineEditSave(areaCode.id, 'state', value)}
                          type="select"
                          options={uniqueStates.map(s => ({ value: s, label: s }))}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {getDIDCountForAreaCode(areaCode.code)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <button
                          onClick={() => {
                            setEditingAreaCode(areaCode);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 ml-4"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Area Code</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Area Code</label>
                <input
                  type="text"
                  value={newAreaCode.code}
                  onChange={(e) => setNewAreaCode(prev => ({ ...prev, code: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 212"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <select
                  value={newAreaCode.state}
                  onChange={(e) => setNewAreaCode(prev => ({ ...prev, state: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a state</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewAreaCode({ code: '', state: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAreaCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Area Code
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && editingAreaCode && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Area Code</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete area code {editingAreaCode.code} ({editingAreaCode.state})?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEditingAreaCode(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAreaCode(editingAreaCode.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaCodes;