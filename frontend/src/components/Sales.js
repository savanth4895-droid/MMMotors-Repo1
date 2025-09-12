import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Search, 
  Eye, 
  FileText, 
  Users, 
  TrendingUp,
  Shield,
  Calendar,
  BarChart3,
  PieChart,
  Download
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
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sales = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/sales', icon: TrendingUp },
    { name: 'Create Invoice', path: '/sales/create-invoice', icon: Plus },
    { name: 'View Invoices', path: '/sales/invoices', icon: FileText },
    { name: 'Add Customer', path: '/sales/customers', icon: Users },
    { name: 'View Customer Details', path: '/sales/customer-details', icon: Eye },
    { name: 'Sales Report', path: '/sales/reports', icon: TrendingUp },
    { name: 'Insurance', path: '/sales/insurance', icon: Shield }
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
        <Route path="/" element={<SalesOverview />} />
        <Route path="/create-invoice" element={<CreateInvoice />} />
        <Route path="/invoices" element={<ViewInvoices />} />
        <Route path="/customers" element={<CustomersManagement />} />
        <Route path="/customer-details" element={<ViewCustomerDetails />} />
        <Route path="/reports" element={<SalesReports />} />
        <Route path="/insurance" element={<InsuranceManagement />} />
      </Routes>
    </div>
  );
};

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
        axios.get(`${API}/customers`)
      ]);

      const sales = salesRes.data;
      const customers = customersRes.data;

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

const CreateInvoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    care_of: '',
    mobile: '',
    address: '',
    brand: '',
    model: '',
    color: '',
    chassis_no: '',
    engine_no: '',
    vehicle_no: '',
    insurance_nominee: '',
    relation: '',
    age: '',
    amount: '',
    payment_method: 'cash'
  });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];

  const handleInputChange = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    return `INV-${timestamp.toString().slice(-8)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create customer first
      const customerResponse = await axios.post(`${API}/customers`, {
        name: invoiceData.name,
        phone: invoiceData.mobile,
        email: null,
        address: invoiceData.address
      });

      // Create vehicle
      const vehicleResponse = await axios.post(`${API}/vehicles`, {
        brand: invoiceData.brand,
        model: invoiceData.model,
        chassis_no: invoiceData.chassis_no,
        engine_no: invoiceData.engine_no,
        color: invoiceData.color,
        key_no: 'N/A',
        inbound_location: 'Showroom'
      });

      // Create sale
      const saleResponse = await axios.post(`${API}/sales`, {
        customer_id: customerResponse.data.id,
        vehicle_id: vehicleResponse.data.id,
        amount: parseFloat(invoiceData.amount),
        payment_method: invoiceData.payment_method
      });

      const invoice = {
        ...saleResponse.data,
        invoice_number: generateInvoiceNumber(),
        customer: {
          name: invoiceData.name,
          care_of: invoiceData.care_of,
          mobile: invoiceData.mobile,
          address: invoiceData.address
        },
        vehicle: {
          brand: invoiceData.brand,
          model: invoiceData.model,
          color: invoiceData.color,
          chassis_no: invoiceData.chassis_no,
          engine_no: invoiceData.engine_no,
          vehicle_no: invoiceData.vehicle_no
        },
        insurance: {
          nominee: invoiceData.insurance_nominee,
          relation: invoiceData.relation,
          age: invoiceData.age
        },
        date: invoiceData.date,
        amount: parseFloat(invoiceData.amount),
        payment_method: invoiceData.payment_method
      };

      setGeneratedInvoice(invoice);
      setShowPreview(true);
      toast.success('Invoice generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('invoice-preview');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${generatedInvoice?.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin: 15px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { margin-bottom: 8px; }
            .label { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; text-align: right; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const resetForm = () => {
    setInvoiceData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      care_of: '',
      mobile: '',
      address: '',
      brand: '',
      model: '',
      color: '',
      chassis_no: '',
      engine_no: '',
      vehicle_no: '',
      insurance_nominee: '',
      relation: '',
      age: '',
      amount: '',
      payment_method: 'cash'
    });
    setShowPreview(false);
    setGeneratedInvoice(null);
  };

  if (showPreview && generatedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <h2 className="text-2xl font-bold">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(false)} variant="outline">
              Back to Form
            </Button>
            <Button onClick={handlePrint} variant="outline">
              Print
            </Button>
            <Button onClick={handleDownload}>
              Download
            </Button>
            <Button onClick={resetForm}>
              New Invoice
            </Button>
          </div>
        </div>

        <Card id="invoice-preview" className="print-full-width">
          <CardContent className="p-8">
            <div className="invoice-container">
              {/* Header */}
              <div className="header text-center mb-6">
                <h1 className="text-3xl font-bold text-blue-600">M M MOTORS</h1>
                <p className="text-lg text-gray-600">Two Wheeler Sales Invoice</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-left">
                    <p><strong>Invoice No:</strong> {generatedInvoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Date:</strong> {new Date(generatedInvoice.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="section border rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="field">
                    <span className="label">Name:</span> {generatedInvoice.customer.name}
                  </div>
                  <div className="field">
                    <span className="label">C/O:</span> {generatedInvoice.customer.care_of}
                  </div>
                  <div className="field">
                    <span className="label">Mobile:</span> {generatedInvoice.customer.mobile}
                  </div>
                  <div className="field">
                    <span className="label">Address:</span> {generatedInvoice.customer.address}
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="section border rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="field">
                    <span className="label">Brand:</span> {generatedInvoice.vehicle.brand}
                  </div>
                  <div className="field">
                    <span className="label">Model:</span> {generatedInvoice.vehicle.model}
                  </div>
                  <div className="field">
                    <span className="label">Color:</span> {generatedInvoice.vehicle.color}
                  </div>
                  <div className="field">
                    <span className="label">Chassis No:</span> {generatedInvoice.vehicle.chassis_no}
                  </div>
                  <div className="field">
                    <span className="label">Engine No:</span> {generatedInvoice.vehicle.engine_no}
                  </div>
                  <div className="field">
                    <span className="label">Vehicle No:</span> {generatedInvoice.vehicle.vehicle_no}
                  </div>
                </div>
              </div>

              {/* Insurance Details */}
              <div className="section border rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Insurance Nominee Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="field">
                    <span className="label">Nominee Name:</span> {generatedInvoice.insurance.nominee}
                  </div>
                  <div className="field">
                    <span className="label">Relation:</span> {generatedInvoice.insurance.relation}
                  </div>
                  <div className="field">
                    <span className="label">Age:</span> {generatedInvoice.insurance.age}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="section border rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="field">
                    <span className="label">Payment Method:</span> {generatedInvoice.payment_method.toUpperCase()}
                  </div>
                  <div className="field total text-right">
                    <span className="label">Amount:</span> ₹{generatedInvoice.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-4 border-t">
                <p className="text-sm text-gray-600">Thank you for choosing M M Motors!</p>
                <p className="text-xs text-gray-500 mt-2">This is a computer-generated invoice.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Invoice</CardTitle>
        <CardDescription>Fill in all details to generate a comprehensive invoice</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={invoiceData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>

          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  value={invoiceData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="care_of">C/O (Care Of)</Label>
                <Input
                  id="care_of"
                  placeholder="S/O, D/O, W/O"
                  value={invoiceData.care_of}
                  onChange={(e) => handleInputChange('care_of', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  placeholder="Enter mobile number"
                  value={invoiceData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter complete address"
                  value={invoiceData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Select value={invoiceData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
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
                  value={invoiceData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Enter color"
                  value={invoiceData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="chassis_no">Chassis No</Label>
                <Input
                  id="chassis_no"
                  placeholder="Enter chassis number"
                  value={invoiceData.chassis_no}
                  onChange={(e) => handleInputChange('chassis_no', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="engine_no">Engine No</Label>
                <Input
                  id="engine_no"
                  placeholder="Enter engine number"
                  value={invoiceData.engine_no}
                  onChange={(e) => handleInputChange('engine_no', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicle_no">Vehicle No</Label>
                <Input
                  id="vehicle_no"
                  placeholder="Enter vehicle registration number"
                  value={invoiceData.vehicle_no}
                  onChange={(e) => handleInputChange('vehicle_no', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Insurance Nominee Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Insurance Nominee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="insurance_nominee">Nominee Name</Label>
                <Input
                  id="insurance_nominee"
                  placeholder="Enter nominee name"
                  value={invoiceData.insurance_nominee}
                  onChange={(e) => handleInputChange('insurance_nominee', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="relation">Relation</Label>
                <Select value={invoiceData.relation} onValueChange={(value) => handleInputChange('relation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="son">Son</SelectItem>
                    <SelectItem value="daughter">Daughter</SelectItem>
                    <SelectItem value="brother">Brother</SelectItem>
                    <SelectItem value="sister">Sister</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={invoiceData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={invoiceData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={invoiceData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Generating Invoice...' : 'Generate Invoice'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ViewInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API}/sales`);
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`);
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles');
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = invoices.filter(invoice => {
        const customer = customers.find(c => c.id === invoice.customer_id);
        const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
        
        return (
          invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.amount?.toString().includes(searchTerm) ||
          invoice.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredInvoices(filtered);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getVehicleModel = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown Vehicle';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors.paid}`}>
        {status || 'Paid'}
      </span>
    );
  };

  const handleViewInvoice = (invoice) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
    
    setSelectedInvoice({
      ...invoice,
      customer,
      vehicle
    });
    setShowInvoiceModal(true);
  };

  const handleEditInvoice = (invoice) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
    
    setEditingInvoice(invoice);
    setEditFormData({
      customer_id: invoice.customer_id,
      vehicle_id: invoice.vehicle_id,
      amount: invoice.amount,
      payment_method: invoice.payment_method,
      insurance_details: invoice.insurance_details || {}
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;
    
    try {
      setLoading(true);
      await axios.put(`${API}/sales/${editingInvoice.id}`, editFormData);
      toast.success('Invoice updated successfully!');
      setShowEditModal(false);
      setEditingInvoice(null);
      setEditFormData({});
      fetchInvoices(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingInvoice(null);
    setEditFormData({});
  };

  const handlePrintInvoice = (invoice) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin: 15px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { margin-bottom: 8px; }
            .label { font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>M M MOTORS</h1>
            <p>Two Wheeler Sales Invoice</p>
            <div class="grid">
              <div><strong>Invoice No:</strong> ${invoice.invoice_number}</div>
              <div><strong>Date:</strong> ${new Date(invoice.sale_date).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Customer Details</h3>
            <div class="field"><span class="label">Name:</span> ${customer?.name || 'N/A'}</div>
            <div class="field"><span class="label">Phone:</span> ${customer?.phone || 'N/A'}</div>
            <div class="field"><span class="label">Address:</span> ${customer?.address || 'N/A'}</div>
          </div>
          
          <div class="section">
            <h3>Vehicle Details</h3>
            <div class="field"><span class="label">Brand & Model:</span> ${vehicle?.brand || 'N/A'} ${vehicle?.model || ''}</div>
            <div class="field"><span class="label">Color:</span> ${vehicle?.color || 'N/A'}</div>
            <div class="field"><span class="label">Chassis No:</span> ${vehicle?.chassis_no || 'N/A'}</div>
            <div class="field"><span class="label">Engine No:</span> ${vehicle?.engine_no || 'N/A'}</div>
          </div>
          
          <div class="section">
            <div class="total">
              <div><span class="label">Payment Method:</span> ${invoice.payment_method?.toUpperCase() || 'CASH'}</div>
              <div><span class="label">Total Amount:</span> ₹${invoice.amount?.toLocaleString() || '0'}</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
            <p>Thank you for choosing M M Motors!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Invoices</h2>
          <p className="text-gray-600">Manage and view all sales invoices</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by invoice no, customer, vehicle, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-80"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => 
                    new Date(inv.sale_date).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(invoices.map(inv => inv.customer_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Invoice List ({filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Invoice No.</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No invoices found matching your search' : 'No invoices found'}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {invoice.invoice_number}
                        </button>
                      </td>
                      <td className="p-3 text-gray-600">
                        {new Date(invoice.sale_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">
                          {getCustomerName(invoice.customer_id)}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        {getVehicleModel(invoice.vehicle_id)}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-900">
                          ₹{invoice.amount?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(invoice.status || 'paid')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInvoice(invoice)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintInvoice(invoice)}
                            className="flex items-center gap-1"
                          >
                            Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice View Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Invoice Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInvoiceModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-3xl font-bold text-blue-600">M M MOTORS</h1>
                  <p className="text-lg text-gray-600">Two Wheeler Sales Invoice</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-left">
                      <p><strong>Invoice No:</strong> {selectedInvoice.invoice_number}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Date:</strong> {new Date(selectedInvoice.sale_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedInvoice.customer?.name || 'N/A'}</div>
                    <div><strong>Phone:</strong> {selectedInvoice.customer?.phone || 'N/A'}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedInvoice.customer?.address || 'N/A'}</div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Brand:</strong> {selectedInvoice.vehicle?.brand || 'N/A'}</div>
                    <div><strong>Model:</strong> {selectedInvoice.vehicle?.model || 'N/A'}</div>
                    <div><strong>Color:</strong> {selectedInvoice.vehicle?.color || 'N/A'}</div>
                    <div><strong>Chassis No:</strong> {selectedInvoice.vehicle?.chassis_no || 'N/A'}</div>
                    <div><strong>Engine No:</strong> {selectedInvoice.vehicle?.engine_no || 'N/A'}</div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Payment Method:</strong> {selectedInvoice.payment_method?.toUpperCase() || 'CASH'}</div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">
                        Total: ₹{selectedInvoice.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Print Invoice
                </Button>
                <Button onClick={() => setShowInvoiceModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Invoice</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={editFormData.amount || ''}
                    onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select 
                    value={editFormData.payment_method} 
                    onValueChange={(value) => setEditFormData({...editFormData, payment_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select 
                    value={editFormData.customer_id} 
                    onValueChange={(value) => setEditFormData({...editFormData, customer_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Select 
                    value={editFormData.vehicle_id} 
                    onValueChange={(value) => setEditFormData({...editFormData, vehicle_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} - {vehicle.chassis_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [customerData, setCustomerData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    care_of: '',
    mobile: '',
    address: '',
    brand: '',
    model: '',
    color: '',
    chassis_no: '',
    engine_no: '',
    vehicle_no: '',
    insurance_nominee: '',
    relation: '',
    age: ''
  });

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA'];
  const relations = ['father', 'mother', 'spouse', 'son', 'daughter', 'brother', 'sister', 'other'];

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`);
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles');
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    if (searchTerm) {
      filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCustomers(filtered);
  };

  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = 'Customer name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = 'Name should only contain letters and spaces';
        }
        break;
      
      case 'mobile':
        if (!value.trim()) {
          error = 'Mobile number is required';
        } else if (!/^[6-9]\d{9}$/.test(value.trim())) {
          error = 'Enter valid 10-digit mobile number';
        }
        break;
      
      case 'address':
        if (!value.trim()) {
          error = 'Address is required';
        } else if (value.trim().length < 10) {
          error = 'Address must be at least 10 characters';
        }
        break;
      
      case 'chassis_no':
        if (value.trim() && !/^[A-Z0-9]{17}$/.test(value.trim())) {
          error = 'Chassis number must be 17 characters (letters and numbers)';
        }
        break;
      
      case 'engine_no':
        if (value.trim() && value.trim().length < 5) {
          error = 'Engine number must be at least 5 characters';
        } else if (value.trim() && !/^[A-Z0-9]+$/.test(value.trim())) {
          error = 'Engine number should only contain letters and numbers';
        }
        break;
      
      case 'vehicle_no':
        if (value.trim() && !/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(value.trim().replace(/\s/g, ''))) {
          error = 'Enter valid vehicle number (e.g., KA05AB1234)';
        }
        break;
      
      case 'age':
        if (value && (isNaN(value) || value < 18 || value > 100)) {
          error = 'Age must be between 18 and 100';
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = ['name', 'mobile', 'address'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, customerData[field]);
      if (error) errors[field] = error;
    });

    // Validate optional fields if they have values
    Object.keys(customerData).forEach(field => {
      if (!requiredFields.includes(field) && customerData[field]) {
        const error = validateField(field, customerData[field]);
        if (error) errors[field] = error;
      }
    });

    return errors;
  };

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field and update errors
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const resetForm = () => {
    setCustomerData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      care_of: '',
      mobile: '',
      address: '',
      brand: '',
      model: '',
      color: '',
      chassis_no: '',
      engine_no: '',
      vehicle_no: '',
      insurance_nominee: '',
      relation: '',
      age: ''
    });
    setValidationErrors({});
    setTouched({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    // Mark all fields as touched to show errors
    const allTouched = {};
    Object.keys(customerData).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);

    try {
      // Create customer
      const customerResponse = await axios.post(`${API}/customers`, {
        name: customerData.name,
        phone: customerData.mobile,
        email: null,
        address: customerData.address
      });

      // Create vehicle if vehicle details are provided
      if (customerData.brand && customerData.model) {
        await axios.post(`${API}/vehicles`, {
          brand: customerData.brand,
          model: customerData.model,
          chassis_no: customerData.chassis_no,
          engine_no: customerData.engine_no,
          color: customerData.color,
          key_no: 'N/A',
          inbound_location: 'Customer Registration'
        });
      }

      toast.success('Customer details saved successfully!');
      resetForm();
      setShowAddForm(false);
      fetchCustomers();
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Date', 'Name', 'C/O', 'Mobile', 'Address', 'Email', 'Created Date'].join(','),
        ...customers.map(customer => [
          new Date().toISOString().split('T')[0],
          customer.name || '',
          '', // C/O not stored separately
          customer.phone || '',
          customer.address || '',
          customer.email || '',
          new Date(customer.created_at).toLocaleDateString()
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Customer data exported successfully!');
    } catch (error) {
      toast.error('Failed to export customer data');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',');
            
            // Basic CSV parsing - in production, use a proper CSV library
            toast.info('Import functionality will process CSV files. Please ensure correct format.');
            console.log('CSV headers:', headers);
            console.log('CSV lines count:', lines.length - 1);
          } catch (error) {
            toast.error('Failed to parse CSV file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getCustomerVehicle = (customerId) => {
    const vehicle = vehicles.find(v => v.customer_id === customerId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'No vehicle';
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customer details and vehicle information</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
          <Button onClick={handleImport} variant="outline" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Import
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View All
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers by name, phone, email, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Customer Details</CardTitle>
            <CardDescription>Complete customer registration with vehicle and insurance information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Date */}
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={customerData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              {/* Customer Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter customer name"
                      value={customerData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className={touched.name && validationErrors.name ? 'border-red-500' : ''}
                    />
                    {touched.name && validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="care_of">C/O (Care Of)</Label>
                    <Input
                      id="care_of"
                      placeholder="S/O, D/O, W/O"
                      value={customerData.care_of}
                      onChange={(e) => handleInputChange('care_of', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      placeholder="Enter mobile number"
                      value={customerData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      required
                      className={touched.mobile && validationErrors.mobile ? 'border-red-500' : ''}
                    />
                    {touched.mobile && validationErrors.mobile && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.mobile}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter complete address"
                      value={customerData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                      className={touched.address && validationErrors.address ? 'border-red-500' : ''}
                    />
                    {touched.address && validationErrors.address && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={customerData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
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
                      value={customerData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="Enter color"
                      value={customerData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chassis_no">Chassis No</Label>
                    <Input
                      id="chassis_no"
                      placeholder="Enter chassis number (17 characters)"
                      value={customerData.chassis_no}
                      onChange={(e) => handleInputChange('chassis_no', e.target.value.toUpperCase())}
                      className={touched.chassis_no && validationErrors.chassis_no ? 'border-red-500' : ''}
                    />
                    {touched.chassis_no && validationErrors.chassis_no && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.chassis_no}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="engine_no">Engine No</Label>
                    <Input
                      id="engine_no"
                      placeholder="Enter engine number"
                      value={customerData.engine_no}
                      onChange={(e) => handleInputChange('engine_no', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_no">Vehicle No</Label>
                    <Input
                      id="vehicle_no"
                      placeholder="Enter vehicle registration number"
                      value={customerData.vehicle_no}
                      onChange={(e) => handleInputChange('vehicle_no', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Nominee Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Insurance Nominee Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="insurance_nominee">Insurance Nominee Name</Label>
                    <Input
                      id="insurance_nominee"
                      placeholder="Enter nominee name"
                      value={customerData.insurance_nominee}
                      onChange={(e) => handleInputChange('insurance_nominee', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relation">Relation</Label>
                    <Select value={customerData.relation} onValueChange={(value) => handleInputChange('relation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation.charAt(0).toUpperCase() + relation.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter age"
                      value={customerData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  {loading ? 'Saving...' : 'Save Customer Details'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Reset Form
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 sm:flex-none sm:px-8"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Phone</th>
                  <th className="text-left p-3 font-semibold">Address</th>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Created Date</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No customers found matching your search' : 'No customers found'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium">{customer.name}</td>
                      <td className="p-3 text-gray-600">{customer.phone}</td>
                      <td className="p-3 text-gray-600">{customer.address}</td>
                      <td className="p-3 text-gray-600">{getCustomerVehicle(customer.id)}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(customer.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </div>
                      </td>
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

const SalesReports = () => {
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [brandData, setBrandData] = useState([]);
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
  }, [sales, vehicles]);

  const fetchAllData = async () => {
    try {
      const [salesRes, vehiclesRes, customersRes] = await Promise.all([
        axios.get(`${API}/sales`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/customers`)
      ]);
      
      setSales(salesRes.data);
      setVehicles(vehiclesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = () => {
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
  };

  const processBrandData = () => {
    const brandMap = {};
    
    sales.forEach(sale => {
      const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
      if (vehicle) {
        const brand = vehicle.brand;
        if (!brandMap[brand]) {
          brandMap[brand] = {
            brand: brand,
            sales: 0,
            revenue: 0,
            count: 0
          };
        }
        
        brandMap[brand].sales += 1;
        brandMap[brand].revenue += sale.amount || 0;
        brandMap[brand].count += 1;
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
    
    // Find top brand by revenue
    const brandRevenue = {};
    sales.forEach(sale => {
      const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
      if (vehicle) {
        brandRevenue[vehicle.brand] = (brandRevenue[vehicle.brand] || 0) + (sale.amount || 0);
      }
    });
    
    const topBrand = Object.keys(brandRevenue).reduce((a, b) => 
      brandRevenue[a] > brandRevenue[b] ? a : b, '');

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
        ['Brand', 'Sales Count', 'Revenue'].join(','),
        ...brandData.map(item => [item.brand, item.sales, item.revenue].join(','))
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Monthly Sales Performance
            </CardTitle>
            <CardDescription>
              Sales count and revenue trends over time
            </CardDescription>
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
              Revenue breakdown by vehicle brands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="brand" 
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
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
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
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
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Brand</th>
                    <th className="text-right p-3 font-semibold">Sales</th>
                    <th className="text-right p-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {brandData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.brand}</td>
                      <td className="p-3 text-right">{item.sales}</td>
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

const ViewCustomerDetails = () => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [sales, setSales] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (customers.length > 0 && vehicles.length > 0) {
      combineCustomerVehicleData();
    }
  }, [customers, vehicles, sales]);

  useEffect(() => {
    filterCustomerDetails();
  }, [customerDetails, searchTerm]);

  const fetchAllData = async () => {
    try {
      const [customersRes, vehiclesRes, salesRes] = await Promise.all([
        axios.get(`${API}/customers`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/sales`)
      ]);
      
      setCustomers(customersRes.data);
      setVehicles(vehiclesRes.data);
      setSales(salesRes.data);
    } catch (error) {
      toast.error('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const combineCustomerVehicleData = () => {
    const combined = customers.map(customer => {
      // Find customer's sale to get vehicle information
      const customerSale = sales.find(sale => sale.customer_id === customer.id);
      let customerVehicle = null;
      
      if (customerSale) {
        customerVehicle = vehicles.find(vehicle => vehicle.id === customerSale.vehicle_id);
      }
      
      // If no sale found, check if vehicle is directly linked to customer
      if (!customerVehicle) {
        customerVehicle = vehicles.find(vehicle => vehicle.customer_id === customer.id);
      }

      return {
        id: customer.id,
        date: customerSale ? customerSale.sale_date : customer.created_at,
        name: customer.name,
        mobile: customer.phone,
        address: customer.address,
        email: customer.email,
        brand: customerVehicle?.brand || 'N/A',
        model: customerVehicle?.model || 'N/A',
        color: customerVehicle?.color || 'N/A',
        chassis_no: customerVehicle?.chassis_no || 'N/A',
        engine_no: customerVehicle?.engine_no || 'N/A',
        vehicle_no: customerVehicle?.vehicle_no || 'N/A',
        vehicle_status: customerVehicle?.status || 'N/A',
        sale_amount: customerSale?.amount || null,
        payment_method: customerSale?.payment_method || null
      };
    });
    
    setCustomerDetails(combined);
  };

  const filterCustomerDetails = () => {
    let filtered = customerDetails;
    
    if (searchTerm) {
      filtered = customerDetails.filter(detail =>
        detail.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.chassis_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.engine_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.vehicle_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDetails(filtered);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    
    try {
      setLoading(true);
      await axios.put(`${API}/customers/${editingCustomer.id}`, editFormData);
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      setEditFormData({});
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setEditFormData({});
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Date', 'Name', 'Mobile Number', 'Address', 'Brand', 'Model', 'Color', 'Chassis No', 'Engine No', 'Vehicle No'].join(','),
        ...filteredDetails.map(detail => [
          new Date(detail.date).toLocaleDateString('en-IN'),
          detail.name || '',
          detail.mobile || '',
          detail.address || '',
          detail.brand || '',
          detail.model || '',
          detail.color || '',
          detail.chassis_no || '',
          detail.engine_no || '',
          detail.vehicle_no || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer_details_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Customer details exported successfully!');
    } catch (error) {
      toast.error('Failed to export customer details');
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
          <h2 className="text-2xl font-bold text-gray-900">View Customer Details</h2>
          <p className="text-gray-600">Complete customer information with vehicle details</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, mobile, address, brand, model, chassis no, engine no, or vehicle no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customerDetails.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MotorcycleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customerDetails.filter(c => c.brand !== 'N/A').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{customerDetails.reduce((sum, c) => sum + (c.sale_amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredDetails.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customer Details ({filteredDetails.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Mobile Number</th>
                  <th className="text-left p-3 font-semibold">Address</th>
                  <th className="text-left p-3 font-semibold">Brand</th>
                  <th className="text-left p-3 font-semibold">Model</th>
                  <th className="text-left p-3 font-semibold">Color</th>
                  <th className="text-left p-3 font-semibold">Chassis NO.</th>
                  <th className="text-left p-3 font-semibold">Engine NO.</th>
                  <th className="text-left p-3 font-semibold">Vehicle No.</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetails.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No customer details found matching your search' : 'No customer details found'}
                    </td>
                  </tr>
                ) : (
                  filteredDetails.map((detail) => (
                    <tr key={detail.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600">
                        {new Date(detail.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{detail.name}</div>
                      </td>
                      <td className="p-3 text-gray-600">{detail.mobile}</td>
                      <td className="p-3 text-gray-600 max-w-xs truncate" title={detail.address}>
                        {detail.address}
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${detail.brand !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {detail.brand}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{detail.model}</td>
                      <td className="p-3 text-gray-600">{detail.color}</td>
                      <td className="p-3 text-gray-600 font-mono text-sm">{detail.chassis_no}</td>
                      <td className="p-3 text-gray-600 font-mono text-sm">{detail.engine_no}</td>
                      <td className="p-3 text-gray-600 font-mono text-sm">{detail.vehicle_no}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewCustomer(detail)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCustomer(detail)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customer Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedCustomer.name}</div>
                    <div><strong>Mobile:</strong> {selectedCustomer.mobile}</div>
                    <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                    <div><strong>Registration Date:</strong> {new Date(selectedCustomer.date).toLocaleDateString('en-IN')}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedCustomer.address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  {selectedCustomer.brand !== 'N/A' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><strong>Brand:</strong> {selectedCustomer.brand}</div>
                      <div><strong>Model:</strong> {selectedCustomer.model}</div>
                      <div><strong>Color:</strong> {selectedCustomer.color}</div>
                      <div><strong>Vehicle Status:</strong> {selectedCustomer.vehicle_status}</div>
                      <div><strong>Chassis Number:</strong> {selectedCustomer.chassis_no}</div>
                      <div><strong>Engine Number:</strong> {selectedCustomer.engine_no}</div>
                      <div className="md:col-span-2"><strong>Vehicle Registration:</strong> {selectedCustomer.vehicle_no}</div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No vehicle information available</p>
                  )}
                </div>

                {/* Sales Information */}
                {selectedCustomer.sale_amount && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-600">Sales Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><strong>Sale Amount:</strong> ₹{selectedCustomer.sale_amount?.toLocaleString()}</div>
                      <div><strong>Payment Method:</strong> {selectedCustomer.payment_method?.toUpperCase()}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleEditCustomer(selectedCustomer)}
                >
                  Edit Customer
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Customer</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter customer name"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete address"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InsuranceManagement = () => {
  const [insuranceData, setInsuranceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchInsuranceData();
  }, []);

  useEffect(() => {
    filterInsuranceData();
  }, [insuranceData, searchTerm]);

  const fetchInsuranceData = async () => {
    try {
      const [salesRes, customersRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/sales`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/vehicles`)
      ]);

      const sales = salesRes.data;
      const customers = customersRes.data;
      const vehicles = vehiclesRes.data;

      // Combine data to create insurance records
      const combined = sales.map(sale => {
        const customer = customers.find(c => c.id === sale.customer_id);
        const vehicle = vehicles.find(v => v.id === sale.vehicle_id);
        
        // Calculate insurance expiry date (364 days from purchase date)
        const purchaseDate = new Date(sale.sale_date);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(purchaseDate.getDate() + 364);

        // Determine status based on expiry date
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status;
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon';
        } else {
          status = 'active';
        }

        return {
          id: sale.id,
          customer_name: customer?.name || 'Unknown',
          phone_number: customer?.phone || 'N/A',
          vehicle_model: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown Vehicle',
          vehicle_reg_no: vehicle?.vehicle_no || 'N/A',
          purchase_date: sale.sale_date,
          expiry_date: expiryDate.toISOString(),
          status: status,
          days_until_expiry: daysUntilExpiry,
          customer_id: sale.customer_id,
          vehicle_id: sale.vehicle_id,
          sale_amount: sale.amount,
          payment_method: sale.payment_method,
          customer_address: customer?.address || 'N/A',
          vehicle_chassis: vehicle?.chassis_no || 'N/A',
          vehicle_engine: vehicle?.engine_no || 'N/A'
        };
      });

      setInsuranceData(combined);
    } catch (error) {
      toast.error('Failed to fetch insurance data');
    } finally {
      setLoading(false);
    }
  };

  const filterInsuranceData = () => {
    let filtered = insuranceData;

    if (searchTerm) {
      filtered = insuranceData.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const getStatusBadge = (status, daysUntilExpiry) => {
    const statusConfig = {
      expired: { 
        label: 'Expired', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      },
      expiring_soon: { 
        label: `Expires in ${daysUntilExpiry} days`, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      active: { 
        label: 'Active', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      }
    };

    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleViewInsurance = (insurance) => {
    setSelectedInsurance(insurance);
    setShowViewModal(true);
  };

  const handleEditInsurance = (insurance) => {
    setSelectedInsurance(insurance);
    setShowEditModal(true);
  };

  const exportInsuranceData = () => {
    try {
      const csvContent = [
        ['Customer Name', 'Phone Number', 'Vehicle Model', 'Vehicle Reg No', 'Purchase Date', 'Expiry Date', 'Status', 'Days Until Expiry'].join(','),
        ...filteredData.map(item => [
          item.customer_name || '',
          item.phone_number || '',
          item.vehicle_model || '',
          item.vehicle_reg_no || '',
          new Date(item.purchase_date).toLocaleDateString('en-IN'),
          new Date(item.expiry_date).toLocaleDateString('en-IN'),
          item.status || '',
          item.days_until_expiry || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insurance_renewals_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Insurance data exported successfully!');
    } catch (error) {
      toast.error('Failed to export insurance data');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const expiredCount = insuranceData.filter(item => item.status === 'expired').length;
  const expiringSoonCount = insuranceData.filter(item => item.status === 'expiring_soon').length;
  const activeCount = insuranceData.filter(item => item.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insurance Renewal Management</h2>
          <p className="text-gray-600">Track and manage vehicle insurance renewals</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportInsuranceData} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export Data
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by customer name, phone, vehicle model, or registration number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringSoonCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-blue-600">{insuranceData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Renewal Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Insurance Renewals ({filteredData.length} policies)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Expiry Date</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No insurance records found matching your search' : 'No insurance records found'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((insurance) => (
                    <tr key={insurance.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{insurance.customer_name}</div>
                      </td>
                      <td className="p-3 text-gray-600">{insurance.phone_number}</td>
                      <td className="p-3 text-gray-600">{insurance.vehicle_model}</td>
                      <td className="p-3 text-gray-600 font-mono">{insurance.vehicle_reg_no}</td>
                      <td className="p-3">
                        <div className="text-gray-900 font-medium">
                          {new Date(insurance.expiry_date).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {insurance.days_until_expiry > 0 
                            ? `${insurance.days_until_expiry} days left`
                            : `${Math.abs(insurance.days_until_expiry)} days overdue`
                          }
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(insurance.status, insurance.days_until_expiry)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInsurance(insurance)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInsurance(insurance)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Insurance Modal */}
      {showViewModal && selectedInsurance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Insurance Policy Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedInsurance.customer_name}</div>
                    <div><strong>Phone:</strong> {selectedInsurance.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedInsurance.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Model:</strong> {selectedInsurance.vehicle_model}</div>
                    <div><strong>Registration:</strong> {selectedInsurance.vehicle_reg_no}</div>
                    <div><strong>Chassis Number:</strong> {selectedInsurance.vehicle_chassis}</div>
                    <div><strong>Engine Number:</strong> {selectedInsurance.vehicle_engine}</div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Insurance Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Purchase Date:</strong> {new Date(selectedInsurance.purchase_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Expiry Date:</strong> {new Date(selectedInsurance.expiry_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedInsurance.status, selectedInsurance.days_until_expiry)}</div>
                    <div><strong>Days Until Expiry:</strong> 
                      <span className={selectedInsurance.days_until_expiry < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {selectedInsurance.days_until_expiry > 0 
                          ? `${selectedInsurance.days_until_expiry} days`
                          : `${Math.abs(selectedInsurance.days_until_expiry)} days overdue`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sale Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Sale Amount:</strong> ₹{selectedInsurance.sale_amount?.toLocaleString()}</div>
                    <div><strong>Payment Method:</strong> {selectedInsurance.payment_method?.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditInsurance(selectedInsurance);
                  }}
                >
                  Edit Policy
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Insurance Modal */}
      {showEditModal && selectedInsurance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Insurance Policy</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="text-center py-8">
                <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Insurance Policy Management</h3>
                <p className="text-gray-500 mb-4">
                  Edit functionality for insurance policies will be implemented in the next update.
                  Currently showing policy details for: <strong>{selectedInsurance.customer_name}</strong>
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">
                    Vehicle: {selectedInsurance.vehicle_model} ({selectedInsurance.vehicle_reg_no})
                  </p>
                  <p className="text-sm text-gray-600">
                    Expiry: {new Date(selectedInsurance.expiry_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Button onClick={() => setShowEditModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;