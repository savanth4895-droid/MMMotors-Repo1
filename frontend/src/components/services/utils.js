// Services Module Utilities
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Service types options
export const serviceTypes = [
  { value: 'regular_service', label: 'Regular Service' },
  { value: 'periodic_service', label: 'Periodic Service' },
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'engine_repair', label: 'Engine Repair' },
  { value: 'electrical_work', label: 'Electrical Work' },
  { value: 'body_work', label: 'Body Work' },
  { value: 'tire_replacement', label: 'Tire Replacement' },
  { value: 'chain_sprocket', label: 'Chain & Sprocket' },
  { value: 'clutch_service', label: 'Clutch Service' },
  { value: 'suspension_service', label: 'Suspension Service' },
  { value: 'other', label: 'Other' },
];

// Status options
export const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

// Helper function to get status badge
export const getStatusBadge = (status) => {
  const statusConfig = statusOptions.find(s => s.value === status) || statusOptions[0];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
      {statusConfig.label}
    </span>
  );
};

// Helper function to safely extract error messages
export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data) {
    if (Array.isArray(error.response.data) && error.response.data.length > 0) {
      return error.response.data.map(err => err.msg || err.message || 'Validation error').join(', ');
    }
    
    if (error.response.data.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(err => err.msg || err.message || 'Error').join(', ');
      }
    }
    
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Common API helper with auth
export const apiRequest = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('token');
  const config = {
    method,
    url: `${API}${endpoint}`,
    headers: { Authorization: `Bearer ${token}` },
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN');
};

// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
};
