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
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sales = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/sales', icon: TrendingUp },
    { name: 'Create Invoice', path: '/sales/create-invoice', icon: Plus },
    { name: 'View Invoices', path: '/sales/invoices', icon: FileText },
    { name: 'Customers', path: '/sales/customers', icon: Users },
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
        amount: parseFloat(invoiceData.amount)
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
                <h1 className="text-3xl font-bold text-blue-600">MOTO MANAGER</h1>
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
                <p className="text-sm text-gray-600">Thank you for choosing Moto Manager!</p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Invoice #</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Payment</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{invoice.invoice_number}</td>
                  <td className="p-2">{new Date(invoice.sale_date).toLocaleDateString()}</td>
                  <td className="p-2">{invoice.customer_id}</td>
                  <td className="p-2">₹{invoice.amount}</td>
                  <td className="p-2">
                    <Badge variant="outline">{invoice.payment_method}</Badge>
                  </td>
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
  );
};

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/customers`, customerData);
      toast.success('Customer added successfully!');
      setCustomerData({ name: '', phone: '', email: '', address: '' });
      setShowAddForm(false);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to add customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Customer Management</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Customer</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Address</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{customer.name}</td>
                    <td className="p-2">{customer.phone}</td>
                    <td className="p-2">{customer.email || 'N/A'}</td>
                    <td className="p-2">{customer.address}</td>
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

const InsuranceManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurance Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Insurance Features</h3>
          <p className="text-gray-500 mb-4">Manage insurance renewals and policies</p>
          <Button>Coming Soon</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Sales;