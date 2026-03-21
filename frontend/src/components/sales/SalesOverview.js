import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const SalesOverview = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    topCustomers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [salesRes, customersRes] = await Promise.all([
        axios.get(`${API}/sales`),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          }
        })
      ]);

      const sales = salesRes.data;
      const customers = customersRes.data.data || customersRes.data;

      // Calculate current month revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = sales
        .filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        })
        .reduce((sum, sale) => sum + (sale.amount || 0), 0);

      setStats({
        totalSales: sales.length,
        monthlyRevenue: monthlyRevenue,
        pendingInvoices: 0, // This would need a separate status field in sales
        topCustomers: customers.slice(0, 5) // Top 5 customers by recent creation
      });
    } catch (error) {
      console.error('Failed to fetch sales overview stats:', error);
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.totalSales}</p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">₹{stats.monthlyRevenue}</p>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link to="/sales/create-invoice">
            <Button className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
          <Link to="/sales/customers">
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};



export default SalesOverview;
