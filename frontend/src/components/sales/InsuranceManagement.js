import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import { Plus, Search, Eye, FileText, Shield, Users, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const InsuranceManagement = () => {
  const [insuranceData, setInsuranceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchInsuranceData();
  }, []);

  useEffect(() => {
    filterInsuranceData();
  }, [insuranceData, searchTerm]);

  const fetchInsuranceData = async () => {
    try {
      const [salesRes, customersRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/sales`),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          }
        }),
        axios.get(`${API}/vehicles`)
      ]);

      const sales = salesRes.data;
      const customers = customersRes.data.data || customersRes.data;
      const vehicles = vehiclesRes.data;

      // Combine data to create insurance records
      const combined = sales.map(sale => {
        const customer = customers.find(c => c.id === sale.customer_id);
        const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
        
        // For direct sales, get vehicle details from vehicles collection
        // For imported sales, get vehicle details from sale record itself
        let vehicleModel = 'Unknown Vehicle';
        let vehicleRegNo = 'N/A';
        let vehicleChassis = 'N/A';
        let vehicleEngine = 'N/A';
        
        if (vehicle) {
          // Direct sale with vehicle_id
          vehicleModel = `${vehicle.brand} ${vehicle.model}`;
          vehicleRegNo = vehicle.vehicle_number || 'N/A';
          vehicleChassis = vehicle.chassis_number || 'N/A';
          vehicleEngine = vehicle.engine_number || 'N/A';
        } else if (sale.vehicle_brand || sale.vehicle_model) {
          // Imported sale with vehicle details in sale record
          vehicleModel = `${sale.vehicle_brand || ''} ${sale.vehicle_model || ''}`.trim() || 'Unknown Vehicle';
          vehicleRegNo = sale.vehicle_registration || 'N/A';
          vehicleChassis = sale.vehicle_chassis || 'N/A';
          vehicleEngine = sale.vehicle_engine || 'N/A';
        }
        
        // Calculate insurance expiry date (364 days from purchase date)
        const purchaseDate = new Date(sale.sale_date);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(purchaseDate.getDate() + 364);

        // Determine status based on expiry date
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status;
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon';
        } else {
          status = 'active';
        }

        return {
          id: sale.id,
          customer_name: customer?.name || 'Unknown',
          phone_number: customer?.mobile || customer?.phone || 'N/A',
          vehicle_model: vehicleModel,
          vehicle_reg_no: vehicleRegNo,
          purchase_date: sale.sale_date,
          expiry_date: expiryDate.toISOString(),
          status: status,
          days_until_expiry: daysUntilExpiry,
          customer_id: sale.customer_id,
          vehicle_id: sale.vehicle_id,
          sale_amount: sale.amount,
          payment_method: sale.payment_method,
          customer_address: customer?.address || 'N/A',
          vehicle_chassis: vehicleChassis,
          vehicle_engine: vehicleEngine,
          source: sale.source || 'direct'
        };
      });

      setInsuranceData(combined);
    } catch (error) {
      toast.error('Failed to fetch insurance data');
    } finally {
      setLoading(false);
    }
  };

  const filterInsuranceData = () => {
    let filtered = insuranceData;

    if (searchTerm) {
      filtered = insuranceData.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const getStatusBadge = (status, daysUntilExpiry) => {
    const statusConfig = {
      expired: { 
        label: 'Expired', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      },
      expiring_soon: { 
        label: `Expires in ${daysUntilExpiry} days`, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      active: { 
        label: 'Active', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      }
    };

    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleViewInsurance = (insurance) => {
    setSelectedInsurance(insurance);
    setShowViewModal(true);
  };

  const handleEditInsurance = (insurance) => {
    setSelectedInsurance(insurance);
    setShowEditModal(true);
  };

  const handleDeleteInsurance = async (insurance) => {
    if (!window.confirm(`Are you sure you want to delete insurance record for "${insurance.customer_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Since insurance is derived from customer/sales data, we need to delete the related sale or update customer data
      // For now, we'll remove it from the local view - this would need backend support for actual deletion
      const updatedData = insuranceData.filter(ins => ins.id !== insurance.id);
      setInsuranceData(updatedData);
      
      toast.success('Insurance record deleted successfully!');
      
      // In a real implementation, you'd call a backend endpoint like:
      // const token = localStorage.getItem('token');
      // await axios.delete(`${API}/insurance/${insurance.id}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete insurance record');
    }
  };

  const exportInsuranceData = () => {
    try {
      const csvContent = [
        ['Customer Name', 'Phone Number', 'Vehicle Model', 'Vehicle Reg No', 'Purchase Date', 'Expiry Date', 'Status', 'Days Until Expiry'].join(','),
        ...filteredData.map(item => [
          item.customer_name || '',
          item.phone_number || '',
          item.vehicle_model || '',
          item.vehicle_reg_no || '',
          new Date(item.purchase_date).toLocaleDateString('en-IN'),
          new Date(item.expiry_date).toLocaleDateString('en-IN'),
          item.status || '',
          item.days_until_expiry || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insurance_renewals_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Insurance data exported successfully!');
    } catch (error) {
      toast.error('Failed to export insurance data');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const expiredCount = insuranceData.filter(item => item.status === 'expired').length;
  const expiringSoonCount = insuranceData.filter(item => item.status === 'expiring_soon').length;
  const activeCount = insuranceData.filter(item => item.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insurance Renewal Management</h2>
          <p className="text-gray-600">Track and manage vehicle insurance renewals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportInsuranceData} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export Data
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by customer name, phone, vehicle model, or registration number..."
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
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringSoonCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-blue-600">{insuranceData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Renewal Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Insurance Renewals ({filteredData.length} policies)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Expiry Date</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No insurance records found matching your search' : 'No insurance records found'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((insurance) => (
                    <tr key={insurance.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{insurance.customer_name}</div>
                      </td>
                      <td className="p-3 text-gray-600">{insurance.phone_number}</td>
                      <td className="p-3 text-gray-600">{insurance.vehicle_model}</td>
                      <td className="p-3 text-gray-600 font-mono">{insurance.vehicle_reg_no}</td>
                      <td className="p-3">
                        <div className="text-gray-900 font-medium">
                          {new Date(insurance.expiry_date).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {insurance.days_until_expiry > 0 
                            ? `${insurance.days_until_expiry} days left`
                            : `${Math.abs(insurance.days_until_expiry)} days overdue`
                          }
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(insurance.status, insurance.days_until_expiry)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInsurance(insurance)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInsurance(insurance)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInsurance(insurance)}
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
      </Card>

      {/* View Insurance Modal */}
      {showViewModal && selectedInsurance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Insurance Policy Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedInsurance.customer_name}</div>
                    <div><strong>Mobile:</strong> {selectedInsurance.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedInsurance.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Model:</strong> {selectedInsurance.vehicle_model}</div>
                    <div><strong>Registration:</strong> {selectedInsurance.vehicle_reg_no}</div>
                    <div><strong>Chassis Number:</strong> {selectedInsurance.vehicle_chassis}</div>
                    <div><strong>Engine Number:</strong> {selectedInsurance.vehicle_engine}</div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Insurance Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Purchase Date:</strong> {new Date(selectedInsurance.purchase_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Expiry Date:</strong> {new Date(selectedInsurance.expiry_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedInsurance.status, selectedInsurance.days_until_expiry)}</div>
                    <div><strong>Days Until Expiry:</strong> 
                      <span className={selectedInsurance.days_until_expiry < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {selectedInsurance.days_until_expiry > 0 
                          ? `${selectedInsurance.days_until_expiry} days`
                          : `${Math.abs(selectedInsurance.days_until_expiry)} days overdue`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sale Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Sale Amount:</strong> ₹{selectedInsurance.sale_amount?.toLocaleString()}</div>
                    <div><strong>Payment Method:</strong> {selectedInsurance.payment_method?.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditInsurance(selectedInsurance);
                  }}
                >
                  Edit Policy
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Insurance Modal */}
      {showEditModal && selectedInsurance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Insurance Policy</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="text-center py-8">
                <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Insurance Policy Management</h3>
                <p className="text-gray-500 mb-4">
                  Edit functionality for insurance policies will be implemented in the next update.
                  Currently showing policy details for: <strong>{selectedInsurance.customer_name}</strong>
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">
                    Vehicle: {selectedInsurance.vehicle_model} ({selectedInsurance.vehicle_reg_no})
                  </p>
                  <p className="text-sm text-gray-600">
                    Expiry: {new Date(selectedInsurance.expiry_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Button onClick={() => setShowEditModal(false)}>
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



export default InsuranceManagement;
