// Sales Module Utilities
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Utility function to convert number to words (Indian numbering system)
export const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };
  
  if (num < 100) {
    return convertHundreds(num);
  } else if (num < 1000) {
    return convertHundreds(num);
  } else if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = convertHundreds(thousands) + ' Thousand';
    if (remainder > 0) {
      result += ' ' + convertHundreds(remainder);
    }
    return result;
  } else if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    let result = convertHundreds(lakhs) + ' Lakh';
    if (remainder > 0) {
      if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += ' ' + convertHundreds(thousands) + ' Thousand';
        if (hundreds > 0) {
          result += ' ' + convertHundreds(hundreds);
        }
      } else {
        result += ' ' + convertHundreds(remainder);
      }
    }
    return result;
  } else {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    let result = convertHundreds(crores) + ' Crore';
    if (remainder > 0) {
      if (remainder >= 100000) {
        const lakhs = Math.floor(remainder / 100000);
        const rest = remainder % 100000;
        result += ' ' + convertHundreds(lakhs) + ' Lakh';
        if (rest > 0) {
          if (rest >= 1000) {
            const thousands = Math.floor(rest / 1000);
            const hundreds = rest % 1000;
            result += ' ' + convertHundreds(thousands) + ' Thousand';
            if (hundreds > 0) {
              result += ' ' + convertHundreds(hundreds);
            }
          } else {
            result += ' ' + convertHundreds(rest);
          }
        }
      } else if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += ' ' + convertHundreds(thousands) + ' Thousand';
        if (hundreds > 0) {
          result += ' ' + convertHundreds(hundreds);
        }
      } else {
        result += ' ' + convertHundreds(remainder);
      }
    }
    return result;
  }
};

// Custom Motorcycle Icon Component
export const MotorcycleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 16c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm12 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm1.5-9H16l-3-3h-2v2h1.5l1.5 1.5H8L6 5.5H4.5C3.7 5.5 3 6.2 3 7s.7 1.5 1.5 1.5H6l2 2.5h8l2-2.5h.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5z"/>
    <circle cx="7" cy="16" r="1"/>
    <circle cx="19" cy="16" r="1"/>
    <path d="M8.5 12l1.5-1.5h4L15.5 12H8.5z"/>
  </svg>
);

// Helper function to safely extract error messages
export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data) {
    // Handle Pydantic validation errors
    if (Array.isArray(error.response.data) && error.response.data.length > 0) {
      return error.response.data.map(err => err.msg || err.message || 'Validation error').join(', ');
    }
    
    // Handle detail errors
    if (error.response.data.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(err => err.msg || err.message || 'Error').join(', ');
      }
    }
    
    // Handle message errors
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

// Payment methods options
export const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'finance', label: 'Finance' },
];

// Chart colors
export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
