import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading';
import MotorcycleIcon from '../ui/MotorcycleIcon';
import { TrendingUp, BarChart3, PieChart, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { API, getErrorMessage } from '../../utils/helpers';

const SalesReports = () => {
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [brandData, setBrandData] = useState([]);
  const [chartGranularity, setChartGranularity] = useState('monthly');
  const [totalStats, setTotalStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topBrand: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (sales.length > 0 && vehicles.length > 0) {
      processMonthlyData();
      processBrandData();
      calculateStats();
    }
  }, [sales, vehicles, chartGranularity]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [salesRes, vehiclesRes, customersRes] = await Promise.all([
        axios.get(`${API}/sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/vehicles`, {
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
      
      setSales(salesRes.data);
      setVehicles(vehiclesRes.data);
      setCustomers(customersRes.data.data || customersRes.data);
    } catch (error) {
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = () => {
    if (chartGranularity === 'monthly') {
      const monthlyMap = {};
      
      sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthName,
            sales: 0,
            revenue: 0,
            count: 0
          };
        }
        
        monthlyMap[monthKey].sales += 1;
        monthlyMap[monthKey].revenue += sale.amount || 0;
        monthlyMap[monthKey].count += 1;
      });

      // Sort by month and get last 12 months or available data
      const sortedData = Object.values(monthlyMap)
        .sort((a, b) => new Date(a.month + ' 01') - new Date(b.month + ' 01'))
        .slice(-12);
      
      setMonthlyData(sortedData);
    } else {
      // Yearly aggregation
      const yearlyMap = {};
      
      sales.forEach(sale => {
        const date = new Date(sale.sale_date);
        const year = date.getFullYear();
        
        if (!yearlyMap[year]) {
          yearlyMap[year] = {
            month: year.toString(),
            sales: 0,
            revenue: 0,
            count: 0
          };
        }
        
        yearlyMap[year].sales += 1;
        yearlyMap[year].revenue += sale.amount || 0;
        yearlyMap[year].count += 1;
      });

      // Sort by year and get last 5 years
      const sortedData = Object.values(yearlyMap)
        .sort((a, b) => parseInt(a.month) - parseInt(b.month))
        .slice(-5);
      
      setMonthlyData(sortedData);
    }
  };

  const processBrandData = () => {
    const brandMap = {};
    
    sales.forEach(sale => {
      let brand = null;
      
      // For direct sales with vehicle_id, get brand from vehicles collection
      if (sale.vehicle_id) {
        const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
        if (vehicle) {
          brand = vehicle.brand;
        }
      } 
      // For imported sales without vehicle_id, use vehicle_brand field
      else if (sale.vehicle_brand) {
        brand = sale.vehicle_brand;
      }
      
      // If we have a brand, add to the map
      if (brand) {
        if (!brandMap[brand]) {
          brandMap[brand] = {
            brand: brand,
            sales: 0,
            revenue: 0,
            count: 0,
            directSales: 0,
            importedSales: 0
          };
        }
        
        brandMap[brand].sales += 1;
        brandMap[brand].revenue += sale.amount || 0;
        brandMap[brand].count += 1;
        
        // Track source of sale
        if (sale.source === 'import') {
          brandMap[brand].importedSales += 1;
        } else {
          brandMap[brand].directSales += 1;
        }
      }
    });

    const sortedBrandData = Object.values(brandMap)
      .sort((a, b) => b.revenue - a.revenue);
    
    setBrandData(sortedBrandData);
  };

  const calculateStats = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Find top brand by revenue (including both direct and imported sales)
    const brandRevenue = {};
    sales.forEach(sale => {
      let brand = null;
      
      // For direct sales with vehicle_id
      if (sale.vehicle_id) {
        const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
        if (vehicle) {
          brand = vehicle.brand;
        }
      } 
      // For imported sales with vehicle_brand
      else if (sale.vehicle_brand) {
        brand = sale.vehicle_brand;
      }
      
      if (brand) {
        brandRevenue[brand] = (brandRevenue[brand] || 0) + (sale.amount || 0);
      }
    });
    
    const topBrand = Object.keys(brandRevenue).length > 0 
      ? Object.keys(brandRevenue).reduce((a, b) => 
          brandRevenue[a] > brandRevenue[b] ? a : b, '')
      : 'N/A';

    setTotalStats({
      totalSales,
      totalRevenue,
      averageOrderValue,
      topBrand
    });
  };

  const exportReport = () => {
    try {
      const reportData = {
        totalStats,
        monthlyData,
        brandData,
        generatedAt: new Date().toISOString()
      };

      const csvContent = [
        ['Sales Report Generated:', new Date().toLocaleDateString()].join(','),
        [],
        ['Monthly Sales Data:'],
        ['Month', 'Sales Count', 'Revenue'].join(','),
        ...monthlyData.map(item => [item.month, item.sales, item.revenue].join(',')),
        [],
        ['Brand Sales Data:'],
        ['Brand', 'Total Sales', 'Direct Sales', 'Imported Sales', 'Revenue'].join(','),
        ...brandData.map(item => [
          item.brand, 
          item.sales, 
          item.directSales || 0, 
          item.importedSales || 0, 
          item.revenue
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Sales report exported successfully!');
    } catch (error) {
      toast.error('Failed to export sales report');
    }
  };

  // Colors for charts
  const chartColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Reports</h2>
          <p className="text-gray-600">Comprehensive sales analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Order</p>
                <p className="text-2xl font-bold text-gray-900">₹{Math.round(totalStats.averageOrderValue).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MotorcycleIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Brand</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.topBrand || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Source Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Direct Sales</p>
                <p className="text-2xl font-bold text-blue-900">
                  {sales.filter(sale => !sale.source || sale.source === 'direct').length}
                </p>
                <p className="text-sm text-gray-500">
                  ₹{sales.filter(sale => !sale.source || sale.source === 'direct')
                    .reduce((sum, sale) => sum + (sale.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Imported Sales</p>
                <p className="text-2xl font-bold text-orange-900">
                  {sales.filter(sale => sale.source === 'import').length}
                </p>
                <p className="text-sm text-gray-500">
                  ₹{sales.filter(sale => sale.source === 'import')
                    .reduce((sum, sale) => sum + (sale.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Import Percentage</p>
                <p className="text-2xl font-bold text-green-900">
                  {sales.length > 0 ? 
                    Math.round((sales.filter(sale => sale.source === 'import').length / sales.length) * 100) 
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">
                  of total sales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  {chartGranularity === 'monthly' ? 'Monthly' : 'Yearly'} Sales Performance
                </CardTitle>
                <CardDescription>
                  Sales count and revenue trends over time
                </CardDescription>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-md p-1">
                <Button
                  variant={chartGranularity === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartGranularity('monthly')}
                >
                  Month
                </Button>
                <Button
                  variant={chartGranularity === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartGranularity('yearly')}
                >
                  Year
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Sales Count'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" name="Sales Count" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="Revenue (₹)"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brand-wise Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-600" />
              Brand-wise Sales Distribution
            </CardTitle>
            <CardDescription>
              Sales count by vehicle brands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="brand" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Sales Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-gray-900 mb-2">{data.brand}</p>
                            <p className="text-sm text-gray-700">Total Sales: {data.sales}</p>
                            <p className="text-sm text-gray-700">Revenue: ₹{data.revenue?.toLocaleString()}</p>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-blue-600">Direct Sales: {data.directSales || 0}</p>
                              <p className="text-xs text-purple-600">Imported Sales: {data.importedSales || 0}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#10b981" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Month</th>
                    <th className="text-right p-3 font-semibold">Sales</th>
                    <th className="text-right p-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">{item.month}</td>
                      <td className="p-3 text-right font-medium">{item.sales}</td>
                      <td className="p-3 text-right font-medium text-green-600">
                        ₹{item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Brand Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Performance Summary</CardTitle>
            <CardDescription>
              Sales breakdown by source (Direct vs Imported)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Brand</th>
                    <th className="text-right p-3 font-semibold">Total Sales</th>
                    <th className="text-right p-3 font-semibold text-blue-600">Direct</th>
                    <th className="text-right p-3 font-semibold text-purple-600">Imported</th>
                    <th className="text-right p-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {brandData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.brand}</td>
                      <td className="p-3 text-right font-semibold">{item.sales}</td>
                      <td className="p-3 text-right text-blue-600">{item.directSales || 0}</td>
                      <td className="p-3 text-right text-purple-600">{item.importedSales || 0}</td>
                      <td className="p-3 text-right font-medium text-green-600">
                        ₹{item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Best Performing Month</h4>
              <p className="text-blue-700">
                {monthlyData.length > 0 
                  ? monthlyData.reduce((max, item) => item.revenue > max.revenue ? item : max, monthlyData[0]).month
                  : 'N/A'
                }
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Top Revenue Brand</h4>
              <p className="text-green-700">
                {brandData.length > 0 ? brandData[0].brand : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Growth Trend</h4>
              <p className="text-purple-700">
                {monthlyData.length >= 2 
                  ? monthlyData[monthlyData.length - 1].revenue > monthlyData[monthlyData.length - 2].revenue 
                    ? 'Increasing' : 'Stable'
                  : 'Insufficient Data'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



export default SalesReports;
