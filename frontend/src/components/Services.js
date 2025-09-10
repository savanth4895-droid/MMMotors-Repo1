import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Eye, 
  Wrench, 
  ClipboardList, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  FileText,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Services = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/services', icon: Wrench },
    { name: 'New Service', path: '/services/new', icon: Plus },
    { name: 'View Registration', path: '/services/registrations', icon: Eye },
    { name: 'Job Cards', path: '/services/job-cards', icon: ClipboardList },
    { name: 'Service Due', path: '/services/due', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex flex-wrap gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<ServicesOverview />} />
        <Route path="/new" element={<NewService />} />
        <Route path="/registrations" element={<ViewRegistration />} />
        <Route path="/job-cards" element={<JobCards />} />
        <Route path="/due" element={<ServiceDue />} />
      </Routes>
    </div>
  );
};

const ServicesOverview = () => {
  const [stats, setStats] = useState({
    pendingServices: 0,
    completedToday: 0,
    inProgress: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [pending, inProgress, completed] = await Promise.all([
        axios.get(`${API}/services?status=pending`),
        axios.get(`${API}/services?status=in_progress`),
        axios.get(`${API}/services?status=completed`)
      ]);
      
      setStats({
        pendingServices: pending.data.length,
        inProgress: inProgress.data.length,
        completedToday: completed.data.filter(s => 
          new Date(s.completion_date).toDateString() === new Date().toDateString()
        ).length
      });
    } catch (error) {
      toast.error('Failed to fetch service statistics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Services</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingServices}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/services/new">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                New Service Registration
              </Button>
            </Link>
            <Link to="/services/job-cards">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="w-4 h-4 mr-2" />
                View Job Cards
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Regular Service</span>
                <Badge variant="outline">45%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Repair Work</span>
                <Badge variant="outline">30%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Parts Replacement</span>
                <Badge variant="outline">25%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const NewService = () => {
  const [serviceData, setServiceData] = useState({
    customer_name: '',
    phone_number: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_reg_no: '',
    service_type: '',
    description: '',
    estimated_amount: ''
  });
  const [loading, setLoading] = useState(false);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];
  const serviceTypes = [
    'Regular Service',
    'Oil Change',
    'Brake Service',
    'Engine Repair',
    'Electrical Work',
    'Body Work',
    'Tire Replacement',
    'Chain & Sprocket',
    'Clutch Service',
    'Suspension Service',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setServiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setServiceData({
      customer_name: '',
      phone_number: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_reg_no: '',
      service_type: '',
      description: '',
      estimated_amount: ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, try to find existing customer or create new one
      let customerId = null;
      
      try {
        const customersResponse = await axios.get(`${API}/customers`);
        const existingCustomer = customersResponse.data.find(
          customer => customer.phone === serviceData.phone_number
        );
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const customerResponse = await axios.post(`${API}/customers`, {
            name: serviceData.customer_name,
            phone: serviceData.phone_number,
            email: '',
            address: 'Service Registration'
          });
          customerId = customerResponse.data.id;
        }
      } catch (error) {
        // Create customer if customer API fails
        const customerResponse = await axios.post(`${API}/customers`, {
          name: serviceData.customer_name,
          phone: serviceData.phone_number,
          email: '',
          address: 'Service Registration'
        });
        customerId = customerResponse.data.id;
      }

      // Create service record
      await axios.post(`${API}/services`, {
        customer_id: customerId,
        vehicle_number: serviceData.vehicle_reg_no,
        service_type: serviceData.service_type.toLowerCase().replace(' ', '_'),
        description: `${serviceData.vehicle_brand} ${serviceData.vehicle_model} (${serviceData.vehicle_year}) - ${serviceData.description}`,
        amount: parseFloat(serviceData.estimated_amount) || 0
      });

      toast.success('Service registration completed successfully!');
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Service Registration</CardTitle>
        <CardDescription>Register a new vehicle for service with complete details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Customer Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  placeholder="Enter customer name"
                  value={serviceData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  placeholder="Enter phone number"
                  value={serviceData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                <Select value={serviceData.vehicle_brand} onValueChange={(value) => handleInputChange('vehicle_brand', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle_model">Vehicle Model</Label>
                <Input
                  id="vehicle_model"
                  placeholder="Enter vehicle model"
                  value={serviceData.vehicle_model}
                  onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicle_year">Vehicle Year</Label>
                <Select value={serviceData.vehicle_year} onValueChange={(value) => handleInputChange('vehicle_year', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 25}, (_, i) => 2024 - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle_reg_no">Vehicle Reg. No</Label>
                <Input
                  id="vehicle_reg_no"
                  placeholder="Enter vehicle registration number"
                  value={serviceData.vehicle_reg_no}
                  onChange={(e) => handleInputChange('vehicle_reg_no', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Service Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Service Type</Label>
                <Select value={serviceData.service_type} onValueChange={(value) => handleInputChange('service_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimated_amount">Estimated Amount (₹)</Label>
                <Input
                  id="estimated_amount"
                  type="number"
                  placeholder="Enter estimated amount"
                  value={serviceData.estimated_amount}
                  onChange={(e) => handleInputChange('estimated_amount', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Service Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the service work required or issues reported"
                value={serviceData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 sm:flex-none sm:px-8"
            >
              {loading ? 'Saving Service Registration...' : 'Save Service Registration'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              className="flex-1 sm:flex-none sm:px-8"
            >
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ViewRegistration = () => {
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm]);

  const fetchAllData = async () => {
    try {
      const [servicesRes, customersRes] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/customers`)
      ]);

      const services = servicesRes.data;
      const customers = customersRes.data;

      // Combine service and customer data to create registration records
      const combined = services.map(service => {
        const customer = customers.find(c => c.id === service.customer_id);
        
        // Extract vehicle information from service description
        const description = service.description || '';
        const vehicleInfo = extractVehicleInfo(description, service.vehicle_number);

        return {
          id: service.id,
          registration_date: service.service_date,
          customer_name: customer?.name || 'Unknown',
          phone_number: customer?.phone || 'N/A',
          vehicle_brand: vehicleInfo.brand,
          vehicle_model: vehicleInfo.model,
          vehicle_year: vehicleInfo.year,
          vehicle_reg_no: service.vehicle_number || 'N/A',
          service_type: service.service_type,
          amount: service.amount,
          status: service.status,
          job_card_number: service.job_card_number,
          description: service.description,
          customer_address: customer?.address || 'N/A'
        };
      });

      setRegistrations(combined);
      setCustomers(customers);
    } catch (error) {
      toast.error('Failed to fetch registration data');
    } finally {
      setLoading(false);
    }
  };

  const extractVehicleInfo = (description, vehicleNumber) => {
    // Try to extract vehicle info from description
    const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];
    let brand = 'N/A';
    let model = 'N/A';
    let year = 'N/A';

    if (description) {
      // Find brand in description
      const foundBrand = brands.find(b => description.toUpperCase().includes(b));
      if (foundBrand) {
        brand = foundBrand;
        
        // Try to extract model (text after brand)
        const brandIndex = description.toUpperCase().indexOf(foundBrand);
        const afterBrand = description.substring(brandIndex + foundBrand.length).trim();
        const modelMatch = afterBrand.match(/^([A-Za-z0-9\s+\-]+)/);
        if (modelMatch) {
          model = modelMatch[1].trim();
        }
        
        // Try to extract year (4 digits in parentheses)
        const yearMatch = description.match(/\((\d{4})\)/);
        if (yearMatch) {
          year = yearMatch[1];
        }
      }
    }

    return { brand, model, year };
  };

  const filterRegistrations = () => {
    let filtered = registrations;

    if (searchTerm) {
      filtered = registrations.filter(reg =>
        reg.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.job_card_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRegistrations(filtered);
  };

  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
    setShowViewModal(true);
  };

  const handleEditRegistration = (registration) => {
    toast.info('Edit functionality will be implemented in the next update');
    // TODO: Implement edit functionality
  };

  const exportRegistrations = () => {
    try {
      const csvContent = [
        ['Registration Date', 'Customer Name', 'Phone Number', 'Vehicle Brand', 'Vehicle Model', 'Vehicle Year', 'Vehicle Reg No', 'Service Type', 'Amount'].join(','),
        ...filteredRegistrations.map(reg => [
          new Date(reg.registration_date).toLocaleDateString('en-IN'),
          reg.customer_name || '',
          reg.phone_number || '',
          reg.vehicle_brand || '',
          reg.vehicle_model || '',
          reg.vehicle_year || '',
          reg.vehicle_reg_no || '',
          reg.service_type || '',
          reg.amount || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_registrations_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Registrations exported successfully!');
    } catch (error) {
      toast.error('Failed to export registrations');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">View Service Registrations</h2>
          <p className="text-gray-600">View and manage all service registrations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportRegistrations} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Print List
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by customer name, phone, vehicle brand, model, year, or registration number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {registrations.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {registrations.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-purple-600">{filteredRegistrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Service Registrations ({filteredRegistrations.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Registration Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Brand</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Vehicle Year</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No registrations found matching your search' : 'No service registrations found'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600">
                        {new Date(registration.registration_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{registration.customer_name}</div>
                      </td>
                      <td className="p-3 text-gray-600">{registration.phone_number}</td>
                      <td className="p-3">
                        <span className={`font-medium ${registration.vehicle_brand !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {registration.vehicle_brand}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{registration.vehicle_model}</td>
                      <td className="p-3 text-gray-600">{registration.vehicle_year}</td>
                      <td className="p-3 text-gray-600 font-mono">{registration.vehicle_reg_no}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewRegistration(registration)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRegistration(registration)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Registration Modal */}
      {showViewModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Service Registration Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Registration Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Registration Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Registration Date:</strong> {new Date(selectedRegistration.registration_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Job Card Number:</strong> {selectedRegistration.job_card_number}</div>
                    <div><strong>Service Type:</strong> {selectedRegistration.service_type?.replace('_', ' ')}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedRegistration.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedRegistration.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedRegistration.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedRegistration.customer_name}</div>
                    <div><strong>Phone:</strong> {selectedRegistration.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedRegistration.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Brand:</strong> {selectedRegistration.vehicle_brand}</div>
                    <div><strong>Model:</strong> {selectedRegistration.vehicle_model}</div>
                    <div><strong>Year:</strong> {selectedRegistration.vehicle_year}</div>
                    <div><strong>Registration No:</strong> {selectedRegistration.vehicle_reg_no}</div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Service Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Estimated Amount:</strong> ₹{selectedRegistration.amount?.toLocaleString() || '0'}</div>
                    <div><strong>Service Type:</strong> {selectedRegistration.service_type?.replace('_', ' ')}</div>
                    <div className="md:col-span-2">
                      <strong>Description:</strong>
                      <p className="mt-1 text-gray-600">{selectedRegistration.description || 'No description provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditRegistration(selectedRegistration);
                  }}
                >
                  Edit Registration
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const JobCards = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const updateServiceStatus = async (serviceId, status) => {
    try {
      await axios.put(`${API}/services/${serviceId}/status?status=${status}`);
      toast.success('Service status updated');
      fetchServices();
    } catch (error) {
      toast.error('Failed to update service status');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', variant: 'secondary' },
      in_progress: { label: 'In Progress', variant: 'default' },
      completed: { label: 'Completed', variant: 'success' }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Cards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Job Card #</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Vehicle</th>
                <th className="text-left p-2">Service Type</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{service.job_card_number}</td>
                  <td className="p-2">{new Date(service.service_date).toLocaleDateString()}</td>
                  <td className="p-2">{service.vehicle_number}</td>
                  <td className="p-2">{service.service_type.replace('_', ' ')}</td>
                  <td className="p-2">₹{service.amount}</td>
                  <td className="p-2">{getStatusBadge(service.status)}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      {service.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateServiceStatus(service.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {service.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateServiceStatus(service.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Complete
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const ServiceDue = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Due Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Due Tracking</h3>
          <p className="text-gray-500 mb-4">Track and remind customers of upcoming service due dates</p>
          <Button>Coming Soon</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Services;