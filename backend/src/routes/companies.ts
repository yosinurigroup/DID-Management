import express from 'express';
const router = express.Router();

// In-memory storage for companies (temporary until database is connected)
let companiesStorage: any[] = [];

// GET /api/companies - Get all companies
router.get('/', async (req, res) => {
  try {
    res.json(companiesStorage);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving companies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/companies/bulk - Bulk import companies
router.post('/bulk', async (req, res) => {
  try {
    const { companies } = req.body;
    
    if (!Array.isArray(companies)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of companies.'
      });
    }

    // Store companies in memory
    companiesStorage = companies;
    
    res.status(201).json({
      success: true,
      data: companies,
      message: `Successfully imported ${companies.length} companies`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error importing companies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/companies - Create a new company
router.post('/', async (req, res) => {
  try {
    const { companyName, companyId, description } = req.body;
    
    // TODO: Implement company creation in database
    const newCompany = {
      id: Date.now().toString(),
      companyName,
      companyId: companyId || `COMP-${Date.now()}`,
      description: description || '',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    
    companiesStorage.push(newCompany);
    
    res.status(201).json({
      success: true,
      data: newCompany,
      message: 'Company created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/companies/:id - Inline edit update for a company
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the company in storage and update it
    const companyIndex = companiesStorage.findIndex(company => company.id === id);
    
    if (companyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Update the company with the new data
    companiesStorage[companyIndex] = {
      ...companiesStorage[companyIndex],
      ...updateData,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    res.json({
      success: true,
      data: companiesStorage[companyIndex],
      message: 'Company updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/companies/:id - Update a company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, companyId, description } = req.body;
    
    // Find the company in storage and update it
    const companyIndex = companiesStorage.findIndex(company => company.id === id);
    
    if (companyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Update the company
    companiesStorage[companyIndex] = {
      ...companiesStorage[companyIndex],
      companyName,
      companyId,
      description,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    res.json({
      success: true,
      data: companiesStorage[companyIndex],
      message: 'Company updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/companies/:id - Delete a company
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the company in storage and remove it
    const companyIndex = companiesStorage.findIndex(company => company.id === id);
    
    if (companyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    companiesStorage.splice(companyIndex, 1);
    
    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting company',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;