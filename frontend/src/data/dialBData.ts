// DialB Data Management
// Handles spam/clean status for phone numbers with carrier-specific flagging

import defaultDialBDataJson from './defaultDialBData.json';

export interface DialBRecord {
  id: string;
  phoneNumber: string;
  group: string;
  overallStatus: 'Clean' | 'Spam';
  tMobileFlag: boolean;
  attFlag: boolean;
  thirdPartyFlag: boolean;
  lastChecked: string;
  createdAt: string;
  updatedAt: string;
}

// Default DialB data loaded from JSON
const defaultDialBData: DialBRecord[] = defaultDialBDataJson as DialBRecord[];

// Load DialB data from localStorage
export const loadDialBData = (): DialBRecord[] => {
  try {
    const saved = localStorage.getItem('dialBData');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : defaultDialBData;
    }
    return defaultDialBData;
  } catch (error) {
    console.error('Error loading DialB data:', error);
    return defaultDialBData;
  }
};

// Save DialB data to localStorage
export const saveDialBData = (data: DialBRecord[]): void => {
  try {
    localStorage.setItem('dialBData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving DialB data:', error);
  }
};

// Get all DialB records
export const getAllDialBRecords = (): DialBRecord[] => {
  return loadDialBData();
};

// Add new DialB record
export const addDialBRecord = (record: Omit<DialBRecord, 'id' | 'createdAt' | 'updatedAt'>): DialBRecord => {
  const dialBData = loadDialBData();
  const newRecord: DialBRecord = {
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const updatedData = [...dialBData, newRecord];
  saveDialBData(updatedData);
  return newRecord;
};

// Update DialB record
export const updateDialBRecord = (id: string, updates: Partial<Omit<DialBRecord, 'id' | 'createdAt'>>): DialBRecord | null => {
  const dialBData = loadDialBData();
  const index = dialBData.findIndex(record => record.id === id);
  
  if (index === -1) return null;
  
  const updatedRecord = {
    ...dialBData[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  dialBData[index] = updatedRecord;
  saveDialBData(dialBData);
  return updatedRecord;
};

// Delete DialB record
export const deleteDialBRecord = (id: string): boolean => {
  const dialBData = loadDialBData();
  const filteredData = dialBData.filter(record => record.id !== id);
  
  if (filteredData.length === dialBData.length) {
    return false; // Record not found
  }
  
  saveDialBData(filteredData);
  return true;
};

// Delete multiple DialB records
export const deleteMultipleDialBRecords = (ids: string[]): number => {
  const dialBData = loadDialBData();
  const initialLength = dialBData.length;
  const filteredData = dialBData.filter(record => !ids.includes(record.id));
  
  saveDialBData(filteredData);
  return initialLength - filteredData.length;
};

// Get DialB record by phone number
export const getDialBRecordByPhone = (phoneNumber: string): DialBRecord | null => {
  const dialBData = loadDialBData();
  return dialBData.find(record => record.phoneNumber === phoneNumber) || null;
};

// Import DialB data from CSV
export const importDialBFromCSV = (csvData: string): { success: boolean; imported: number; errors: string[] } => {
  const dialBData = loadDialBData();
  const errors: string[] = [];
  let imported = 0;
  
  try {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    // Expected headers: Phone Number,Group,Overall Status,T-Mobile,AT&T,3rd Party,Last Checked
    const expectedHeaders = ['Phone Number', 'Group', 'Overall Status', 'T-Mobile', 'AT&T', '3rd Party', 'Last Checked'];
    const headerMismatch = expectedHeaders.some(expected => !headers.includes(expected));
    
    if (headerMismatch) {
      errors.push('CSV headers do not match expected format. Expected: ' + expectedHeaders.join(', '));
      return { success: false, imported: 0, errors };
    }
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length < expectedHeaders.length) {
          errors.push(`Line ${i + 1}: Insufficient data columns`);
          continue;
        }
        
        const phoneNumber = values[0];
        const group = values[1];
        const overallStatus = values[2] as 'Clean' | 'Spam';
        const tMobileFlag = values[3].toLowerCase() === 'true';
        const attFlag = values[4].toLowerCase() === 'true';
        const thirdPartyFlag = values[5].toLowerCase() === 'true';
        const lastChecked = values[6];
        
        // Check for duplicates
        const existing = dialBData.find(record => record.phoneNumber === phoneNumber);
        if (existing) {
          // Update existing record
          const index = dialBData.findIndex(record => record.id === existing.id);
          dialBData[index] = {
            ...existing,
            group,
            overallStatus,
            tMobileFlag,
            attFlag,
            thirdPartyFlag,
            lastChecked,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Add new record
          const newRecord: DialBRecord = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            phoneNumber,
            group,
            overallStatus,
            tMobileFlag,
            attFlag,
            thirdPartyFlag,
            lastChecked,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          dialBData.push(newRecord);
        }
        
        imported++;
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }
    
    saveDialBData(dialBData);
    return { success: true, imported, errors };
    
  } catch (error) {
    errors.push(`CSV parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, imported: 0, errors };
  }
};

// Export DialB data to CSV
export const exportDialBToCSV = (): string => {
  const dialBData = loadDialBData();
  const headers = ['Phone Number', 'Group', 'Overall Status', 'T-Mobile', 'AT&T', '3rd Party', 'Last Checked'];
  
  const csvContent = [
    headers.join(','),
    ...dialBData.map(record => [
      `"${record.phoneNumber}"`,
      `"${record.group}"`,
      `"${record.overallStatus}"`,
      `"${record.tMobileFlag}"`,
      `"${record.attFlag}"`,
      `"${record.thirdPartyFlag}"`,
      `"${record.lastChecked}"`
    ].join(','))
  ].join('\n');
  
  return csvContent;
};

// Get statistics
export const getDialBStatistics = () => {
  const dialBData = loadDialBData();
  const uniqueGroups = dialBData.reduce((groups: string[], record) => {
    if (!groups.includes(record.group)) {
      groups.push(record.group);
    }
    return groups;
  }, []);
  
  return {
    total: dialBData.length,
    clean: dialBData.filter(record => record.overallStatus === 'Clean').length,
    spam: dialBData.filter(record => record.overallStatus === 'Spam').length,
    tMobileFlagged: dialBData.filter(record => record.tMobileFlag).length,
    attFlagged: dialBData.filter(record => record.attFlag).length,
    thirdPartyFlagged: dialBData.filter(record => record.thirdPartyFlag).length,
    groups: uniqueGroups.length,
  };
};