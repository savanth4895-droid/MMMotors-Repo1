import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import { Search, Eye, Edit, Save, X, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const EditVehicleModal = ({ vehicle, isOpen, onClose, onUpdate }) => {
  const [editData, setEditData] = useState({
    brand: '',
    model: '',
    chassis_number: '',
    engine_number: '',
    color: '',
    vehicle_number: '',
    key_number: '',
    inbound_location: '',
    page_number: '',
    outbound_location: '',
    status: 'in_stock',
    date_received: '',
    date_returned: ''
  });
  const [loading, setLoading] = useState(false);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
  const statusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'sold', label: 'Sold' },
    { value: 'returned', label: 'Returned' }
  ];

  useEffect(() => {
    if (vehicle && isOpen) {
      setEditData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        chassis_number: vehicle.chassis_number || '',
        engine_number: vehicle.engine_number || '',
        color: vehicle.color || '',
        vehicle_number: vehicle.vehicle_number || '',
        key_number: vehicle.key_number || '',
        inbound_location: vehicle.inbound_location || '',
        page_number: vehicle.page_number || '',
        outbound_location: vehicle.outbound_location || '',
        status: vehicle.status || 'in_stock',
        date_received: vehicle.date_received ? new Date(vehicle.date_received).toISOString().split('T')[0] : '',
        date_returned: vehicle.date_returned ? new Date(vehicle.date_returned).toISOString().split('T')[0] : ''
      });
    }
  }, [vehicle, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare the full vehicle update payload
      const updateData = {
        brand: editData.brand,
        model: editData.model,
        chassis_number: editData.chassis_number,
        engine_number: editData.engine_number,
        color: editData.color,
        vehicle_number: editData.vehicle_number,
        key_number: editData.key_number,
        inbound_location: editData.inbound_location,
        page_number: editData.page_number,
        outbound_location: editData.outbound_location,
        status: editData.status
      };

      // Add date_received if provided
      if (editData.date_received) {
        updateData.date_received = new Date(editData.date_received).toISOString();
      }

      // Add return date if status is 'returned' and date is provided
      if (editData.status === 'returned' && editData.date_returned) {
        updateData.date_returned = editData.date_returned;
      }

      // Use the full vehicle update endpoint
      const response = await axios.put(`${API}/vehicles/${vehicle.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vehicle updated successfully!');
      onUpdate(response.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle Details</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Select value={editData.brand} onValueChange={(value) => setEditData({...editData, brand: value})}>
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
              <Label htmlFor="edit-date-received">Date Received</Label>
              <Input
                id="edit-date-received"
                type="date"
                value={editData.date_received}
                onChange={(e) => setEditData({...editData, date_received: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                placeholder="Enter model name"
                value={editData.model}
                onChange={(e) => setEditData({...editData, model: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-chassis">Chassis Number</Label>
              <Input
                id="edit-chassis"
                placeholder="Enter chassis number"
                value={editData.chassis_number}
                onChange={(e) => setEditData({...editData, chassis_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-engine">Engine Number</Label>
              <Input
                id="edit-engine"
                placeholder="Enter engine number"
                value={editData.engine_number}
                onChange={(e) => setEditData({...editData, engine_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                placeholder="Enter color"
                value={editData.color}
                onChange={(e) => setEditData({...editData, color: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-vehicle-number">Vehicle Number (Registration)</Label>
              <Input
                id="edit-vehicle-number"
                placeholder="Enter vehicle registration number"
                value={editData.vehicle_number}
                onChange={(e) => setEditData({...editData, vehicle_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-key">Key Number</Label>
              <Input
                id="edit-key"
                placeholder="Enter key number"
                value={editData.key_number}
                onChange={(e) => setEditData({...editData, key_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-inbound">Inbound Location</Label>
              <Input
                id="edit-inbound"
                placeholder="Enter inbound location"
                value={editData.inbound_location}
                onChange={(e) => setEditData({...editData, inbound_location: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-outbound">Outbound Location</Label>
              <Input
                id="edit-outbound"
                placeholder="Enter outbound location"
                value={editData.outbound_location}
                onChange={(e) => setEditData({...editData, outbound_location: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-page">Page Number</Label>
              <Input
                id="edit-page"
                placeholder="Enter page number"
                value={editData.page_number}
                onChange={(e) => setEditData({...editData, page_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Return Date Field - Only shown when status is 'returned' */}
            {editData.status === 'returned' && (
              <div>
                <Label htmlFor="edit-return-date">Return Date</Label>
                <Input
                  id="edit-return-date"
                  type="date"
                  value={editData.date_returned}
                  onChange={(e) => setEditData({...editData, date_returned: e.target.value})}
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="spinner w-4 h-4 mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Updating...' : 'Update Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BrandDetails = () => {
  const { brand } = useParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editVehicle, setEditVehicle] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    fetchBrandVehicles();
  }, [brand]);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm]);

  const fetchBrandVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles?brand=${brand}`);
      setVehicles(response.data);
    } catch (error) {
      toast.error(`Failed to fetch ${brand} vehicles`);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;
    if (searchTerm) {
      filtered = vehicles.filter(vehicle =>
        vehicle.chassis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.engine_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.key_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredVehicles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800 border-green-200' },
      sold: { label: 'Sold', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      returned: { label: 'Returned', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const config = statusConfig[status] || statusConfig.in_stock;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
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

  const exportBrandData = () => {
    try {
      const csvContent = [
        ['Date', 'Chassis No', 'Engine No', 'Model', 'Color', 'Vehicle No', 'Key No', 'Inbound Location', 'Status', 'Return Date', 'Page Number', 'Outbound Location'].join(','),
        ...filteredVehicles.map(vehicle => [
          new Date(vehicle.date_received).toLocaleDateString('en-IN'),
          vehicle.chassis_number || '',
          vehicle.engine_number || '',
          vehicle.model || '',
          vehicle.color || '',
          vehicle.vehicle_number || '',
          vehicle.key_number || '',
          vehicle.inbound_location || '',
          vehicle.status || '',
          vehicle.status === 'returned' && vehicle.date_returned 
            ? new Date(vehicle.date_returned).toLocaleDateString('en-IN')
            : '',
          vehicle.page_number || '',
          vehicle.outbound_location || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brand}_vehicles_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${brand} vehicle data exported successfully!`);
    } catch (error) {
      toast.error('Failed to export vehicle data');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const inStockCount = vehicles.filter(v => v.status === 'in_stock').length;
  const soldCount = vehicles.filter(v => v.status === 'sold').length;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Brands
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{brand} Vehicle Stock</h2>
            <p className="text-gray-600">Detailed inventory for {brand} vehicles</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportBrandData} variant="outline" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Brand Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MotorcycleIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total {brand}</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-orange-600">{soldCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by chassis no, engine no, model, color, vehicle no, or key number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicle Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {brand} Vehicles ({filteredVehicles.length} vehicles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Chassis No</th>
                  <th className="text-left p-3 font-semibold">Engine No</th>
                  <th className="text-left p-3 font-semibold">Model</th>
                  <th className="text-left p-3 font-semibold">Color</th>
                  <th className="text-left p-3 font-semibold">Vehicle No</th>
                  <th className="text-left p-3 font-semibold">Key no.</th>
                  <th className="text-left p-3 font-semibold">Inbound Location</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Return Date</th>
                  <th className="text-left p-3 font-semibold">Page Number</th>
                  <th className="text-left p-3 font-semibold">Outbound Location</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-8 text-center text-gray-500">
                      {searchTerm ? `No ${brand} vehicles found matching your search` : `No ${brand} vehicles found`}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600">
                        {new Date(vehicle.date_received).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 text-gray-900 font-mono font-medium">{vehicle.chassis_number}</td>
                      <td className="p-3 text-gray-900 font-mono font-medium">{vehicle.engine_number}</td>
                      <td className="p-3 text-gray-900 font-medium">{vehicle.model}</td>
                      <td className="p-3 text-gray-600">{vehicle.color}</td>
                      <td className="p-3 text-gray-600 font-mono">{vehicle.vehicle_number}</td>
                      <td className="p-3 text-gray-600 font-mono">{vehicle.key_number}</td>
                      <td className="p-3 text-gray-600">{vehicle.inbound_location}</td>
                      <td className="p-3">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="p-3 text-gray-600">
                        {vehicle.status === 'returned' && vehicle.date_returned 
                          ? new Date(vehicle.date_returned).toLocaleDateString('en-IN')
                          : (vehicle.status === 'returned' ? 'Not Set' : 'N/A')
                        }
                      </td>
                      <td className="p-3 text-gray-600">{vehicle.page_number || 'N/A'}</td>
                      <td className="p-3 text-gray-600">{vehicle.outbound_location || 'N/A'}</td>
                      <td className="p-3">
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
        
        {/* Pagination */}
        {filteredVehicles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredVehicles.length / itemsPerPage)}
            total={filteredVehicles.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        vehicle={editVehicle}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateVehicle}
      />
    </div>
  );
};



export default BrandDetails;
