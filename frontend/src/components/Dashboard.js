import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Users, 
  ShoppingCart, 
  Wrench, 
  Package, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Database
} from 'lucide-react';

// Custom Motorcycle Icon Component
const MotorcycleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 16c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm12 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm1.5-9H16l-3-3h-2v2h1.5l1.5 1.5H8L6 5.5H4.5C3.7 5.5 3 6.2 3 7s.7 1.5 1.5 1.5H6l2 2.5h8l2-2.5h.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5z"/>
    <circle cx="7" cy="16" r="1"/>
    <circle cx="19" cy="16" r="1"/>
    <path d="M8.5 12l1.5-1.5h4L15.5 12H8.5z"/>
  </svg>
);
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_customers: 0,
    total_vehicles: 0,
    vehicles_in_stock: 0,
    vehicles_sold: 0,
    pending_services: 0,
    low_stock_parts: 0,
    completed_today: 0,
    sales_stats: {
      total_sales: 0,
      direct_sales: 0,
      imported_sales: 0,
      total_revenue: 0,
      direct_revenue: 0,
      imported_revenue: 0
    }
  });
  const [backupStats, setBackupStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Initial fetch
    fetchStats();
    fetchRecentActivities();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchStats();
      fetchRecentActivities();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchStats = async () => {
    try {
      const [dashboardRes, backupRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/backup/stats`).catch(() => ({ data: null }))
      ]);
      
      setStats(dashboardRes.data);
      setBackupStats(backupRes.data);
      setLastUpdate(new Date());
    } catch (error) {
      if (loading) {
        toast.error('Failed to fetch dashboard statistics');
      }
      // Silently fail for auto-refresh to avoid annoying the user
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get(`${API}/activities?limit=5`);
      setRecentActivities(response.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const getActivityIcon = (type, icon) => {
    const iconClasses = "w-4 h-4";
    const colorMap = {
      success: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: AlertTriangle },
      error: { bg: 'bg-red-100', text: 'text-red-600', icon: AlertTriangle },
      info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: Database }
    };

    const typeIconMap = {
      sale_created: ShoppingCart,
      service_completed: Wrench,
      service_created: Wrench,
      vehicle_added: MotorcycleIcon,
      vehicle_sold: ShoppingCart,
      low_stock: AlertTriangle,
      customer_added: Users,
      backup_created: Database
    };

    const color = colorMap[icon] || colorMap.info;
    const IconComponent = typeIconMap[type] || color.icon;

    return (
      <div className={`w-8 h-8 ${color.bg} rounded-full flex items-center justify-center`}>
        <IconComponent className={`${iconClasses} ${color.text}`} />
      </div>
    );
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const mainModules = [
    {
      title: 'Sales',
      description: 'Manage invoices, customers, and insurance',
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      link: '/sales',
      stats: [
        { label: 'Total Customers', value: stats.total_customers },
        { label: 'Vehicles Sold', value: stats.vehicles_sold }
      ]
    },
    {
      title: 'Services',
      description: 'Job cards, registrations, and service management',
      icon: Wrench,
      color: 'from-green-500 to-teal-500',
      link: '/services',
      stats: [
        { label: 'Pending Services', value: stats.pending_services },
        { label: 'Active Jobs', value: stats.pending_services }
      ]
    },
    {
      title: 'Vehicle Stock',
      description: 'Track inventory across all brands',
      icon: MotorcycleIcon,
      color: 'from-purple-500 to-pink-500',
      link: '/vehicles',
      stats: [
        { label: 'In Stock', value: stats.vehicles_in_stock },
        { label: 'Total Vehicles', value: stats.total_vehicles }
      ]
    },
    {
      title: 'Spare Parts',
      description: 'Inventory management and billing',
      icon: Package,
      color: 'from-orange-500 to-red-500',
      link: '/spare-parts',
      stats: [
        { label: 'Low Stock Items', value: stats.low_stock_parts },
        { label: 'Active Parts', value: '250+' }
      ]
    }
  ];

  const quickStats = [
    {
      title: 'Total Revenue',
      value: `₹${stats.sales_stats?.total_revenue?.toLocaleString() || '0'}`,
      change: stats.sales_stats?.imported_sales > 0 ? `${stats.sales_stats.imported_sales} imported` : 'No imports',
      changeType: 'positive',
      icon: TrendingUp
    },
    {
      title: 'Pending Services',
      value: stats.pending_services,
      change: stats.pending_services > 5 ? 'High' : 'Normal',
      changeType: stats.pending_services > 5 ? 'negative' : 'positive',
      icon: AlertTriangle
    },
    {
      title: 'Completed Today',
      value: stats.completed_today || 0,
      change: stats.completed_today > 0 ? `+${stats.completed_today}` : 'No completions',
      changeType: 'positive',
      icon: CheckCircle
    },
    {
      title: 'Active Customers',
      value: stats.total_customers,
      change: stats.total_customers > 0 ? `${stats.total_customers} total` : 'No customers',
      changeType: 'positive',
      icon: Users
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome to M M Motors Dashboard</h1>
            <p className="text-blue-100">
              Manage your two-wheeler business efficiently with our comprehensive system.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchStats}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Database className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
            <p className="text-xs text-blue-100">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            <p className="text-xs text-blue-200">
              Auto-refresh every 30s
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-xs ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mainModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Card key={index} className="card-hover overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${module.color}`}></div>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${module.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {module.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <Link to={module.link}>
                  <Button className="w-full btn-hover">
                    Access {module.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales Overview Including Imported Data */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Sales Overview</CardTitle>
                <CardDescription>Revenue including imported sales data</CardDescription>
              </div>
            </div>
            <Link to="/sales">
              <Button variant="outline" size="sm">
                View Sales
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                ₹{stats.sales_stats?.total_revenue?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                ₹{stats.sales_stats?.direct_revenue?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-600">Direct Sales</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                ₹{stats.sales_stats?.imported_revenue?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-600">Imported Sales</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {stats.sales_stats?.total_sales || 0}
              </p>
              <p className="text-xs text-gray-600">Total Transactions</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">
                {stats.sales_stats?.direct_sales || 0}
              </p>
              <p className="text-xs text-gray-600">Direct Sales Count</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">
                {stats.sales_stats?.imported_sales || 0}
              </p>
              <p className="text-xs text-gray-600">Imported Sales Count</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Status */}
      {backupStats && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Data Backup Status</CardTitle>
                  <CardDescription>System backup and data protection</CardDescription>
                </div>
              </div>
              <Link to="/backup">
                <Button variant="outline" size="sm">
                  Manage Backups
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{backupStats.total_backups}</p>
                <p className="text-xs text-gray-600">Total Backups</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {backupStats.total_backups > 0 
                    ? Math.round((backupStats.successful_backups / backupStats.total_backups) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-600">Success Rate</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {backupStats.total_storage_used_mb > 1024 
                    ? `${(backupStats.total_storage_used_mb / 1024).toFixed(1)}GB`
                    : `${backupStats.total_storage_used_mb.toFixed(0)}MB`}
                </p>
                <p className="text-xs text-gray-600">Storage Used</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1">
                  {backupStats.last_backup_date ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-bold text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-red-600">No Backups</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-600">Backup Status</p>
              </div>
            </div>
            {backupStats.last_backup_date && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  Last backup: {new Date(backupStats.last_backup_date).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Kolkata'
                  })} IST
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New sale recorded</p>
                <p className="text-xs text-gray-500">Hero Splendor+ sold to customer #1234</p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Wrench className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Service completed</p>
                <p className="text-xs text-gray-500">Regular maintenance for TVS Apache</p>
              </div>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Low stock alert</p>
                <p className="text-xs text-gray-500">Brake pads running low in inventory</p>
              </div>
              <span className="text-xs text-gray-400">6 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;