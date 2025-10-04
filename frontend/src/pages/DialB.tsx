import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PhoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

import {
  DialBRecord,
  getAllDialBRecords,
  deleteDialBRecord,
  deleteMultipleDialBRecords,
  importDialBFromCSV,
  exportDialBToCSV,
  getDialBStatistics,
} from '../data/dialBData';

const DialB: React.FC = () => {
  const [dialBData, setDialBData] = useState<DialBRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Clean' | 'Spam'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [carrierFilter, setCarrierFilter] = useState<'all' | 'tmobile' | 'att' | 'thirdparty'>('all');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(() => {
    const data = getAllDialBRecords();
    setDialBData(data);
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get statistics
  const statistics = useMemo(() => getDialBStatistics(), []);

  // Get unique groups for filter
  const uniqueGroups = useMemo(() => {
    const groups = dialBData.reduce((acc: string[], record) => {
      if (!acc.includes(record.group)) {
        acc.push(record.group);
      }
      return acc;
    }, []);
    return groups.sort();
  }, [dialBData]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return dialBData.filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.group.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || record.overallStatus === statusFilter;
      const matchesGroup = groupFilter === 'all' || record.group === groupFilter;
      
      let matchesCarrier = true;
      if (carrierFilter === 'tmobile') matchesCarrier = record.tMobileFlag;
      if (carrierFilter === 'att') matchesCarrier = record.attFlag;
      if (carrierFilter === 'thirdparty') matchesCarrier = record.thirdPartyFlag;
      
      return matchesSearch && matchesStatus && matchesGroup && matchesCarrier;
    });
  }, [dialBData, searchTerm, statusFilter, groupFilter, carrierFilter]);

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const text = await file.text();
      const result = importDialBFromCSV(text);
      
      if (result.success) {
        setImportMessage({
          type: 'success',
          message: `Successfully imported ${result.imported} records${result.errors.length > 0 ? ` with ${result.errors.length} warnings` : ''}`
        });
        loadData();
      } else {
        setImportMessage({
          type: 'error',
          message: `Import failed: ${result.errors.join(', ')}`
        });
      }
    } catch (error) {
      setImportMessage({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle CSV export
  const handleExport = () => {
    const csvContent = exportDialBToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dialb_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle record selection
  const handleSelectRecord = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRecords.size === filteredData.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredData.map(record => record.id)));
    }
  };

  // Handle delete selected
  const handleDeleteSelected = () => {
    if (selectedRecords.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedRecords.size} selected records?`)) {
      const deletedCount = deleteMultipleDialBRecords(Array.from(selectedRecords));
      setSelectedRecords(new Set());
      loadData();
      alert(`Deleted ${deletedCount} records successfully.`);
    }
  };

  // Handle single delete
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteDialBRecord(id);
      loadData();
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned;
  };

  // Get status badge component
  const StatusBadge: React.FC<{ status: 'Clean' | 'Spam' }> = ({ status }) => (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        status === 'Clean'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {status === 'Clean' ? (
        <CheckCircleIcon className="w-3 h-3 mr-1" />
      ) : (
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
      )}
      {status}
    </span>
  );

  // Get carrier flags display
  const CarrierFlags: React.FC<{ record: DialBRecord }> = ({ record }) => (
    <div className="flex space-x-1">
      {record.tMobileFlag && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
          T-Mobile
        </span>
      )}
      {record.attFlag && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          AT&T
        </span>
      )}
      {record.thirdPartyFlag && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
          3rd Party
        </span>
      )}
      {!record.tMobileFlag && !record.attFlag && !record.thirdPartyFlag && (
        <span className="text-xs text-gray-500">No flags</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DialB - Spam Management</h1>
          <p className="text-gray-600">Manage phone number spam/clean status with carrier-specific flagging</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <PhoneIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clean Numbers</p>
              <p className="text-2xl font-bold text-green-600">{statistics.clean.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Spam Numbers</p>
              <p className="text-2xl font-bold text-red-600">{statistics.spam.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Carrier Flags</p>
              <p className="text-sm text-gray-500">
                T-M: {statistics.tMobileFlagged} | AT&T: {statistics.attFlagged} | 3rd: {statistics.thirdPartyFlagged}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Message */}
      {importMessage && (
        <div className={`p-4 rounded-lg ${
          importMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {importMessage.message}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search phone numbers or groups..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Clean' | 'Spam')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Clean">Clean</option>
            <option value="Spam">Spam</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Groups</option>
            {uniqueGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value as 'all' | 'tmobile' | 'att' | 'thirdparty')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Carriers</option>
            <option value="tmobile">T-Mobile Flagged</option>
            <option value="att">AT&T Flagged</option>
            <option value="thirdparty">3rd Party Flagged</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="hidden"
              disabled={isImporting}
            />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export CSV
          </button>

          {selectedRecords.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete Selected ({selectedRecords.size})
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && selectedRecords.size === filteredData.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carrier Flags
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No records found. {dialBData.length === 0 ? 'Import a CSV file to get started.' : 'Try adjusting your search or filters.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRecords.has(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {formatPhoneNumber(record.phoneNumber)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {record.group}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={record.overallStatus} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CarrierFlags record={record} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {new Date(record.lastChecked).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete record"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredData.length} of {dialBData.length} records
        {selectedRecords.size > 0 && ` (${selectedRecords.size} selected)`}
      </div>
    </div>
  );
};

export default DialB;