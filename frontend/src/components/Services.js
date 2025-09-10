import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Services = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/services', icon: Wrench },
    { name: 'New Service', path: '/services/new', icon: Plus },
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
  const [customers, setCustomers] = useState([]);
  const [serviceData, setServiceData] = useState({
    customer_id: '',
    vehicle_number: '',
    service_type: '',
    description: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/services`, {
        ...serviceData,
        amount: parseFloat(serviceData.amount)
      });
      toast.success('Service registered successfully!');
      setServiceData({
        customer_id: '',
        vehicle_number: '',
        service_type: '',
        description: '',
        amount: ''
      });
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
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={serviceData.customer_id} onValueChange={(value) => setServiceData({...serviceData, customer_id: value})}>
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
              <Label htmlFor="vehicle_number">Vehicle Number</Label>
              <Input
                id="vehicle_number"
                placeholder="Enter vehicle number"
                value={serviceData.vehicle_number}
                onChange={(e) => setServiceData({...serviceData, vehicle_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="service_type">Service Type</Label>
              <Select value={serviceData.service_type} onValueChange={(value) => setServiceData({...serviceData, service_type: value})}>
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Estimated Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter estimated amount"
                value={serviceData.amount}
                onChange={(e) => setServiceData({...serviceData, amount: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Service Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the service work required"
              value={serviceData.description}
              onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Register Service'}
          </Button>
        </form>
      </CardContent>
    </Card>
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