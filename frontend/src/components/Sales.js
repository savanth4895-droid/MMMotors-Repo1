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
  Download,
  Trash2
} from 'lucide-react';
// Utility function to convert number to words
const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };
  
  if (num < 100) {
    return convertHundreds(num);
  } else if (num < 1000) {
    return convertHundreds(num);
  } else if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = convertHundreds(thousands) + ' Thousand';
    if (remainder > 0) {
      result += ' ' + convertHundreds(remainder);
    }
    return result;
  } else if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    let result = convertHundreds(lakhs) + ' Lakh';
    if (remainder > 0) {
      if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += ' ' + convertHundreds(thousands) + ' Thousand';
        if (hundreds > 0) {
          result += ' ' + convertHundreds(hundreds);
        }
      } else {
        result += ' ' + convertHundreds(remainder);
      }
    }
    return result;
  } else {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    let result = convertHundreds(crores) + ' Crore';
    if (remainder > 0) {
      if (remainder >= 100000) {
        const lakhs = Math.floor(remainder / 100000);
        const rest = remainder % 100000;
        result += ' ' + convertHundreds(lakhs) + ' Lakh';
        if (rest > 0) {
          if (rest >= 1000) {
            const thousands = Math.floor(rest / 1000);
            const hundreds = rest % 1000;
            result += ' ' + convertHundreds(thousands) + ' Thousand';
            if (hundreds > 0) {
              result += ' ' + convertHundreds(hundreds);
            }
          } else {
            result += ' ' + convertHundreds(rest);
          }
        }
      } else if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += ' ' + convertHundreds(thousands) + ' Thousand';
        if (hundreds > 0) {
          result += ' ' + convertHundreds(hundreds);
        }
      } else {
        result += ' ' + convertHundreds(remainder);
      }
    }
    return result;
  }
};

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

