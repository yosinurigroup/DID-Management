import React, { useState, useEffect } from 'react';
import { companiesData, Company, addCompany, updateCompany, deleteCompany } from '../data/companiesData';
import ColumnFilter from '../components/ColumnFilter';
import ColumnSort, { SortDirection } from '../components/ColumnSort';
import { StandaloneInlineEdit } from '../components/InlineEdit';
import { API_ENDPOINTS } from '../config/api';

const Companies: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState({
    companyId: '',
    companyName: '',
    description: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Selection state for bulk actions
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: SortDirection }>({
    column: '',
    direction: 'none'
  });

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

  // Load companies data
  useEffect(() => {
    console.log('Loading companies data...', companiesData);
    if (companiesData && Array.isArray(companiesData)) {
      setCompanies(companiesData);
      console.log('Loaded companies:', companiesData.length);
    } else {
      console.error('Failed to load companies data');
    }
  }, [refreshKey]);

  // Listen for company data updates
  useEffect(() => {
    const handleCompaniesUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('companiesDataUpdated', handleCompaniesUpdate);
    return () => {
      window.removeEventListener('companiesDataUpdated', handleCompaniesUpdate);
    };
  }, []);

  const handleAddCompany = () => {
    if (newCompany.companyId && newCompany.companyName && newCompany.description) {
      // Check if company ID already exists
      const existingCompany = companies.find(company => company.companyId === newCompany.companyId);
      
      if (existingCompany) {
        setErrorMessage('This Company ID already exists');
        return;
      }
      
      // Clear any previous error message
      setErrorMessage('');
      
      addCompany({
        companyId: newCompany.companyId,
        companyName: newCompany.companyName,
        description: newCompany.description,
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      });
      
      setNewCompany({ companyId: '', companyName: '', description: '' });
      setShowAddModal(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setNewCompany({
      companyId: company.companyId,
      companyName: company.companyName,
      description: company.description
    });
    setShowEditModal(true);
    setErrorMessage('');
  };

  const handleUpdateCompany = () => {
    if (newCompany.companyId && newCompany.companyName && newCompany.description && editingCompany) {
      // Check if company ID already exists (excluding the current one being edited)
      const existingCompany = companies.find(company => 
        company.companyId === newCompany.companyId && company.id !== editingCompany.id
      );
      
      if (existingCompany) {
        setErrorMessage('This Company ID already exists');
        return;
      }
      
      // Clear any previous error message
      setErrorMessage('');
      
      updateCompany(editingCompany.id, {
        companyId: newCompany.companyId,
        companyName: newCompany.companyName,
        description: newCompany.description
      });
      
      setNewCompany({ companyId: '', companyName: '', description: '' });
      setShowEditModal(false);
      setEditingCompany(null);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteCompany(companyId);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewCompany({ companyId: '', companyName: '', description: '' });
    setErrorMessage('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCompany(null);
    setNewCompany({ companyId: '', companyName: '', description: '' });
    setErrorMessage('');
  };

  // Handle inline edit save
  const handleInlineEditSave = async (companyId: string, field: string, value: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANIES}/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update company');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the local data using the utility function
        updateCompany(companyId, { [field]: value } as Partial<Company>);
        setRefreshKey(prev => prev + 1);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating company:', error);
      return false;
    }
  };

  // Bulk selection handlers
  const handleSelectAllCompanies = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map(company => company.id));
    }
  };

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  const handleBulkDeleteCompanies = () => {
    if (selectedCompanies.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDeleteCompanies = () => {
    selectedCompanies.forEach(companyId => {
      deleteCompany(companyId);
    });
    setSelectedCompanies([]);
    setShowBulkDeleteModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      company.companyId.toLowerCase().includes(searchLower) ||
      company.companyName.toLowerCase().includes(searchLower) ||
      company.description.toLowerCase().includes(searchLower)
    );
    
    // Column filters
    const matchesColumnFilters = Object.entries(columnFilters).every(([columnKey, selectedValues]) => {
      // If no filter values or empty array, don't filter (show all)
      if (!selectedValues || selectedValues.length === 0) return true;
      
      let cellValue = '';
      switch (columnKey) {
        case 'companyId':
          cellValue = company.companyId;
          break;
        case 'companyName':
          cellValue = company.companyName;
          break;
        case 'description':
          cellValue = company.description;
          break;
        default:
          return true;
      }
      
      return selectedValues.includes(cellValue);
    });
    
    return matchesSearch && matchesColumnFilters;
  }).sort((a, b) => {
    // Apply sorting
    if (sortConfig.direction !== 'none' && sortConfig.column) {
      let aValue = '';
      let bValue = '';

      switch (sortConfig.column) {
        case 'companyId':
          aValue = a.companyId;
          bValue = b.companyId;
          break;
        case 'companyName':
          aValue = a.companyName;
          bValue = b.companyName;
          break;
        case 'description':
          aValue = a.description;
          bValue = b.description;
          break;
        default:
          return 0;
      }

      const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search by company ID, name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Company
          </button>

          {/* Bulk Actions */}
          {selectedCompanies.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedCompanies.length} selected
              </span>
              <button
                onClick={handleBulkDeleteCompanies}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedCompanies([])}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Companies Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{filteredCompanies.length}</p>
            <p className="text-sm text-gray-500">Total Companies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{companies.length}</p>
            <p className="text-sm text-gray-500">All Companies</p>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 text-center">Companies</h3>
        </div>
        <div className="overflow-x-auto h-96 overflow-y-auto" style={{ height: 'calc(100vh - 400px)' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                    onChange={handleSelectAllCompanies}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    Company ID
                    <ColumnFilter
                      columnKey="companyId"
                      data={companies}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.companyId}
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
                      data={companies}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.companyName}
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
                    Description
                    <ColumnFilter
                      columnKey="description"
                      data={companies}
                      activeFilters={columnFilters}
                      onFilterChange={handleColumnFilterChange}
                      getValueFromRow={(row) => row.description}
                      isActive={!!(columnFilters.description && columnFilters.description.length > 0)}
                    />
                    <ColumnSort
                      columnKey="description"
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
              {filteredCompanies.map((company) => (
                <tr key={`${company.id}-${refreshKey}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.includes(company.id)}
                      onChange={() => handleSelectCompany(company.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    <StandaloneInlineEdit
                      value={company.companyId}
                      onSave={(value: string) => handleInlineEditSave(company.id, 'companyId', value)}
                      type="text"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <StandaloneInlineEdit
                      value={company.companyName}
                      onSave={(value: string) => handleInlineEditSave(company.id, 'companyName', value)}
                      type="text"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center max-w-xs">
                    <StandaloneInlineEdit
                      value={company.description}
                      onSave={(value: string) => handleInlineEditSave(company.id, 'description', value)}
                      type="textarea"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <button 
                      onClick={() => handleEditCompany(company)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCompany(company.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No companies found.</p>
            <p className="text-sm text-gray-400">Add companies to get started.</p>
          </div>
        )}
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Company</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company ID
                  </label>
                  <input
                    type="text"
                    value={newCompany.companyId}
                    onChange={(e) => {
                      setNewCompany({ ...newCompany, companyId: e.target.value });
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="e.g., COMP001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCompany.companyName}
                    onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    placeholder="e.g., Leading technology solutions provider"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Error Message */}
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCompany}
                  disabled={!newCompany.companyId || !newCompany.companyName || !newCompany.description}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && editingCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Company</h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company ID
                  </label>
                  <input
                    type="text"
                    value={newCompany.companyId}
                    onChange={(e) => {
                      setNewCompany({ ...newCompany, companyId: e.target.value });
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="e.g., COMP001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCompany.companyName}
                    onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    placeholder="e.g., Leading technology solutions provider"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Error Message */}
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCompany}
                  disabled={!newCompany.companyId || !newCompany.companyName || !newCompany.description}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Company
                </button>
              </div>
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
                Are you sure you want to delete {selectedCompanies.length} selected compan{selectedCompanies.length > 1 ? 'ies' : 'y'}? This action cannot be undone.
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
                onClick={confirmBulkDeleteCompanies}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete {selectedCompanies.length} Compan{selectedCompanies.length > 1 ? 'ies' : 'y'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;