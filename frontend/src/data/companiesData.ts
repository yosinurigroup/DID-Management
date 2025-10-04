export interface Company {
  id: string;
  companyId: string;
  companyName: string;
  description: string;
  createdDate: string;
  lastUpdated: string;
}

// Load data from localStorage or initialize with sample data
const loadCompaniesData = (): Company[] => {
  try {
    const stored = localStorage.getItem('companiesData');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading companies data from localStorage:', error);
  }
  
  // Return sample data if no stored data or error
  return [
    {
      id: '1',
      companyId: 'COMP001',
      companyName: 'Acme Corporation',
      description: 'Leading technology solutions provider',
      createdDate: '2024-01-15',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      companyId: 'COMP002',
      companyName: 'Global Telecom Solutions',
      description: 'International telecommunications services',
      createdDate: '2024-02-10',
      lastUpdated: '2024-02-10'
    },
    {
      id: '3',
      companyId: 'COMP003',
      companyName: 'Digital Innovations LLC',
      description: 'Cloud-based communication platforms',
      createdDate: '2024-03-05',
      lastUpdated: '2024-03-05'
    }
  ];
};

// Save data to localStorage
const saveCompaniesData = (data: Company[]) => {
  try {
    localStorage.setItem('companiesData', JSON.stringify(data));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('companiesDataUpdated'));
    console.log('Companies data saved to localStorage');
  } catch (error) {
    console.error('Error saving companies data to localStorage:', error);
  }
};

// Initialize the companies data
export const companiesData: Company[] = loadCompaniesData();

// CRUD operations
export const addCompany = (company: Omit<Company, 'id'>): void => {
  const newCompany: Company = {
    ...company,
    id: (companiesData.length + 1).toString(),
  };
  companiesData.push(newCompany);
  saveCompaniesData(companiesData);
  console.log('Company added:', newCompany);
};

export const updateCompany = (id: string, updates: Partial<Company>): void => {
  const index = companiesData.findIndex(company => company.id === id);
  if (index !== -1) {
    companiesData[index] = { 
      ...companiesData[index], 
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    saveCompaniesData(companiesData);
    console.log('Company updated:', companiesData[index]);
  }
};

export const deleteCompany = (id: string): void => {
  const index = companiesData.findIndex(company => company.id === id);
  if (index !== -1) {
    const deletedCompany = companiesData.splice(index, 1)[0];
    saveCompaniesData(companiesData);
    console.log('Company deleted:', deletedCompany);
  }
};

export const getCompanyById = (id: string): Company | undefined => {
  return companiesData.find(company => company.id === id);
};

export const getCompanyByCompanyId = (companyId: string): Company | undefined => {
  return companiesData.find(company => company.companyId === companyId);
};

export const getCompaniesCount = () => companiesData.length;

// Function to clear all company data (useful for testing or reset)
export const clearAllCompanyData = (): void => {
  companiesData.length = 0; // Clear the array
  saveCompaniesData(companiesData);
  window.dispatchEvent(new CustomEvent('companiesDataUpdated'));
  console.log('All company data cleared');
};