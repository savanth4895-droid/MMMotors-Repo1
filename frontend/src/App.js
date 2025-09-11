import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Services from './components/Services';
import VehicleStock from './components/VehicleStock';
import SpareParts from './components/SpareParts';
import Layout from './components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Axios request:', config.method?.toUpperCase(), config.url, config.headers.Authorization ? 'with auth' : 'no auth');
    return config;
  },
  (error) => {
    console.error('Axios request error:', error);
    return Promise.reject(error);
  }
);

// Axios response interceptor for handling auth errors
axios.interceptors.response.use(
  (response) => {
    console.log('Axios response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Axios response error:', error);
    if (error.response?.status === 401) {
      console.log('Authentication error - clearing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth context
const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      axios.get(`${API}/auth/me`)
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    console.log('AuthContext login called with:', { userData, token: token ? 'present' : 'missing' });
    setUser(userData);
    localStorage.setItem('token', token);
    console.log('User state set and token stored in localStorage');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login />} 
            />
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
            />
            <Route
              path="/dashboard"
              element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/sales/*"
              element={user ? <Layout><Sales /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/services/*"
              element={user ? <Layout><Services /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/vehicles/*"
              element={user ? <Layout><VehicleStock /></Layout> : <Navigate to="/login" />}
            />
            <Route
              path="/spare-parts/*"
              element={user ? <Layout><SpareParts /></Layout> : <Navigate to="/login" />}
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AuthContext.Provider>
  );
}

export { AuthContext };
export default App;