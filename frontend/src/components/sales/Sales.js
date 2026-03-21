import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import ViewCustomerDetailsPage from '../ViewCustomerDetailsPage';
import { Plus, Eye, FileText, Users, TrendingUp, Shield } from 'lucide-react';
import SalesOverview from './SalesOverview';
import CreateInvoice from './CreateInvoice';
import ViewInvoices from './ViewInvoices';
import CustomersManagement from './CustomersManagement';
import SalesReports from './SalesReports';
import InsuranceManagement from './InsuranceManagement';

const Sales = () => {
  const location = useLocation();
  const navigationItems = [
    { name: 'Overview', path: '/sales', icon: TrendingUp },
    { name: 'Create Invoice', path: '/sales/create-invoice', icon: Plus },
    { name: 'View Invoices', path: '/sales/invoices', icon: FileText },
    { name: 'Add Customer', path: '/sales/customers', icon: Users },
    { name: 'View Customer Details', path: '/sales/customer-details', icon: Eye },
    { name: 'Sales Report', path: '/sales/reports', icon: TrendingUp },
    { name: 'Insurance', path: '/sales/insurance', icon: Shield }
  ];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex flex-wrap gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (<Link key={item.path} to={item.path}><Button variant={isActive ? "default" : "ghost"} size="sm" className="flex items-center space-x-2"><Icon className="w-4 h-4" /><span>{item.name}</span></Button></Link>);
          })}
        </div>
      </div>
      <Routes>
        <Route path="/" element={<SalesOverview />} />
        <Route path="/create-invoice" element={<CreateInvoice />} />
        <Route path="/invoices" element={<ViewInvoices />} />
        <Route path="/customers" element={<CustomersManagement />} />
        <Route path="/customer-details" element={<ViewCustomerDetailsPage />} />
        <Route path="/reports" element={<SalesReports />} />
        <Route path="/insurance" element={<InsuranceManagement />} />
      </Routes>
    </div>
  );
};

export default Sales;
