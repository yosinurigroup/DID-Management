import React, { useState, useCallback } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { 
  DIDRecord, 
  getUniqueProviders, 
  addImportedDIDs, 
  ImportResult,
  cleanPhoneNumber,
  extractAreaCode,
  getStateFromAreaCode
} from '../data/didsData';
import { companiesData, Company, addCompany } from '../data/companiesData';

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  [dbField: string]: string; // dbField -> csvColumn
}

const ImportDIDs: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showNewProviderInput, setShowNewProviderInput] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [currentStep, setCurrentStep] = useState<'upload' | 'provider' | 'mapping' | 'preview' | 'results'>('upload');
  const [previewData, setPreviewData] = useState<Partial<DIDRecord>[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [importResults, setImportResults] = useState<ImportResult | null>(null);

  const existingProviders = getUniqueProviders();
  const existingCompanies = companiesData;
  
  const databaseFields = [
    { key: 'provider', label: 'Provider', autoFilled: true },
    { key: 'didNumber', label: 'DID#', required: true },
    { key: 'trankId', label: 'Trank ID', required: true },
    { key: 'didForward', label: 'DID Forward', required: true },
  ];

  // Clean CSV data by removing non-data rows and finding header
  const cleanCSVData = (rawData: string[][]): { headers: string[], data: CSVRow[] } => {
    let headerRowIndex = -1;
    
    // More sophisticated header detection
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }
      
      // Check if this row looks like a header row
      const hasTextColumns = row.filter(cell => cell && cell.trim()).length >= 3;
      const hasVariedContent = row.some(cell => cell && isNaN(Number(cell.trim())));
      const hasReasonableLength = row.length >= 4;
      
      // Look for common header patterns
      const headerPatterns = [
        'did', 'trunk', 'trank', 'phone', 'number', 'forward', 'destination',
        'type', 'primary', 'secondary', 'status', 'active', 'company', 'client'
      ];
      
      const hasHeaderKeywords = row.some(cell => 
        cell && headerPatterns.some(pattern => 
          cell.toLowerCase().includes(pattern.toLowerCase())
        )
      );
      
      // Additional check: avoid rows that are clearly titles or metadata
      const isTitle = row.length === 1 || 
                     row.some(cell => cell && (
                       cell.toLowerCase().includes('provider') ||
                       cell.toLowerCase().includes('customer') ||
                       cell.toLowerCase().includes('report') ||
                       cell.toLowerCase().includes('data as of')
                     ));
      
      if (hasTextColumns && hasVariedContent && hasReasonableLength && 
          (hasHeaderKeywords || i >= 2) && !isTitle) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not identify header row in CSV file. Please ensure your CSV has proper column headers.');
    }
    
    // Clean and normalize headers
    const headers = rawData[headerRowIndex]
      .map(h => h ? h.trim() : '')
      .filter(h => h !== '');
    
    if (headers.length < 3) {
      throw new Error('CSV file must have at least 3 columns with headers.');
    }
    
    // Extract data rows (skip header and any rows above it)
    const dataRows = rawData.slice(headerRowIndex + 1)
      .filter(row => {
        // Skip empty rows
        if (!row || row.length === 0) return false;
        
        // Skip rows where all cells are empty or just whitespace
        const hasContent = row.some(cell => cell && cell.trim() !== '');
        if (!hasContent) return false;
        
        // Skip rows that look like footers or summaries
        const firstCell = row[0] ? row[0].trim().toLowerCase() : '';
        if (firstCell.includes('total') || firstCell.includes('summary') || 
            firstCell.includes('count') || firstCell.includes('end of')) {
          return false;
        }
        
        return true;
      })
      .map(row => {
        const obj: CSVRow = {};
        headers.forEach((header, index) => {
          const cellValue = row[index] ? row[index].trim() : '';
          obj[header] = cellValue;
        });
        return obj;
      })
      .filter(row => {
        // Final filter: ensure the row has meaningful data
        return Object.values(row).some(value => value && value.trim() !== '');
      });
    
    if (dataRows.length === 0) {
      throw new Error('No valid data rows found in CSV file.');
    }
    
    return { headers, data: dataRows };
  };

  // Parse CSV file
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
        currentRow.push(currentCell);
        if (currentRow.some(cell => cell.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    // Add last row if exists
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      if (currentRow.some(cell => cell.trim())) {
        rows.push(currentRow);
      }
    }
    
    return rows;
  };

  // Auto-map columns based on similarity
  const autoMapColumns = useCallback((headers: string[]) => {
    const mapping: ColumnMapping = {};
    
    const mappingRules = [
      { 
        dbField: 'didNumber', 
        patterns: ['did', 'phone', 'number', 'telephone', 'tn', 'dn'] 
      },
      { 
        dbField: 'trankId', 
        patterns: ['trunk', 'trank', 'trunk id', 'trank id', 'primary trunk', 'primary', 'secondary trunk'] 
      },
      { 
        dbField: 'didForward', 
        patterns: ['forward', 'forwarding', 'destination', 'target', 'pstn forward', 'pstn backup', 'confirmation to call'] 
      },
    ];
    
    mappingRules.forEach(({ dbField, patterns }) => {
      const matchedHeader = headers.find(header => 
        patterns.some(pattern => {
          const headerLower = header.toLowerCase();
          const patternLower = pattern.toLowerCase();
          return headerLower.includes(patternLower) || patternLower.includes(headerLower);
        })
      );
      if (matchedHeader) {
        mapping[dbField] = matchedHeader;
      }
    });
    
    return mapping;
  }, []);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError('');
    
    try {
      const text = await file.text();
      const rawData = parseCSV(text);
      const { headers, data } = cleanCSVData(rawData);
      
      setCsvHeaders(headers);
      setCsvData(data);
      setUploadedFile(file);
      setColumnMapping(autoMapColumns(headers));
      setCurrentStep('provider');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Handle provider selection
  const handleProviderSelect = (provider: string) => {
    if (provider === 'new') {
      setShowNewProviderInput(true);
      setSelectedProvider('');
    } else {
      setShowNewProviderInput(false);
      setSelectedProvider(provider);
    }
  };

  const handleProviderContinue = () => {
    const provider = showNewProviderInput ? newProviderName : selectedProvider;
    if (provider.trim()) {
      setCurrentStep('mapping');
    }
  };

  // Handle company selection
  const handleCompanySelect = (company: string) => {
    if (company === 'new') {
      setShowNewCompanyInput(true);
      setSelectedCompany('');
    } else {
      setShowNewCompanyInput(false);
      setSelectedCompany(company);
    }
  };

  // Extract area code from DID number
  // Generate preview data
  const generatePreview = () => {
    const provider = showNewProviderInput ? newProviderName : selectedProvider;
    
    // Get company information
    let companyInfo = { companyId: '', companyName: '' };
    if (selectedCompany) {
      const company = existingCompanies.find(c => c.id === selectedCompany);
      if (company) {
        companyInfo = {
          companyId: company.companyId,
          companyName: company.companyName
        };
      }
    } else if (showNewCompanyInput && newCompanyName.trim()) {
      // Generate company ID for new company
      const newCompanyId = `COMP-${Date.now()}`;
      companyInfo = {
        companyId: newCompanyId,
        companyName: newCompanyName.trim()
      };
    }
    
    const preview = csvData.slice(0, 5).map((row, index) => {
      const mappedRow: Partial<DIDRecord> = {
        id: `preview-${index}`,
        provider: provider,
        status: 'active',
        assignedDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        companyId: companyInfo.companyId,
        companyName: companyInfo.companyName,
      };

      // Map each field
      Object.entries(columnMapping).forEach(([dbField, csvColumn]) => {
        if (csvColumn && row[csvColumn]) {
          let value = row[csvColumn];
          
          // Clean phone numbers for didForward field
          if (dbField === 'didForward') {
            value = cleanPhoneNumber(value);
          }
          
          (mappedRow as any)[dbField] = value;
        }
      });

      // Auto-generate area code and state if DID# is mapped
      if (mappedRow.didNumber) {
        mappedRow.areaCode = extractAreaCode(mappedRow.didNumber);
        mappedRow.state = getStateFromAreaCode(mappedRow.areaCode);
      }

      return mappedRow;
    });
    
    setPreviewData(preview);
    setCurrentStep('preview');
  };

  // Handle import
  const handleImport = () => {
    const provider = showNewProviderInput ? newProviderName : selectedProvider;
    
    // Get company information
    let companyInfo = { companyId: '', companyName: '' };
    if (selectedCompany) {
      const company = existingCompanies.find(c => c.id === selectedCompany);
      if (company) {
        companyInfo = {
          companyId: company.companyId,
          companyName: company.companyName
        };
      }
    } else if (showNewCompanyInput && newCompanyName.trim()) {
      // Generate company ID for new company
      const newCompanyId = `COMP-${Date.now()}`;
      companyInfo = {
        companyId: newCompanyId,
        companyName: newCompanyName.trim()
      };
      
      // Add the new company to the companies data
      addCompany({
        companyId: newCompanyId,
        companyName: newCompanyName.trim(),
        description: `Company created during DID import - ${new Date().toLocaleDateString()}`,
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }
    
    // Transform CSV data to DID records
    const newRecords: DIDRecord[] = csvData.map((row, index) => {
      const baseRecord: DIDRecord = {
        id: `imported-${Date.now()}-${index}`,
        provider: provider,
        didNumber: '',
        trankId: '',
        didForward: '',
        areaCode: '',
        state: '',
        companyId: companyInfo.companyId,
        companyName: companyInfo.companyName,
        status: 'active',
        assignedDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      // Map the fields based on column mapping
      Object.entries(columnMapping).forEach(([dbField, csvColumn]) => {
        if (csvColumn && row[csvColumn]) {
          let value = row[csvColumn];
          
          // Clean phone numbers for didForward field
          if (dbField === 'didForward') {
            value = cleanPhoneNumber(value);
          }
          
          (baseRecord as any)[dbField] = value;
        }
      });

      // Auto-generate area code and state from DID number
      if (baseRecord.didNumber) {
        baseRecord.areaCode = extractAreaCode(baseRecord.didNumber);
        baseRecord.state = getStateFromAreaCode(baseRecord.areaCode);
      }

      return baseRecord;
    });

    // Add records to the DIDs data and get import results
    const results = addImportedDIDs(newRecords);
    setImportResults(results);
    setCurrentStep('results');
    
    console.log('Import completed:', results);
  };

  const resetImport = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setSelectedProvider('');
    setShowNewProviderInput(false);
    setNewProviderName('');
    setSelectedCompany('');
    setShowNewCompanyInput(false);
    setNewCompanyName('');
    setColumnMapping({});
    setPreviewData([]);
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Import DIDs from CSV</h1>
        {currentStep !== 'upload' && (
          <button
            onClick={resetImport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Start Over
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 py-4">
        {[
          { key: 'upload', label: 'Upload File' },
          { key: 'provider', label: 'Provider & Company' },
          { key: 'mapping', label: 'Map Columns' },
          { key: 'preview', label: 'Preview & Import' },
          { key: 'results', label: 'Import Results' }
        ].map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step.key 
                ? 'bg-blue-600 text-white' 
                : index < ['upload', 'provider', 'mapping', 'preview', 'results'].indexOf(currentStep)
                ? 'bg-green-600 text-white'
                : 'bg-gray-300 text-gray-700'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-3 text-sm font-medium ${
              currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {index < 4 && <div className="w-12 h-0.5 bg-gray-300 ml-6" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: File Upload */}
      {currentStep === 'upload' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Step 1: Upload CSV File</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isProcessing ? (
              <div className="space-y-2">
                <div className="animate-spin mx-auto h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
                <p className="text-sm text-gray-600">Processing CSV file...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Drop your CSV file here or</p>
                  <label className="cursor-pointer text-blue-600 hover:text-blue-500">
                    browse to upload
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-sm font-medium text-green-800">
                  File uploaded: {uploadedFile.name}
                </span>
                <span className="ml-2 text-sm text-green-600">
                  ({csvData.length} rows found)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Provider Selection */}
      {currentStep === 'provider' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Step 2: Select Provider & Company</h2>
          <p className="text-sm text-gray-600 mb-4">Which provider and company is this data for?</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={showNewProviderInput ? 'new' : selectedProvider}
                onChange={(e) => handleProviderSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a provider...</option>
                {existingProviders.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
                <option value="new">+ Add New Provider</option>
              </select>
            </div>

            {showNewProviderInput && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Provider Name</label>
                <input
                  type="text"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter provider name"
                />
              </div>
            )}

            {/* Company Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
              <select
                value={showNewCompanyInput ? 'new' : selectedCompany}
                onChange={(e) => handleCompanySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a company...</option>
                {existingCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.companyName} ({company.companyId})
                  </option>
                ))}
                <option value="new">+ Add New Company</option>
              </select>
            </div>

            {showNewCompanyInput && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Company Name</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleProviderContinue}
                disabled={!selectedProvider && !newProviderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue to Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {currentStep === 'mapping' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 text-center">Step 3: Map Columns</h2>
          <p className="text-sm text-gray-600 mb-8 text-center">
            Map the columns from your CSV file to the corresponding database fields.
          </p>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {databaseFields.map(field => (
                <div key={field.key} className="grid grid-cols-2 gap-8 items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="font-medium text-gray-900 text-lg">{field.label}</span>
                    {field.required && <span className="text-red-500 text-lg">*</span>}
                    {field.autoFilled && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Auto-filled</span>
                    )}
                  </div>
                  
                  <div>
                    {field.autoFilled ? (
                      <input
                        type="text"
                        value={field.key === 'provider' 
                          ? (showNewProviderInput ? newProviderName : selectedProvider)
                          : 'Auto-generated from DID#'
                        }
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-center"
                      />
                    ) : (
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => setColumnMapping(prev => ({
                          ...prev,
                          [field.key]: e.target.value
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      >
                        <option value="">Select CSV column...</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={generatePreview}
                disabled={!columnMapping.didNumber || !columnMapping.trankId || !columnMapping.didForward}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
              >
                Preview Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Preview and Import */}
      {currentStep === 'preview' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 text-center">Step 4: Preview & Import</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Review the mapped data below. This shows the first 5 rows of your import.
          </p>
          
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">DID#</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trank ID</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">DID Forward</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.provider}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.didNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.trankId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.didForward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-8 text-center">
            <div className="flex justify-center">
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Import Summary</h3>
                <p className="text-blue-700">
                  Ready to import <span className="font-semibold">{csvData.length}</span> DID records for provider: <span className="font-semibold">{showNewProviderInput ? newProviderName : selectedProvider}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-6">
            <button
              onClick={() => setCurrentStep('mapping')}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-lg"
            >
              Import {csvData.length} Records
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Import Results */}
      {currentStep === 'results' && importResults && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Step 5: Import Results</h2>
            <p className="text-sm text-gray-600">
              Import completed! Here's a summary of the results.
            </p>
          </div>

          {/* Results Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Processed */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{importResults.totalProcessed}</div>
              <div className="text-sm font-medium text-blue-800">Total Processed</div>
            </div>

            {/* Successful Imports */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{importResults.successCount}</div>
              <div className="text-sm font-medium text-green-800">Successfully Imported</div>
            </div>

            {/* Duplicates */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{importResults.duplicateCount}</div>
              <div className="text-sm font-medium text-yellow-800">Duplicates Skipped</div>
            </div>
          </div>

          {/* Detailed Results */}
          {importResults.duplicateCount > 0 && (
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4 text-center">Duplicate DID Numbers Found</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-sm text-yellow-800 mb-3 text-center">
                  The following DID numbers already exist and were not imported:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {importResults.duplicates.map((duplicate, index) => (
                    <div key={index} className="bg-white px-3 py-2 rounded border text-sm text-center">
                      {duplicate.didNumber}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {importResults.successCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">Import Successful!</h3>
              <p className="text-green-700">
                {importResults.successCount} DID records have been successfully added to your database.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => {
                // Reset form for new import
                setUploadedFile(null);
                setCsvData([]);
                setCsvHeaders([]);
                setSelectedProvider('');
                setNewProviderName('');
                setColumnMapping({});
                setPreviewData([]);
                setImportResults(null);
                setCurrentStep('upload');
                setError('');
              }}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Import Another File
            </button>
            <button
              onClick={() => {
                // Navigate to DIDs page to view imported data
                const event = new CustomEvent('navigate', { detail: { page: 'dids' } });
                window.dispatchEvent(event);
              }}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              View DIDs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportDIDs;