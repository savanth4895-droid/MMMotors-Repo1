import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import { Plus, Search, Eye, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Modal states for view and edit functionality
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const [customerData, setCustomerData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    care_of: '',
    mobile: '',
    address: '',
    brand: '',
    model: '',
    color: '',
    chassis_number: '',
    engine_number: '',
    vehicle_no: '',
    insurance_nominee: '',
    relation: '',
    age: ''
  });

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
  const relations = ['father', 'mother', 'spouse', 'son', 'daughter', 'brother', 'sister', 'other'];

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`, {
        params: {
          page: 1,
          limit: 10000,
          sort: 'created_at',
          order: 'desc'
        }
      });
      setCustomers(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`);
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles');
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    if (searchTerm) {
      filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCustomers(filtered);
  };

  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'name':
        // Removed required validation - name is now optional
        if (value.trim() && value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (value.trim() && !/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = 'Name should only contain letters and spaces';
        }
        break;
      
      case 'mobile':
        // Removed required validation - mobile is now optional
        if (value.trim() && !/^\d{10}$/.test(value.trim())) {
          error = 'Enter valid 10-digit mobile number';
        }
        break;
      
      case 'address':
        // Removed required validation - address is now optional
        if (value.trim() && value.trim().length < 10) {
          error = 'Address must be at least 10 characters';
        }
        break;
      
      case 'chassis_number':
        if (value.trim() && !/^[A-Z0-9]{17}$/.test(value.trim())) {
          error = 'Chassis number must be 17 characters (letters and numbers)';
        }
        break;
      
      case 'engine_number':
        if (value.trim() && value.trim().length < 5) {
          error = 'Engine number must be at least 5 characters';
        } else if (value.trim() && !/^[A-Z0-9]+$/.test(value.trim())) {
          error = 'Engine number should only contain letters and numbers';
        }
        break;
      
      case 'vehicle_no':
        if (value.trim() && !/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(value.trim().replace(/\s/g, ''))) {
          error = 'Enter valid vehicle number (e.g., KA05AB1234)';
        }
        break;
      
      case 'age':
        if (value && (isNaN(value) || value < 18 || value > 100)) {
          error = 'Age must be between 18 and 100';
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const errors = {};
    
    // Only validate format if fields have values, no required fields
    Object.keys(customerData).forEach(field => {
      if (customerData[field]) {
        const error = validateField(field, customerData[field]);
        if (error) {
          errors[field] = error;
        }
      }
    });
    
    return errors;
  };

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field and update errors
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: typeof error === 'string' ? error : (error ? 'Invalid input' : '')
    }));
  };

  const resetForm = () => {
    setCustomerData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      care_of: '',
      mobile: '',
      address: '',
      brand: '',
      model: '',
      color: '',
      chassis_number: '',
      engine_number: '',
      vehicle_no: '',
      insurance_nominee: '',
      relation: '',
      age: ''
    });
    setValidationErrors({});
    setTouched({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    // Mark all fields as touched to show errors
    const allTouched = {};
    Object.keys(customerData).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);

    try {
      // Create customer
      const customerResponse = await axios.post(`${API}/customers`, {
        name: customerData.name,
        phone: customerData.mobile,
        email: null,
        address: customerData.address
      });

      // Create vehicle if vehicle details are provided
      if (customerData.brand && customerData.model) {
        await axios.post(`${API}/vehicles`, {
          brand: customerData.brand,
          model: customerData.model,
          chassis_number: customerData.chassis_number,
          engine_number: customerData.engine_number,
          color: customerData.color,
          key_number: 'N/A',
          inbound_location: 'Customer Registration'
        });
      }

      toast.success('Customer details saved successfully!');
      resetForm();
      setShowAddForm(false);
      fetchCustomers();
      fetchVehicles();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to save customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Date', 'Name', 'C/O', 'Mobile', 'Address', 'Email', 'Created Date'].join(','),
        ...customers.map(customer => [
          new Date().toISOString().split('T')[0],
          customer.name || '',
          '', // C/O not stored separately
          customer.mobile || '',
          customer.address || '',
          customer.email || '',
          new Date(customer.created_at).toLocaleDateString()
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Customer data exported successfully!');
    } catch (error) {
      toast.error('Failed to export customer data');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',');
            
            // Basic CSV parsing - in production, use a proper CSV library
            toast.info('Import functionality will process CSV files. Please ensure correct format.');
          } catch (error) {
            toast.error('Failed to parse CSV file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getCustomerVehicle = (customerId) => {
    const vehicle = vehicles.find(v => v.customer_id === customerId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'No vehicle';
  };

  // View customer functionality
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // Delete customer functionality
  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await axios.delete(`${API}/customers/${customer.id}`);
        toast.success('Customer deleted successfully!');
        fetchCustomers(); // Refresh the list
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage || 'Failed to delete customer');
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit customer functionality
  const handleEditCustomer = (customer) => {
    const associatedVehicle = vehicles.find(v => v.customer_id === customer.id);
    
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      care_of: customer.care_of || '',
      mobile: customer.mobile || customer.phone || '',
      address: customer.address || '',
      email: customer.email || '',
      // Vehicle details if associated
      brand: associatedVehicle?.brand || '',
      model: associatedVehicle?.model || '',
      color: associatedVehicle?.color || '',
      chassis_number: associatedVehicle?.chassis_number || '',
      engine_number: associatedVehicle?.engine_number || '',
      vehicle_no: associatedVehicle?.vehicle_no || '',
      // Insurance details
      insurance_nominee: associatedVehicle?.insurance_nominee || '',
      relation: associatedVehicle?.relation || '',
      age: associatedVehicle?.age || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || loading) return;
    
    try {
      setLoading(true);
      
        editingCustomer,
        editFormData,
        API
      });
      
      // Prepare customer data with vehicle and insurance information
      const customerUpdateData = {
        name: editFormData.name?.trim() || '',
        care_of: editFormData.care_of?.trim() || '',
        mobile: editFormData.mobile?.trim() || '',
        address: editFormData.address?.trim() || '',
        email: editFormData.email?.trim() || ''
      };
      
      // Add vehicle information to customer record
      if (editFormData.brand || editFormData.model || editFormData.color || 
          editFormData.chassis_number || editFormData.engine_number || editFormData.vehicle_no) {
        customerUpdateData.vehicle_info = {
          brand: editFormData.brand?.trim() || '',
          model: editFormData.model?.trim() || '',
          color: editFormData.color?.trim() || '',
          vehicle_number: editFormData.vehicle_no?.trim() || '',
          chassis_number: editFormData.chassis_number?.trim() || '',
          engine_number: editFormData.engine_number?.trim() || ''
        };
      }
      
      // Add insurance information to customer record
      if (editFormData.insurance_nominee || editFormData.relation || editFormData.age) {
        customerUpdateData.insurance_info = {
          nominee_name: editFormData.insurance_nominee?.trim() || '',
          relation: editFormData.relation?.trim() || '',
          age: editFormData.age?.trim() || ''
        };
      }
      
      
      const customerResponse = await axios.put(`${API}/customers/${editingCustomer.id}`, customerUpdateData);
      
      // Update associated inventory vehicle if exists (only inventory-specific fields)
      const associatedVehicle = vehicles.find(v => v.customer_id === editingCustomer.id);
      if (associatedVehicle && (editFormData.brand || editFormData.model || editFormData.color || editFormData.chassis_number || editFormData.engine_number)) {
        // Only update inventory vehicle fields that actually exist in Vehicle model
        const vehicleUpdateData = {
          brand: editFormData.brand?.trim() || associatedVehicle.brand,
          model: editFormData.model?.trim() || associatedVehicle.model,
          color: editFormData.color?.trim() || associatedVehicle.color,
          chassis_number: editFormData.chassis_number?.trim() || associatedVehicle.chassis_number,
          engine_number: editFormData.engine_number?.trim() || associatedVehicle.engine_number
          // Note: vehicle_no is not a field in Vehicle model - stored in customer.vehicle_info
          // Note: insurance fields belong to customer, not vehicle
        };
        
        
        const vehicleResponse = await axios.put(`${API}/vehicles/${associatedVehicle.id}`, vehicleUpdateData);
      }
      
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      setEditFormData({});
      fetchCustomers(); // Refresh the list
      fetchVehicles(); // Refresh vehicles too
    } catch (error) {
      console.error('Error saving customer edit:', error);
      console.error('Error response:', error.response?.data);
      toast.error(getErrorMessage(error) || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setEditFormData({});
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customer details and vehicle information</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
          <Button onClick={handleImport} variant="outline" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Import
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View All
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers by name, phone, email, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Customer Details</CardTitle>
            <CardDescription>Complete customer registration with vehicle and insurance information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Date */}
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={customerData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>

              {/* Customer Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter customer name"
                      value={customerData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={touched.name && validationErrors.name ? 'border-red-500' : ''}
                    />
                    {touched.name && validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="care_of">C/O (Care Of)</Label>
                    <Input
                      id="care_of"
                      placeholder="S/O, D/O, W/O"
                      value={customerData.care_of}
                      onChange={(e) => handleInputChange('care_of', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={customerData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                    />
                    {touched.mobile && validationErrors.mobile && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.mobile}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter complete address"
                      value={customerData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={touched.address && validationErrors.address ? 'border-red-500' : ''}
                    />
                    {touched.address && validationErrors.address && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={customerData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
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
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="Enter model name"
                      value={customerData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="Enter color"
                      value={customerData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chassis_number">Chassis No</Label>
                    <Input
                      id="chassis_number"
                      placeholder="Enter chassis number (17 characters)"
                      value={customerData.chassis_number}
                      onChange={(e) => handleInputChange('chassis_number', e.target.value.toUpperCase())}
                      className={touched.chassis_number && validationErrors.chassis_number ? 'border-red-500' : ''}
                    />
                    {touched.chassis_number && validationErrors.chassis_number && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.chassis_number}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="engine_number">Engine No</Label>
                    <Input
                      id="engine_number"
                      placeholder="Enter engine number"
                      value={customerData.engine_number}
                      onChange={(e) => handleInputChange('engine_number', e.target.value.toUpperCase())}
                      className={touched.engine_number && validationErrors.engine_number ? 'border-red-500' : ''}
                    />
                    {touched.engine_number && validationErrors.engine_number && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.engine_number}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="vehicle_no">Vehicle No</Label>
                    <Input
                      id="vehicle_no"
                      placeholder="Enter vehicle registration number (e.g., KA05AB1234)"
                      value={customerData.vehicle_no}
                      onChange={(e) => handleInputChange('vehicle_no', e.target.value.toUpperCase())}
                      className={touched.vehicle_no && validationErrors.vehicle_no ? 'border-red-500' : ''}
                    />
                    {touched.vehicle_no && validationErrors.vehicle_no && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.vehicle_no}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Insurance Nominee Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Insurance Nominee Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="insurance_nominee">Insurance Nominee Name</Label>
                    <Input
                      id="insurance_nominee"
                      placeholder="Enter nominee name"
                      value={customerData.insurance_nominee}
                      onChange={(e) => handleInputChange('insurance_nominee', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relation">Relation</Label>
                    <Select value={customerData.relation} onValueChange={(value) => handleInputChange('relation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation.charAt(0).toUpperCase() + relation.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter age"
                      value={customerData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  {loading ? 'Saving...' : 'Save Customer Details'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Reset Form
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Phone</th>
                  <th className="text-left p-3 font-semibold">Address</th>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Created Date</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-0">
                      <TableSkeleton rows={5} columns={6} />
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      <EmptyState 
                        title={searchTerm ? 'No customers found' : 'No customers yet'}
                        description={searchTerm ? 'Try adjusting your search terms' : 'Add a customer to get started'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{customer.name}</div>
                          {customer.vehicle_info && Object.keys(customer.vehicle_info).some(key => customer.vehicle_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Has Vehicle Details from Import">
                              🏍️
                            </span>
                          )}
                          {customer.insurance_info && Object.keys(customer.insurance_info).some(key => customer.insurance_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800" title="Has Insurance Nominee Details from Import">
                              🛡️
                            </span>
                          )}
                          {customer.sales_info && Object.keys(customer.sales_info).some(key => customer.sales_info[key]) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800" title="Has Sales Information from Import">
                              💰
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{customer.mobile}</td>
                      <td className="p-3 text-gray-600">{customer.address}</td>
                      <td className="p-3 text-gray-600">{getCustomerVehicle(customer.id)}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(customer.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewCustomer(customer)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditCustomer(customer)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteCustomer(customer)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
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

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customer Details</h2>
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      👤 Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.name || 'N/A'}</div>
                      <div><strong>Care Of:</strong> {selectedCustomer.care_of || 'N/A'}</div>
                      <div><strong>Mobile:</strong> {selectedCustomer.mobile || selectedCustomer.phone || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                      <div><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</div>
                      <div><strong>Date Added:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  {/* Vehicle Details from Import */}
                  {selectedCustomer.vehicle_info && Object.keys(selectedCustomer.vehicle_info).some(key => selectedCustomer.vehicle_info[key]) && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        🏍️ Vehicle Details (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Brand:</strong> {selectedCustomer.vehicle_info.brand || 'N/A'}</div>
                        <div><strong>Model:</strong> {selectedCustomer.vehicle_info.model || 'N/A'}</div>
                        <div><strong>Color:</strong> {selectedCustomer.vehicle_info.color || 'N/A'}</div>
                        <div><strong>Vehicle Number:</strong> {selectedCustomer.vehicle_info.vehicle_number || 'N/A'}</div>
                        <div><strong>Chassis Number:</strong> {selectedCustomer.vehicle_info.chassis_number || 'N/A'}</div>
                        <div><strong>Engine Number:</strong> {selectedCustomer.vehicle_info.engine_number || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Associated Vehicle from Inventory */}
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      🚗 Associated Vehicle (Inventory)
                    </h3>
                    {(() => {
                      const customerVehicle = vehicles.find(v => v.customer_id === selectedCustomer.id);
                      if (customerVehicle) {
                        return (
                          <div className="space-y-2">
                            <div><strong>Brand:</strong> {customerVehicle.brand || 'N/A'}</div>
                            <div><strong>Model:</strong> {customerVehicle.model || 'N/A'}</div>
                            <div><strong>Color:</strong> {customerVehicle.color || 'N/A'}</div>
                            <div><strong>Vehicle No:</strong> {customerVehicle.vehicle_no || 'N/A'}</div>
                            <div><strong>Chassis No:</strong> {customerVehicle.chassis_number || 'N/A'}</div>
                            <div><strong>Engine No:</strong> {customerVehicle.engine_number || 'N/A'}</div>
                          </div>
                        );
                      } else {
                        return <p className="text-gray-500">No vehicle associated with this customer in inventory</p>;
                      }
                    })()}
                  </div>
                  
                  {/* Insurance Nominee Details from Import */}
                  {selectedCustomer.insurance_info && Object.keys(selectedCustomer.insurance_info).some(key => selectedCustomer.insurance_info[key]) && (
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                        🛡️ Insurance Nominee Details (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Nominee Name:</strong> {selectedCustomer.insurance_info.nominee_name || 'N/A'}</div>
                        <div><strong>Relation:</strong> {selectedCustomer.insurance_info.relation || 'N/A'}</div>
                        <div><strong>Age:</strong> {selectedCustomer.insurance_info.age || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Sales Information from Import */}
                  {selectedCustomer.sales_info && Object.keys(selectedCustomer.sales_info).some(key => selectedCustomer.sales_info[key]) && (
                    <div className="border rounded-lg p-4 bg-orange-50">
                      <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                        💰 Sales Information (From Import)
                      </h3>
                      <div className="space-y-2">
                        <div><strong>Amount:</strong> {selectedCustomer.sales_info.amount ? `₹${selectedCustomer.sales_info.amount}` : 'N/A'}</div>
                        <div><strong>Payment Method:</strong> {selectedCustomer.sales_info.payment_method || 'N/A'}</div>
                        <div><strong>Hypothecation:</strong> {selectedCustomer.sales_info.hypothecation || 'N/A'}</div>
                        <div><strong>Sale Date:</strong> {selectedCustomer.sales_info.sale_date || 'N/A'}</div>
                        <div><strong>Invoice Number:</strong> {selectedCustomer.sales_info.invoice_number || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteCustomer(selectedCustomer);
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Customer
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditCustomer(selectedCustomer);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Edit Customer
                  </Button>
                  <Button onClick={() => setShowViewModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Customer</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Details Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    👤 Customer Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_name">Customer Name</Label>
                      <Input
                        id="edit_name"
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_care_of">Care Of (C/O)</Label>
                      <Input
                        id="edit_care_of"
                        type="text"
                        value={editFormData.care_of || ''}
                        onChange={(e) => setEditFormData({...editFormData, care_of: e.target.value})}
                        placeholder="S/O, D/O, W/O"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_mobile">Mobile Number</Label>
                      <Input
                        id="edit_mobile"
                        type="tel"
                        value={editFormData.mobile || ''}
                        onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit_address">Address</Label>
                      <Input
                        id="edit_address"
                        type="text"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    🏍️ Vehicle Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_brand">Brand</Label>
                      <Select
                        value={editFormData.brand || ''}
                        onValueChange={(value) => setEditFormData({...editFormData, brand: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_model">Model</Label>
                      <Input
                        id="edit_model"
                        type="text"
                        value={editFormData.model || ''}
                        onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                        placeholder="Enter model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_color">Color</Label>
                      <Input
                        id="edit_color"
                        type="text"
                        value={editFormData.color || ''}
                        onChange={(e) => setEditFormData({...editFormData, color: e.target.value})}
                        placeholder="Enter color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_vehicle_no">Vehicle Number</Label>
                      <Input
                        id="edit_vehicle_no"
                        type="text"
                        value={editFormData.vehicle_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_no: e.target.value.toUpperCase()})}
                        placeholder="KA05AB1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_chassis_number">Chassis Number</Label>
                      <Input
                        id="edit_chassis_number"
                        type="text"
                        value={editFormData.chassis_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, chassis_number: e.target.value.toUpperCase()})}
                        placeholder="Enter chassis number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_engine_number">Engine Number</Label>
                      <Input
                        id="edit_engine_number"
                        type="text"
                        value={editFormData.engine_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, engine_number: e.target.value.toUpperCase()})}
                        placeholder="Enter engine number"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Details Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    🛡️ Insurance Nominee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_nominee">Nominee Name</Label>
                      <Input
                        id="edit_nominee"
                        type="text"
                        value={editFormData.insurance_nominee || ''}
                        onChange={(e) => setEditFormData({...editFormData, insurance_nominee: e.target.value})}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_relation">Relation</Label>
                      <Select
                        value={editFormData.relation || ''}
                        onValueChange={(value) => setEditFormData({...editFormData, relation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relation" />
                        </SelectTrigger>
                        <SelectContent>
                          {relations.map(relation => (
                            <SelectItem key={relation} value={relation}>
                              {relation.charAt(0).toUpperCase() + relation.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_age">Age</Label>
                      <Input
                        id="edit_age"
                        type="number"
                        value={editFormData.age || ''}
                        onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
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



export default CustomersManagement;
