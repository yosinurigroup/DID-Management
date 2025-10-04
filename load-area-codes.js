// Simple script to convert CSV data to JSON for manual upload
const fs = require('fs');
const path = require('path');

// Function to parse CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });
}

// Function to convert CSV data to area codes format
function convertCSVToAreaCodes(csvData) {
  return csvData.map((row, index) => ({
    id: (index + 1).toString(),
    code: row['Area Code'],
    region: row['State'], // Using state as region for now
    state: row['State'],
    timezone: 'EST', // Default timezone
    totalDIDs: Math.floor(Math.random() * 1000), // Random for demo
    activeDIDs: Math.floor(Math.random() * 500)  // Random for demo
  }));
}

// Load and process the CSV file
function loadAreaCodes() {
  try {
    console.log('Loading area codes from CSV...');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, 'sample_area_codes.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse and convert the data
    const csvData = parseCSV(csvContent);
    const areaCodeData = convertCSVToAreaCodes(csvData);
    
    console.log(`Parsed ${areaCodeData.length} area codes`);
    
    // Save to JSON file for manual upload
    const jsonPath = path.join(__dirname, 'area-codes-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ areaCodes: areaCodeData }, null, 2));
    
    console.log('✅ Successfully created area-codes-data.json!');
    console.log(`📊 Total area codes: ${areaCodeData.length}`);
    console.log('📋 You can now upload this data using curl or manually');
    
  } catch (error) {
    console.error('❌ Error loading area codes:', error);
  }
}

// Run the script
loadAreaCodes();