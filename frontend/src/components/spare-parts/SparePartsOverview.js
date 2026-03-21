import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from '../ui/loading';
import { Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const SparePartsOverview = () => {
  const [stats, setStats] = useState({
    totalParts: 0,
    lowStockParts: 0,
    totalValue: 0,
    monthlyBills: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [partsResponse, lowStockResponse, billsResponse] = await Promise.all([
        axios.get(`${API}/spare-parts`),
        axios.get(`${API}/spare-parts?low_stock=true`),
        axios.get(`${API}/spare-parts/bills`)
      ]);

      const totalValue = partsResponse.data.reduce((sum, part) => sum + (part.quantity * part.unit_price), 0);
      
      setStats({
        totalParts: partsResponse.data.length,
        lowStockParts: lowStockResponse.data.length,
        totalValue: totalValue,
        monthlyBills: billsResponse.data.filter(bill => 
          new Date(bill.bill_date).getMonth() === new Date().getMonth()
        ).length
      });
    } catch (error) {
      toast.error('Failed to fetch spare parts statistics');
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
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalParts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockParts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Bills</p>
                <p className="text-2xl font-bold text-purple-600">{stats.monthlyBills}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
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
            <Link to="/spare-parts/add">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add New Part
              </Button>
            </Link>
            <Link to="/spare-parts/create-bill">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create Bill
              </Button>
            </Link>
            <Link to="/spare-parts/low-stock">
              <Button variant="outline" className="w-full justify-start text-red-600">
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Low Stock
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Engine Parts</span>
                <Badge variant="outline">35%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Brake System</span>
                <Badge variant="outline">28%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Electrical</span>
                <Badge variant="outline">22%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Body Parts</span>
                <Badge variant="outline">15%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};



export default SparePartsOverview;
