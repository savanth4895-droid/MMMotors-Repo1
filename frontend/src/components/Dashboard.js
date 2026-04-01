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
  Database,
  X
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
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showTracker, setShowTracker] = useState(true);

  useEffect(() => {
    fetchStats();
    const refreshInterval = setInterval(fetchStats, 10000);
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const dashboardRes = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(dashboardRes.data);
      setLastUpdate(new Date());
    } catch (error) {
      if (loading) {
        toast.error('Failed to fetch dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
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

    </div>
  );
};


// ─── Sales Process Milestone Tracker ─────────────────────────────────────────

const MILESTONES = [
  { key: 'customer_docs',      label: 'Customer Docs',       sub: 'Aadhaar, PAN, RTO', icon: '🪪' },
  { key: 'invoice_insurance',  label: 'Invoice & Insurance', sub: 'Invoice, policy',    icon: '📄' },
  { key: 'road_tax',           label: 'Road Tax',            sub: 'Tax receipt',        icon: '🛣️' },
  { key: 'number_plates',      label: 'Number Plates',       sub: 'Front & back',       icon: '🔢' },
  { key: 'plates_attached',    label: 'Plates on Bike',      sub: 'Final attachment',   icon: '🏍️' },
];

const SalesMilestoneTracker = ({ onClose }) => {
  const [sales, setSales] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [milestoneData, setMilestoneData] = useState({});
  const [selectedSale, setSelectedSale] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingNote, setSavingNote] = useState({});
  const [toggling, setToggling] = useState({});
  const [expandedNote, setExpandedNote] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchRecentSales(); }, []);
  useEffect(() => { if (selectedSale) fetchMilestones(selectedSale.id); }, [selectedSale]);

  // Filter sales by search
  useEffect(() => {
    if (!search.trim()) {
      setSales(allSales.slice(0, 8));
    } else {
      const q = search.toLowerCase();
      setSales(allSales.filter(s =>
        s.customer_name?.toLowerCase().includes(q) ||
        s.invoice_number?.toLowerCase().includes(q) ||
        s.vehicle_model?.toLowerCase().includes(q)
      ).slice(0, 8));
    }
  }, [search, allSales]);

  const fetchRecentSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const [salesRes, custRes] = await Promise.all([
        axios.get(`${API}/sales`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/customers`, { params: { page: 1, limit: 10000 }, headers: { Authorization: `Bearer ${token}` } })
      ]);
      const customers = custRes.data.data || custRes.data || [];
      const custMap = {};
      customers.forEach(c => { if (c.id) custMap[c.id] = c.name; });
      const enriched = (salesRes.data || [])
        .map(s => ({ ...s, customer_name: s.customer_name || custMap[s.customer_id] || 'Unknown' }))
        .sort((a, b) => new Date(b.sale_date || b.created_at) - new Date(a.sale_date || a.created_at));
      setAllSales(enriched);
      setSales(enriched.slice(0, 8));
      if (enriched.length > 0 && !selectedSale) setSelectedSale(enriched[0]);
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
    if (!selectedSale || toggling[key]) return;
    setToggling(p => ({ ...p, [key]: true }));
    const token = localStorage.getItem('token');
    const isCompleted = ms(key).completed;
    const url = isCompleted
      ? `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/uncomplete`
      : `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/complete`;
    await axios.post(url, { notes: notes[key] || '' }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    await fetchMilestones(selectedSale.id);
    setToggling(p => ({ ...p, [key]: false }));
  };

  const handleSaveNote = async (key) => {
    if (!selectedSale) return;
    setSavingNote(p => ({ ...p, [key]: true }));
    const token = localStorage.getItem('token');
    const isCompleted = ms(key).completed;
    const url = isCompleted
      ? `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/complete`
      : `${API}/sale-milestones/${selectedSale.id}/milestone/${key}/complete`;
    await axios.post(url, { notes: notes[key] || '' }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    await fetchMilestones(selectedSale.id);
    setSavingNote(p => ({ ...p, [key]: false }));
    setExpandedNote(null);
  };

  const allDone = completedCount === MILESTONES.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-5 py-3 border-b border-gray-100 ${allDone && selectedSale ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <div>
            <span className="text-sm font-bold text-gray-800">Sales Process Tracker</span>
            {selectedSale && (
              <span className="ml-2 text-xs text-gray-400">— {selectedSale.customer_name}</span>
            )}
          </div>
          {selectedSale && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${allDone ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
              {completedCount}/{MILESTONES.length} done
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedSale && (
            <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">{selectedSale.invoice_number}</span>
          )}
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex" style={{ minHeight: 260 }}>
        {/* ── Left: Sales list with search ── */}
        <div className="w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col">
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name / invoice..."
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
            />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-1.5">
            {search ? 'Results' : 'Recent Sales'}
          </p>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {sales.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No sales found</p>
            ) : sales.map(sale => {
              const isActive = selectedSale?.id === sale.id;
              return (
                <button
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className={`w-full text-left px-3 py-3 transition-colors border-l-2 ${isActive ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent hover:bg-white hover:border-l-gray-200'}`}
                >
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                    {sale.customer_name}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-400 font-mono">{sale.invoice_number}</span>
                    {sale.vehicle_model && (
                      <span className="text-xs text-gray-400 truncate ml-1 max-w-20">{sale.vehicle_model}</span>
                    )}
                  </div>
                  {/* Mini progress bar always visible */}
                  {isActive && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${allDone ? 'text-green-600' : 'text-blue-500'}`}>
                        {pct}%
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Milestone area ── */}
        <div className="flex-1 p-6 flex flex-col">
          {!selectedSale ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a sale to track its progress
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Horizontal timeline */}
              <div className="relative pt-2">
                {/* Background connector */}
                <div className="absolute top-[36px] left-[calc(10%)] right-[calc(10%)] h-1 bg-gray-200 z-0 rounded-full" />
                {/* Progress fill */}
                <div
                  className={`absolute top-[36px] left-[calc(10%)] h-1 z-0 rounded-full transition-all duration-700 ${allDone ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: completedCount === 0 ? '0%' : `calc(${((completedCount - 0.5) / MILESTONES.length) * 80}%)` }}
                />

                {/* Steps */}
                <div className="relative z-10 grid grid-cols-5">
                  {MILESTONES.map((m) => {
                    const state = ms(m.key);
                    const done = state.completed;
                    const noteActive = expandedNote === m.key;
                    return (
                      <div key={m.key} className="flex flex-col items-center gap-2">
                        {/* Big circle button */}
                        <button
                          onClick={() => handleToggle(m.key)}
                          disabled={toggling[m.key]}
                          title={done ? `Unmark ${m.label}` : `Mark ${m.label} as done`}
                          className={`w-[60px] h-[60px] rounded-full flex items-center justify-center text-2xl border-3 transition-all shadow-md
                            ${done
                              ? 'bg-green-500 border-green-500 text-white shadow-green-200 scale-105'
                              : 'bg-white border-2 border-gray-300 hover:border-blue-400 hover:shadow-blue-100 hover:scale-105'}
                            ${toggling[m.key] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {done ? (
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span>{m.icon}</span>
                          )}
                        </button>

                        {/* Label block */}
                        <div className="text-center px-1">
                          <p className={`text-xs font-bold leading-tight ${done ? 'text-green-700' : 'text-gray-700'}`}>
                            {m.label}
                          </p>
                          <p className="text-gray-400 leading-tight mt-0.5" style={{ fontSize: '10px' }}>
                            {m.sub}
                          </p>
                          {done && state.completed_at && (
                            <p className="text-green-500 font-medium mt-0.5" style={{ fontSize: '10px' }}>
                              ✓ {new Date(state.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>

                        {/* Note button */}
                        <button
                          onClick={() => setExpandedNote(noteActive ? null : m.key)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            state.notes
                              ? 'bg-amber-50 border-amber-300 text-amber-700 font-medium'
                              : noteActive
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                          }`}
                        >
                          {state.notes ? '📝 Note' : '+ Note'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expanded note editor */}
              {expandedNote && (() => {
                const m = MILESTONES.find(x => x.key === expandedNote);
                const state = ms(expandedNote);
                return (
                  <div className="border border-blue-100 rounded-xl p-4 bg-blue-50">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      {m.icon} {m.label} — Add Note
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Note for ${m.label}...`}
                        value={notes[expandedNote] || ''}
                        onChange={e => setNotes(p => ({ ...p, [expandedNote]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleSaveNote(expandedNote)}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveNote(expandedNote)}
                        disabled={savingNote[expandedNote]}
                        className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        {savingNote[expandedNote] ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setExpandedNote(null)}
                        className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg border border-gray-200 bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                    {state.notes && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span>📝</span>
                        <span>{state.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Completion banner */}
              {allDone && (
                <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-xl">🎉</span>
                  <p className="text-sm font-bold text-green-700">
                    All steps complete for {selectedSale.customer_name}!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
