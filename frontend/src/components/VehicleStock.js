import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Plus, 
  Car, 
  Search, 
  Filter,
  Package,
  TrendingUp,
  Eye,
  ArrowLeft,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VehicleStock = () => {
  const location = useLocation();
  const [selectedBrand, setSelectedBrand] = useState('all');
  
  const navigationItems = [
    { name: 'Overview', path: '/vehicles', icon: TrendingUp },
    { name: 'Add Vehicle', path: '/vehicles/add', icon: Plus },
    { name: 'Stock View', path: '/vehicles/stock', icon: Package }
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
        <Route path="/" element={<BrandOverview />} />
        <Route path="/add" element={<AddVehicle />} />
        <Route path="/stock" element={<StockView />} />
        <Route path="/brand/:brand" element={<BrandDetails />} />
      </Routes>
    </div>
  );
};

const BrandOverview = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const brands = [
    { name: 'TVS', color: 'from-red-500 to-red-600' },
    { name: 'BAJAJ', color: 'from-blue-500 to-blue-600' },
    { name: 'HERO', color: 'from-green-500 to-green-600' },
    { name: 'HONDA', color: 'from-yellow-500 to-yellow-600' },
    { name: 'TRIUMPH', color: 'from-purple-500 to-purple-600' },
    { name: 'KTM', color: 'from-orange-500 to-orange-600' },
    { name: 'SUZUKI', color: 'from-pink-500 to-pink-600' },
    { name: 'APRILIA', color: 'from-indigo-500 to-indigo-600' }
  ];

  useEffect(() => {
    fetchVehicles();
  }, []);

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

  const getBrandStats = (brandName) => {
    const brandVehicles = vehicles.filter(v => v.brand === brandName);
    return {
      total: brandVehicles.length,
      inStock: brandVehicles.filter(v => v.status === 'in_stock').length,
      sold: brandVehicles.filter(v => v.status === 'sold').length
    };
  };

  const handleBrandClick = (brandName) => {
    navigate(`/vehicles/brand/${brandName}`);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const totalVehicles = vehicles.length;
  const inStockVehicles = vehicles.filter(v => v.status === 'in_stock').length;
  const soldVehicles = vehicles.filter(v => v.status === 'sold').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Stock by Brand</h2>
          <p className="text-gray-600">Click on any brand to view detailed inventory</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{totalVehicles}</p>
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
                <p className="text-2xl font-bold text-green-600">{inStockVehicles}</p>
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
                <p className="text-2xl font-bold text-orange-600">{soldVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {brands.map((brand) => {
          const stats = getBrandStats(brand.name);
          return (
            <Card 
              key={brand.name} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              onClick={() => handleBrandClick(brand.name)}
            >
              <div className={`h-3 bg-gradient-to-r ${brand.color} rounded-t-lg`}></div>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${brand.color} rounded-full flex items-center justify-center`}>
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{brand.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">In Stock:</span>
                      <span className="font-semibold text-green-600">{stats.inStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Sold:</span>
                      <span className="font-semibold text-orange-600">{stats.sold}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const EditVehicleModal = ({ vehicle, isOpen, onClose, onUpdate }) => {
  const [editData, setEditData] = useState({
    brand: '',
    model: '',
    chassis_no: '',
    engine_no: '',
    color: '',
    key_no: '',
    inbound_location: '',
    page_number: '',
    outbound_location: '',
    status: 'in_stock'
  });
  const [loading, setLoading] = useState(false);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];
  const statusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'sold', label: 'Sold' },
    { value: 'reserved', label: 'Reserved' }
  ];

  useEffect(() => {
    if (vehicle && isOpen) {
      setEditData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        chassis_no: vehicle.chassis_no || '',
        engine_no: vehicle.engine_no || '',
        color: vehicle.color || '',
        key_no: vehicle.key_no || '',
        inbound_location: vehicle.inbound_location || '',
        page_number: vehicle.page_number || '',
        outbound_location: vehicle.outbound_location || '',
        status: vehicle.status || 'in_stock'
      });
    }
  }, [vehicle, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(`${API}/vehicles/${vehicle.id}`, editData);
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
                value={editData.chassis_no}
                onChange={(e) => setEditData({...editData, chassis_no: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-engine">Engine Number</Label>
              <Input
                id="edit-engine"
                placeholder="Enter engine number"
                value={editData.engine_no}
                onChange={(e) => setEditData({...editData, engine_no: e.target.value})}
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
              <Label htmlFor="edit-key">Key Number</Label>
              <Input
                id="edit-key"
                placeholder="Enter key number"
                value={editData.key_no}
                onChange={(e) => setEditData({...editData, key_no: e.target.value})}
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
        vehicle.chassis_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.engine_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.key_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredVehicles(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_stock: { label: 'In Stock', className: 'bg-green-100 text-green-800 border-green-200' },
      sold: { label: 'Sold', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      reserved: { label: 'Reserved', className: 'bg-blue-100 text-blue-800 border-blue-200' }
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

  const exportBrandData = () => {
    try {
      const csvContent = [
        ['Date', 'Chassis No', 'Engine No', 'Model', 'Color', 'Key No', 'Inbound Location', 'Status', 'Page Number', 'Outbound Location'].join(','),
        ...filteredVehicles.map(vehicle => [
          new Date(vehicle.date_received).toLocaleDateString('en-IN'),
          vehicle.chassis_no || '',
          vehicle.engine_no || '',
          vehicle.model || '',
          vehicle.color || '',
          vehicle.key_no || '',
          vehicle.inbound_location || '',
          vehicle.status || '',
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
              <Car className="h-8 w-8 text-blue-600" />
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
          placeholder="Search by chassis no, engine no, model, color, or key number..."
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
                  <th className="text-left p-3 font-semibold">Key no.</th>
                  <th className="text-left p-3 font-semibold">Inbound Location</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Page Number</th>
                  <th className="text-left p-3 font-semibold">Outbound Location</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-8 text-center text-gray-500">
                      {searchTerm ? `No ${brand} vehicles found matching your search` : `No ${brand} vehicles found`}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600">
                        {new Date(vehicle.date_received).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 text-gray-900 font-mono font-medium">{vehicle.chassis_no}</td>
                      <td className="p-3 text-gray-900 font-mono font-medium">{vehicle.engine_no}</td>
                      <td className="p-3 text-gray-900 font-medium">{vehicle.model}</td>
                      <td className="p-3 text-gray-600">{vehicle.color}</td>
                      <td className="p-3 text-gray-600 font-mono">{vehicle.key_no}</td>
                      <td className="p-3 text-gray-600">{vehicle.inbound_location}</td>
                      <td className="p-3">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="p-3 text-gray-600">{vehicle.page_number || 'N/A'}</td>
                      <td className="p-3 text-gray-600">{vehicle.outbound_location || 'N/A'}</td>
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

const AddVehicle = () => {
  const [vehicleData, setVehicleData] = useState({
    brand: '',
    model: '',
    chassis_no: '',
    engine_no: '',
    color: '',
    key_no: '',
    inbound_location: '',
    page_number: ''
  });
  const [loading, setLoading] = useState(false);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/vehicles`, vehicleData);
      toast.success('Vehicle added successfully!');
      setVehicleData({
        brand: '',
        model: '',
        chassis_no: '',
        engine_no: '',
        color: '',
        key_no: '',
        inbound_location: '',
        page_number: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={vehicleData.brand} onValueChange={(value) => setVehicleData({...vehicleData, brand: value})}>
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
                value={vehicleData.model}
                onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="chassis_no">Chassis Number</Label>
              <Input
                id="chassis_no"
                placeholder="Enter chassis number"
                value={vehicleData.chassis_no}
                onChange={(e) => setVehicleData({...vehicleData, chassis_no: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="engine_no">Engine Number</Label>
              <Input
                id="engine_no"
                placeholder="Enter engine number"
                value={vehicleData.engine_no}
                onChange={(e) => setVehicleData({...vehicleData, engine_no: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Enter color"
                value={vehicleData.color}
                onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="key_no">Key Number</Label>
              <Input
                id="key_no"
                placeholder="Enter key number"
                value={vehicleData.key_no}
                onChange={(e) => setVehicleData({...vehicleData, key_no: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="inbound_location">Inbound Location</Label>
              <Input
                id="inbound_location"
                placeholder="Enter inbound location"
                value={vehicleData.inbound_location}
                onChange={(e) => setVehicleData({...vehicleData, inbound_location: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="page_number">Page Number (Optional)</Label>
              <Input
                id="page_number"
                placeholder="Enter page number"
                value={vehicleData.page_number}
                onChange={(e) => setVehicleData({...vehicleData, page_number: e.target.value})}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const StockView = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, selectedBrand, selectedStatus]);

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
        vehicle.chassis_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.engine_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.brand === selectedBrand);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === selectedStatus);
    }

    setFilteredVehicles(filtered);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      in_stock: { label: 'In Stock', variant: 'success' },
      sold: { label: 'Sold', variant: 'secondary' },
      reserved: { label: 'Reserved', variant: 'default' }
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
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Stock ({filteredVehicles.length} vehicles)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Brand</th>
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Chassis No</th>
                  <th className="text-left p-2">Engine No</th>
                  <th className="text-left p-2">Color</th>
                  <th className="text-left p-2">Key No</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(vehicle.date_received).toLocaleDateString()}</td>
                    <td className="p-2 font-medium">{vehicle.brand}</td>
                    <td className="p-2">{vehicle.model}</td>
                    <td className="p-2">{vehicle.chassis_no}</td>
                    <td className="p-2">{vehicle.engine_no}</td>
                    <td className="p-2">{vehicle.color}</td>
                    <td className="p-2">{vehicle.key_no}</td>
                    <td className="p-2">{vehicle.inbound_location}</td>
                    <td className="p-2">{getStatusBadge(vehicle.status)}</td>
                    <td className="p-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



export default VehicleStock;