import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import Pagination from '../Pagination';
import SortDropdown from '../SortDropdown';
import { Plus, Search, Eye, Edit, Save, FileText, Users, Car, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

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
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('registration_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm, sortBy, sortOrder]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [registrationsRes, customersRes] = await Promise.all([
        axios.get(`${API}/registrations`, {
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

      const registrationsData = registrationsRes.data;
      const customers = customersRes.data.data || customersRes.data;

      // Map registration data for display
      const combined = registrationsData.map(reg => {
        return {
          id: reg.id,
          registration_number: reg.registration_number,
          registration_date: reg.registration_date || reg.created_at,
          customer_name: reg.customer_name || 'Unknown',
          phone_number: reg.customer_mobile || 'N/A',
          vehicle_brand: reg.vehicle_brand || 'N/A',
          vehicle_model: reg.vehicle_model || 'N/A',
          vehicle_year: reg.vehicle_year || 'N/A',
          vehicle_reg_no: reg.vehicle_number || 'N/A',
          chassis_number: reg.chassis_number || 'N/A',
          engine_number: reg.engine_number || 'N/A',
          customer_address: reg.customer_address || 'N/A',
          customer_id: reg.customer_id
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'registration_date':
          aVal = new Date(a.registration_date || 0);
          bVal = new Date(b.registration_date || 0);
          break;
        case 'customer_name':
          aVal = a.customer_name || '';
          bVal = b.customer_name || '';
          break;
        case 'vehicle_brand':
          aVal = a.vehicle_brand || '';
          bVal = b.vehicle_brand || '';
          break;
        case 'amount':
          aVal = a.amount || 0;
          bVal = b.amount || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRegistrations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
    setShowViewModal(true);
  };

  const handleEditRegistration = (registration) => {
    setEditingRegistration(registration);
    setEditFormData({
      customer_name: registration.customer_name || '',
      customer_mobile: registration.phone_number !== 'N/A' ? registration.phone_number : '',
      customer_address: registration.customer_address !== 'N/A' ? registration.customer_address : '',
      vehicle_number: registration.vehicle_reg_no !== 'N/A' ? registration.vehicle_reg_no : '',
      vehicle_brand: registration.vehicle_brand !== 'N/A' ? registration.vehicle_brand : '',
      vehicle_model: registration.vehicle_model !== 'N/A' ? registration.vehicle_model : '',
      vehicle_year: registration.vehicle_year !== 'N/A' ? registration.vehicle_year : '',
      chassis_number: registration.chassis_number !== 'N/A' ? registration.chassis_number : '',
      engine_number: registration.engine_number !== 'N/A' ? registration.engine_number : ''
    });
    setShowEditModal(true);
  };

  const handleDeleteRegistration = async (registration) => {
    if (!window.confirm(`Are you sure you want to delete registration for "${registration.customer_name}" (${registration.vehicle_reg_no})? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/registrations/${registration.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedRegistrations = registrations.filter(reg => reg.id !== registration.id);
      setRegistrations(updatedRegistrations);
      
      toast.success('Registration deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete registration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRegistration) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Prepare the data for registration update
      const updateData = {
        customer_name: editFormData.customer_name,
        customer_mobile: editFormData.customer_mobile,
        customer_address: editFormData.customer_address || '',
        vehicle_number: editFormData.vehicle_number,
        vehicle_brand: editFormData.vehicle_brand || null,
        vehicle_model: editFormData.vehicle_model || null,
        vehicle_year: editFormData.vehicle_year || null,
        chassis_number: editFormData.chassis_number || null,
        engine_number: editFormData.engine_number || null
      };
      
      await axios.put(`${API}/registrations/${editingRegistration.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Registration updated successfully!');
      setShowEditModal(false);
      setEditingRegistration(null);
      setEditFormData({});
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update registration');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRegistration(null);
    setEditFormData({});
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const currentPageItems = filteredRegistrations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    
    if (selectAll) {
      // Deselect all on current page
      setSelectedIds(prev => prev.filter(id => !currentPageItems.find(item => item.id === id)));
      setSelectAll(false);
    } else {
      // Select all on current page
      const currentPageIds = currentPageItems.map(item => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected for deletion');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} registration(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.delete(`${API}/registrations/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to delete registration ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} registration(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} registration(s)`);
      }

      // Clear selection and refresh data
      setSelectedIds([]);
      setSelectAll(false);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to perform bulk delete');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Update selectAll state when page changes
  useEffect(() => {
    const currentPageItems = filteredRegistrations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    const allSelected = currentPageItems.length > 0 && 
      currentPageItems.every(item => selectedIds.includes(item.id));
    setSelectAll(allSelected);
  }, [currentPage, filteredRegistrations, selectedIds, itemsPerPage]);

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
          <h2 className="text-2xl font-bold text-gray-900">Customer & Vehicle Registrations</h2>
          <p className="text-gray-600">View and manage all customer/vehicle registrations. Create job cards from here.</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              onClick={handleBulkDelete} 
              variant="destructive" 
              className="flex items-center gap-2"
              disabled={bulkDeleting}
            >
              <Trash2 className="w-4 h-4" />
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </Button>
          )}
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

      {/* Search Bar & Sort */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer name, phone, vehicle brand, model, year, or registration number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <SortDropdown
          currentSort={sortBy}
          currentOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          options={[
            { field: 'registration_date', order: 'desc', label: 'Newest First' },
            { field: 'registration_date', order: 'asc', label: 'Oldest First' },
            { field: 'customer_name', order: 'asc', label: 'Customer (A-Z)' },
            { field: 'customer_name', order: 'desc', label: 'Customer (Z-A)' },
            { field: 'vehicle_brand', order: 'asc', label: 'Brand (A-Z)' },
            { field: 'vehicle_brand', order: 'desc', label: 'Brand (Z-A)' },
            { field: 'amount', order: 'desc', label: 'Amount (High to Low)' },
            { field: 'amount', order: 'asc', label: 'Amount (Low to High)' }
          ]}
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(registrations.map(r => r.phone_number)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-purple-600" />
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
          <div className="flex items-center justify-between">
            <CardTitle>
              Registrations ({filteredRegistrations.length} records)
            </CardTitle>
            {selectedIds.length > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedIds.length} item(s) selected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
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
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No registrations found matching your search' : 'No service registrations found'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((registration) => (
                      <tr key={registration.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedIds.includes(registration.id) ? 'bg-blue-50' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(registration.id)}
                            onChange={() => handleSelectItem(registration.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRegistration(registration)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
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
        
        {/* Pagination */}
        {filteredRegistrations.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRegistrations.length / itemsPerPage)}
            total={filteredRegistrations.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* View Registration Modal */}
      {showViewModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Registration Details</h2>
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
                    <div><strong>Registration Number:</strong> {selectedRegistration.registration_number || 'N/A'}</div>
                    <div><strong>Registration Date:</strong> {new Date(selectedRegistration.registration_date).toLocaleDateString('en-IN')}</div>
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
                  <h3 className="text-lg font-semibold mb-3 text-green-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Registration No:</strong> {selectedRegistration.vehicle_reg_no}</div>
                    <div><strong>Brand:</strong> {selectedRegistration.vehicle_brand}</div>
                    <div><strong>Model:</strong> {selectedRegistration.vehicle_model}</div>
                    <div><strong>Year:</strong> {selectedRegistration.vehicle_year}</div>
                    <div><strong>Chassis Number:</strong> {selectedRegistration.chassis_number}</div>
                    <div><strong>Engine Number:</strong> {selectedRegistration.engine_number}</div>
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
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Registration</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Customer Name</Label>
                      <Input
                        id="customer_name"
                        placeholder="Enter customer name"
                        value={editFormData.customer_name || ''}
                        onChange={(e) => setEditFormData({...editFormData, customer_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_mobile">Mobile Number</Label>
                      <Input
                        id="customer_mobile"
                        placeholder="Enter mobile number"
                        value={editFormData.customer_mobile || ''}
                        onChange={(e) => setEditFormData({...editFormData, customer_mobile: e.target.value})}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="customer_address">Address</Label>
                      <Input
                        id="customer_address"
                        placeholder="Enter customer address"
                        value={editFormData.customer_address || ''}
                        onChange={(e) => setEditFormData({...editFormData, customer_address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600 border-b pb-2">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                      <Select 
                        value={editFormData.vehicle_brand || ''} 
                        onValueChange={(value) => setEditFormData({...editFormData, vehicle_brand: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'].map((brand) => (
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
                        value={editFormData.vehicle_model || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_model: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_year">Vehicle Year</Label>
                      <Input
                        id="vehicle_year"
                        placeholder="Enter vehicle year (e.g., 2024)"
                        value={editFormData.vehicle_year || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_year: e.target.value})}
                        type="number"
                        min="1990"
                        max="2030"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chassis_number">Chassis Number</Label>
                      <Input
                        id="chassis_number"
                        placeholder="Enter chassis number"
                        value={editFormData.chassis_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, chassis_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="engine_number">Engine Number</Label>
                      <Input
                        id="engine_number"
                        placeholder="Enter engine number"
                        value={editFormData.engine_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, engine_number: e.target.value})}
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



export default ViewRegistration;
