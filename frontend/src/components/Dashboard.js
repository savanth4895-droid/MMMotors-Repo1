import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Users, 
  ShoppingCart, 
  Wrench, 
  Package, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Database,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  FileText,
  Image,
  Eye,
  CheckSquare,
  Square,
  Search,
  RotateCcw
} from 'lucide-react';

// Custom Motorcycle Icon Component
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MotorcycleIcon from './ui/MotorcycleIcon';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_customers: 0,
    total_vehicles: 0,
    vehicles_in_stock: 0,
    vehicles_sold: 0,
    pending_services: 0,
    active_jobs: 0,
    low_stock_parts: 0,
    total_parts: 0,
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
  const [showTracker, setShowTracker] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchStats();
    fetchRecentActivities();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchStats();
      fetchRecentActivities();
    }, 10000); // 10 seconds — real-time dashboard
    
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
        { label: 'Active Jobs', value: stats.active_jobs }
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
        { label: 'Total Parts', value: stats.total_parts }
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
            <div className="flex gap-2">
              {!showTracker && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTracker(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  📋 Process Tracker
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchStats}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Database className="w-4 h-4 mr-2" />
                Refresh Stats
              </Button>
            </div>
            <p className="text-xs text-blue-100">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            <p className="text-xs text-blue-200">
              Auto-refresh every 10s
            </p>
          </div>
        </div>
      </div>

      {/* Sales Process Tracker — top of dashboard, closeable */}
      {showTracker && <SalesMilestoneTracker onClose={() => setShowTracker(false)} />}

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
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`flex items-center space-x-4 p-3 rounded-lg ${
                    activity.icon === 'success' ? 'bg-green-50' :
                    activity.icon === 'warning' ? 'bg-yellow-50' :
                    activity.icon === 'error' ? 'bg-red-50' : 'bg-blue-50'
                  }`}
                >
                  {getActivityIcon(activity.type, activity.icon)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTimeAgo(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


// ─── Sales Process Milestone Tracker ─────────────────────────────────────────

const MILESTONES = [
  { key: 'customer_docs',      label: 'Customer Docs',      sub: 'Aadhaar, PAN, RTO', icon: '🪪', color: '#3b82f6' },
  { key: 'invoice_insurance',  label: 'Invoice & Insurance',sub: 'Invoice, policy',    icon: '📄', color: '#8b5cf6' },
  { key: 'road_tax',           label: 'Road Tax',           sub: 'Tax receipt',        icon: '🛣️', color: '#f97316' },
  { key: 'number_plates',      label: 'Number Plates',      sub: 'Front & back',       icon: '🔢', color: '#10b981' },
  { key: 'plates_attached',    label: 'Plates on Bike',     sub: 'Final attachment',   icon: '🏍️', color: '#06b6d4' },
];

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      let data = canvas.toDataURL('image/jpeg', 0.5);
      if (data.length > 270000) data = canvas.toDataURL('image/jpeg', 0.3);
      resolve({ data, mime_type: 'image/jpeg', size_kb: parseFloat((data.length * 0.75 / 1024).toFixed(1)) });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const SalesMilestoneTracker = ({ onClose }) => {
  const [sales, setSales] = useState([]);
  const [milestoneData, setMilestoneData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [activeMilestone, setActiveMilestone] = useState(null); // key of expanded panel
  const [uploading, setUploading] = useState({});
  const [viewDoc, setViewDoc] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingNote, setSavingNote] = useState({});

  useEffect(() => { fetchRecentSales(); }, []);
  useEffect(() => { if (selectedSale) fetchMilestones(selectedSale.id); }, [selectedSale]);

  const fetchRecentSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const [salesRes, custRes] = await Promise.all([
        axios.get(`${API}/sales`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/customers`, {
          params: { page: 1, limit: 10000 },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const customers = custRes.data.data || custRes.data || [];
      const custMap = {};
      customers.forEach(c => { if (c.id) custMap[c.id] = c.name; });

      const sales = (salesRes.data || []).map(s => ({
        ...s,
        customer_name: s.customer_name || custMap[s.customer_id] || ''
      }));
      const sorted = sales.sort((a, b) => new Date(b.sale_date || b.created_at) - new Date(a.sale_date || a.created_at));
      setSales(sorted.slice(0, 100));
    } catch { /* silent */ }
  };

  const fetchMilestones = async (saleId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/sale-milestones/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: null }));
      const data = res.data || { milestones: {} };
      setMilestoneData(data);
      const n = {};
      MILESTONES.forEach(m => { n[m.key] = data.milestones?.[m.key]?.notes || ''; });
      setNotes(n);
    } finally { setLoading(false); }
  };

  const ms = (key) => milestoneData?.milestones?.[key] || {};
  const completedCount = MILESTONES.filter(m => ms(m.key).completed).length;
  const pct = Math.round((completedCount / MILESTONES.length) * 100);

  const handleToggle = async (key) => {
    if (!selectedSale) return;
    const token = localStorage.getItem('token');
    const isCompleted = ms(key).completed;
    const url = isCompleted
      ? `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/uncomplete`
      : `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/complete`;
    await axios.post(url, { notes: notes[key] || '' }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    await fetchMilestones(selectedSale.id);
  };

  const handleUpload = async (key, files) => {
    if (!selectedSale || !files.length) return;
    setUploading(p => ({ ...p, [key]: true }));
    try {
      const token = localStorage.getItem('token');
      const newDocs = [];
      for (const file of Array.from(files)) {
        let doc;
        if (file.type.startsWith('image/')) {
          const c = await compressImage(file);
          doc = { name: file.name, ...c };
        } else {
          const data = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(file); });
          doc = { name: file.name, data, mime_type: file.type, size_kb: parseFloat((file.size / 1024).toFixed(1)) };
        }
        newDocs.push(doc);
      }
      const existing = ms(key).docs || [];
      await axios.post(
        `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/complete`,
        { docs: [...existing, ...newDocs], notes: notes[key] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMilestones(selectedSale.id);
    } catch { alert('Upload failed'); }
    finally { setUploading(p => ({ ...p, [key]: false })); }
  };

  const handleDeleteDoc = async (key, idx) => {
    if (!selectedSale || !window.confirm('Delete this document?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/sale-milestones/${selectedSale.id}/milestone/${key}/doc/${idx}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      // If index is out of sync, fall back to patching via complete endpoint
      if (e.response?.status === 400) {
        const currentDocs = (ms(key).docs || []).filter((_, i) => i !== idx);
        await axios.post(
          `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/complete`,
          { docs: currentDocs, notes: notes[key] || '' },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
      }
    }
    await fetchMilestones(selectedSale.id);
  };

  const handleSaveNote = async (key) => {
    if (!selectedSale) return;
    setSavingNote(p => ({ ...p, [key]: true }));
    const token = localStorage.getItem('token');
    const state = ms(key);
    await axios.post(
      `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/complete`,
      { docs: state.docs || [], notes: notes[key] || '' },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(() => {});
    await fetchMilestones(selectedSale.id);
    setSavingNote(p => ({ ...p, [key]: false }));
  };

  const filteredSales = sales.filter(s =>
    !searchTerm ||
    s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <div>
            <h3 className="text-xs font-semibold text-gray-800">Sales Process Tracker</h3>
            <p className="text-xs text-gray-400 hidden">Document milestone checklist per sale</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedSale && (
            <button
              onClick={() => { setSelectedSale(null); setMilestoneData({}); setActiveMilestone(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1"
            >
              <RotateCcw className="w-3 h-3" /> Change
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              title="Close tracker"
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3">
        {!selectedSale ? (
          /* ── Sale Picker ── */
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search customer or invoice..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-8"
              />
            </div>
            <div className="rounded-lg border border-gray-100 divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {filteredSales.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No sales found</p>
              ) : filteredSales.map(sale => (
                <button key={sale.id} onClick={() => setSelectedSale(sale)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-gray-800 truncate">{sale.customer_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0">{sale.invoice_number}</span>
                  </div>
                  <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ── Sale summary bar ── */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-xs truncate">{selectedSale.customer_name}</p>
                <p className="text-xs text-gray-400 font-mono">{selectedSale.invoice_number}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <span className={`text-lg font-bold ${completedCount === MILESTONES.length ? 'text-green-600' : 'text-blue-600'}`}>
                    {completedCount}<span className="text-gray-400 font-normal text-sm">/{MILESTONES.length}</span>
                  </span>
                </div>
                <div className="w-24">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${completedCount === MILESTONES.length ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-0.5">{pct}%</p>
                </div>
              </div>
            </div>

            {/* ── Horizontal Timeline ── */}
            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              {/* Completed fill line */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-green-400 z-0 transition-all duration-700"
                style={{ width: completedCount === 0 ? '0%' : `${((completedCount - 0.5) / MILESTONES.length) * 100}%` }}
              />

              {/* Steps row */}
              <div className="relative z-10 grid grid-cols-5 gap-1">
                {MILESTONES.map((m, idx) => {
                  const state = ms(m.key);
                  const done = state.completed;
                  const active = activeMilestone === m.key;
                  const docCount = (state.docs || []).length;

                  return (
                    <div key={m.key} className="flex flex-col items-center gap-1">
                      {/* Circle */}
                      <button
                        onClick={() => { handleToggle(m.key); }}
                        title={done ? 'Click to unmark' : 'Click to mark complete'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 border-2 shadow-sm
                          ${done
                            ? 'bg-green-500 border-green-500 scale-105'
                            : 'bg-white border-gray-300 hover:border-blue-400 hover:scale-105'
                          }`}
                      >
                        {done ? '✓' : m.icon}
                      </button>

                      {/* Label */}
                      <div className="text-center w-full">
                        <p className={`text-xs font-semibold leading-tight ${done ? 'text-green-700' : 'text-gray-700'}`} style={{fontSize:'9px'}}>
                          {m.label}
                        </p>
                        <p className="text-gray-400 leading-tight" style={{fontSize:'8px'}}>{m.sub}</p>
                        {done && state.completed_at && (
                          <p className="text-xs text-green-500 mt-0.5">
                            {new Date(state.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                        {docCount > 0 && (
                          <span className="inline-block mt-0.5 text-xs px-1.5 py-0 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {docCount} doc{docCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Expand button */}
                      <button
                        onClick={() => setActiveMilestone(active ? null : m.key)}
                        className={`px-1.5 py-0 rounded-full border transition-colors
                          ${active
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                          }`}
                      >
                        <span style={{fontSize:'8px'}}>{active ? '▲' : '▼'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Expanded detail panel ── */}
            {activeMilestone && (() => {
              const m = MILESTONES.find(x => x.key === activeMilestone);
              const state = ms(activeMilestone);
              const docs = state.docs || [];
              return (
                <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ borderTopColor: m.color, borderTopWidth: 3 }}>
                  <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                        <p className="text-xs text-gray-400">{m.sub}</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveMilestone(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Docs grid */}
                    {docs.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {docs.map((doc, i) => (
                          <div key={i} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            {doc.mime_type?.startsWith('image/') ? (
                              <img src={doc.data} alt={doc.name} className="w-full h-14 object-cover" />
                            ) : (
                              <div className="w-full h-14 flex flex-col items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <span className="text-xs text-gray-400">{doc.mime_type?.split('/')[1]?.toUpperCase()}</span>
                              </div>
                            )}
                            <div className="px-1 pb-1">
                              <p className="text-xs text-gray-600 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">{doc.size_kb}KB</p>
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-lg">
                              <button onClick={() => setViewDoc(doc)} className="text-white hover:text-blue-300"><Eye className="w-4 h-4" /></button>
                              {doc.drive_url && (
                                <a href={doc.drive_url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-300" title="View in Drive">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.28 3L1 12.5 6.28 22h11.44L23 12.5 17.72 3H6.28zM12 16.5L7.5 9h9L12 16.5z"/></svg>
                                </a>
                              )}
                              <button onClick={() => handleDeleteDoc(activeMilestone, i)} className="text-white hover:text-red-300"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload + notes row */}
                    <div className="flex gap-3 items-start flex-wrap sm:flex-nowrap">
                      {/* Upload */}
                      <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-2.5 cursor-pointer hover:border-blue-300 transition-colors bg-white flex-shrink-0">
                        <input type="file" multiple accept="image/*,application/pdf" className="hidden"
                          onChange={e => handleUpload(activeMilestone, e.target.files)} />
                        {uploading[activeMilestone] ? (
                          <span className="text-sm text-gray-400">Compressing...</span>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500 whitespace-nowrap">Upload docs</span>
                          </>
                        )}
                      </label>

                      {/* Notes */}
                      <div className="flex gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Add a note for this milestone..."
                          value={notes[activeMilestone] || ''}
                          onChange={e => setNotes(p => ({ ...p, [activeMilestone]: e.target.value }))}
                          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                        />
                        <button
                          onClick={() => handleSaveNote(activeMilestone)}
                          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                        >
                          {savingNote[activeMilestone] ? '...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {/* Saved note display */}
                    {state.notes && (
                      <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        📝 {state.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* All done */}
            {completedCount === MILESTONES.length && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                <p className="text-green-700 font-semibold text-sm">🎉 All milestones complete!</p>
                <p className="text-green-500 text-xs mt-0.5">{selectedSale.customer_name} — fully documented</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Doc preview modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-medium text-sm truncate">{viewDoc.name}</p>
              <button onClick={() => setViewDoc(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              {viewDoc.mime_type?.startsWith('image/') ? (
                <img src={viewDoc.data} alt={viewDoc.name} className="w-full rounded-lg" />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{viewDoc.name}</p>
                  <a href={viewDoc.data} download={viewDoc.name} className="mt-3 inline-block text-sm text-blue-600 underline">Download</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;
