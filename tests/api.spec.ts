import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  test('should test DIDs API endpoint', async ({ request }) => {
    // Test GET /api/dids
    const response = await request.get('http://localhost:3001/api/dids');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should test Companies API endpoint', async ({ request }) => {
    // Test GET /api/companies
    const response = await request.get('http://localhost:3001/api/companies');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should test Area Codes API endpoint', async ({ request }) => {
    // Test GET /api/areacodes
    const response = await request.get('http://localhost:3001/api/areacodes');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should create new DID record', async ({ request }) => {
    // Test POST /api/dids
    const newDID = {
      didNumber: '+1555123456',
      provider: 'Test Provider',
      status: 'active',
      assignedTo: 'Test Company'
    };

    const response = await request.post('http://localhost:3001/api/dids', {
      data: newDID
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.didNumber).toBe(newDID.didNumber);
  });

  test('should update DID record', async ({ request }) => {
    // First create a DID
    const newDID = {
      didNumber: '+1555654321',
      provider: 'Test Provider',
      status: 'active'
    };

    const createResponse = await request.post('http://localhost:3001/api/dids', {
      data: newDID
    });
    
    const createdDID = await createResponse.json();
    
    // Then update it
    const updateData = { status: 'inactive' };
    const updateResponse = await request.patch(`http://localhost:3001/api/dids/${createdDID.id}`, {
      data: updateData
    });
    
    expect(updateResponse.ok()).toBeTruthy();
    const updatedDID = await updateResponse.json();
    expect(updatedDID.status).toBe('inactive');
  });
});