// Helper function to safely extract error messages
const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data) {
    // Handle Pydantic validation errors
    if (Array.isArray(error.response.data) && error.response.data.length > 0) {
      return error.response.data.map(err => err.msg || err.message || 'Validation error').join(', ');
    }
    
    // Handle detail errors
    if (error.response.data.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(err => err.msg || err.message || 'Error').join(', ');
      }
    }
    
    // Handle message errors
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

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
    payment_method: '',
    hypothecation: ''
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
        payment_method: invoiceData.payment_method,
        hypothecation: invoiceData.hypothecation
      };

      setGeneratedInvoice(invoice);
      setShowPreview(true);
      toast.success('Invoice generated successfully!');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!generatedInvoice) return;

    // Get the invoice preview content
    const invoiceElement = document.getElementById('invoice-preview');
    if (invoiceElement) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${generatedInvoice.invoice_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 10px; line-height: 1.3; }
              .invoice-container { max-width: 21cm; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .header h1 { margin: 0; font-size: 18px; color: #2563eb; font-weight: bold; }
              .header p { margin: 3px 0; font-size: 11px; }
              .section { margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px; page-break-inside: avoid; }
              .section h3 { margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
              .field { margin-bottom: 4px; font-size: 10px; }
              .label { font-weight: bold; display: inline-block; min-width: 80px; }
              .payment-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px; }
              .amount-words { margin-top: 6px; font-style: italic; padding: 6px; background-color: #f8f8f8; border-radius: 3px; border-top: 1px solid #ccc; font-size: 10px; }
              .total { font-size: 14px; font-weight: bold; text-align: right; }
              table { width: 100%; border-collapse: collapse; margin-top: 6px; }
              th, td { padding: 4px; text-align: left; border: 1px solid #333; font-size: 9px; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .service-header { text-align: center; font-weight: bold; margin-bottom: 8px; font-size: 12px; }
              .customer-msg { margin-bottom: 8px; padding: 6px; background-color: #f8f8f8; border-radius: 3px; }
              .customer-msg p { margin: 0; font-size: 9px; }
              .service-footer { text-align: center; padding: 4px; background-color: #f0f0f0; border: 2px solid #333; border-top: none; font-weight: bold; font-size: 9px; }
              .footer { text-align: center; margin-top: 15px; border-top: 1px solid #ccc; padding-top: 8px; }
              .grid { display: flex; justify-content: space-between; margin-top: 8px; }
              .no-print { display: none !important; }
              @media print { 
                body { margin: 0; padding: 8px; } 
                .section { page-break-inside: avoid; }
                .no-print { display: none !important; }
                @page { size: A4; margin: 0.5cm; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              ${invoiceElement.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
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

  // Function to download invoice as PDF
  const handleDownloadPDF = async (invoice = null) => {
    const invoiceData = invoice || generatedInvoice;
    if (!invoiceData) return;

    try {
      // Get the invoice preview element
      const invoiceElement = document.getElementById('invoice-preview');
      if (!invoiceElement) return;

      // Import html2pdf dynamically
      const { default: html2pdf } = await import('html2pdf.js');

      // Generate filename with customer name and mobile number
      const customerName = invoiceData.customer?.name || 'Name';
      const customerMobile = invoiceData.customer?.mobile || 'Mobile';
      const sanitizedName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedMobile = customerMobile.replace(/[^0-9]/g, '');
      const filename = `Invoice_${sanitizedName}_${sanitizedMobile}_${invoiceData.invoice_number}.pdf`;

      // Configure options for PDF generation
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          width: 794,  // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: false
        }
      };

      // Generate and download PDF
      html2pdf().set(opt).from(invoiceElement).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
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
      payment_method: 'cash',
      hypothecation: ''
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
            <Button onClick={handleDownloadPDF}>
              Download PDF
            </Button>
            <Button onClick={resetForm}>
              New Invoice
            </Button>
          </div>
        </div>

        <Card id="invoice-preview" className="print-full-width shadow-2xl max-w-[21cm] mx-auto">
          <CardContent className="p-0">
            <div className="invoice-container bg-white text-xs">
              {/* Professional Header - Compact */}
              <div className="header bg-gradient-to-r from-blue-800 to-blue-600 text-white p-3 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-bold tracking-wide">M M MOTORS</h1>
                    <p className="text-blue-100 text-xs mt-1 font-medium">Premium Two Wheeler Sales & Service</p>
                    <div className="mt-1 text-blue-100 text-xs space-y-0.5">
                      <p className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                        Bengaluru main road, behind Ruchi Bakery
                      </p>
                      <p className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                        Malur, Karnataka 563130
                      </p>
                      <p className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                        Phone: 7026263123 | Email: mmmotors3123@gmail.com
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2 border border-white border-opacity-30">
                      <h2 className="text-sm font-bold text-white mb-1">SALES INVOICE</h2>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-blue-100 text-xs">Invoice No:</span>
                          <span className="font-bold text-white text-xs">{generatedInvoice.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-100 text-xs">Date:</span>
                          <span className="font-bold text-white text-xs">{new Date(generatedInvoice.date).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-3">

              {/* Customer & Vehicle Details Grid - Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {/* Customer Details */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-1">
                    <h3 className="text-white font-bold flex items-center text-xs">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      CUSTOMER DETAILS
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="flex items-center border-b border-slate-200 pb-0.5">
                      <span className="text-slate-600 font-medium w-12 text-xs">Name:</span>
                      <span className="text-slate-900 font-semibold text-xs">{generatedInvoice.customer.name}</span>
                    </div>
                    <div className="flex items-center border-b border-slate-200 pb-0.5">
                      <span className="text-slate-600 font-medium w-12 text-xs">C/O:</span>
                      <span className="text-slate-900 text-xs">{generatedInvoice.customer.care_of}</span>
                    </div>
                    <div className="flex items-center border-b border-slate-200 pb-0.5">
                      <span className="text-slate-600 font-medium w-12 text-xs">Mobile:</span>
                      <span className="text-slate-900 font-mono font-semibold text-xs">{generatedInvoice.customer.mobile}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-slate-600 font-medium w-12 text-xs">Address:</span>
                      <span className="text-slate-900 leading-tight text-xs">{generatedInvoice.customer.address}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-2 py-1">
                    <h3 className="text-white font-bold flex items-center text-xs">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2L14,6H18L14,8L15,12L12,10L9,12L10,8L6,6H10L12,2Z"/>
                      </svg>
                      VEHICLE DETAILS
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border-b border-emerald-200 pb-0.5">
                        <span className="text-emerald-700 font-medium text-xs">Brand</span>
                        <div className="text-slate-900 font-bold text-xs">{generatedInvoice.vehicle.brand}</div>
                      </div>
                      <div className="border-b border-emerald-200 pb-0.5">
                        <span className="text-emerald-700 font-medium text-xs">Model</span>
                        <div className="text-slate-900 font-semibold text-xs">{generatedInvoice.vehicle.model}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border-b border-emerald-200 pb-0.5">
                        <span className="text-emerald-700 font-medium text-xs">Color</span>
                        <div className="text-slate-900 text-xs">{generatedInvoice.vehicle.color}</div>
                      </div>
                      <div className="border-b border-emerald-200 pb-0.5">
                        <span className="text-emerald-700 font-medium text-xs">Vehicle No</span>
                        <div className="text-slate-900 font-mono font-bold text-xs">{generatedInvoice.vehicle.vehicle_no}</div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700 font-medium">Chassis No:</span>
                        <span className="text-slate-900 font-mono text-xs">{generatedInvoice.vehicle.chassis_no}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700 font-medium">Engine No:</span>
                        <span className="text-slate-900 font-mono text-xs">{generatedInvoice.vehicle.engine_no}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Details - Compact */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-2 py-1">
                  <h3 className="text-white font-bold flex items-center text-xs">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5H16.2V16H7.8V11.5H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.9 10.5,9.7V11.5H13.5V9.7C13.5,8.9 12.8,8.2 12,8.2Z"/>
                    </svg>
                    INSURANCE NOMINEE DETAILS
                  </h3>
                </div>
                <div className="p-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <span className="text-purple-700 font-medium text-xs block">Nominee Name</span>
                      <div className="text-slate-900 font-semibold mt-0.5 text-xs">{generatedInvoice.insurance.nominee}</div>
                    </div>
                    <div className="text-center">
                      <span className="text-purple-700 font-medium text-xs block">Relation</span>
                      <div className="text-slate-900 font-semibold mt-0.5 capitalize text-xs">{generatedInvoice.insurance.relation}</div>
                    </div>
                    <div className="text-center">
                      <span className="text-purple-700 font-medium text-xs block">Age</span>
                      <div className="text-slate-900 font-semibold mt-0.5 text-xs">{generatedInvoice.insurance.age} years</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary - Compact */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-2 py-1">
                  <h3 className="text-white font-bold flex items-center text-xs">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                    </svg>
                    PAYMENT SUMMARY
                  </h3>
                </div>
                <div className="p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-1 border-b border-green-200">
                        <span className="text-green-700 font-medium text-xs">Payment Method:</span>
                        <span className="text-slate-900 font-bold uppercase bg-green-200 px-2 py-0.5 rounded-full text-xs">
                          {generatedInvoice.payment_method}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-green-700 font-medium text-xs">Hypothecation:</span>
                        <span className="text-slate-900 font-semibold text-xs">{generatedInvoice.hypothecation || 'CASH'}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-300 shadow-sm">
                      <div className="text-center">
                        <span className="text-green-700 font-medium text-xs block mb-1">TOTAL AMOUNT</span>
                        <div className="text-lg font-bold text-green-600">
                          ₹{generatedInvoice.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200">
                    <span className="text-orange-800 font-semibold text-xs">Amount in Words:</span>
                    <div className="text-slate-900 font-medium mt-0.5 italic text-xs">
                      {numberToWords(generatedInvoice.amount)} Rupees Only
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Schedule - Compact */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-2 py-1">
                  <h3 className="text-white font-bold text-center flex items-center justify-center text-xs">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                    </svg>
                    SERVICE SCHEDULE
                  </h3>
                </div>
                <div className="p-2">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 mb-2 border border-indigo-200">
                    <p className="font-bold text-indigo-800 text-xs mb-1">DEAR VALUED CUSTOMER,</p>
                    <p className="text-indigo-700 text-xs leading-tight">
                      We thank you for choosing our world-class vehicle. To ensure optimal performance and longevity, 
                      please follow the service schedule below for a pleasant riding experience at all times.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-indigo-300 shadow-sm">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                          <th className="p-1.5 text-left font-bold border-r border-indigo-500">SERVICE DATE</th>
                          <th className="p-1.5 text-left font-bold border-r border-indigo-500">SERVICE TYPE</th>
                          <th className="p-1.5 text-left font-bold">RECOMMENDED SCHEDULE</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr className="border-b border-indigo-200 hover:bg-indigo-50">
                          <td className="p-1.5 border-r border-indigo-200 text-slate-600">____/____/____</td>
                          <td className="p-1.5 border-r border-indigo-200 font-bold text-indigo-700">FIRST SERVICE</td>
                          <td className="p-1.5 text-slate-800">500-700 kms or 15-30 days</td>
                        </tr>
                        <tr className="border-b border-indigo-200 hover:bg-indigo-50">
                          <td className="p-1.5 border-r border-indigo-200 text-slate-600">____/____/____</td>
                          <td className="p-1.5 border-r border-indigo-200 font-bold text-indigo-700">SECOND SERVICE</td>
                          <td className="p-1.5 text-slate-800">3000-3500 kms or 30-90 days</td>
                        </tr>
                        <tr className="border-b border-indigo-200 hover:bg-indigo-50">
                          <td className="p-1.5 border-r border-indigo-200 text-slate-600">____/____/____</td>
                          <td className="p-1.5 border-r border-indigo-200 font-bold text-indigo-700">THIRD SERVICE</td>
                          <td className="p-1.5 text-slate-800">6000-6500 kms or 90-180 days</td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="p-1.5 border-r border-indigo-200 text-slate-600">____/____/____</td>
                          <td className="p-1.5 border-r border-indigo-200 font-bold text-indigo-700">FOURTH SERVICE</td>
                          <td className="p-1.5 text-slate-800">9000-9500 kms or 180-270 days</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-t border-indigo-300 p-1.5 text-center">
                      <p className="font-bold text-amber-800 text-xs">
                        ⚠️ IMPORTANT: Follow whichever milestone comes first (kilometers or days)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Footer - Compact */}
              <div className="mt-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg p-3 border border-slate-300">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-6 text-slate-700">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9,11H15L13,9H11V7H13V9H15V7A2,2 0 0,0 13,5H11A2,2 0 0,0 9,7V9H7L9,11M20,6H16V4A2,2 0 0,0 14,2H10A2,2 0 0,0 8,4V6H4A2,2 0 0,0 2,8V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V8A2,2 0 0,0 20,6Z"/>
                      </svg>
                      <span className="text-xs font-medium">Authorized Dealer</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H12.5L16.2,16.7L17.3,15.6L14.2,12.5H13V7H11Z"/>
                      </svg>
                      <span className="text-xs font-medium">24/7 Service Support</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                      </svg>
                      <span className="text-xs font-medium">Quality Guaranteed</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-300 pt-2">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Thank You for Choosing M M Motors!</h4>
                    <p className="text-slate-600 text-xs mb-1">Your trust drives our excellence in two-wheeler sales and service.</p>
                    <div className="flex justify-center items-center space-x-3 text-xs text-slate-500">
                      <span>🌟 Premium Quality</span>
                      <span>•</span>
                      <span>⚡ Expert Service</span>
                      <span>•</span>
                      <span>🤝 Customer First</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 border-t border-slate-300 pt-1">
                    This is a computer-generated invoice and does not require a signature. 
                    For queries, contact us at mmmotors3123@gmail.com or 7026263123
                  </div>
                </div>
              </div>
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
                />
              </div>
              <div>
                <Label htmlFor="care_of">C/O (Care Of)</Label>
                <Input
                  id="care_of"
                  placeholder="S/O, D/O, W/O"
                  value={invoiceData.care_of}
                  onChange={(e) => handleInputChange('care_of', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  placeholder="Enter mobile number"
                  value={invoiceData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter complete address"
                  value={invoiceData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
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
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Enter color"
                  value={invoiceData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="chassis_no">Chassis No</Label>
                <Input
                  id="chassis_no"
                  placeholder="Enter chassis number"
                  value={invoiceData.chassis_no}
                  onChange={(e) => handleInputChange('chassis_no', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="engine_no">Engine No</Label>
                <Input
                  id="engine_no"
                  placeholder="Enter engine number"
                  value={invoiceData.engine_no}
                  onChange={(e) => handleInputChange('engine_no', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_no">Vehicle No</Label>
                <Input
                  id="vehicle_no"
                  placeholder="Enter vehicle registration number"
                  value={invoiceData.vehicle_no}
                  onChange={(e) => handleInputChange('vehicle_no', e.target.value)}
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
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={invoiceData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
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
              <div>
                <Label htmlFor="hypothecation">Hypothecation</Label>
                <Input
                  id="hypothecation"
                  placeholder="Enter hypothecation details"
                  value={invoiceData.hypothecation}
                  onChange={(e) => handleInputChange('hypothecation', e.target.value)}
                />
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
      // Basic Invoice Details
      invoice_number: invoice.invoice_number,
      sale_date: invoice.sale_date,
      amount: invoice.amount,
      payment_method: invoice.payment_method,
      hypothecation: invoice.hypothecation || 'Cash',
      
      // Customer Details
      customer_id: invoice.customer_id,
      customer_name: customer?.name || '',
      customer_care_of: customer?.care_of || '',
      customer_mobile: customer?.mobile || customer?.phone || '',
      customer_address: customer?.address || '',
      
      // Vehicle Details
      vehicle_id: invoice.vehicle_id,
      vehicle_brand: vehicle?.brand || '',
      vehicle_model: vehicle?.model || '',
      vehicle_color: vehicle?.color || '',
      vehicle_no: vehicle?.vehicle_no || '',
      chassis_no: vehicle?.chassis_no || '',
      engine_no: vehicle?.engine_no || '',
      
      // Insurance Details
      insurance_details: invoice.insurance_details || {
        nominee: '',
        relation: '',
        age: ''
      }
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
      toast.error(getErrorMessage(error) || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingInvoice(null);
    setEditFormData({});
  };

  const handleDownloadInvoicePDF = async (invoice) => {
    if (!invoice) return;

    try {
      // Import html2pdf dynamically
      const { default: html2pdf } = await import('html2pdf.js');

      // Generate filename with customer name and mobile number
      const customerName = invoice.customer?.name || 'name';
      const customerMobile = invoice.customer?.phone || 'mobile';
      const sanitizedName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedMobile = customerMobile.replace(/[^0-9]/g, '');
      const filename = `Invoice_${sanitizedName}_${sanitizedMobile}_${invoice.invoice_number}.pdf`;

      // Create a temporary div with invoice content for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div style="max-width: 21cm; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.3;">
          <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            <h1 style="margin: 0; font-size: 18px; color: #2563eb; font-weight: bold;">M M MOTORS</h1>
            <p style="margin: 3px 0; font-size: 11px;">Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</p>
            <p style="margin: 3px 0; font-size: 11px;">Two Wheeler Sales Invoice</p>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
              <div><strong>Invoice No:</strong> ${invoice.invoice_number}</div>
              <div><strong>Date:</strong> ${new Date(invoice.sale_date).toLocaleDateString('en-IN')}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Customer Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Name:</strong> ${invoice.customer?.name || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Mobile:</strong> ${invoice.customer?.phone || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Address:</strong> ${invoice.customer?.address || 'N/A'}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Vehicle Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Brand:</strong> ${invoice.vehicle?.brand || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Model:</strong> ${invoice.vehicle?.model || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Color:</strong> ${invoice.vehicle?.color || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Chassis No:</strong> ${invoice.vehicle?.chassis_no || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Engine No:</strong> ${invoice.vehicle?.engine_no || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Vehicle No:</strong> ${invoice.vehicle?.vehicle_no || 'N/A'}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Payment Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px;">
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Payment Method:</strong> ${invoice.payment_method?.toUpperCase() || 'CASH'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Hypothecation:</strong> ${invoice.hypothecation || 'CASH'}</div>
              <div style="font-size: 14px; font-weight: bold; text-align: right;"><strong>Amount:</strong> ₹${invoice.amount?.toLocaleString() || '0'}</div>
            </div>
            <div style="margin-top: 6px; font-style: italic; padding: 6px; background-color: #f8f8f8; border-radius: 3px; border-top: 1px solid #ccc; font-size: 10px;">
              <strong>Amount in Words:</strong> ${numberToWords(invoice.amount || 0)} Rupees Only
            </div>
          </div>
        </div>
      `;

      // Configure options for PDF generation
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          width: 794,  // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      // Generate and download PDF
      html2pdf().set(opt).from(tempDiv).save();
      
      // Clean up
      tempDiv.remove();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrintInvoice = (invoice) => {
    if (!invoice) return;
    
    // Create a new window with the optimized invoice layout matching the target format
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.3; 
              color: #333;
              background: white;
              font-size: 12px;
            }
            .invoice-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 8mm;
              background: white;
              transform: scale(0.9);
              transform-origin: top center;
            }
            
            /* Professional Header - Matching Target */
            .header { 
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: start;
            }
            .header-left {
              flex: 1;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 4px;
              letter-spacing: 2px;
            }
            .company-tagline { 
              font-size: 13px; 
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .company-address { 
              font-size: 12px; 
              line-height: 1.4;
            }
            .company-address p {
              margin: 2px 0;
              display: flex;
              align-items: center;
            }
            .bullet {
              width: 4px;
              height: 4px;
              background: rgba(255,255,255,0.8);
              border-radius: 50%;
              margin-right: 8px;
            }
            .header-right {
              background: rgba(255,255,255,0.2);
              padding: 15px;
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.3);
              backdrop-filter: blur(10px);
            }
            .invoice-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
            }
            .invoice-info {
              font-size: 12px;
            }
            .invoice-info div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            
            /* Content Sections - Compact */
            .section-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .full-width-section {
              margin-bottom: 10px;
            }
            .detail-card {
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .detail-header {
              padding: 8px 12px;
              font-weight: bold;
              font-size: 12px;
              color: white;
              display: flex;
              align-items: center;
            }
            .detail-content {
              padding: 10px 12px;
              background: #f8fafc;
              font-size: 11px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding-bottom: 4px;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
            }
            .detail-value {
              color: #111827;
              text-align: right;
              font-weight: 500;
            }
            
            /* Color themes matching target */
            .customer-card .detail-header { 
              background: linear-gradient(135deg, #2563eb, #3b82f6); 
            }
            .vehicle-card .detail-header { 
              background: linear-gradient(135deg, #059669, #10b981); 
            }
            .insurance-card .detail-header { 
              background: linear-gradient(135deg, #7c3aed, #8b5cf6); 
            }
            .payment-card .detail-header { 
              background: linear-gradient(135deg, #059669, #10b981); 
            }
            .service-card .detail-header { 
              background: linear-gradient(135deg, #2563eb, #3b82f6); 
            }
            
            /* Insurance Layout - Compact 3 Columns */
            .insurance-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              text-align: center;
            }
            .insurance-item {
              padding: 6px;
            }
            .insurance-label {
              font-size: 10px;
              color: #7c3aed;
              font-weight: 600;
              margin-bottom: 3px;
            }
            .insurance-value {
              font-weight: bold;
              font-size: 12px;
            }
            
            /* Payment Summary - Compact */
            .payment-content {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 15px;
              align-items: center;
            }
            .payment-details {
              font-size: 11px;
            }
            .payment-details .detail-row {
              margin-bottom: 4px;
              border-bottom: 1px solid rgba(255,255,255,0.3);
              padding-bottom: 2px;
            }
            .amount-display {
              text-align: center;
              background: rgba(255,255,255,0.15);
              padding: 10px 15px;
              border-radius: 6px;
              border: 1px solid rgba(255,255,255,0.2);
              min-width: 200px;
            }
            .amount-label {
              font-size: 12px;
              margin-bottom: 4px;
              font-weight: 600;
            }
            .amount-large {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .amount-words-section {
              background: linear-gradient(90deg, #fef3c7, #fde68a);
              color: #92400e;
              padding: 8px;
              border-radius: 4px;
              margin-top: 10px;
              border: 1px solid #f59e0b;
              font-size: 11px;
            }
            .amount-words {
              font-style: italic;
              font-weight: 600;
              font-size: 11px;
            }
            
            /* Service Schedule - Compact */
            .service-message {
              background: linear-gradient(135deg, #dbeafe, #bfdbfe);
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 10px;
              border: 1px solid #3b82f6;
            }
            .service-message p {
              margin: 0;
              font-size: 10px;
              color: #1e40af;
            }
            .service-message .customer-greeting {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .service-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              border-radius: 4px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .service-table th {
              background: linear-gradient(135deg, #2563eb, #3b82f6);
              color: white;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              border-right: 1px solid rgba(255,255,255,0.3);
            }
            .service-table th:last-child {
              border-right: none;
            }
            .service-table td {
              padding: 6px 8px;
              border-bottom: 1px solid #e2e8f0;
              border-right: 1px solid #e2e8f0;
              background: #f8fafc;
            }
            .service-table td:last-child {
              border-right: none;
            }
            .service-table tr:last-child td {
              border-bottom: none;
            }
            .service-type {
              font-weight: bold;
              color: #2563eb;
            }
            .service-note {
              background: linear-gradient(90deg, #fef3c7, #fde68a);
              padding: 6px;
              text-align: center;
              font-weight: bold;
              color: #92400e;
              font-size: 9px;
              border: 1px solid #f59e0b;
              border-radius: 0 0 4px 4px;
            }
            
            /* Footer - Compact */
            .footer {
              background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
              border-radius: 6px;
              padding: 12px;
              text-align: center;
              margin-top: 15px;
              border: 1px solid #cbd5e1;
            }
            .footer-badges {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-bottom: 8px;
              font-size: 10px;
              color: #475569;
            }
            .footer-badge {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            .footer-title {
              font-weight: bold;
              font-size: 14px;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .footer-subtitle {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 6px;
            }
            .footer-features {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .footer-contact {
              font-size: 9px;
              color: #64748b;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .invoice-container { padding: 6mm; }
              @page { size: A4; margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Professional Header -->
            <div class="header">
              <div class="header-left">
                <div class="company-name">M M MOTORS</div>
                <div class="company-tagline">Premium Two Wheeler Sales & Service</div>
                <div class="company-address">
                  <p><span class="bullet"></span>Bengaluru main road, behind Ruchi Bakery</p>
                  <p><span class="bullet"></span>Malur, Karnataka 563130</p>
                  <p><span class="bullet"></span>Phone: 7026263123 | Email: mmmotors3123@gmail.com</p>
                </div>
              </div>
              <div class="header-right">
                <div class="invoice-title">SALES INVOICE</div>
                <div class="invoice-info">
                  <div><span>Invoice No:</span><span>${invoice.invoice_number}</span></div>
                  <div><span>Date:</span><span>${new Date(invoice.sale_date).toLocaleDateString('en-IN')}</span></div>
                </div>
              </div>
            </div>
            
            <!-- Customer & Vehicle Details Grid -->
            <div class="section-grid">
              <!-- Customer Details -->
              <div class="detail-card customer-card">
                <div class="detail-header">
                  👤 CUSTOMER DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${invoice.customer?.name || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">C/O:</span>
                    <span class="detail-value">${invoice.customer?.care_of || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Mobile:</span>
                    <span class="detail-value">${invoice.customer?.mobile || invoice.customer?.phone || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${invoice.customer?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <!-- Vehicle Details -->
              <div class="detail-card vehicle-card">
                <div class="detail-header">
                  🏍️ VEHICLE DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Brand:</span>
                    <span class="detail-value">${invoice.vehicle?.brand || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Model:</span>
                    <span class="detail-value">${invoice.vehicle?.model || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Color:</span>
                    <span class="detail-value">${invoice.vehicle?.color || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Vehicle No:</span>
                    <span class="detail-value">${invoice.vehicle?.vehicle_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Chassis No:</span>
                    <span class="detail-value">${invoice.vehicle?.chassis_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Engine No:</span>
                    <span class="detail-value">${invoice.vehicle?.engine_no || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Insurance Nominee Details -->
            <div class="full-width-section">
              <div class="detail-card insurance-card">
                <div class="detail-header">
                  🛡️ INSURANCE NOMINEE DETAILS
                </div>
                <div class="detail-content">
                  <div class="insurance-grid">
                    <div class="insurance-item">
                      <div class="insurance-label">Nominee Name</div>
                      <div class="insurance-value">${invoice.insurance_details?.nominee || 'N/A'}</div>
                    </div>
                    <div class="insurance-item">
                      <div class="insurance-label">Relation</div>
                      <div class="insurance-value" style="text-transform: capitalize;">${invoice.insurance_details?.relation || 'N/A'}</div>
                    </div>
                    <div class="insurance-item">
                      <div class="insurance-label">Age</div>
                      <div class="insurance-value">${invoice.insurance_details?.age || 'N/A'} years</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Payment Summary -->
            <div class="full-width-section">
              <div class="detail-card payment-card">
                <div class="detail-header">
                  💳 PAYMENT SUMMARY
                </div>
                <div class="detail-content" style="background: linear-gradient(135deg, #059669, #10b981); color: white;">
                  <div class="payment-content">
                    <div class="payment-details">
                      <div class="detail-row">
                        <span>Payment Method:</span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-weight: bold;">${invoice.payment_method || 'CASH'}</span>
                      </div>
                      <div class="detail-row">
                        <span>Hypothecation:</span>
                        <span style="font-weight: bold;">${invoice.hypothecation || 'Cash'}</span>
                      </div>
                    </div>
                    <div class="amount-display">
                      <div class="amount-label">TOTAL AMOUNT</div>
                      <div class="amount-large">₹${invoice.amount?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                  <div class="amount-words-section">
                    <strong>Amount in Words:</strong><br>
                    <span class="amount-words">${numberToWords(invoice.amount || 0)} Rupees Only</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Service Schedule -->
            <div class="full-width-section">
              <div class="detail-card service-card">
                <div class="detail-header">
                  🔧 SERVICE SCHEDULE
                </div>
                <div class="detail-content">
                  <div class="service-message">
                    <p class="customer-greeting">DEAR VALUED CUSTOMER,</p>
                    <p>We thank you for choosing our world-class vehicle. To ensure optimal performance and longevity, please follow the service schedule below for a pleasant riding experience at all times.</p>
                  </div>
                  
                  <table class="service-table">
                    <thead>
                      <tr>
                        <th style="width: 25%;">SERVICE DATE</th>
                        <th style="width: 35%;">SERVICE TYPE</th>
                        <th style="width: 40%;">RECOMMENDED SCHEDULE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">FIRST SERVICE</td>
                        <td>500-700 kms or 15-30 days</td>
                      </tr>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">SECOND SERVICE</td>
                        <td>3000-3500 kms or 30-90 days</td>
                      </tr>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">THIRD SERVICE</td>
                        <td>6000-6500 kms or 90-180 days</td>
                      </tr>
                      <tr>
                        <td>____/____/____</td>
                        <td class="service-type">FOURTH SERVICE</td>
                        <td>9000-9500 kms or 180-270 days</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="service-note">
                    ⚠️ IMPORTANT: Follow whichever milestone comes first (kilometers or days)
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-badges">
                <div class="footer-badge">🏆 Authorized Dealer</div>
                <div class="footer-badge">🕒 24/7 Service Support</div>
                <div class="footer-badge">✅ Quality Guaranteed</div>
              </div>
              <div class="footer-title">Thank You for Choosing M M Motors!</div>
              <div class="footer-subtitle">Your trust drives our excellence in two-wheeler sales and service.</div>
              <div class="footer-features">🌟 Premium Quality • ⚡ Expert Service • 🤝 Customer First</div>
              <div class="footer-contact">
                This is a computer-generated invoice and does not require a signature.<br>
                For queries, contact us at mmmotors3123@gmail.com or 7026263123
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintInvoiceModal = (invoice) => {
    if (!invoice) return;
    
    // Create a new window with the optimized invoice layout matching sales invoice format
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.3; 
              color: #333;
              background: white;
              font-size: 12px;
            }
            .invoice-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 8mm;
              background: white;
              transform: scale(0.9);
              transform-origin: top center;
            }
            
            /* Professional Header - Matching Sales Invoice */
            .header { 
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: start;
            }
            .header-left {
              flex: 1;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 4px;
            }
            .company-tagline { 
              font-size: 12px; 
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .company-address { 
              font-size: 11px; 
              line-height: 1.4;
            }
            .company-address p {
              margin: 2px 0;
              display: flex;
              align-items: center;
            }
            .bullet {
              width: 4px;
              height: 4px;
              background: rgba(255,255,255,0.7);
              border-radius: 50%;
              margin-right: 8px;
            }
            .header-right {
              background: rgba(255,255,255,0.2);
              padding: 12px;
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.3);
            }
            .invoice-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .invoice-info {
              font-size: 11px;
            }
            .invoice-info div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            
            /* Content Sections - Matching Sales Invoice */
            .content-section {
              margin-bottom: 12px;
            }
            .section-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }
            .detail-card {
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              overflow: hidden;
            }
            .detail-header {
              padding: 8px 12px;
              font-weight: bold;
              font-size: 11px;
              color: white;
              display: flex;
              align-items: center;
            }
            .detail-content {
              padding: 10px 12px;
              background: #f8fafc;
              font-size: 11px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              padding-bottom: 3px;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
              min-width: 60px;
            }
            .detail-value {
              color: #111827;
              text-align: right;
            }
            
            /* Color themes for different sections */
            .customer-card .detail-header { background: linear-gradient(135deg, #2563eb, #3b82f6); }
            .vehicle-card .detail-header { background: linear-gradient(135deg, #059669, #10b981); }
            .insurance-card .detail-header { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
            
            /* Payment Summary - Matching Sales Invoice */
            .payment-summary {
              background: linear-gradient(135deg, #059669, #10b981);
              color: white;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              text-align: center;
            }
            .payment-header {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .payment-method {
              font-size: 10px;
              background: rgba(255,255,255,0.2);
              padding: 4px 8px;
              border-radius: 12px;
              margin-bottom: 8px;
              display: inline-block;
            }
            .amount-large {
              font-size: 28px;
              font-weight: bold;
              margin: 8px 0;
            }
            .amount-words {
              font-size: 11px;
              font-style: italic;
              opacity: 0.9;
              background: rgba(255,255,255,0.1);
              padding: 8px;
              border-radius: 4px;
              margin-top: 8px;
            }
            
            /* Service Schedule - Matching Sales Invoice */
            .service-schedule {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
              margin: 15px 0;
            }
            .service-header {
              background: linear-gradient(135deg, #4f46e5, #6366f1);
              color: white;
              padding: 10px 12px;
              font-weight: bold;
              font-size: 12px;
              text-align: center;
            }
            .service-message {
              background: #f0f9ff;
              padding: 12px;
              border-bottom: 1px solid #bfdbfe;
            }
            .service-message p {
              margin: 0;
              font-size: 10px;
              color: #1e40af;
            }
            .service-message .customer-greeting {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .service-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .service-table th {
              background: linear-gradient(135deg, #4f46e5, #6366f1);
              color: white;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              border-right: 1px solid rgba(255,255,255,0.3);
            }
            .service-table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              border-right: 1px solid #e2e8f0;
            }
            .service-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .service-type {
              font-weight: bold;
              color: #4f46e5;
            }
            .service-note {
              background: linear-gradient(90deg, #fef3c7, #fde68a);
              padding: 8px;
              text-align: center;
              font-weight: bold;
              color: #92400e;
              font-size: 10px;
              border-top: 1px solid #f59e0b;
            }
            
            /* Footer - Matching Sales Invoice */
            .footer {
              background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin-top: 20px;
              border: 1px solid #cbd5e1;
            }
            .footer-badges {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-bottom: 12px;
              font-size: 10px;
              color: #475569;
            }
            .footer-title {
              font-weight: bold;
              font-size: 14px;
              color: #1e293b;
              margin-bottom: 6px;
            }
            .footer-subtitle {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .footer-features {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 10px;
            }
            .footer-contact {
              font-size: 10px;
              color: #64748b;
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .invoice-container { padding: 6mm; }
              @page { size: A4; margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Professional Header -->
            <div class="header">
              <div class="header-left">
                <div class="company-name">M M MOTORS</div>
                <div class="company-tagline">Premium Two Wheeler Sales & Service</div>
                <div class="company-address">
                  <p><span class="bullet"></span>Bengaluru main road, behind Ruchi Bakery</p>
                  <p><span class="bullet"></span>Malur, Karnataka 563130</p>
                  <p><span class="bullet"></span>Phone: 7026263123 | Email: mmmotors3123@gmail.com</p>
                </div>
              </div>
              <div class="header-right">
                <div class="invoice-title">SALES INVOICE</div>
                <div class="invoice-info">
                  <div><span>Invoice No:</span><span>${invoice.invoice_number}</span></div>
                  <div><span>Date:</span><span>${new Date(invoice.sale_date).toLocaleDateString('en-IN')}</span></div>
                </div>
              </div>
            </div>
            
            <!-- Customer & Vehicle Details Grid -->
            <div class="section-grid">
              <!-- Customer Details -->
              <div class="detail-card customer-card">
                <div class="detail-header">
                  👤 CUSTOMER DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${invoice.customer?.name || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${invoice.customer?.phone || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${invoice.customer?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <!-- Vehicle Details -->
              <div class="detail-card vehicle-card">
                <div class="detail-header">
                  🏍️ VEHICLE DETAILS
                </div>
                <div class="detail-content">
                  <div class="detail-row">
                    <span class="detail-label">Brand:</span>
                    <span class="detail-value">${invoice.vehicle?.brand || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Model:</span>
                    <span class="detail-value">${invoice.vehicle?.model || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Color:</span>
                    <span class="detail-value">${invoice.vehicle?.color || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Vehicle No:</span>
                    <span class="detail-value">${invoice.vehicle?.vehicle_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Chassis No:</span>
                    <span class="detail-value">${invoice.vehicle?.chassis_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Engine No:</span>
                    <span class="detail-value">${invoice.vehicle?.engine_no || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Insurance Nominee Details -->
            <div class="detail-card insurance-card">
              <div class="detail-header">
                🛡️ INSURANCE NOMINEE DETAILS
              </div>
              <div class="detail-content">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Nominee Name</div>
                    <div style="font-weight: bold;">${invoice.insurance_details?.nominee || 'N/A'}</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Relation</div>
                    <div style="font-weight: bold; text-transform: capitalize;">${invoice.insurance_details?.relation || 'N/A'}</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Age</div>
                    <div style="font-weight: bold;">${invoice.insurance_details?.age || 'N/A'} years</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Payment Summary -->
            <div class="payment-summary">
              <div class="payment-header">💳 PAYMENT SUMMARY</div>
              <div class="payment-method">Payment Method: ${invoice.payment_method || 'CASH'}</div>
              <div style="font-size: 14px; margin-bottom: 4px;">TOTAL AMOUNT</div>
              <div class="amount-large">₹${invoice.amount?.toLocaleString() || '0'}</div>
              <div class="amount-words">
                ${numberToWords(invoice.amount || 0)} Rupees Only
              </div>
            </div>
            
            <!-- Service Schedule -->
            <div class="service-schedule">
              <div class="service-header">
                🔧 SERVICE SCHEDULE
              </div>
              <div class="service-message">
                <p class="customer-greeting">DEAR VALUED CUSTOMER,</p>
                <p>We thank you for choosing our world-class vehicle. To ensure optimal performance and longevity, please follow the service schedule below for a pleasant riding experience at all times.</p>
              </div>
              <table class="service-table">
                <thead>
                  <tr>
                    <th style="width: 25%;">SERVICE DATE</th>
                    <th style="width: 35%;">SERVICE TYPE</th>
                    <th style="width: 40%;">RECOMMENDED SCHEDULE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">FIRST SERVICE</td>
                    <td>500-700 kms or 15-30 days</td>
                  </tr>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">SECOND SERVICE</td>
                    <td>3000-3500 kms or 30-90 days</td>
                  </tr>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">THIRD SERVICE</td>
                    <td>6000-6500 kms or 90-180 days</td>
                  </tr>
                  <tr>
                    <td>____/____/____</td>
                    <td class="service-type">FOURTH SERVICE</td>
                    <td>9000-9500 kms or 180-270 days</td>
                  </tr>
                </tbody>
              </table>
              <div class="service-note">
                ⚠️ IMPORTANT: Follow whichever milestone comes first (kilometers or days)
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-badges">
                <span>🏆 Authorized Dealer</span>
                <span>🕒 24/7 Service Support</span>
                <span>✅ Quality Guaranteed</span>
              </div>
              <div class="footer-title">Thank You for Choosing M M Motors!</div>
              <div class="footer-subtitle">Your trust drives our excellence in two-wheeler sales and service.</div>
              <div class="footer-features">🌟 Premium Quality • ⚡ Expert Service • 🤝 Customer First</div>
              <div class="footer-contact">
                This is a computer-generated invoice and does not require a signature.<br>
                For queries, contact us at mmmotors3123@gmail.com or 7026263123
              </div>
            </div>
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePrintInvoiceModal(selectedInvoice)}
                    className="flex items-center gap-2"
                  >
                    Print
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInvoiceModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Optimized Invoice Preview */}
              <Card id="invoice-modal-preview" className="print-full-width shadow-2xl max-w-[21cm] mx-auto">
                <CardContent className="p-0">
                  <div className="invoice-container bg-white text-xs">
                    {/* Professional Header - Compact */}
                    <div className="header bg-gradient-to-r from-blue-800 to-blue-600 text-white p-3 rounded-t-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-xl font-bold tracking-wide">M M MOTORS</h1>
                          <p className="text-blue-100 text-xs mt-1 font-medium">Premium Two Wheeler Sales & Service</p>
                          <div className="mt-1 text-blue-100 text-xs space-y-0.5">
                            <p className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                              Bengaluru main road, behind Ruchi Bakery
                            </p>
                            <p className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                              Malur, Karnataka 563130
                            </p>
                            <p className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5"></span>
                              Phone: 7026263123 | Email: mmmotors3123@gmail.com
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2 border border-white border-opacity-30">
                            <h2 className="text-sm font-bold text-white mb-1">SALES INVOICE</h2>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-blue-100 text-xs">Invoice No:</span>
                                <span className="font-bold text-white text-xs">{selectedInvoice.invoice_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-100 text-xs">Date:</span>
                                <span className="font-bold text-white text-xs">{new Date(selectedInvoice.sale_date).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 space-y-3">
                      {/* Customer & Vehicle Details Grid - Compact */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {/* Customer Details */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-1">
                            <h3 className="text-white font-bold flex items-center text-xs">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                              CUSTOMER DETAILS
                            </h3>
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="flex items-center border-b border-slate-200 pb-0.5">
                              <span className="text-slate-600 font-medium w-12 text-xs">Name:</span>
                              <span className="text-slate-900 font-semibold text-xs">{selectedInvoice.customer?.name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center border-b border-slate-200 pb-0.5">
                              <span className="text-slate-600 font-medium w-12 text-xs">Phone:</span>
                              <span className="text-slate-900 font-mono font-semibold text-xs">{selectedInvoice.customer?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-start">
                              <span className="text-slate-600 font-medium w-12 text-xs">Address:</span>
                              <span className="text-slate-900 leading-tight text-xs">{selectedInvoice.customer?.address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Details */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-2 py-1">
                            <h3 className="text-white font-bold flex items-center text-xs">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,2L14,6H18L14,8L15,12L12,10L9,12L10,8L6,6H10L12,2Z"/>
                              </svg>
                              VEHICLE DETAILS
                            </h3>
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Brand</span>
                                <div className="text-slate-900 font-bold text-xs">{selectedInvoice.vehicle?.brand || 'N/A'}</div>
                              </div>
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Model</span>
                                <div className="text-slate-900 font-semibold text-xs">{selectedInvoice.vehicle?.model || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Color</span>
                                <div className="text-slate-900 text-xs">{selectedInvoice.vehicle?.color || 'N/A'}</div>
                              </div>
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Vehicle No</span>
                                <div className="text-slate-900 font-mono font-bold text-xs">{selectedInvoice.vehicle?.vehicle_no || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-700 font-medium">Chassis No:</span>
                                <span className="text-slate-900 font-mono text-xs">{selectedInvoice.vehicle?.chassis_no || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-700 font-medium">Engine No:</span>
                                <span className="text-slate-900 font-mono text-xs">{selectedInvoice.vehicle?.engine_no || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insurance Nominee Details - Compact */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-2 py-1">
                          <h3 className="text-white font-bold flex items-center text-xs">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5H16.2V16H7.8V11.5H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.9 10.5,9.7V11.5H13.5V9.7C13.5,8.9 12.8,8.2 12,8.2Z"/>
                            </svg>
                            INSURANCE NOMINEE DETAILS
                          </h3>
                        </div>
                        <div className="p-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Nominee Name</span>
                              <div className="text-slate-900 font-semibold mt-0.5 text-xs">{selectedInvoice.insurance_details?.nominee || 'N/A'}</div>
                            </div>
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Relation</span>
                              <div className="text-slate-900 font-semibold mt-0.5 capitalize text-xs">{selectedInvoice.insurance_details?.relation || 'N/A'}</div>
                            </div>
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Age</span>
                              <div className="text-slate-900 font-semibold mt-0.5 text-xs">{selectedInvoice.insurance_details?.age || 'N/A'} years</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Summary - Compact */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 px-2 py-1">
                          <h3 className="text-white font-bold flex items-center text-xs">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                            </svg>
                            PAYMENT SUMMARY
                          </h3>
                        </div>
                        <div className="p-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center py-1 border-b border-green-200">
                                <span className="text-green-700 font-medium text-xs">Payment Method:</span>
                                <span className="text-slate-900 font-bold uppercase bg-green-200 px-2 py-0.5 rounded-full text-xs">
                                  {selectedInvoice.payment_method || 'CASH'}
                                </span>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-green-300 shadow-sm">
                              <div className="text-center">
                                <span className="text-green-700 font-medium text-xs block mb-1">TOTAL AMOUNT</span>
                                <div className="text-lg font-bold text-green-600">
                                  ₹{selectedInvoice.amount?.toLocaleString() || '0'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200">
                            <span className="text-orange-800 font-semibold text-xs">Amount in Words:</span>
                            <div className="text-slate-900 font-medium mt-0.5 italic text-xs">
                              {numberToWords(selectedInvoice.amount || 0)} Rupees Only
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Professional Footer - Compact */}
                      <div className="mt-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg p-3 border border-slate-300">
                        <div className="text-center space-y-2">
                          <div className="flex items-center justify-center space-x-6 text-slate-700">
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9,11H15L13,9H11V7H13V9H15V7A2,2 0 0,0 13,5H11A2,2 0 0,0 9,7V9H7L9,11M20,6H16V4A2,2 0 0,0 14,2H10A2,2 0 0,0 8,4V6H4A2,2 0 0,0 2,8V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V8A2,2 0 0,0 20,6Z"/>
                              </svg>
                              <span className="text-xs font-medium">Authorized Dealer</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H12.5L16.2,16.7L17.3,15.6L14.2,12.5H13V7H11Z"/>
                              </svg>
                              <span className="text-xs font-medium">24/7 Service Support</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                              </svg>
                              <span className="text-xs font-medium">Quality Guaranteed</span>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-300 pt-2">
                            <h4 className="text-sm font-bold text-slate-800 mb-1">Thank You for Choosing M M Motors!</h4>
                            <p className="text-slate-600 text-xs mb-1">Your trust drives our excellence in two-wheeler sales and service.</p>
                            <div className="flex justify-center items-center space-x-3 text-xs text-slate-500">
                              <span>🌟 Premium Quality</span>
                              <span>•</span>
                              <span>⚡ Expert Service</span>
                              <span>•</span>
                              <span>🤝 Customer First</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-slate-500 border-t border-slate-300 pt-1">
                            This is a computer-generated invoice and does not require a signature. 
                            For queries, contact us at mmmotors3123@gmail.com or 7026263123
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

              <div className="space-y-6">
                {/* Invoice Details Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    📋 Invoice Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoice_number">Invoice Number</Label>
                      <Input
                        id="invoice_number"
                        type="text"
                        value={editFormData.invoice_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, invoice_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sale_date">Sale Date</Label>
                      <Input
                        id="sale_date"
                        type="date"
                        value={editFormData.sale_date?.split('T')[0] || ''}
                        onChange={(e) => setEditFormData({...editFormData, sale_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Details Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    👤 Customer Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer">Select Customer</Label>
                      <Select 
                        value={editFormData.customer_id} 
                        onValueChange={(value) => {
                          const selectedCustomer = customers.find(c => c.id === value);
                          setEditFormData({
                            ...editFormData, 
                            customer_id: value,
                            customer_name: selectedCustomer?.name || '',
                            customer_care_of: selectedCustomer?.care_of || '',
                            customer_mobile: selectedCustomer?.mobile || selectedCustomer?.phone || '',
                            customer_address: selectedCustomer?.address || ''
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone || customer.mobile}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                          id="customer_name"
                          type="text"
                          value={editFormData.customer_name || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_name: e.target.value})}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_care_of">Care Of (C/O)</Label>
                        <Input
                          id="customer_care_of"
                          type="text"
                          value={editFormData.customer_care_of || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_care_of: e.target.value})}
                          placeholder="S/O, D/O, W/O"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_mobile">Mobile Number *</Label>
                        <Input
                          id="customer_mobile"
                          type="tel"
                          value={editFormData.customer_mobile || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_mobile: e.target.value})}
                          placeholder="Enter mobile number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_address">Address</Label>
                        <Input
                          id="customer_address"
                          type="text"
                          value={editFormData.customer_address || ''}
                          onChange={(e) => setEditFormData({...editFormData, customer_address: e.target.value})}
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                    🏍️ Vehicle Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="vehicle">Select Vehicle</Label>
                      <Select 
                        value={editFormData.vehicle_id} 
                        onValueChange={(value) => {
                          const selectedVehicle = vehicles.find(v => v.id === value);
                          setEditFormData({
                            ...editFormData, 
                            vehicle_id: value,
                            vehicle_brand: selectedVehicle?.brand || '',
                            vehicle_model: selectedVehicle?.model || '',
                            vehicle_color: selectedVehicle?.color || '',
                            vehicle_no: selectedVehicle?.vehicle_no || '',
                            chassis_no: selectedVehicle?.chassis_no || '',
                            engine_no: selectedVehicle?.engine_no || ''
                          });
                        }}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vehicle_brand">Brand</Label>
                        <Input
                          id="vehicle_brand"
                          type="text"
                          value={editFormData.vehicle_brand || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_brand: e.target.value})}
                          placeholder="Enter brand"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_model">Model</Label>
                        <Input
                          id="vehicle_model"
                          type="text"
                          value={editFormData.vehicle_model || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_model: e.target.value})}
                          placeholder="Enter model"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_color">Color</Label>
                        <Input
                          id="vehicle_color"
                          type="text"
                          value={editFormData.vehicle_color || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_color: e.target.value})}
                          placeholder="Enter color"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vehicle_no">Vehicle Number</Label>
                        <Input
                          id="vehicle_no"
                          type="text"
                          value={editFormData.vehicle_no || ''}
                          onChange={(e) => setEditFormData({...editFormData, vehicle_no: e.target.value})}
                          placeholder="Enter vehicle number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chassis_no">Chassis Number</Label>
                        <Input
                          id="chassis_no"
                          type="text"
                          value={editFormData.chassis_no || ''}
                          onChange={(e) => setEditFormData({...editFormData, chassis_no: e.target.value})}
                          placeholder="Enter chassis number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="engine_no">Engine Number</Label>
                        <Input
                          id="engine_no"
                          type="text"
                          value={editFormData.engine_no || ''}
                          onChange={(e) => setEditFormData({...editFormData, engine_no: e.target.value})}
                          placeholder="Enter engine number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Details Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    🛡️ Insurance Nominee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nominee_name">Nominee Name</Label>
                      <Input
                        id="nominee_name"
                        type="text"
                        value={editFormData.insurance_details?.nominee || ''}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          insurance_details: {
                            ...editFormData.insurance_details,
                            nominee: e.target.value
                          }
                        })}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nominee_relation">Relation</Label>
                      <Select
                        value={editFormData.insurance_details?.relation || ''}
                        onValueChange={(value) => setEditFormData({
                          ...editFormData,
                          insurance_details: {
                            ...editFormData.insurance_details,
                            relation: value
                          }
                        })}
                      >
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
                      <Label htmlFor="nominee_age">Age</Label>
                      <Input
                        id="nominee_age"
                        type="number"
                        min="1"
                        max="100"
                        value={editFormData.insurance_details?.age || ''}
                        onChange={(e) => setEditFormData({
                          ...editFormData, 
                          insurance_details: {
                            ...editFormData.insurance_details,
                            age: e.target.value
                          }
                        })}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="border rounded-lg p-4 bg-red-50">
                  <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                    💳 Payment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={editFormData.amount || ''}
                        onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Select 
                        value={editFormData.payment_method || ''} 
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
                      <Label htmlFor="hypothecation">Hypothecation</Label>
                      <Select
                        value={editFormData.hypothecation || 'Cash'}
                        onValueChange={(value) => setEditFormData({...editFormData, hypothecation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hypothecation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Finance">Bank Finance</SelectItem>
                          <SelectItem value="NBFC">NBFC</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
  
  // Modal states for view and edit functionality
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
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
        // Removed required validation - name is now optional
        if (value.trim() && value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        } else if (value.trim() && !/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = 'Name should only contain letters and spaces';
        }
        break;
      
      case 'mobile':
        // Removed required validation - mobile is now optional
        if (value.trim() && !/^\d{10}$/.test(value.trim())) {
          error = 'Enter valid 10-digit mobile number';
        }
        break;
      
      case 'address':
        // Removed required validation - address is now optional
        if (value.trim() && value.trim().length < 10) {
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
    
    // Only validate format if fields have values, no required fields
    Object.keys(customerData).forEach(field => {
      if (customerData[field]) {
        const error = validateField(field, customerData[field]);
        if (error) {
          errors[field] = error;
        }
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
      [field]: typeof error === 'string' ? error : (error ? 'Invalid input' : '')
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
      toast.error(getErrorMessage(error) || 'Failed to save customer details');
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

  // View customer functionality
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // Delete customer functionality
  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await axios.delete(`${API}/customers/${customer.id}`);
        toast.success('Customer deleted successfully!');
        fetchCustomers(); // Refresh the list
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage || 'Failed to delete customer');
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit customer functionality
  const handleEditCustomer = (customer) => {
    const associatedVehicle = vehicles.find(v => v.customer_id === customer.id);
    
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      care_of: customer.care_of || '',
      mobile: customer.mobile || customer.phone || '',
      address: customer.address || '',
      email: customer.email || '',
      // Vehicle details if associated
      brand: associatedVehicle?.brand || '',
      model: associatedVehicle?.model || '',
      color: associatedVehicle?.color || '',
      chassis_no: associatedVehicle?.chassis_no || '',
      engine_no: associatedVehicle?.engine_no || '',
      vehicle_no: associatedVehicle?.vehicle_no || '',
      // Insurance details
      insurance_nominee: associatedVehicle?.insurance_nominee || '',
      relation: associatedVehicle?.relation || '',
      age: associatedVehicle?.age || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || loading) return;
    
    try {
      setLoading(true);
      
      console.log('Saving customer edit:', {
        editingCustomer,
        editFormData,
        API
      });
      
      // Update customer data
      const customerUpdateData = {
        name: editFormData.name?.trim() || '',
        care_of: editFormData.care_of?.trim() || '',
        mobile: editFormData.mobile?.trim() || '',
        address: editFormData.address?.trim() || '',
        email: editFormData.email?.trim() || ''
      };
      
      console.log('Customer update data:', customerUpdateData);
      
      const customerResponse = await axios.put(`${API}/customers/${editingCustomer.id}`, customerUpdateData);
      console.log('Customer update response:', customerResponse.data);
      
      // Update associated vehicle if exists
      const associatedVehicle = vehicles.find(v => v.customer_id === editingCustomer.id);
      if (associatedVehicle && (editFormData.brand || editFormData.model || editFormData.color || editFormData.vehicle_no || editFormData.chassis_no || editFormData.engine_no)) {
        const vehicleUpdateData = {
          brand: editFormData.brand?.trim() || '',
          model: editFormData.model?.trim() || '',
          color: editFormData.color?.trim() || '',
          chassis_no: editFormData.chassis_no?.trim() || '',
          engine_no: editFormData.engine_no?.trim() || '',
          vehicle_no: editFormData.vehicle_no?.trim() || '',
          insurance_nominee: editFormData.insurance_nominee?.trim() || '',
          relation: editFormData.relation?.trim() || '',
          age: editFormData.age ? parseInt(editFormData.age) : null
        };
        
        console.log('Vehicle update data:', vehicleUpdateData);
        
        const vehicleResponse = await axios.put(`${API}/vehicles/${associatedVehicle.id}`, vehicleUpdateData);
        console.log('Vehicle update response:', vehicleResponse.data);
      }
      
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      setEditFormData({});
      fetchCustomers(); // Refresh the list
      fetchVehicles(); // Refresh vehicles too
    } catch (error) {
      console.error('Error saving customer edit:', error);
      console.error('Error response:', error.response?.data);
      toast.error(getErrorMessage(error) || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setEditFormData({});
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={customerData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
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
                      onChange={(e) => handleInputChange('engine_no', e.target.value.toUpperCase())}
                      className={touched.engine_no && validationErrors.engine_no ? 'border-red-500' : ''}
                    />
                    {touched.engine_no && validationErrors.engine_no && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.engine_no}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="vehicle_no">Vehicle No</Label>
                    <Input
                      id="vehicle_no"
                      placeholder="Enter vehicle registration number (e.g., KA05AB1234)"
                      value={customerData.vehicle_no}
                      onChange={(e) => handleInputChange('vehicle_no', e.target.value.toUpperCase())}
                      className={touched.vehicle_no && validationErrors.vehicle_no ? 'border-red-500' : ''}
                    />
                    {touched.vehicle_no && validationErrors.vehicle_no && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.vehicle_no}</p>
                    )}
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewCustomer(customer)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditCustomer(customer)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteCustomer(customer)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
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
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      👤 Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.name || 'N/A'}</div>
                      <div><strong>Care Of:</strong> {selectedCustomer.care_of || 'N/A'}</div>
                      <div><strong>Mobile:</strong> {selectedCustomer.mobile || selectedCustomer.phone || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                      <div><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</div>
                      <div><strong>Date Added:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      🏍️ Associated Vehicle
                    </h3>
                    {(() => {
                      const customerVehicle = vehicles.find(v => v.customer_id === selectedCustomer.id);
                      if (customerVehicle) {
                        return (
                          <div className="space-y-2">
                            <div><strong>Brand:</strong> {customerVehicle.brand || 'N/A'}</div>
                            <div><strong>Model:</strong> {customerVehicle.model || 'N/A'}</div>
                            <div><strong>Color:</strong> {customerVehicle.color || 'N/A'}</div>
                            <div><strong>Vehicle No:</strong> {customerVehicle.vehicle_no || 'N/A'}</div>
                            <div><strong>Chassis No:</strong> {customerVehicle.chassis_no || 'N/A'}</div>
                            <div><strong>Engine No:</strong> {customerVehicle.engine_no || 'N/A'}</div>
                          </div>
                        );
                      } else {
                        return <p className="text-gray-500">No vehicle associated with this customer</p>;
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Customer</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Details Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    👤 Customer Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_name">Customer Name</Label>
                      <Input
                        id="edit_name"
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_care_of">Care Of (C/O)</Label>
                      <Input
                        id="edit_care_of"
                        type="text"
                        value={editFormData.care_of || ''}
                        onChange={(e) => setEditFormData({...editFormData, care_of: e.target.value})}
                        placeholder="S/O, D/O, W/O"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_mobile">Mobile Number</Label>
                      <Input
                        id="edit_mobile"
                        type="tel"
                        value={editFormData.mobile || ''}
                        onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit_address">Address</Label>
                      <Input
                        id="edit_address"
                        type="text"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    🏍️ Vehicle Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_brand">Brand</Label>
                      <Select
                        value={editFormData.brand || ''}
                        onValueChange={(value) => setEditFormData({...editFormData, brand: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_model">Model</Label>
                      <Input
                        id="edit_model"
                        type="text"
                        value={editFormData.model || ''}
                        onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                        placeholder="Enter model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_color">Color</Label>
                      <Input
                        id="edit_color"
                        type="text"
                        value={editFormData.color || ''}
                        onChange={(e) => setEditFormData({...editFormData, color: e.target.value})}
                        placeholder="Enter color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_vehicle_no">Vehicle Number</Label>
                      <Input
                        id="edit_vehicle_no"
                        type="text"
                        value={editFormData.vehicle_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_no: e.target.value.toUpperCase()})}
                        placeholder="KA05AB1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_chassis_no">Chassis Number</Label>
                      <Input
                        id="edit_chassis_no"
                        type="text"
                        value={editFormData.chassis_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, chassis_no: e.target.value.toUpperCase()})}
                        placeholder="17-character chassis number"
                        maxLength={17}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_engine_no">Engine Number</Label>
                      <Input
                        id="edit_engine_no"
                        type="text"
                        value={editFormData.engine_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, engine_no: e.target.value.toUpperCase()})}
                        placeholder="Enter engine number"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Details Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    🛡️ Insurance Nominee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_nominee">Nominee Name</Label>
                      <Input
                        id="edit_nominee"
                        type="text"
                        value={editFormData.insurance_nominee || ''}
                        onChange={(e) => setEditFormData({...editFormData, insurance_nominee: e.target.value})}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_relation">Relation</Label>
                      <Select
                        value={editFormData.relation || ''}
                        onValueChange={(value) => setEditFormData({...editFormData, relation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relation" />
                        </SelectTrigger>
                        <SelectContent>
                          {relations.map(relation => (
                            <SelectItem key={relation} value={relation}>
                              {relation.charAt(0).toUpperCase() + relation.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_age">Age</Label>
                      <Input
                        id="edit_age"
                        type="number"
                        min="18"
                        max="100"
                        value={editFormData.age || ''}
                        onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
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

  // Delete customer functionality
  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await axios.delete(`${API}/customers/${customer.id}`);
        toast.success('Customer deleted successfully!');
        fetchCustomers(); // Refresh the list
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage || 'Failed to delete customer');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditCustomer = (customer) => {
    const associatedVehicle = vehicles.find(v => v.customer_id === customer.id || 
      (v.chassis_no === customer.chassis_no && customer.chassis_no !== 'N/A'));
    
    setEditingCustomer(customer);
    setEditFormData({
      // Customer details
      name: customer.name || '',
      care_of: customer.care_of || '',
      mobile: customer.mobile || customer.phone || '',
      address: customer.address || '',
      email: customer.email || '',
      
      // Vehicle details if associated
      brand: customer.brand !== 'N/A' ? customer.brand : (associatedVehicle?.brand || ''),
      model: customer.model !== 'N/A' ? customer.model : (associatedVehicle?.model || ''),
      color: customer.color !== 'N/A' ? customer.color : (associatedVehicle?.color || ''),
      chassis_no: customer.chassis_no !== 'N/A' ? customer.chassis_no : (associatedVehicle?.chassis_no || ''),
      engine_no: customer.engine_no !== 'N/A' ? customer.engine_no : (associatedVehicle?.engine_no || ''),
      vehicle_no: customer.vehicle_no !== 'N/A' ? customer.vehicle_no : (associatedVehicle?.vehicle_no || ''),
      
      // Insurance details
      insurance_nominee: associatedVehicle?.insurance_nominee || '',
      relation: associatedVehicle?.relation || '',
      age: associatedVehicle?.age || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || loading) return;
    
    try {
      setLoading(true);
      
      // Update customer data
      const customerUpdateData = {
        name: editFormData.name,
        care_of: editFormData.care_of,
        mobile: editFormData.mobile,
        address: editFormData.address,
        email: editFormData.email
      };
      
      await axios.put(`${API}/customers/${editingCustomer.id}`, customerUpdateData);
      
      // Update associated vehicle if exists
      const associatedVehicle = vehicles.find(v => v.customer_id === editingCustomer.id || 
        (v.chassis_no === editingCustomer.chassis_no && editingCustomer.chassis_no !== 'N/A'));
      
      if (associatedVehicle) {
        const vehicleUpdateData = {
          brand: editFormData.brand,
          model: editFormData.model,
          color: editFormData.color,
          chassis_no: editFormData.chassis_no,
          engine_no: editFormData.engine_no,
          vehicle_no: editFormData.vehicle_no,
          insurance_nominee: editFormData.insurance_nominee,
          relation: editFormData.relation,
          age: editFormData.age
        };
        
        await axios.put(`${API}/vehicles/${associatedVehicle.id}`, vehicleUpdateData);
      }
      
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      setEditFormData({});
      fetchAllData(); // Refresh the list
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to update customer');
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCustomer(detail)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
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
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      👤 Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.name || 'N/A'}</div>
                      <div><strong>Care Of:</strong> {selectedCustomer.care_of || 'N/A'}</div>
                      <div><strong>Mobile:</strong> {selectedCustomer.mobile || selectedCustomer.phone || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</div>
                      <div><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</div>
                      <div><strong>Registration Date:</strong> {new Date(selectedCustomer.date).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      🏍️ Vehicle Information
                    </h3>
                    {selectedCustomer.brand !== 'N/A' ? (
                      <div className="space-y-2">
                        <div><strong>Brand:</strong> {selectedCustomer.brand || 'N/A'}</div>
                        <div><strong>Model:</strong> {selectedCustomer.model || 'N/A'}</div>
                        <div><strong>Color:</strong> {selectedCustomer.color || 'N/A'}</div>
                        <div><strong>Vehicle No:</strong> {selectedCustomer.vehicle_no || 'N/A'}</div>
                        <div><strong>Chassis No:</strong> {selectedCustomer.chassis_no || 'N/A'}</div>
                        <div><strong>Engine No:</strong> {selectedCustomer.engine_no || 'N/A'}</div>
                        {selectedCustomer.vehicle_status && (
                          <div><strong>Status:</strong> {selectedCustomer.vehicle_status}</div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No vehicle information available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales Information */}
              {selectedCustomer.sale_amount && (
                <div className="mt-6">
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                      💰 Sales Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><strong>Sale Amount:</strong> ₹{selectedCustomer.sale_amount?.toLocaleString()}</div>
                      <div><strong>Payment Method:</strong> {selectedCustomer.payment_method?.toUpperCase()}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Customer Details</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Details Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    👤 Customer Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_name">Customer Name</Label>
                      <Input
                        id="edit_name"
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_care_of">Care Of (C/O)</Label>
                      <Input
                        id="edit_care_of"
                        type="text"
                        value={editFormData.care_of || ''}
                        onChange={(e) => setEditFormData({...editFormData, care_of: e.target.value})}
                        placeholder="S/O, D/O, W/O"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_mobile">Mobile Number</Label>
                      <Input
                        id="edit_mobile"
                        type="tel"
                        value={editFormData.mobile || ''}
                        onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit_address">Address</Label>
                      <Input
                        id="edit_address"
                        type="text"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    🏍️ Vehicle Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_brand">Brand</Label>
                      <Input
                        id="edit_brand"
                        type="text"
                        value={editFormData.brand || ''}
                        onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})}
                        placeholder="Enter brand"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_model">Model</Label>
                      <Input
                        id="edit_model"
                        type="text"
                        value={editFormData.model || ''}
                        onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                        placeholder="Enter model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_color">Color</Label>
                      <Input
                        id="edit_color"
                        type="text"
                        value={editFormData.color || ''}
                        onChange={(e) => setEditFormData({...editFormData, color: e.target.value})}
                        placeholder="Enter color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_vehicle_no">Vehicle Number</Label>
                      <Input
                        id="edit_vehicle_no"
                        type="text"
                        value={editFormData.vehicle_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_no: e.target.value.toUpperCase()})}
                        placeholder="KA05AB1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_chassis_no">Chassis Number</Label>
                      <Input
                        id="edit_chassis_no"
                        type="text"
                        value={editFormData.chassis_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, chassis_no: e.target.value.toUpperCase()})}
                        placeholder="17-character chassis number"
                        maxLength={17}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_engine_no">Engine Number</Label>
                      <Input
                        id="edit_engine_no"
                        type="text"
                        value={editFormData.engine_no || ''}
                        onChange={(e) => setEditFormData({...editFormData, engine_no: e.target.value.toUpperCase()})}
                        placeholder="Enter engine number"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Details Section */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    🛡️ Insurance Nominee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_nominee">Nominee Name</Label>
                      <Input
                        id="edit_nominee"
                        type="text"
                        value={editFormData.insurance_nominee || ''}
                        onChange={(e) => setEditFormData({...editFormData, insurance_nominee: e.target.value})}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_relation">Relation</Label>
                      <Input
                        id="edit_relation"
                        type="text"
                        value={editFormData.relation || ''}
                        onChange={(e) => setEditFormData({...editFormData, relation: e.target.value})}
                        placeholder="Enter relation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_age">Age</Label>
                      <Input
                        id="edit_age"
                        type="number"
                        min="18"
                        max="100"
                        value={editFormData.age || ''}
                        onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
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
