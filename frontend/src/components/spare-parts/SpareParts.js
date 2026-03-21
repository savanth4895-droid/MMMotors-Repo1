import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Plus, Package, ShoppingCart, TrendingDown, FileText } from 'lucide-react';
import SparePartsOverview from './SparePartsOverview';
import AddSparePart from './AddSparePart';
import Inventory from './Inventory';
import CreateBill from './CreateBill';
import Bills from './Bills';
import SparePartsReports from './SparePartsReports';
import LowStock from './LowStock';

const SpareParts = () => {
  const location = useLocation();
  const navigationItems = [
    { name: 'Overview', path: '/spare-parts', icon: Package },
    { name: 'Add Part', path: '/spare-parts/add', icon: Plus },
    { name: 'Inventory', path: '/spare-parts/inventory', icon: Package },
    { name: 'Create Bill', path: '/spare-parts/create-bill', icon: ShoppingCart },
    { name: 'Bills', path: '/spare-parts/bills', icon: FileText },
    { name: 'Reports', path: '/spare-parts/reports', icon: FileText },
    { name: 'Low Stock', path: '/spare-parts/low-stock', icon: TrendingDown }
  ];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex flex-wrap gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (<Link key={item.path} to={item.path}><Button variant={isActive ? "default" : "ghost"} size="sm" className="flex items-center space-x-2"><Icon className="w-4 h-4" /><span className="hidden sm:inline">{item.name}</span></Button></Link>);
          })}
        </div>
      </div>
      <Routes>
        <Route path="/" element={<SparePartsOverview />} />
        <Route path="/add" element={<AddSparePart />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/create-bill" element={<CreateBill />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/reports" element={<SparePartsReports />} />
        <Route path="/low-stock" element={<LowStock />} />
      </Routes>
    </div>
  );
};

export default SpareParts;
