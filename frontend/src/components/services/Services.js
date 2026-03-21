import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Plus, Eye, Wrench, ClipboardList, FileText, Calendar } from 'lucide-react';
import ServicesOverview from './ServicesOverview';
import NewService from './NewService';
import ViewRegistration from './ViewRegistration';
import JobCards from './JobCards';
import ServicesBilling from './ServicesBilling';
import ServiceDue from './ServiceDue';

const Services = () => {
  const location = useLocation();
  const navigationItems = [
    { name: 'Overview', path: '/services', icon: Wrench },
    { name: 'New Registration', path: '/services/new', icon: Plus },
    { name: 'View Registrations', path: '/services/registrations', icon: Eye },
    { name: 'Job Cards', path: '/services/job-cards', icon: ClipboardList },
    { name: 'Service Bills', path: '/services/billing', icon: FileText },
    { name: 'Service Due', path: '/services/due', icon: Calendar }
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
        <Route path="/" element={<ServicesOverview />} />
        <Route path="/new" element={<NewService />} />
        <Route path="/registrations" element={<ViewRegistration />} />
        <Route path="/job-cards" element={<JobCards />} />
        <Route path="/billing" element={<ServicesBilling />} />
        <Route path="/due" element={<ServiceDue />} />
      </Routes>
    </div>
  );
};

export default Services;
