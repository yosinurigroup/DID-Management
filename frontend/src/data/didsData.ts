import { areaCodesData } from './areaCodesData';

export interface DIDRecord {
  id: string;
  provider: string;
  didNumber: string;
  trankId: string;
  didForward: string;
  areaCode: string;
  state: string;
  companyId: string;
  companyName: string;
  status: 'active' | 'inactive' | 'pending';
  assignedDate: string;
  lastUpdated: string;
}

// Load data from localStorage or initialize with sample data
const loadDIDsData = (): DIDRecord[] => {
  try {
    const stored = localStorage.getItem('didsData');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading DIDs data from localStorage:', error);
  }
  
  // Return sample data if no stored data or error
  return [
    {
      id: 'test-did-1',
      provider: 'Sip Trunk',
      didNumber: '12023185300',
      trankId: 'SIP-001',
      didForward: 'not set',
      areaCode: '202',
      state: 'DC',
      companyId: 'COMP001',
      companyName: 'Test Company',
      status: 'active',
      assignedDate: '2024-01-15',
      lastUpdated: '2024-01-15'
    },
    {
      id: 'test-did-2',
      provider: 'DIDWW',
      didNumber: '13105796937',
      trankId: 'DID-001',
      didForward: 'not set',
      areaCode: '310',
      state: 'California',
      companyId: 'COMP002',
      companyName: 'Test Company 2',
      status: 'active',
      assignedDate: '2024-01-15',
      lastUpdated: '2024-01-15'
    },
    {
      id: 'test-did-3',
      provider: 'DIDWW',
      didNumber: '13109298978',
      trankId: 'DID-002',
      didForward: 'not set',
      areaCode: '310',
      state: 'California',
      companyId: 'COMP003',
      companyName: 'Test Company 3',
      status: 'active',
      assignedDate: '2024-01-15',
      lastUpdated: '2024-01-15'
    }
  ];
};

// Save data to localStorage
const saveDIDsData = (data: DIDRecord[]) => {
  try {
    localStorage.setItem('didsData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving DIDs data to localStorage:', error);
  }
};

// Sample DID data - load from localStorage or initialize
export const didsData: DIDRecord[] = loadDIDsData();

// Function to add imported DIDs
export interface ImportResult {
  successful: DIDRecord[];
  duplicates: DIDRecord[];
  totalProcessed: number;
  successCount: number;
  duplicateCount: number;
}

export const addImportedDIDs = (newDIDs: DIDRecord[]): ImportResult => {
  const successful: DIDRecord[] = [];
  const duplicates: DIDRecord[] = [];
  
  // Get existing DID numbers for comparison
  const existingDIDs = new Set(didsData.map(did => did.didNumber));
  
  // Check each new DID for duplicates
  newDIDs.forEach(newDID => {
    if (existingDIDs.has(newDID.didNumber)) {
      duplicates.push(newDID);
    } else {
      successful.push(newDID);
      existingDIDs.add(newDID.didNumber); // Add to set to prevent duplicates within the import batch
    }
  });
  
  // Add only the successful (non-duplicate) DIDs to the existing data
  didsData.push(...successful);
  
  // Save to localStorage
  saveDIDsData(didsData);
  
  console.log(`Import completed: ${successful.length} successful, ${duplicates.length} duplicates`);
  
  // Dispatch a custom event to notify components of data update
  window.dispatchEvent(new CustomEvent('didsDataUpdated'));
  
  return {
    successful,
    duplicates,
    totalProcessed: newDIDs.length,
    successCount: successful.length,
    duplicateCount: duplicates.length
  };
};

// Function to delete a DID record
export const deleteDIDRecord = (didId: string): boolean => {
  const index = didsData.findIndex(did => did.id === didId);
  
  if (index !== -1) {
    const deletedRecord = didsData.splice(index, 1)[0];
    console.log(`Deleted DID record: ${deletedRecord.didNumber}`);
    
    // Save to localStorage
    saveDIDsData(didsData);
    
    // Dispatch a custom event to notify components of data update
    window.dispatchEvent(new CustomEvent('didsDataUpdated'));
    
    return true;
  }
  
  console.log(`DID record with ID ${didId} not found`);
  return false;
};

