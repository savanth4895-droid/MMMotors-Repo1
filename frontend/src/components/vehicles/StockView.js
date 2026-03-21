import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import Pagination from '../Pagination';
import SortDropdown from '../SortDropdown';
import { Search, Eye, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const StockView = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editVehicle, setEditVehicle] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('date_received');
  const [sortOrder, setSortOrder] = useState('desc');

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, selectedBrand, selectedStatus, sortBy, sortOrder]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`);
      setVehicles(response.data);
    } catch (error) {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(vehicle => 
        vehicle.chassis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.engine_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.brand === selectedBrand);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date_received':
          aVal = new Date(a.date_received || 0);
          bVal = new Date(b.date_received || 0);
          break;
        case 'brand':
          aVal = a.brand || '';
          bVal = b.brand || '';
          break;
        case 'model':
          aVal = a.model || '';
          bVal = b.model || '';
          break;
        case 'chassis_number':
          aVal = a.chassis_number || '';
          bVal = b.chassis_number || '';
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

    setFilteredVehicles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleEditVehicle = (vehicle) => {
    setEditVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const handleUpdateVehicle = (updatedVehicle) => {
    const updatedVehicles = vehicles.map(v => 
      v.id === updatedVehicle.id ? updatedVehicle : v
    );
    setVehicles(updatedVehicles);
  };

  const handleDeleteVehicle = async (vehicleId, chassisNo) => {
    if (!window.confirm(`Are you sure you want to delete vehicle with chassis number "${chassisNo}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
      setVehicles(updatedVehicles);
      
      toast.success('Vehicle deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete vehicle');
    }
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVehicles(filteredVehicles.map(v => v.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/vehicles`, {
        data: { ids: selectedVehicles, force_delete: forceDelete },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.deleted > 0) {
        toast.success(`Successfully deleted ${response.data.deleted} vehicle(s)`);
        if (forceDelete && response.data.cascade_deleted) {
          toast.info(`Also deleted: ${response.data.cascade_deleted.sales || 0} sales, ${response.data.cascade_deleted.services || 0} services`);
        }
      }

      if (response.data.failed && response.data.failed.length > 0) {
        // Prepare detailed error information
        const failedCount = response.data.failed.length;
        const errorDetails = response.data.failed.map((failed) => {
          const vehicle = vehicles.find(v => v.id === failed.id);
          return {
            vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.chassis_number})` : failed.id,
            error: failed.error,
            vehicle: vehicle
          };
        });
        
        setDeleteErrors(errorDetails);
        setShowErrorModal(true);
        toast.error(`Could not delete ${failedCount} vehicle(s). See details below.`);
      }

      setSelectedVehicles([]);
      setShowBulkDeleteModal(false);
      setForceDelete(false); // Reset force delete
      fetchVehicles(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete vehicles: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      in_stock: { label: 'In Stock', variant: 'success' },
      sold: { label: 'Sold', variant: 'secondary' },
      returned: { label: 'Returned', variant: 'default' }
    };
    const config = statusMap[status] || statusMap.in_stock;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by chassis, engine, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort By</Label>
              <SortDropdown
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSortChange={(field, order) => {
                  setSortBy(field);
                  setSortOrder(order);
                }}
                options={[
                  { field: 'date_received', order: 'desc', label: 'Newest First' },
                  { field: 'date_received', order: 'asc', label: 'Oldest First' },
                  { field: 'brand', order: 'asc', label: 'Brand (A-Z)' },
                  { field: 'brand', order: 'desc', label: 'Brand (Z-A)' },
                  { field: 'model', order: 'asc', label: 'Model (A-Z)' },
                  { field: 'model', order: 'desc', label: 'Model (Z-A)' },
                  { field: 'chassis_number', order: 'asc', label: 'Chassis No (A-Z)' },
                  { field: 'chassis_number', order: 'desc', label: 'Chassis No (Z-A)' }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Stock ({filteredVehicles.length} vehicles)</CardTitle>
            {selectedVehicles.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedVehicles.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.length === filteredVehicles.length && filteredVehicles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Brand</th>
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Chassis No</th>
                  <th className="text-left p-2">Engine No</th>
                  <th className="text-left p-2">Color</th>
                  <th className="text-left p-2">Key No</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Return Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-8 text-center text-gray-500">
                      {searchTerm || selectedBrand !== 'all' || selectedStatus !== 'all'
                        ? 'No vehicles found matching your filters'
                        : 'No vehicles found'}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((vehicle) => (
                      <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedVehicles.includes(vehicle.id)}
                            onChange={() => handleSelectVehicle(vehicle.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2">{new Date(vehicle.date_received).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">{vehicle.brand}</td>
                        <td className="p-2">{vehicle.model}</td>
                        <td className="p-2">{vehicle.chassis_number}</td>
                        <td className="p-2">{vehicle.engine_number}</td>
                        <td className="p-2">{vehicle.color}</td>
                        <td className="p-2">{vehicle.key_number}</td>
                        <td className="p-2">{vehicle.inbound_location}</td>
                        <td className="p-2">{getStatusBadge(vehicle.status)}</td>
                        <td className="p-2">
                          {vehicle.status === 'returned' && vehicle.date_returned 
                            ? new Date(vehicle.date_returned).toLocaleDateString('en-IN')
                            : (vehicle.status === 'returned' ? 'Not Set' : 'N/A')
                          }
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditVehicle(vehicle)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteVehicle(vehicle.id, vehicle.chassis_number)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
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

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        vehicle={editVehicle}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateVehicle}
      />
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Confirm Delete</h2>
            <p className="mb-4 font-semibold">
              Are you sure you want to delete {selectedVehicles.length} vehicle(s)?
            </p>
            
            {/* Force Delete Option */}
            <div className="mb-4 p-4 border-2 border-red-200 rounded-lg bg-red-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div>
                  <span className="font-bold text-red-700">Force Delete (Cascade)</span>
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ This will permanently delete the vehicles AND all associated sales and service records. This action is irreversible!
                  </p>
                </div>
              </label>
            </div>

            {!forceDelete ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Normal Delete Restrictions:</p>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Vehicles with sales records cannot be deleted</li>
                  <li>Vehicles with service records cannot be deleted</li>
                  <li>You must delete associated records first, OR enable Force Delete</li>
                </ul>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-300 rounded p-3 mb-4">
                <p className="text-sm text-red-800 font-bold mb-2">🚨 Force Delete WILL REMOVE:</p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>All selected vehicles</li>
                  <li>All sales records for these vehicles</li>
                  <li>All service records for these vehicles</li>
                  <li>Customer purchase history will be affected</li>
                </ul>
                <p className="text-sm text-red-800 font-bold mt-2">
                  ⚠️ THIS CANNOT BE UNDONE!
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              {forceDelete 
                ? "All selected vehicles and their complete history will be permanently deleted."
                : "Only vehicles without any sales or service history will be deleted. Others will be skipped."
              }
            </p>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setForceDelete(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete} 
                disabled={loading}
                className={forceDelete ? "bg-red-700 hover:bg-red-800" : ""}
              >
                {loading ? 'Deleting...' : forceDelete ? '🚨 Force Delete All' : 'Proceed with Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Details Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-red-600">⚠️ Deletion Failed</h2>
              <p className="text-gray-600 mt-2">
                {deleteErrors.length} vehicle(s) could not be deleted due to the following reasons:
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {deleteErrors.map((errorItem, index) => (
                  <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{errorItem.vehicleInfo}</p>
                        <p className="text-red-700 mt-1">{errorItem.error}</p>
                        {errorItem.vehicle && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Details:</span> {errorItem.vehicle.brand} {errorItem.vehicle.model} • 
                            Status: <span className={errorItem.vehicle.status === 'sold' ? 'text-orange-600' : 'text-green-600'}>
                              {errorItem.vehicle.status === 'in_stock' ? 'In Stock' : errorItem.vehicle.status === 'sold' ? 'Sold' : 'Returned'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-bold text-yellow-800 mb-2">💡 How to Delete These Vehicles:</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">Option 1:</span>
                    <span>Delete associated sales/service records first, then delete the vehicles.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">Option 2:</span>
                    <span>Use the <strong>"Force Delete"</strong> option in the delete confirmation to remove vehicles along with all their associated records (⚠️ This cannot be undone!).</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowErrorModal(false);
                  setDeleteErrors([]);
                }}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowErrorModal(false);
                  setDeleteErrors([]);
                  setForceDelete(true);
                  setShowBulkDeleteModal(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Force Delete Instead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





export default StockView;
