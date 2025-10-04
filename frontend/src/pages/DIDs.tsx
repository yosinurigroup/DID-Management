import React, { useState, useMemo, useCallback } from 'react';
import { 
  didsData, 
  DIDRecord, 
  getUniqueProviders, 
  getUniqueStates,
  deleteDIDRecord,
  addDIDRecord,
  updateDIDRecord,
  extractAreaCode,
  getStateFromAreaCode
} from '../data/didsData';
import { getAllDialBRecords } from '../data/dialBData';
import ColumnFilter from '../components/ColumnFilter';
import ColumnSort, { SortDirection } from '../components/ColumnSort';
import { StandaloneInlineEdit } from '../components/InlineEdit';
import { API_ENDPOINTS } from '../config/api';
import { CheckIcon, XMarkIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DIDs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDID, setSelectedDID] = useState<DIDRecord | null>(null);
  
  // Selection state for bulk actions
  const [selectedDIDs, setSelectedDIDs] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Row editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowData, setEditingRowData] = useState<Partial<DIDRecord>>({});
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: SortDirection }>({
    column: '',
    direction: 'none'
  });

  // DialB data for status lookup
  const dialBData = useMemo(() => getAllDialBRecords(), []);
  
  // Function to lookup DialB status for a DID number
  const getDialBStatus = useCallback((didNumber: string): 'Clean' | 'Spam' | 'Unknown' => {
    // Remove all non-digit characters from DID number
    let cleanDID = didNumber.replace(/\D/g, '');
    
    // If DID starts with 1 and is 11 digits, remove the country code
    if (cleanDID.length === 11 && cleanDID.startsWith('1')) {
      cleanDID = cleanDID.substring(1);
    }
    
    // Debug logging (comment out in production)
    if (cleanDID === '3105796937' || cleanDID === '3109298978' || cleanDID === '3109554380') {
      console.log(`Found test DID: ${didNumber} -> ${cleanDID}`);
    }
    
    // Find matching record in DialB data
    const dialBRecord = dialBData.find(record => {
      const cleanDialB = record.phoneNumber.replace(/\D/g, '');
      return cleanDialB === cleanDID;
    });
    
    // Debug logging for first few lookups
    if (Math.random() < 0.01) { // Log 1% of lookups
      console.log(`Lookup: ${didNumber} -> ${cleanDID} -> ${dialBRecord ? dialBRecord.overallStatus : 'Unknown'}`);
    }
    
    return dialBRecord ? dialBRecord.overallStatus : 'Unknown';
  }, [dialBData]);

  // Handle column filter changes
  const handleColumnFilterChange = (columnKey: string, selectedValues: string[]) => {
    setColumnFilters(prev => {
      if (selectedValues.length === 0) {
        const newFilters = { ...prev };
        delete newFilters[columnKey];
        return newFilters;
      }
      return {
        ...prev,
        [columnKey]: selectedValues
      };
    });
  };

  // Handle sorting changes
  const handleSortChange = (columnKey: string, direction: SortDirection) => {
    setSortConfig({ column: columnKey, direction });
  };

  // Form data for add/edit
  const [formData, setFormData] = useState<Partial<DIDRecord>>({
    provider: '',
    didNumber: '',
    trankId: '',
    didForward: '',
    areaCode: '',
    state: '',
    companyId: '',
    companyName: '',
    status: 'active'
  });

  const providers = getUniqueProviders();
  const states = getUniqueStates();

  // Filtered and sorted data
  const filteredDIDs = useMemo(() => {
    let filtered = didsData.filter(did => {
      // Optimize search by converting search term once
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        did.didNumber.toLowerCase().includes(lowerSearchTerm) ||
        did.provider.toLowerCase().includes(lowerSearchTerm) ||
        did.trankId.toLowerCase().includes(lowerSearchTerm) ||
        did.didForward.toLowerCase().includes(lowerSearchTerm) ||
        did.areaCode.includes(searchTerm) ||
        did.state.toLowerCase().includes(lowerSearchTerm) ||
        (did.companyId && did.companyId.toLowerCase().includes(lowerSearchTerm)) ||
        (did.companyName && did.companyName.toLowerCase().includes(lowerSearchTerm));

      // Column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([columnKey, selectedValues]) => {
        // If no filter values or empty array, don't filter (show all)
        if (!selectedValues || selectedValues.length === 0) return true;
        
        let cellValue = '';
        switch (columnKey) {
          case 'didNumber':
            cellValue = did.didNumber;
            break;
          case 'provider':
            cellValue = did.provider;
            break;
          case 'trankId':
            cellValue = did.trankId;
            break;
          case 'didForward':
            cellValue = did.didForward;
            break;
          case 'areaCode':
            cellValue = did.areaCode;
            break;
          case 'state':
            cellValue = did.state;
            break;
          case 'companyId':
            cellValue = did.companyId || '';
            break;
          case 'companyName':
            cellValue = did.companyName || '';
            break;
          case 'dialBStatus':
            cellValue = getDialBStatus(did.didNumber);
            break;
          case 'status':
            cellValue = did.status;
            break;
          default:
            return true;
        }
        
        return selectedValues.includes(cellValue);
      });

      return matchesSearch && matchesColumnFilters;
    });

    // Apply sorting
    if (sortConfig.direction !== 'none' && sortConfig.column) {
      filtered.sort((a, b) => {
        let aValue = '';
        let bValue = '';

        switch (sortConfig.column) {
          case 'didNumber':
            aValue = a.didNumber;
            bValue = b.didNumber;
            break;
          case 'provider':
            aValue = a.provider;
            bValue = b.provider;
            break;
          case 'trankId':
            aValue = a.trankId;
            bValue = b.trankId;
            break;
          case 'didForward':
            aValue = a.didForward;
            bValue = b.didForward;
            break;
          case 'areaCode':
            aValue = a.areaCode;
            bValue = b.areaCode;
            break;
          case 'state':
            aValue = a.state;
            bValue = b.state;
            break;
          case 'companyId':
            aValue = a.companyId || '';
            bValue = b.companyId || '';
            break;
          case 'companyName':
            aValue = a.companyName || '';
            bValue = b.companyName || '';
            break;
          case 'dialBStatus':
            aValue = getDialBStatus(a.didNumber);
            bValue = getDialBStatus(b.didNumber);
            break;
          default:
            return 0;
        }

        const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [searchTerm, columnFilters, sortConfig, getDialBStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredDIDs.length;
    const uniqueProviders = new Set(filteredDIDs.map(d => d.provider)).size;
    const uniqueAreaCodes = new Set(filteredDIDs.map(d => d.areaCode)).size;
    const uniqueStates = new Set(filteredDIDs.map(d => d.state)).size;
    
    return { total, uniqueProviders, uniqueAreaCodes, uniqueStates };
  }, [filteredDIDs]);

  // Helper function to handle DID number changes
  const handleDIDNumberChange = (didNumber: string) => {
    const areaCode = extractAreaCode(didNumber);
    const state = getStateFromAreaCode(areaCode);
    setFormData({
      ...formData, 
      didNumber,
      areaCode,
      state
    });
  };

  const handleDelete = (did: DIDRecord) => {
    setSelectedDID(did);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      provider: '',
      didNumber: '',
      trankId: '',
      didForward: '',
      areaCode: '',
      state: '',
      companyId: '',
      companyName: '',
      status: 'active'
    });
  };

  const handleAdd = () => {
    if (formData.provider && formData.didNumber && formData.trankId && formData.didForward) {
      const newDID = addDIDRecord({
        provider: formData.provider,
        didNumber: formData.didNumber,
        trankId: formData.trankId,
        didForward: formData.didForward,
        areaCode: formData.areaCode || '',
        state: formData.state || '',
        companyId: formData.companyId || '',
        companyName: formData.companyName || '',
        status: formData.status || 'active',
        assignedDate: '',
        lastUpdated: ''
      });
      
      console.log('Successfully added DID:', newDID);
    } else {
      alert('Please fill in all required fields: Provider, DID Number, Trank ID, and DID Forward');
      return;
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (selectedDID && formData.provider && formData.didNumber && formData.trankId && formData.didForward) {
      const success = updateDIDRecord(selectedDID.id, {
        provider: formData.provider,
        didNumber: formData.didNumber,
        trankId: formData.trankId,
        didForward: formData.didForward,
        areaCode: formData.areaCode || '',
        state: formData.state || '',
        companyId: formData.companyId || '',
        companyName: formData.companyName || '',
        status: formData.status || 'active'
      });
      
      if (success) {
        console.log('Successfully updated DID:', selectedDID.didNumber);
      } else {
        console.error('Failed to update DID:', selectedDID.id);
        alert('Failed to update DID record');
        return;
      }
    } else {
      alert('Please fill in all required fields: Provider, DID Number, Trank ID, and DID Forward');
      return;
    }
    
    setShowEditModal(false);
    setSelectedDID(null);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    console.log('handleDeleteConfirm called');
    console.log('selectedDID:', selectedDID);
    
    if (selectedDID) {
      console.log('Attempting to delete DID with ID:', selectedDID.id);
      const success = deleteDIDRecord(selectedDID.id);
      console.log('Delete result:', success);
      
      if (success) {
        console.log('Successfully deleted DID:', selectedDID.didNumber);
      } else {
        console.error('Failed to delete DID:', selectedDID.id);
      }
    } else {
      console.log('No selectedDID found');
    }
    
    console.log('Closing modal and clearing selectedDID');
    setShowDeleteModal(false);
    setSelectedDID(null);
  };

  // Handle inline edit save
  const handleInlineEditSave = useCallback(async (didId: string, field: string, value: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.DIDS}/${didId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update DID');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the local data
        const success = updateDIDRecord(didId, { [field]: value } as Partial<DIDRecord>);
        if (success) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error updating DID:', error);
      return false;
    }
  }, []);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedDIDs.length === filteredDIDs.length) {
      setSelectedDIDs([]);
    } else {
      setSelectedDIDs(filteredDIDs.map(did => did.id));
    }
  };

  const handleSelectDID = (didId: string) => {
    setSelectedDIDs(prev => {
      if (prev.includes(didId)) {
        return prev.filter(id => id !== didId);
      } else {
        return [...prev, didId];
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedDIDs.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    selectedDIDs.forEach(didId => {
      deleteDIDRecord(didId);
    });
    setSelectedDIDs([]);
    setShowBulkDeleteModal(false);
  };

  // Export functionality
  const handleExportSelected = () => {
    if (selectedDIDs.length === 0) return;

    // Get selected DIDs data
    const selectedDIDsData = filteredDIDs.filter(did => selectedDIDs.includes(did.id));
    
    // Group by company, state, and area code
    const groups: { [key: string]: DIDRecord[] } = {};
    
    selectedDIDsData.forEach(did => {
      const companyName = did.companyName || 'Unknown Company';
      const state = did.state || 'Unknown State';
      const areaCode = did.areaCode || 'Unknown Area';
      const groupKey = `${companyName}_${state}_${areaCode}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(did);
    });

    // Generate CSV content
    const csvRows: string[] = [];
    
    Object.entries(groups).forEach(([groupKey, dids]) => {
      const [companyName, state, areaCode] = groupKey.split('_');
      const stateAreaCode = `${state} ${areaCode}`;
      
      // Get company code from the first DID in the group (should be the same for all in group)
      const companyCode = dids[0]?.companyId || '';
      const companyCodeAreaCode = `${companyCode}1${areaCode}`;  // Added "1" between company code and area code
      
      // Create one row per area code with all DIDs in separate columns
      const row = [
        companyName,           // Column A: Company name
        'serial',              // Column B: "serial"
        stateAreaCode,         // Column C: State + Area code
        companyCodeAreaCode,   // Column D: Company code + "1" + Area code
        ...dids.map(did => did.didNumber)  // Column E+: DID numbers
      ];
      csvRows.push(row.join(','));
    });

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dids_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export all functionality
  const handleExportAll = () => {
    // Use all filtered DIDs data
    const allDIDsData = filteredDIDs;
    
    // Group by company, state, and area code
    const companiesByState: { [companyName: string]: { [state: string]: { [areaCode: string]: DIDRecord[] } } } = {};
    
    allDIDsData.forEach(did => {
      const companyName = did.companyName || 'Unknown Company';
      const state = did.state || 'Unknown State';
      const areaCode = did.areaCode || 'Unknown Area';
      
      if (!companiesByState[companyName]) {
        companiesByState[companyName] = {};
      }
      if (!companiesByState[companyName][state]) {
        companiesByState[companyName][state] = {};
      }
      if (!companiesByState[companyName][state][areaCode]) {
        companiesByState[companyName][state][areaCode] = [];
      }
      companiesByState[companyName][state][areaCode].push(did);
    });

    // Generate CSV content
    const csvRows: string[] = [];
    
    Object.entries(companiesByState).forEach(([companyName, stateGroups]) => {
      Object.entries(stateGroups).forEach(([state, areaCodeGroups]) => {
        // First, add the default row for the company
        const firstAreaCodeGroup = Object.values(areaCodeGroups)[0];
        const companyCode = firstAreaCodeGroup?.[0]?.companyId || '';
        const defaultRow = [
          `${companyName} ${state} Default`,  // Column A: Company name + State + "Default"
          'serial',                           // Column B: "serial"  
          `${companyCode}000`                 // Column C: Company code + "000"
          // Column D and on: empty for default row
        ];
        csvRows.push(defaultRow.join(','));
        
        // Then add rows for each area code
        Object.entries(areaCodeGroups).forEach(([areaCode, dids]) => {
          const row = [
            `${companyName} ${state} ${areaCode}`,  // Column A: Company name + State + Area code
            'serial',                               // Column B: "serial"
            `${companyCode}1${areaCode}`,          // Column C: Company code + "1" + Area code
            ...dids.map(did => did.didNumber)      // Column D and on: DID numbers
          ];
          csvRows.push(row.join(','));
        });
      });
    });

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `all_dids_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export DID numbers only functionality
  const handleExportDIDsOnly = () => {
    // Use all filtered DIDs data
    const allDIDsData = filteredDIDs;
    
    // Create CSV content with only DID numbers in column A
    const csvRows: string[] = []; // No header row
    
    allDIDsData.forEach(did => {
      if (did.didNumber) {
        csvRows.push(did.didNumber);
      }
    });

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `did_numbers_only_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Row editing handlers
  const handleRowEdit = (did: DIDRecord) => {
    setEditingRowId(did.id);
    setEditingRowData({ ...did });
  };

  const handleRowSave = async () => {
    if (!editingRowId || !editingRowData) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.DIDS}/${editingRowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRowData),
      });

      if (!response.ok) {
        throw new Error('Failed to update DID');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local data
        const success = updateDIDRecord(editingRowId, editingRowData as Partial<DIDRecord>);
        if (success) {
          setEditingRowId(null);
          setEditingRowData({});
        }
      }
    } catch (error) {
      console.error('Error updating DID:', error);
      alert('Failed to update DID record');
    }
  };

  const handleRowCancel = () => {
    setEditingRowId(null);
    setEditingRowData({});
  };

  const handleEditingFieldChange = (field: string, value: string) => {
    setEditingRowData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total DIDs</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Providers</p>
          <p className="text-2xl font-semibold text-blue-600">{stats.uniqueProviders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total Area Codes</p>
          <p className="text-2xl font-semibold text-green-600">{stats.uniqueAreaCodes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total States</p>
          <p className="text-2xl font-semibold text-purple-600">{stats.uniqueStates}</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search DIDs by number, provider, trank ID, forward, area code, state, company ID, or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add DID
          </button>
          
          <button 
            onClick={() => {
              const event = new CustomEvent('navigate', { detail: { page: 'import-dids' } });
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Import DIDs
          </button>

          <button 
            onClick={handleExportAll}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Export All
          </button>

          <button 
            onClick={handleExportDIDsOnly}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Export DIDs Only
          </button>

          {/* Bulk Actions */}
          {selectedDIDs.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedDIDs.length} selected
              </span>
              <button
                onClick={handleExportSelected}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Export Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedDIDs([])}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DIDs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 min-h-0">
        <div className="overflow-auto h-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedDIDs.length === filteredDIDs.length && filteredDIDs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    Provider
                    <ColumnFilter
                      columnKey="provider"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.provider}
                      isActive={!!(columnFilters.provider && columnFilters.provider.length > 0)}
                    />
                    <ColumnSort
                      columnKey="provider"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    DID#
                    <ColumnFilter
                      columnKey="didNumber"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.didNumber}
                      isActive={!!(columnFilters.didNumber && columnFilters.didNumber.length > 0)}
                    />
                    <ColumnSort
                      columnKey="didNumber"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    Trank ID
                    <ColumnFilter
                      columnKey="trankId"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.trankId}
                      isActive={!!(columnFilters.trankId && columnFilters.trankId.length > 0)}
                    />
                    <ColumnSort
                      columnKey="trankId"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    DID Forward
                    <ColumnFilter
                      columnKey="didForward"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.didForward}
                      isActive={!!(columnFilters.didForward && columnFilters.didForward.length > 0)}
                    />
                    <ColumnSort
                      columnKey="didForward"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    Area Code
                    <ColumnFilter
                      columnKey="areaCode"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.areaCode}
                      isActive={!!(columnFilters.areaCode && columnFilters.areaCode.length > 0)}
                    />
                    <ColumnSort
                      columnKey="areaCode"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    State
                    <ColumnFilter
                      columnKey="state"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.state}
                      isActive={!!(columnFilters.state && columnFilters.state.length > 0)}
                    />
                    <ColumnSort
                      columnKey="state"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    Company ID
                    <ColumnFilter
                      columnKey="companyId"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.companyId || ''}
                      isActive={!!(columnFilters.companyId && columnFilters.companyId.length > 0)}
                    />
                    <ColumnSort
                      columnKey="companyId"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    Company Name
                    <ColumnFilter
                      columnKey="companyName"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.companyName || ''}
                      isActive={!!(columnFilters.companyName && columnFilters.companyName.length > 0)}
                    />
                    <ColumnSort
                      columnKey="companyName"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    DialB Status
                    <ColumnFilter
                      columnKey="dialBStatus"
                      data={didsData}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => getDialBStatus(row.didNumber)}
                      isActive={!!(columnFilters.dialBStatus && columnFilters.dialBStatus.length > 0)}
                    />
                    <ColumnSort
                      columnKey="dialBStatus"
                      currentSort={sortConfig}
                      onSortChange={handleSortChange}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDIDs.map((did) => (
                <tr key={did.id} className={`hover:bg-gray-50 ${editingRowId === did.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedDIDs.includes(did.id)}
                      onChange={() => handleSelectDID(did.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={editingRowId === did.id}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {editingRowId === did.id ? (
                      <select
                        value={editingRowData?.provider || ''}
                        onChange={(e) => handleEditingFieldChange('provider', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      >
                        {providers.map(provider => (
                          <option key={provider} value={provider}>{provider}</option>
                        ))}
                      </select>
                    ) : (
                      <StandaloneInlineEdit
                        value={did.provider}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'provider', value)}
                        type="select"
                        options={providers.map(p => ({ value: p, label: p }))}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {editingRowId === did.id ? (
                      <input
                        type="text"
                        value={editingRowData?.didNumber || ''}
                        onChange={(e) => handleEditingFieldChange('didNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <StandaloneInlineEdit
                        value={did.didNumber}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'didNumber', value)}
                        type="text"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {editingRowId === did.id ? (
                      <input
                        type="text"
                        value={editingRowData?.trankId || ''}
                        onChange={(e) => handleEditingFieldChange('trankId', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <StandaloneInlineEdit
                        value={did.trankId}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'trankId', value)}
                        type="text"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {editingRowId === did.id ? (
                      <input
                        type="text"
                        value={editingRowData?.didForward || ''}
                        onChange={(e) => handleEditingFieldChange('didForward', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <StandaloneInlineEdit
                        value={did.didForward}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'didForward', value)}
                        type="text"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {editingRowId === did.id ? (
                      <input
                        type="text"
                        value={editingRowData?.areaCode || ''}
                        onChange={(e) => handleEditingFieldChange('areaCode', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <StandaloneInlineEdit
                        value={did.areaCode}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'areaCode', value)}
                        type="text"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {editingRowId === did.id ? (
                      <select
                        value={editingRowData?.state || ''}
                        onChange={(e) => handleEditingFieldChange('state', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      >
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    ) : (
                      <StandaloneInlineEdit
                        value={did.state}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'state', value)}
                        type="select"
                        options={states.map(s => ({ value: s, label: s }))}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {editingRowId === did.id ? (
                      <input
                        type="text"
                        value={editingRowData?.companyId || ''}
                        onChange={(e) => handleEditingFieldChange('companyId', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <StandaloneInlineEdit
                        value={did.companyId}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'companyId', value)}
                        type="text"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {editingRowId === did.id ? (
                      <input
                        type="text"
                        value={editingRowData?.companyName || ''}
                        onChange={(e) => handleEditingFieldChange('companyName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <StandaloneInlineEdit
                        value={did.companyName}
                        onSave={(value: string) => handleInlineEditSave(did.id, 'companyName', value)}
                        type="text"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {(() => {
                      const status = getDialBStatus(did.didNumber);
                      if (status === 'Clean') {
                        return (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Clean
                          </span>
                        );
                      } else if (status === 'Spam') {
                        return (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            Spam
                          </span>
                        );
                      } else {
                        return (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            Unknown
                          </span>
                        );
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    {editingRowId === did.id ? (
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={handleRowSave}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Save changes"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={handleRowCancel}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Cancel editing"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleRowEdit(did)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit row"
                          disabled={editingRowId !== null}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(did)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete row"
                          disabled={editingRowId !== null}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDIDs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No DIDs found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add DID Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New DID</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={formData.provider || ''}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DID Number</label>
                <input
                  type="text"
                  value={formData.didNumber || ''}
                  onChange={(e) => handleDIDNumberChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (XXX) XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trank ID</label>
                <input
                  type="text"
                  value={formData.trankId || ''}
                  onChange={(e) => setFormData({...formData, trankId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="TRK-XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DID Forward</label>
                <input
                  type="text"
                  value={formData.didForward || ''}
                  onChange={(e) => setFormData({...formData, didForward: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (XXX) XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Code</label>
                <input
                  type="text"
                  value={formData.areaCode || ''}
                  onChange={(e) => setFormData({...formData, areaCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={formData.state || ''}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
                <input
                  type="text"
                  value={formData.companyId || ''}
                  onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="COMP-XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'pending'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Add DID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit DID Modal */}
      {showEditModal && selectedDID && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit DID</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={formData.provider || ''}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DID Number</label>
                <input
                  type="text"
                  value={formData.didNumber || ''}
                  onChange={(e) => handleDIDNumberChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (XXX) XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trank ID</label>
                <input
                  type="text"
                  value={formData.trankId || ''}
                  onChange={(e) => setFormData({...formData, trankId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="TRK-XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DID Forward</label>
                <input
                  type="text"
                  value={formData.didForward || ''}
                  onChange={(e) => setFormData({...formData, didForward: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (XXX) XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Code</label>
                <input
                  type="text"
                  value={formData.areaCode || ''}
                  onChange={(e) => setFormData({...formData, areaCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={formData.state || ''}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
                <input
                  type="text"
                  value={formData.companyId || ''}
                  onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="COMP-XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'pending'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDID(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Update DID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDID && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete DID "{selectedDID.didNumber}"? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDID(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirm Bulk Delete</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {selectedDIDs.length} selected DID{selectedDIDs.length > 1 ? 's' : ''}? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete {selectedDIDs.length} DID{selectedDIDs.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DIDs;