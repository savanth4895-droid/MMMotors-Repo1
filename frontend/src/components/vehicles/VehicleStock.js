import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Plus, TrendingUp, Package } from 'lucide-react';
import BrandOverview from './BrandOverview';
import AddVehicle from './AddVehicle';
import StockView from './StockView';
import BrandDetails from './BrandDetails';

const VehicleStock = () => {
  const location = useLocation();
  const navigationItems = [
    { name: 'Overview', path: '/vehicles', icon: TrendingUp },
    { name: 'Add Vehicle', path: '/vehicles/add', icon: Plus },
    { name: 'Stock View', path: '/vehicles/stock', icon: Package }
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
        <Route path="/" element={<BrandOverview />} />
        <Route path="/add" element={<AddVehicle />} />
        <Route path="/stock" element={<StockView />} />
        <Route path="/brand/:brand" element={<BrandDetails />} />
      </Routes>
    </div>
  );
};

export default VehicleStock;
