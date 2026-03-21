import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading';
import { FileText, Download, Package } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const SparePartsReports = () => {
  const [reportData, setReportData] = useState({
    totalParts: 0,
    totalValue: 0,
    topSellingParts: [],
    lowStockCount: 0,
    monthlyBills: 0,
    monthlyRevenue: 0,
    brandAnalysis: [],
    inventoryTurnover: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const [partsResponse, billsResponse] = await Promise.all([
        axios.get(`${API}/spare-parts`),
        axios.get(`${API}/spare-parts/bills`)
      ]);

      const parts = partsResponse.data;
      const bills = billsResponse.data;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Filter bills by date range
      const recentBills = bills.filter(bill => {
        const billDate = new Date(bill.bill_date);
        return billDate >= startDate && billDate <= endDate;
      });

      // Calculate total parts and value
      const totalValue = parts.reduce((sum, part) => sum + (part.quantity * part.unit_price), 0);
      const lowStockCount = parts.filter(part => part.quantity <= part.low_stock_threshold).length;

      // Calculate monthly revenue
      const monthlyRevenue = recentBills.reduce((sum, bill) => sum + bill.total_amount, 0);

      // Brand analysis
      const brandMap = {};
      parts.forEach(part => {
        if (!brandMap[part.brand]) {
          brandMap[part.brand] = {
            brand: part.brand,
            partCount: 0,
            totalValue: 0,
            avgPrice: 0
          };
        }
        brandMap[part.brand].partCount += 1;
        brandMap[part.brand].totalValue += (part.quantity * part.unit_price);
      });

      const brandAnalysis = Object.values(brandMap).map(brand => ({
        ...brand,
        avgPrice: brand.totalValue / brand.partCount
      })).sort((a, b) => b.totalValue - a.totalValue);

      // Top selling parts (based on recent bills)
      const partSalesMap = {};
      recentBills.forEach(bill => {
        bill.items.forEach(item => {
          if (!partSalesMap[item.description]) {
            partSalesMap[item.description] = {
              name: item.description,
              quantitySold: 0,
              revenue: 0
            };
          }
          partSalesMap[item.description].quantitySold += item.qty;
          partSalesMap[item.description].revenue += item.amount;
        });
      });

      const topSellingParts = Object.values(partSalesMap)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);

      setReportData({
        totalParts: parts.length,
        totalValue,
        topSellingParts,
        lowStockCount,
        monthlyBills: recentBills.length,
        monthlyRevenue,
        brandAnalysis: brandAnalysis.slice(0, 5),
        inventoryTurnover: totalValue > 0 ? (monthlyRevenue / totalValue * 12).toFixed(2) : 0
      });

    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-bold text-gray-900">Spare Parts Reports</h2>
          <p className="text-gray-600">Analytics and insights for spare parts business</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchReportData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.totalParts}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">₹{reportData.totalValue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bills ({dateRange} days)</p>
                <p className="text-2xl font-bold text-purple-600">{reportData.monthlyBills}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue ({dateRange} days)</p>
                <p className="text-2xl font-bold text-orange-600">₹{reportData.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Parts ({dateRange} days)</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topSellingParts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sales data available for the selected period
              </div>
            ) : (
              <div className="space-y-4">
                {reportData.topSellingParts.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{part.name}</p>
                      <p className="text-sm text-gray-600">Qty: {part.quantitySold}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{part.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Top Brands by Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.brandAnalysis.map((brand, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{brand.brand}</p>
                    <p className="text-sm text-gray-600">{brand.partCount} parts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">₹{brand.totalValue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Avg: ₹{brand.avgPrice.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{reportData.lowStockCount}</p>
              <p className="text-gray-600">Parts below threshold</p>
              {reportData.lowStockCount > 0 && (
                <Button className="mt-3" variant="outline" size="sm">
                  View Low Stock Items
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{reportData.inventoryTurnover}x</p>
              <p className="text-gray-600">Annual turnover rate</p>
              <p className="text-sm text-gray-500 mt-2">
                {reportData.inventoryTurnover > 4 ? 'Excellent' : 
                 reportData.inventoryTurnover > 2 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                Export Report
              </Button>
              <Button className="w-full" variant="outline">
                Print Summary
              </Button>
              <Button className="w-full" variant="outline">
                Email Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};



export default SparePartsReports;
