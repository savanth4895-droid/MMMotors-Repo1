import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading';
import MotorcycleIcon from '../ui/MotorcycleIcon';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

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
    { name: 'APRILIA', color: 'from-indigo-500 to-indigo-600' },
    { name: 'YAMAHA', color: 'from-teal-500 to-teal-600' },
    { name: 'PIAGGIO', color: 'from-cyan-500 to-cyan-600' },
    { name: 'ROYAL ENFIELD', color: 'from-amber-500 to-amber-600' }
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
              <MotorcycleIcon className="h-8 w-8 text-blue-600" />
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
                    <MotorcycleIcon className="w-8 h-8 text-white" />
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



export default BrandOverview;
