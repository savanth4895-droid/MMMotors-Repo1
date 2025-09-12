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
  AlertTriangle,
  Search,
  FileText,
  Users,
  Calculator,
  Download,
  Printer,
  Trash2
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
    { name: 'Service Bills', path: '/services/billing', icon: FileText },
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
        <Route path="/billing" element={<ServicesBilling />} />
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
    setEditingRegistration(registration);
    setEditFormData({
      customer_id: customers.find(c => c.name === registration.customer_name)?.id || '',
      vehicle_number: registration.vehicle_reg_no,
      service_type: registration.service_type,
      description: registration.description,
      amount: registration.amount
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRegistration) return;
    
    try {
      setLoading(true);
      await axios.put(`${API}/services/${editingRegistration.id}`, editFormData);
      toast.success('Service registration updated successfully!');
      setShowEditModal(false);
      setEditingRegistration(null);
      setEditFormData({});
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update service registration');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRegistration(null);
    setEditFormData({});
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

      {/* Edit Registration Modal */}
      {showEditModal && editingRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Service Registration</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select 
                    value={editFormData.customer_id} 
                    onValueChange={(value) => setEditFormData({...editFormData, customer_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle_number">Vehicle Registration Number</Label>
                  <Input
                    id="vehicle_number"
                    placeholder="Enter vehicle registration number"
                    value={editFormData.vehicle_number || ''}
                    onChange={(e) => setEditFormData({...editFormData, vehicle_number: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service_type">Service Type</Label>
                  <Select 
                    value={editFormData.service_type} 
                    onValueChange={(value) => setEditFormData({...editFormData, service_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular_service">Regular Service</SelectItem>
                      <SelectItem value="oil_change">Oil Change</SelectItem>
                      <SelectItem value="brake_service">Brake Service</SelectItem>
                      <SelectItem value="engine_repair">Engine Repair</SelectItem>
                      <SelectItem value="electrical_work">Electrical Work</SelectItem>
                      <SelectItem value="body_work">Body Work</SelectItem>
                      <SelectItem value="tire_replacement">Tire Replacement</SelectItem>
                      <SelectItem value="chain_sprocket">Chain & Sprocket</SelectItem>
                      <SelectItem value="clutch_service">Clutch Service</SelectItem>
                      <SelectItem value="suspension_service">Suspension Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter service amount"
                    value={editFormData.amount || ''}
                    onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter service description"
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows={4}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
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
  const [jobCards, setJobCards] = useState([]);
  const [filteredJobCards, setFilteredJobCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJobCard, setEditingJobCard] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterJobCards();
  }, [jobCards, searchTerm]);

  const fetchAllData = async () => {
    try {
      const [servicesRes, customersRes] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/customers`)
      ]);

      const services = servicesRes.data;
      const customers = customersRes.data;

      // Combine service and customer data to create job card records
      const combined = services.map(service => {
        const customer = customers.find(c => c.id === service.customer_id);
        
        // Extract vehicle information from service description
        const vehicleInfo = extractVehicleInfo(service.description, service.vehicle_number);

        return {
          id: service.id,
          job_card_id: service.job_card_number || `JOB-${service.id.slice(-6)}`,
          customer_name: customer?.name || 'Unknown',
          phone_number: customer?.phone || 'N/A',
          vehicle_brand: vehicleInfo.brand,
          vehicle_model: vehicleInfo.model,
          vehicle_year: vehicleInfo.year,
          vehicle_reg_no: service.vehicle_number || 'N/A',
          complaint: vehicleInfo.complaint || service.description || 'No complaint specified',
          status: service.status || 'pending',
          service_type: service.service_type,
          amount: service.amount,
          service_date: service.service_date,
          completion_date: service.completion_date,
          created_by: service.created_by,
          customer_address: customer?.address || 'N/A'
        };
      });

      setJobCards(combined);
      setCustomers(customers);
    } catch (error) {
      toast.error('Failed to fetch job cards data');
    } finally {
      setLoading(false);
    }
  };

  const extractVehicleInfo = (description, vehicleNumber) => {
    const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];
    let brand = 'N/A';
    let model = 'N/A';
    let year = 'N/A';
    let complaint = 'General service';

    if (description) {
      // Find brand in description
      const foundBrand = brands.find(b => description.toUpperCase().includes(b));
      if (foundBrand) {
        brand = foundBrand;
        
        // Try to extract model (text after brand, before year or dash)
        const brandIndex = description.toUpperCase().indexOf(foundBrand);
        const afterBrand = description.substring(brandIndex + foundBrand.length).trim();
        const modelMatch = afterBrand.match(/^([A-Za-z0-9\s+\-]+?)(?:\s*\(|\s*-|$)/);
        if (modelMatch) {
          model = modelMatch[1].trim();
        }
        
        // Try to extract year (4 digits in parentheses)
        const yearMatch = description.match(/\((\d{4})\)/);
        if (yearMatch) {
          year = yearMatch[1];
        }
        
        // Extract complaint (text after the dash or after vehicle info)
        const complaintMatch = description.match(/(?:-\s*(.+)|(?:\(\d{4}\)\s*-?\s*(.+)))/);
        if (complaintMatch) {
          complaint = complaintMatch[1] || complaintMatch[2] || complaint;
        }
      } else {
        // If no brand found, treat entire description as complaint
        complaint = description;
      }
    }

    return { brand, model, year, complaint };
  };

  const filterJobCards = () => {
    let filtered = jobCards;

    if (searchTerm) {
      filtered = jobCards.filter(job =>
        job.job_card_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobCards(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleViewJobCard = (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowViewModal(true);
  };

  const handleEditJobCard = (jobCard) => {
    setEditingJobCard(jobCard);
    setEditFormData({
      customer_id: customers.find(c => c.name === jobCard.customer_name)?.id || '',
      vehicle_number: jobCard.vehicle_reg_no,
      service_type: jobCard.service_type,
      description: jobCard.complaint,
      amount: jobCard.amount
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingJobCard) return;
    
    try {
      setLoading(true);
      await axios.put(`${API}/services/${editingJobCard.id}`, editFormData);
      toast.success('Job card updated successfully!');
      setShowEditModal(false);
      setEditingJobCard(null);
      setEditFormData({});
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update job card');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingJobCard(null);
    setEditFormData({});
  };

  const handleAddNewJob = () => {
    setShowAddModal(true);
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await axios.put(`${API}/services/${jobId}/status`, { status: newStatus });
      toast.success('Job card status updated successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update job card status');
    }
  };

  const exportJobCards = () => {
    try {
      const csvContent = [
        ['Job Card ID', 'Customer Name', 'Phone Number', 'Vehicle Brand', 'Vehicle Model', 'Vehicle Year', 'Vehicle Reg No', 'Complaint', 'Status', 'Amount'].join(','),
        ...filteredJobCards.map(job => [
          job.job_card_id || '',
          job.customer_name || '',
          job.phone_number || '',
          job.vehicle_brand || '',
          job.vehicle_model || '',
          job.vehicle_year || '',
          job.vehicle_reg_no || '',
          job.complaint || '',
          job.status || '',
          job.amount || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_cards_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Job cards exported successfully!');
    } catch (error) {
      toast.error('Failed to export job cards');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const pendingCount = jobCards.filter(job => job.status === 'pending').length;
  const inProgressCount = jobCards.filter(job => job.status === 'in_progress').length;
  const completedCount = jobCards.filter(job => job.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Cards Management</h2>
          <p className="text-gray-600">Manage and track all service job cards</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNewJob} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Job
          </Button>
          <Button onClick={exportJobCards} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by job card ID, customer name, phone, vehicle details, complaint, or status..."
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
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Job Cards</p>
                <p className="text-2xl font-bold text-gray-900">{jobCards.length}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
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
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Job Cards ({filteredJobCards.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Job Card ID</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Brand</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Vehicle Year</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Complaint</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobCards.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No job cards found matching your search' : 'No job cards found'}
                    </td>
                  </tr>
                ) : (
                  filteredJobCards.map((jobCard) => (
                    <tr key={jobCard.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <span className="font-medium text-blue-600">{jobCard.job_card_id}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{jobCard.customer_name}</div>
                      </td>
                      <td className="p-3 text-gray-600">{jobCard.phone_number}</td>
                      <td className="p-3">
                        <span className={`font-medium ${jobCard.vehicle_brand !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {jobCard.vehicle_brand}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{jobCard.vehicle_model}</td>
                      <td className="p-3 text-gray-600">{jobCard.vehicle_year}</td>
                      <td className="p-3 text-gray-600 font-mono">{jobCard.vehicle_reg_no}</td>
                      <td className="p-3 max-w-xs">
                        <div className="truncate" title={jobCard.complaint}>
                          {jobCard.complaint}
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(jobCard.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewJobCard(jobCard)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditJobCard(jobCard)}
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

      {/* View Job Card Modal */}
      {showViewModal && selectedJobCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Job Card Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Job Card Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Job Card Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Job Card ID:</strong> {selectedJobCard.job_card_id}</div>
                    <div><strong>Service Date:</strong> {new Date(selectedJobCard.service_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Service Type:</strong> {selectedJobCard.service_type?.replace('_', ' ')}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedJobCard.status)}</div>
                    {selectedJobCard.completion_date && (
                      <div><strong>Completion Date:</strong> {new Date(selectedJobCard.completion_date).toLocaleDateString('en-IN')}</div>
                    )}
                    <div><strong>Amount:</strong> ₹{selectedJobCard.amount?.toLocaleString() || '0'}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedJobCard.customer_name}</div>
                    <div><strong>Phone:</strong> {selectedJobCard.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedJobCard.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Brand:</strong> {selectedJobCard.vehicle_brand}</div>
                    <div><strong>Model:</strong> {selectedJobCard.vehicle_model}</div>
                    <div><strong>Year:</strong> {selectedJobCard.vehicle_year}</div>
                    <div><strong>Registration No:</strong> {selectedJobCard.vehicle_reg_no}</div>
                  </div>
                </div>

                {/* Complaint/Service Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Service Details</h3>
                  <div>
                    <strong>Complaint/Description:</strong>
                    <p className="mt-1 text-gray-600">{selectedJobCard.complaint}</p>
                  </div>
                </div>

                {/* Status Update Actions */}
                {selectedJobCard.status !== 'completed' && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-600">Update Status</h3>
                    <div className="flex gap-2">
                      {selectedJobCard.status === 'pending' && (
                        <Button
                          onClick={() => {
                            updateJobStatus(selectedJobCard.id, 'in_progress');
                            setShowViewModal(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Work
                        </Button>
                      )}
                      {selectedJobCard.status === 'in_progress' && (
                        <Button
                          onClick={() => {
                            updateJobStatus(selectedJobCard.id, 'completed');
                            setShowViewModal(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditJobCard(selectedJobCard);
                  }}
                >
                  Edit Job Card
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Job Card</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="text-center py-8">
                <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Job Card</h3>
                <p className="text-gray-500 mb-4">
                  To add a new job card, please use the "New Service" registration form.
                  This will automatically create a job card with all necessary details.
                </p>
                <div className="flex gap-2 justify-center">
                  <Link to="/services/new">
                    <Button onClick={() => setShowAddModal(false)}>
                      Go to New Service
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Card Modal */}
      {showEditModal && editingJobCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Job Card</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select 
                    value={editFormData.customer_id} 
                    onValueChange={(value) => setEditFormData({...editFormData, customer_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle_number">Vehicle Registration Number</Label>
                  <Input
                    id="vehicle_number"
                    placeholder="Enter vehicle registration number"
                    value={editFormData.vehicle_number || ''}
                    onChange={(e) => setEditFormData({...editFormData, vehicle_number: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service_type">Service Type</Label>
                  <Select 
                    value={editFormData.service_type} 
                    onValueChange={(value) => setEditFormData({...editFormData, service_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular_service">Regular Service</SelectItem>
                      <SelectItem value="oil_change">Oil Change</SelectItem>
                      <SelectItem value="brake_service">Brake Service</SelectItem>
                      <SelectItem value="engine_repair">Engine Repair</SelectItem>
                      <SelectItem value="electrical_work">Electrical Work</SelectItem>
                      <SelectItem value="body_work">Body Work</SelectItem>
                      <SelectItem value="tire_replacement">Tire Replacement</SelectItem>
                      <SelectItem value="chain_sprocket">Chain & Sprocket</SelectItem>
                      <SelectItem value="clutch_service">Clutch Service</SelectItem>
                      <SelectItem value="suspension_service">Suspension Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter service amount"
                    value={editFormData.amount || ''}
                    onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Complaint/Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter complaint or service description"
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows={4}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ServicesBilling = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [customers, setCustomers] = useState([]);
  const [serviceBills, setServiceBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [billItems, setBillItems] = useState([{
    sl_no: 1,
    description: '',
    hsn_sac: '',
    qty: 1,
    unit: 'Nos',
    rate: 0,
    labor: 0,
    disc_percent: 0,
    gst_percent: 18,
    cgst_amount: 0,
    sgst_amount: 0,
    total_tax: 0,
    amount: 0
  }]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [billNumber, setBillNumber] = useState(`SB-${Date.now().toString().slice(-6)}`);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const units = ['Nos', 'Kgs', 'Ltrs', 'Hrs', 'Days', 'Pcs'];
  const gstRates = [0, 5, 12, 18, 28];

  useEffect(() => {
    fetchCustomers();
    if (activeTab === 'view') {
      fetchServiceBills();
    }
  }, [activeTab]);

  useEffect(() => {
    filterBills();
  }, [serviceBills, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const fetchServiceBills = async () => {
    try {
      setLoading(true);
      // For now, we'll use service registrations as service bills
      // In a real application, you'd have a separate service_bills collection
      const response = await axios.get(`${API}/services`);
      setServiceBills(response.data);
    } catch (error) {
      toast.error('Failed to fetch service bills');
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = serviceBills;

    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.job_card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBills(filtered);
  };

  const calculateItemAmounts = (item) => {
    const baseAmount = (item.qty * item.rate) + item.labor;
    const discountAmount = (baseAmount * item.disc_percent) / 100;
    const taxableAmount = baseAmount - discountAmount;
    
    const gstAmount = (taxableAmount * item.gst_percent) / 100;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    const totalTax = cgstAmount + sgstAmount;
    const finalAmount = taxableAmount + totalTax;

    return {
      cgst_amount: parseFloat(cgstAmount.toFixed(2)),
      sgst_amount: parseFloat(sgstAmount.toFixed(2)),
      total_tax: parseFloat(totalTax.toFixed(2)),
      amount: parseFloat(finalAmount.toFixed(2))
    };
  };

  const updateBillItem = (index, field, value) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amounts for this item
    const calculatedAmounts = calculateItemAmounts(updatedItems[index]);
    updatedItems[index] = { ...updatedItems[index], ...calculatedAmounts };
    
    setBillItems(updatedItems);
  };

  const addBillItem = () => {
    const newItem = {
      sl_no: billItems.length + 1,
      description: '',
      hsn_sac: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      labor: 0,
      disc_percent: 0,
      gst_percent: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      total_tax: 0,
      amount: 0
    };
    setBillItems([...billItems, newItem]);
  };

  const removeBillItem = (index) => {
    if (billItems.length > 1) {
      const updatedItems = billItems.filter((_, i) => i !== index);
      // Update serial numbers
      const reNumberedItems = updatedItems.map((item, i) => ({
        ...item,
        sl_no: i + 1
      }));
      setBillItems(reNumberedItems);
    }
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.qty * item.rate) + item.labor, 0);
    const totalDiscount = billItems.reduce((sum, item) => sum + ((item.qty * item.rate + item.labor) * item.disc_percent / 100), 0);
    const totalCGST = billItems.reduce((sum, item) => sum + item.cgst_amount, 0);
    const totalSGST = billItems.reduce((sum, item) => sum + item.sgst_amount, 0);
    const totalTax = billItems.reduce((sum, item) => sum + item.total_tax, 0);
    const grandTotal = billItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalCGST: parseFloat(totalCGST.toFixed(2)),
      totalSGST: parseFloat(totalSGST.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const handleSaveBill = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (billItems.length === 0 || billItems.every(item => !item.description)) {
      toast.error('Please add at least one item with description');
      return;
    }

    setLoading(true);
    try {
      // Create a service bill record (you might need to create a new API endpoint for this)
      const billData = {
        bill_number: billNumber,
        bill_date: billDate,
        customer_id: selectedCustomer,
        items: billItems,
        totals: calculateTotals()
      };

      // For now, we'll create a service record with the bill details
      await axios.post(`${API}/services`, {
        customer_id: selectedCustomer,
        vehicle_number: 'Service Bill',
        service_type: 'billing',
        description: `Service Bill ${billNumber} - ${billItems.length} items`,
        amount: calculateTotals().grandTotal
      });

      toast.success('Service bill saved successfully!');
      
      // Reset form
      setBillItems([{
        sl_no: 1,
        description: '',
        hsn_sac: '',
        qty: 1,
        unit: 'Nos',
        rate: 0,
        labor: 0,
        disc_percent: 0,
        gst_percent: 18,
        cgst_amount: 0,
        sgst_amount: 0,
        total_tax: 0,
        amount: 0
      }]);
      setSelectedCustomer('');
      setBillNumber(`SB-${Date.now().toString().slice(-6)}`);
      setBillDate(new Date().toISOString().split('T')[0]);
      
    } catch (error) {
      toast.error('Failed to save service bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-1">
        <div className="flex gap-1">
          <Button 
            variant={activeTab === 'create' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('create')}
          >
            Create Bill
          </Button>
          <Button 
            variant={activeTab === 'view' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setActiveTab('view')}
          >
            View Bills
          </Button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <CreateBillContent 
          customers={customers}
          billItems={billItems}
          setBillItems={setBillItems}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          billNumber={billNumber}
          setBillNumber={setBillNumber}
          billDate={billDate}
          setBillDate={setBillDate}
          loading={loading}
          calculateItemAmounts={calculateItemAmounts}
          calculateTotals={calculateTotals}
          updateBillItem={updateBillItem}
          addBillItem={addBillItem}
          removeBillItem={removeBillItem}
          handleSaveBill={handleSaveBill}
          handlePrintBill={handlePrintBill}
          units={units}
          gstRates={gstRates}
        />
      ) : (
        <ViewBillsContent 
          serviceBills={filteredBills}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
        />
      )}
    </div>
  );
};

const CreateBillContent = ({ 
  customers, billItems, setBillItems, selectedCustomer, setSelectedCustomer,
  billNumber, setBillNumber, billDate, setBillDate, loading,
  calculateItemAmounts, calculateTotals, updateBillItem, addBillItem, removeBillItem,
  handleSaveBill, handlePrintBill, units, gstRates
}) => {
  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Service Bill</h2>
          <p className="text-gray-600">Create GST-compliant service bills</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrintBill} variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Bill
          </Button>
          <Button onClick={handleSaveBill} disabled={loading} className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Bill'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bill Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bill_number">Bill Number</Label>
              <Input
                id="bill_number"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="Enter bill number"
              />
            </div>
            <div>
              <Label htmlFor="bill_date">Bill Date</Label>
              <Input
                id="bill_date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left font-semibold">Sl. No.</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Description of Goods</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">HSN/SAC</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Qty.</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Unit</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Rate</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Labor</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Disc%</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">GST%</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">CGST Amount</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">SGST Amount</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Total Tax</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Amount</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 text-center font-medium">{item.sl_no}</td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                        placeholder="Enter description"
                        className="border-0 p-1"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.hsn_sac}
                        onChange={(e) => updateBillItem(index, 'hsn_sac', e.target.value)}
                        placeholder="HSN/SAC"
                        className="border-0 p-1 w-20"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateBillItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-16"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Select value={item.unit} onValueChange={(value) => updateBillItem(index, 'unit', value)}>
                        <SelectTrigger className="border-0 p-1 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-20"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.labor}
                        onChange={(e) => updateBillItem(index, 'labor', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-20"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.disc_percent}
                        onChange={(e) => updateBillItem(index, 'disc_percent', parseFloat(e.target.value) || 0)}
                        className="border-0 p-1 w-16"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Select value={item.gst_percent.toString()} onValueChange={(value) => updateBillItem(index, 'gst_percent', parseFloat(value))}>
                        <SelectTrigger className="border-0 p-1 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gstRates.map((rate) => (
                            <SelectItem key={rate} value={rate.toString()}>
                              {rate}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-medium">₹{item.cgst_amount}</td>
                    <td className="border border-gray-300 p-2 text-right font-medium">₹{item.sgst_amount}</td>
                    <td className="border border-gray-300 p-2 text-right font-medium">₹{item.total_tax}</td>
                    <td className="border border-gray-300 p-2 text-right font-bold">₹{item.amount}</td>
                    <td className="border border-gray-300 p-2 text-center no-print">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeBillItem(index)}
                        disabled={billItems.length === 1}
                        className="w-8 h-8 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Item Button */}
          <div className="no-print">
            <Button onClick={addBillItem} variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          {/* Bill Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div></div>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b">
                <span>Subtotal:</span>
                <span className="font-medium">₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total Discount:</span>
                <span className="font-medium text-red-600">-₹{totals.totalDiscount}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total CGST:</span>
                <span className="font-medium">₹{totals.totalCGST}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total SGST:</span>
                <span className="font-medium">₹{totals.totalSGST}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Total Tax:</span>
                <span className="font-medium">₹{totals.totalTax}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-400">
                <span className="font-bold text-lg">Grand Total:</span>
                <span className="font-bold text-lg text-green-600">₹{totals.grandTotal}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ViewBillsContent = ({ serviceBills, searchTerm, setSearchTerm, loading }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Bills</h2>
          <p className="text-gray-600">View all service bills and invoices</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Job Card #</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Vehicle</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Service Type</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Amount</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      Loading service bills...
                    </td>
                  </tr>
                ) : serviceBills.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      No service bills found
                    </td>
                  </tr>
                ) : (
                  serviceBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-blue-600">
                        {bill.job_card_number || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        {bill.customer_name || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {bill.vehicle_reg_no || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {bill.service_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-medium text-green-600">
                        ₹{bill.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bill.status === 'completed' ? 'bg-green-100 text-green-800' :
                          bill.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bill.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
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

      {serviceBills.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Showing {serviceBills.length} service bills</span>
          <span>Total Revenue: ₹{serviceBills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

const ServiceDue = () => {
  const [dueServices, setDueServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'overdue', 'due_soon'

  useEffect(() => {
    fetchDueServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [dueServices, searchTerm]);

  const fetchDueServices = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [servicesResponse, salesResponse, customersResponse] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/sales`),  // To get purchase dates
        axios.get(`${API}/customers`)
      ]);
      
      const services = servicesResponse.data;
      const sales = salesResponse.data;
      const customers = customersResponse.data;
      const today = new Date();
      
      // Create a map of vehicles with their purchase dates and latest service dates
      const vehicleServiceMap = {};
      
      // First, populate with purchase dates from sales
      sales.forEach(sale => {
        if (sale.vehicle_id) {
          vehicleServiceMap[sale.vehicle_id] = {
            purchase_date: new Date(sale.created_at),
            latest_service_date: null,
            customer_name: customers.find(c => c.id === sale.customer_id)?.name || 'Unknown',
            vehicle_details: sale.vehicle_id
          };
        }
      });
      
      // Then, update with latest service dates
      services.forEach(service => {
        const customer = customers.find(c => c.id === service.customer_id);
        const customerName = customer?.name || service.customer_name || 'Unknown';
        const serviceDate = new Date(service.completion_date || service.created_at);
        
        // Create a unique key for each customer-vehicle combination
        const vehicleKey = `${service.customer_id}-${service.vehicle_reg_no}`;
        
        if (!vehicleServiceMap[vehicleKey]) {
          vehicleServiceMap[vehicleKey] = {
            purchase_date: null,
            latest_service_date: serviceDate,
            customer_name: customerName,
            vehicle_details: service.vehicle_reg_no
          };
        } else {
          // Update with the latest service date
          if (!vehicleServiceMap[vehicleKey].latest_service_date || 
              serviceDate > vehicleServiceMap[vehicleKey].latest_service_date) {
            vehicleServiceMap[vehicleKey].latest_service_date = serviceDate;
          }
          vehicleServiceMap[vehicleKey].customer_name = customerName;
        }
      });
      
      // Calculate due dates based on business rules
      const vehiclesWithDueDates = Object.keys(vehicleServiceMap).map(vehicleKey => {
        const vehicleData = vehicleServiceMap[vehicleKey];
        let baseDate, dueDate, serviceType;
        
        if (vehicleData.latest_service_date) {
          // Rule: 90 days from the date of last service
          baseDate = vehicleData.latest_service_date;
          dueDate = new Date(baseDate);
          dueDate.setDate(baseDate.getDate() + 90);
          serviceType = 'Regular Service (90 days from last service)';
        } else if (vehicleData.purchase_date) {
          // Rule: 30 days from the date of purchase
          baseDate = vehicleData.purchase_date;
          dueDate = new Date(baseDate);
          dueDate.setDate(baseDate.getDate() + 30);
          serviceType = 'First Service (30 days from purchase)';
        } else {
          // Skip vehicles without purchase or service dates
          return null;
        }
        
        const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          id: vehicleKey,
          customer_name: vehicleData.customer_name,
          vehicle_reg_no: vehicleData.vehicle_details,
          last_service_date: vehicleData.latest_service_date,
          purchase_date: vehicleData.purchase_date,
          base_date: baseDate,
          due_date: dueDate,
          days_until_due: daysDifference,
          is_overdue: daysDifference < 0,
          is_due_soon: daysDifference >= 0 && daysDifference <= 7,
          service_type: serviceType
        };
      }).filter(vehicle => vehicle !== null);
      
      // Sort by priority: overdue first, then due soon, then by due date
      vehiclesWithDueDates.sort((a, b) => {
        if (a.is_overdue && !b.is_overdue) return -1;
        if (!a.is_overdue && b.is_overdue) return 1;
        if (a.is_due_soon && !b.is_due_soon) return -1;
        if (!a.is_due_soon && b.is_due_soon) return 1;
        return a.due_date - b.due_date;
      });

      setDueServices(vehiclesWithDueDates);
    } catch (error) {
      toast.error('Failed to fetch service due information');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = dueServices;

    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleSendReminder = (service) => {
    // In a real application, this would send SMS/email reminder
    toast.success(`Reminder sent to ${service.customer_name} for ${service.vehicle_reg_no}`);
  };

  const getDueDateColor = (service) => {
    if (service.is_overdue) return 'text-red-600 bg-red-50';
    if (service.is_due_soon) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getDueDateText = (service) => {
    if (service.is_overdue) {
      return `Overdue by ${Math.abs(service.days_until_due)} days`;
    }
    if (service.is_due_soon) {
      return `Due in ${service.days_until_due} days`;
    }
    return `Due in ${service.days_until_due} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Due Reminders</h2>
          <p className="text-gray-600">Track service due dates: 30 days from purchase, 90 days from last service</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={fetchDueServices}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Services</p>
                <p className="text-2xl font-bold text-red-600">
                  {dueServices.filter(s => s.is_overdue).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dueServices.filter(s => s.is_due_soon).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tracked</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dueServices.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Due Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Customer</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Vehicle</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Base Date</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Service Type</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Due Date</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      Loading service due information...
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      No services due found
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-900">
                        {service.customer_name || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {service.vehicle_reg_no || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {service.base_date ? 
                          new Date(service.base_date).toLocaleDateString() : 
                          'N/A'
                        }
                        <br />
                        <span className="text-xs text-gray-400">
                          {service.last_service_date ? 'Last Service' : 'Purchase Date'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.last_service_date ? 'Regular Service' : 'First Service'}
                        </span>
                        <br />
                        <span className="text-xs text-gray-500">
                          {service.last_service_date ? '90 days cycle' : '30 days from purchase'}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {service.due_date.toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDueDateColor(service)}`}>
                          {getDueDateText(service)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendReminder(service)}
                          >
                            Send Reminder
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4" />
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
    </div>
  );
};

export default Services;