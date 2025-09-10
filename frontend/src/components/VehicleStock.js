import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Car, 
  Search, 
  Filter,
  Package,
  TrendingUp,
  Eye
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
        <Route path="/" element={<VehicleOverview />} />
        <Route path="/add" element={<AddVehicle />} />
        <Route path="/stock" element={<StockView />} />
        <Route path="/brand/:brand" element={<BrandStock />} />
      </Routes>
    </div>
  );
};

const VehicleOverview = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    inStock: 0,
    sold: 0,
    reserved: 0
  });
  const [brands, setBrands] = useState([]);
  const [brandStats, setBrandStats] = useState({});

  useEffect(() => {
    fetchStats();
    fetchBrands();
    fetchBrandStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats({
        totalVehicles: response.data.total_vehicles,
        inStock: response.data.vehicles_in_stock,
        sold: response.data.vehicles_sold,
        reserved: 0 // Will be calculated from actual data
      });
    } catch (error) {
      toast.error('Failed to fetch vehicle statistics');
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API}/vehicles/brands`);
      setBrands(response.data);
    } catch (error) {
      toast.error('Failed to fetch brands');
    }
  };

  const fetchBrandStats = async () => {
    try {
      const stats = {};
      for (const brand of ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA']) {
        const response = await axios.get(`${API}/vehicles?brand=${brand}`);
        stats[brand] = {
          total: response.data.length,
          inStock: response.data.filter(v => v.status === 'in_stock').length,
          sold: response.data.filter(v => v.status === 'sold').length
        };
      }
      setBrandStats(stats);
    } catch (error) {
      toast.error('Failed to fetch brand statistics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalVehicles}</p>
              </div>
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-orange-600">{stats.sold}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reserved</p>
                <p className="text-2xl font-bold text-purple-600">{stats.reserved}</p>
              </div>
              <Car className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Stock by Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(brandStats).map(([brand, stats]) => (
              <Link key={brand} to={`/vehicles/brand/${brand}`}>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{brand}</h3>
                    <Badge variant="outline">{stats.total}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>In Stock:</span>
                      <span className="text-green-600">{stats.inStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sold:</span>
                      <span className="text-orange-600">{stats.sold}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
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

const BrandStock = () => {
  // This would be a detailed view for a specific brand
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Stock Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Detailed brand-specific stock view coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default VehicleStock;