// Function to add a new DID record
export const addDIDRecord = (newDID: Omit<DIDRecord, 'id'>): DIDRecord => {
  const didRecord: DIDRecord = {
    ...newDID,
    id: `did-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    assignedDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0],
  };
  
  didsData.push(didRecord);
  console.log(`Added new DID record: ${didRecord.didNumber}`);
  
  // Save to localStorage
  saveDIDsData(didsData);
  
  // Dispatch a custom event to notify components of data update
  window.dispatchEvent(new CustomEvent('didsDataUpdated'));
  
  return didRecord;
};

// Function to update an existing DID record
export const updateDIDRecord = (didId: string, updates: Partial<DIDRecord>): boolean => {
  const index = didsData.findIndex(did => did.id === didId);
  
  if (index !== -1) {
    didsData[index] = {
      ...didsData[index],
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    
    console.log(`Updated DID record with ID: ${didId}`);
    
    // Save to localStorage
    saveDIDsData(didsData);
    
    // Dispatch a custom event to notify components of data update
    window.dispatchEvent(new CustomEvent('didsDataUpdated'));
    
    return true;
  }
  
  console.log(`DID record with ID ${didId} not found`);
  return false;
};

// Function to get current DIDs count
export const getDIDsCount = () => didsData.length;

// Utility functions
export const getDIDsByStatus = (status: string) => {
  if (status === 'all') return didsData;
  return didsData.filter(did => did.status === status);
};

export const getDIDsByProvider = (provider: string) => {
  if (provider === 'all') return didsData;
  return didsData.filter(did => did.provider === provider);
};

export const getDIDsByState = (states: string[]) => {
  if (states.length === 0 || states.includes('all')) return didsData;
  return didsData.filter(did => states.includes(did.state));
};

export const getUniqueProviders = () => {
  return Array.from(new Set(didsData.map(did => did.provider))).sort();
};

export const getUniqueStates = () => {
  return Array.from(new Set(didsData.map(did => did.state))).sort();
};

export const searchDIDs = (searchTerm: string) => {
  const term = searchTerm.toLowerCase();
  return didsData.filter(did =>
    did.didNumber.toLowerCase().includes(term) ||
    did.provider.toLowerCase().includes(term) ||
    did.trankId.toLowerCase().includes(term) ||
    did.didForward.toLowerCase().includes(term) ||
    did.areaCode.includes(term) ||
    did.state.toLowerCase().includes(term)
  );
};

// Utility function to clean phone numbers (remove tel: prefix, extract digits)
export const cleanPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove tel: prefix if present
  let cleaned = phoneNumber.replace(/^tel:/i, '');
  
  // Extract only digits
  const digits = cleaned.replace(/\D/g, '');
  
  // Return 11-digit phone number (1 + 10 digits) or original if less than 10 digits
  if (digits.length >= 10) {
    // If it has 11 digits and starts with 1, return as is
    if (digits.length === 11 && digits.startsWith('1')) {
      return digits;
    }
    // If it has 10 digits, add the 1 prefix
    if (digits.length === 10) {
      return '1' + digits;
    }
    // If it has more than 11 digits, take the last 10 and add 1 prefix
    if (digits.length > 11) {
      return '1' + digits.slice(-10);
    }
  }
  
  return digits; // Return whatever digits we have
};

// Utility function to extract area code from phone number
export const extractAreaCode = (phoneNumber: string): string => {
  const cleaned = cleanPhoneNumber(phoneNumber);
  if (cleaned.length >= 10) {
    // For 11-digit numbers starting with 1, take positions 1-3 (area code)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.substring(1, 4);
    }
    // For 10-digit numbers, take first 3 digits
    if (cleaned.length === 10) {
      return cleaned.substring(0, 3);
    }
  }
  return '';
};

// Utility function to get state from area code
export const getStateFromAreaCode = (areaCode: string): string => {
  const areaCodeEntry = areaCodesData.find(ac => ac.code === areaCode);
  return areaCodeEntry ? areaCodeEntry.state : '';
};

// Function to clear all DID data (useful for testing or reset)
export const clearAllDIDData = (): void => {
  didsData.length = 0; // Clear the array
  saveDIDsData(didsData);
  window.dispatchEvent(new CustomEvent('didsDataUpdated'));
  console.log('All DID data cleared');
};