// Area codes data converted from JSON
import rawData from './area-codes-data.json';

export interface AreaCode {
  id: string;
  code: string;
  region: string;
  state: string;
  timezone: string;
  totalDIDs: number;
  activeDIDs: number;
}

// Load area codes from localStorage or initialize with default data
const loadAreaCodesData = (): AreaCode[] => {
  try {
    const stored = localStorage.getItem('areaCodesData');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading area codes data from localStorage:', error);
  }
  
  // Return default data if no stored data or error
  return rawData.areaCodes.map((areaCode: any) => ({
    ...areaCode,
    totalDIDs: 0,
    activeDIDs: 0
  })) as AreaCode[];
};

// Save area codes to localStorage
const saveAreaCodesData = (data: AreaCode[]) => {
  try {
    localStorage.setItem('areaCodesData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving area codes data to localStorage:', error);
  }
};

// Remove demo DID data - set all DID counts to 0
export const areaCodesData: AreaCode[] = loadAreaCodesData();

// Function to add a new area code
export const addAreaCode = (newAreaCode: Omit<AreaCode, 'id'>): AreaCode => {
  const areaCode: AreaCode = {
    ...newAreaCode,
    id: `ac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  areaCodesData.push(areaCode);
  saveAreaCodesData(areaCodesData);
  
  console.log(`Added new area code: ${areaCode.code} - ${areaCode.state}`);
  
  // Dispatch a custom event to notify components of data update
  window.dispatchEvent(new CustomEvent('areaCodesDataUpdated'));
  
  return areaCode;
};

// Function to update an existing area code
export const updateAreaCode = (id: string, updates: Partial<AreaCode>): boolean => {
  const index = areaCodesData.findIndex(ac => ac.id === id);
  if (index !== -1) {
    areaCodesData[index] = { ...areaCodesData[index], ...updates };
    saveAreaCodesData(areaCodesData);
    
    console.log(`Updated area code: ${areaCodesData[index].code} - ${areaCodesData[index].state}`);
    
    // Dispatch a custom event to notify components of data update
    window.dispatchEvent(new CustomEvent('areaCodesDataUpdated'));
    
    return true;
  }
  
  console.log(`Area code with ID ${id} not found`);
  return false;
};

// Function to delete an area code
export const deleteAreaCode = (id: string): boolean => {
  const index = areaCodesData.findIndex(ac => ac.id === id);
  if (index !== -1) {
    const deletedAreaCode = areaCodesData.splice(index, 1)[0];
    saveAreaCodesData(areaCodesData);
    
    console.log(`Deleted area code: ${deletedAreaCode.code} - ${deletedAreaCode.state}`);
    
    // Dispatch a custom event to notify components of data update
    window.dispatchEvent(new CustomEvent('areaCodesDataUpdated'));
    
    return true;
  }
  
  console.log(`Area code with ID ${id} not found`);
  return false;
};

// Function to get unique states from area codes
export const getUniqueStatesFromAreaCodes = (): string[] => {
  const states = new Set(areaCodesData.map(ac => ac.state));
  return Array.from(states).sort();
};