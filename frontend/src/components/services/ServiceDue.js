import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import { Search, Edit, Edit2, Check, Calendar, AlertTriangle, Users, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const ServiceDue = () => {
  const [dueServices, setDueServices] = useState([]);
  const [dismissedKeys, setDismissedKeys] = useState(new Set());
  const [baseDateOverrides, setBaseDateOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'overdue', 'due_soon'
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Edit base date state
  const [editingBaseDateId, setEditingBaseDateId] = useState(null);
  const [editBaseDateValue, setEditBaseDateValue] = useState('');

  useEffect(() => {
    fetchDueServices();
    fetchDismissedRecords();
    fetchBaseDateOverrides();
  }, []);

  useEffect(() => {
    filterServices();
  }, [dueServices, searchTerm, activeFilter, dismissedKeys, baseDateOverrides]);

  const fetchBaseDateOverrides = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/service-due-base-date`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const overridesMap = {};
      response.data.forEach(o => {
        overridesMap[o.service_due_key] = o.custom_base_date;
      });
      setBaseDateOverrides(overridesMap);
    } catch (error) {
      console.error('Failed to fetch base date overrides:', error);
    }
  };

  const fetchDismissedRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dismissed-service-due`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const keys = new Set(response.data.map(d => d.service_due_key));
      setDismissedKeys(keys);
    } catch (error) {
      console.error('Failed to fetch dismissed records:', error);
    }
  };

  const fetchDueServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all necessary data
      const [servicesResponse, salesResponse, customersResponse] = await Promise.all([
        axios.get(`${API}/services`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const services = servicesResponse.data;
      const sales = salesResponse.data;
      const customers = customersResponse.data.data || customersResponse.data;
      const today = new Date();
      
      // Create a map of vehicles with their purchase dates and latest service dates
      const vehicleServiceMap = {};
      
      // First, populate with purchase dates from sales
      sales.forEach(sale => {
        if (sale && sale.vehicle_id && sale.created_at) {
          vehicleServiceMap[sale.vehicle_id] = {
            purchase_date: new Date(sale.created_at),
            latest_service_date: null,
            customer_name: customers.find(c => c && c.id === sale.customer_id)?.name || 'Unknown',
            vehicle_details: sale.vehicle_id
          };
        }
      });
      
      // Then, update with latest service dates
      services.forEach(service => {
        if (service && service.customer_id && service.vehicle_number) {
          const customer = customers.find(c => c && c.id === service.customer_id);
          const customerName = customer?.name || service.customer_name || 'Unknown';
          
          // Skip services without valid dates
          const serviceDateStr = service.completion_date || service.service_date || service.created_at;
          if (!serviceDateStr) return;
          
          const serviceDate = new Date(serviceDateStr);
          
          // Skip if date is invalid
          if (isNaN(serviceDate.getTime())) return;
          
          // Create a unique key for each customer-vehicle combination
          const vehicleKey = `${service.customer_id}-${service.vehicle_number}`;
          
          if (!vehicleServiceMap[vehicleKey]) {
            vehicleServiceMap[vehicleKey] = {
              purchase_date: null,
              latest_service_date: serviceDate,
              customer_name: customerName,
              vehicle_details: service.vehicle_number,
              customer_id: service.customer_id
            };
          } else {
            // Update with the latest service date
            if (!vehicleServiceMap[vehicleKey].latest_service_date || 
                serviceDate > vehicleServiceMap[vehicleKey].latest_service_date) {
              vehicleServiceMap[vehicleKey].latest_service_date = serviceDate;
            }
            vehicleServiceMap[vehicleKey].customer_name = customerName;
            vehicleServiceMap[vehicleKey].customer_id = service.customer_id;
          }
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
          customer_name: vehicleData.customer_name || 'Unknown',
          vehicle_reg_no: vehicleData.vehicle_details || 'N/A',
          last_service_date: vehicleData.latest_service_date,
          purchase_date: vehicleData.purchase_date,
          base_date: baseDate,
          due_date: dueDate,
          days_until_due: daysDifference,
          is_overdue: daysDifference < 0,
          is_due_soon: daysDifference >= 0 && daysDifference <= 7,
          service_type: serviceType,
          customer_id: vehicleData.customer_id
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

  // Apply base date overrides to due services when overrides are loaded
  useEffect(() => {
    if (Object.keys(baseDateOverrides).length > 0 && dueServices.length > 0) {
      const today = new Date();
      const updatedServices = dueServices.map(service => {
        if (baseDateOverrides[service.id]) {
          const newBaseDate = new Date(baseDateOverrides[service.id]);
          const dueDate = new Date(newBaseDate);
          // Apply the same logic: 90 days for regular service, 30 days for first service
          if (service.last_service_date) {
            dueDate.setDate(newBaseDate.getDate() + 90);
          } else {
            dueDate.setDate(newBaseDate.getDate() + 30);
          }
          const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          return {
            ...service,
            base_date: newBaseDate,
            due_date: dueDate,
            days_until_due: daysDifference,
            is_overdue: daysDifference < 0,
            is_due_soon: daysDifference >= 0 && daysDifference <= 7
          };
        }
        return service;
      });
      
      // Only update if there are actual changes
      const hasChanges = updatedServices.some((s, i) => 
        s.base_date !== dueServices[i].base_date
      );
      
      if (hasChanges) {
        setDueServices(updatedServices);
      }
    }
  }, [baseDateOverrides]);

  const filterServices = () => {
    // First, filter out dismissed records
    let filtered = dueServices.filter(service => !dismissedKeys.has(service.id));

    // Apply status filter
    if (activeFilter === 'overdue') {
      filtered = filtered.filter(service => service.is_overdue);
    } else if (activeFilter === 'due_soon') {
      filtered = filtered.filter(service => service.is_due_soon && !service.is_overdue);
    }
    // 'all' shows everything, no additional filtering needed

    // Then apply search filter
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleEditBaseDate = (service) => {
    setEditingBaseDateId(service.id);
    // Format date for input (YYYY-MM-DD)
    const currentDate = baseDateOverrides[service.id] 
      ? new Date(baseDateOverrides[service.id])
      : new Date(service.base_date);
    setEditBaseDateValue(currentDate.toISOString().split('T')[0]);
  };

  const handleSaveBaseDate = async (service) => {
    if (!editBaseDateValue) {
      toast.error('Please select a date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API}/service-due-base-date`, {
        service_due_key: service.id,
        custom_base_date: new Date(editBaseDateValue).toISOString(),
        notes: 'Manually updated'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      const newBaseDate = new Date(editBaseDateValue);
      setBaseDateOverrides(prev => ({
        ...prev,
        [service.id]: newBaseDate.toISOString()
      }));
      
      // Recalculate the due services with the new base date
      setDueServices(prev => prev.map(s => {
        if (s.id === service.id) {
          const dueDate = new Date(newBaseDate);
          // Apply the same logic: 90 days for regular service, 30 days for first service
          if (s.last_service_date) {
            dueDate.setDate(newBaseDate.getDate() + 90);
          } else {
            dueDate.setDate(newBaseDate.getDate() + 30);
          }
          const today = new Date();
          const daysDifference = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          return {
            ...s,
            base_date: newBaseDate,
            due_date: dueDate,
            days_until_due: daysDifference,
            is_overdue: daysDifference < 0,
            is_due_soon: daysDifference >= 0 && daysDifference <= 7
          };
        }
        return s;
      }));
      
      setEditingBaseDateId(null);
      setEditBaseDateValue('');
      toast.success('Base date updated successfully');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update base date');
    }
  };

  const handleCancelEditBaseDate = () => {
    setEditingBaseDateId(null);
    setEditBaseDateValue('');
  };

  const handleFilterClick = (filterType) => {
    setActiveFilter(filterType);
    // Clear search when changing filters for better UX
    if (filterType !== 'all') {
      setSearchTerm('');
    }
  };

  const handleSendReminder = (service) => {
    // In a real application, this would send SMS/email reminder
    toast.success(`Reminder sent to ${service.customer_name} for ${service.vehicle_reg_no}`);
  };

  const handleDeleteServiceDue = async (service) => {
    if (!window.confirm(`Are you sure you want to remove this service due reminder for ${service.customer_name} (${service.vehicle_reg_no})?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Dismiss the service due record
      await axios.post(`${API}/dismissed-service-due`, {
        service_due_key: service.id,
        customer_id: service.customer_id,
        customer_name: service.customer_name,
        vehicle_reg_no: service.vehicle_reg_no,
        reason: 'Manually dismissed'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      setDismissedKeys(prev => new Set([...prev, service.id]));
      setSelectedIds(prev => prev.filter(id => id !== service.id));
      
      toast.success('Service due record removed from view');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete service due record');
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServices.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${selectedIds.length} service due reminder(s)?`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get the selected services data
      const itemsToDelete = filteredServices
        .filter(s => selectedIds.includes(s.id))
        .map(s => ({
          service_due_key: s.id,
          customer_id: s.customer_id,
          customer_name: s.customer_name,
          vehicle_reg_no: s.vehicle_reg_no,
          reason: 'Bulk dismissed'
        }));
      
      await axios.post(`${API}/dismissed-service-due/bulk`, {
        items: itemsToDelete
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      setDismissedKeys(prev => new Set([...prev, ...selectedIds]));
      setSelectedIds([]);
      setSelectAll(false);
      
      toast.success(`Successfully removed ${itemsToDelete.length} service due record(s)`);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete service due records');
    } finally {
      setBulkDeleting(false);
    }
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
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'overdue' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-red-50'
          }`}
          onClick={() => handleFilterClick('overdue')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Services</p>
                <p className="text-2xl font-bold text-red-600">
                  {dueServices.filter(s => s.is_overdue && !dismissedKeys.has(s.id)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeFilter === 'overdue' ? 'Currently filtered' : 'Click to filter'}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'due_soon' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-yellow-50'
          }`}
          onClick={() => handleFilterClick('due_soon')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dueServices.filter(s => s.is_due_soon && !s.is_overdue && !dismissedKeys.has(s.id)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeFilter === 'due_soon' ? 'Currently filtered' : 'Click to filter'}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-blue-50'
          }`}
          onClick={() => handleFilterClick('all')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tracked</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dueServices.filter(s => !dismissedKeys.has(s.id)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeFilter === 'all' ? 'Showing all' : 'Click to show all'}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Service Due Schedule</CardTitle>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              )}
            </div>
            {activeFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeFilter === 'overdue' ? 'bg-red-100 text-red-800' :
                  activeFilter === 'due_soon' ? 'bg-yellow-100 text-yellow-800' : ''
                }`}>
                  {activeFilter === 'overdue' ? 'Showing Overdue Only' : 
                   activeFilter === 'due_soon' ? 'Showing Due This Week Only' : ''}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFilterClick('all')}
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-500 w-10">
                    <input
                      type="checkbox"
                      checked={selectAll && filteredServices.length > 0}
                      onChange={handleSelectAll}
                      disabled={filteredServices.length === 0}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
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
                    <td colSpan="8" className="p-0">
                      <TableSkeleton rows={5} columns={8} />
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      <EmptyState 
                        title="No services due"
                        description="All vehicles are up to date with their service schedules"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id} className={`hover:bg-gray-50 ${selectedIds.includes(service.id) ? 'bg-blue-50' : ''}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(service.id)}
                          onChange={() => handleSelectItem(service.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3 text-sm font-medium text-gray-900">
                        {service.customer_name || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {service.vehicle_reg_no || 'N/A'}
                      </td>
                      <td className="p-3 text-sm">
                        {editingBaseDateId === service.id ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              type="date"
                              value={editBaseDateValue}
                              onChange={(e) => setEditBaseDateValue(e.target.value)}
                              className="w-36 text-sm"
                            />
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSaveBaseDate(service)}
                                className="text-green-600 hover:bg-green-50 px-2 py-1 h-7"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={handleCancelEditBaseDate}
                                className="text-red-600 hover:bg-red-50 px-2 py-1 h-7"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 rounded p-1 -m-1 group"
                            onClick={() => handleEditBaseDate(service)}
                            title="Click to edit base date"
                          >
                            <div className="flex items-center gap-1">
                              <span className={baseDateOverrides[service.id] ? 'text-purple-600 font-medium' : ''}>
                                {service.base_date ? 
                                  new Date(service.base_date).toLocaleDateString('en-IN') : 
                                  'N/A'
                                }
                              </span>
                              <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xs text-gray-400">
                              {baseDateOverrides[service.id] ? (
                                <span className="text-purple-500">Custom Date</span>
                              ) : (
                                service.last_service_date ? 'Last Service' : 'Purchase Date'
                              )}
                            </span>
                          </div>
                        )}
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
                        {service.due_date ? service.due_date.toLocaleDateString() : 'N/A'}
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteServiceDue(service)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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



export default ServiceDue;
