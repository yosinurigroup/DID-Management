// API Configuration for Vercel deployment
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  DIDS: `${API_BASE_URL}/api/dids`,
  COMPANIES: `${API_BASE_URL}/api/companies`,
  AREACODES: `${API_BASE_URL}/api/areacodes`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
};

export default API_ENDPOINTS;