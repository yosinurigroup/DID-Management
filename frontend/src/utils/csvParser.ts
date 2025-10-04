// CSV parsing utility functions

export interface CSVAreaCode {
  'Area Code': string;
  'State': string;
  'Area Code +1': string;
}

export interface AreaCodeData {
  id: string;
  code: string;
  region: string;
  state: string;
  timezone: string;
  totalDIDs: number;
  activeDIDs: number;
}

// Parse CSV content into array of objects
export const parseCSV = (csvContent: string): CSVAreaCode[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj as CSVAreaCode;
  });
};

// Convert CSV area code data to our application format
export const convertCSVToAreaCodes = (csvData: CSVAreaCode[]): AreaCodeData[] => {
  // State to timezone mapping (simplified)
  const stateTimezones: { [key: string]: string } = {
    'Florida': 'EST',
    'California': 'PST',
    'Alabama': 'CST',
    'Alaska': 'AKST',
    'Arizona': 'MST',
    'Arkansas': 'CST',
    'Colorado': 'MST',
    'Connecticut': 'EST',
    'Delaware': 'EST',
    'District of Columbia': 'EST',
    'Georgia': 'EST',
    'Hawaii': 'HST',
    'Idaho': 'MST',
    'Illinois': 'CST',
    'Indiana': 'EST',
    'Iowa': 'CST',
    'Kansas': 'CST',
    'Kentucky': 'EST',
    'Louisiana': 'CST',
    'Maine': 'EST',
    'Maryland': 'EST',
    'Massachusetts': 'EST',
    'Michigan': 'EST',
    'Minnesota': 'CST',
    'Mississippi': 'CST',
    'Missouri': 'CST',
    'Montana': 'MST',
    'Nebraska': 'CST',
    'Nevada': 'PST',
    'New Hampshire': 'EST',
    'New Jersey': 'EST',
    'New Mexico': 'MST',
    'New York': 'EST',
    'North Carolina': 'EST',
    'North Dakota': 'CST',
    'Ohio': 'EST',
    'Oklahoma': 'CST',
    'Oregon': 'PST',
    'Pennsylvania': 'EST',
    'Rhode Island': 'EST',
    'South Carolina': 'EST',
    'South Dakota': 'CST',
    'Tennessee': 'CST',
    'Texas': 'CST',
    'Utah': 'MST',
    'Vermont': 'EST',
    'Virginia': 'EST',
    'Washington': 'PST',
    'West Virginia': 'EST',
    'Wisconsin': 'CST',
    'Wyoming': 'MST',
    'Tell Free': 'N/A'
  };

  return csvData.map((item, index) => ({
    id: (index + 1).toString(),
    code: item['Area Code'],
    region: item.State === 'Tell Free' ? 'Toll Free' : `${item.State} Region`,
    state: item.State,
    timezone: stateTimezones[item.State] || 'EST',
    totalDIDs: 0,
    activeDIDs: 0
  }));
};

// Read file as text
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};