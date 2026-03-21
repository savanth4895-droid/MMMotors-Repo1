import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage, numberToWords } from '../../utils/helpers';

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
    chassis_number: '',
    engine_number: '',
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
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

  // Vehicle search functionality
  const searchVehiclesByChassisNo = async (chassisQuery) => {
    if (chassisQuery.length < 3) {
      setVehicleSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/vehicles`);
      const availableVehicles = response.data.filter(vehicle => 
        vehicle.status === 'in_stock' && 
        vehicle.chassis_number?.toLowerCase().includes(chassisQuery.toLowerCase())
      );
      
      setVehicleSuggestions(availableVehicles.slice(0, 10)); // Limit to 10 suggestions
      setShowSuggestions(availableVehicles.length > 0);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast.error('Failed to search vehicles');
    }
  };

  // Debounced search to avoid excessive API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const debouncedVehicleSearch = debounce(searchVehiclesByChassisNo, 300);

  const handleInputChange = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));

    // Trigger vehicle search when chassis number changes
    if (field === 'chassis_number') {
      debouncedVehicleSearch(value);
    }
  };

  // Select vehicle from suggestions
  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setInvoiceData(prev => ({
      ...prev,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      chassis_number: vehicle.chassis_number,
      engine_number: vehicle.engine_number,
      vehicle_no: vehicle.vehicle_number || vehicle.vehicle_no || ''
    }));
    
    setShowSuggestions(false);
    setVehicleSuggestions([]);
    
    toast.success(`Vehicle details loaded: ${vehicle.brand} ${vehicle.model}`);
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    return `INV-${timestamp.toString().slice(-8)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Comprehensive validation
    const errors = [];
    
    // Required field validations
    if (!invoiceData.name.trim()) errors.push('Customer name is required');
    if (!invoiceData.mobile.trim()) errors.push('Mobile number is required');
    if (!invoiceData.brand.trim()) errors.push('Vehicle brand is required');
    if (!invoiceData.model.trim()) errors.push('Vehicle model is required');
    if (!invoiceData.chassis_number.trim()) errors.push('Chassis number is required');
    if (!invoiceData.engine_number.trim()) errors.push('Engine number is required');
    if (!invoiceData.amount) errors.push('Amount is required');
    if (!invoiceData.payment_method) errors.push('Payment method is required');
    
    // Format validations
    if (invoiceData.mobile && !/^\d{10}$/.test(invoiceData.mobile)) {
      errors.push('Mobile number must be 10 digits');
    }
    
    // Amount validation
    if (invoiceData.amount && parseFloat(invoiceData.amount) <= 0) {
      errors.push('Amount must be greater than zero');
    }
    
    // Chassis/Engine number length validation
    if (invoiceData.chassis_number && invoiceData.chassis_number.length < 5) {
      errors.push('Chassis number must be at least 5 characters');
    }
    
    if (invoiceData.engine_number && invoiceData.engine_number.length < 5) {
      errors.push('Engine number must be at least 5 characters');
    }
    
    // Insurance nominee validation (if any one field is filled, all should be filled)
    const hasInsuranceInfo = invoiceData.insurance_nominee || invoiceData.relation || invoiceData.age;
    if (hasInsuranceInfo) {
      if (!invoiceData.insurance_nominee) errors.push('Insurance nominee name is required');
      if (!invoiceData.relation) errors.push('Insurance nominee relation is required');
      if (!invoiceData.age) errors.push('Insurance nominee age is required');
    }
    
    // Show all validation errors
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    
    setLoading(true);

    try {
      // Create customer first with insurance nominee details
      const customerData = {
        name: invoiceData.name,
        mobile: invoiceData.mobile,
        care_of: invoiceData.care_of,
        email: null,
        address: invoiceData.address
      };

      // Add insurance nominee details if provided
      if (invoiceData.insurance_nominee || invoiceData.relation || invoiceData.age) {
        customerData.insurance_info = {
          nominee_name: invoiceData.insurance_nominee || '',
          relation: invoiceData.relation || '',
          age: invoiceData.age || ''
        };
      }

      const customerResponse = await axios.post(`${API}/customers`, customerData);

      let vehicleResponse;
      
      if (selectedVehicle) {
        // Use selected vehicle from inventory
        vehicleResponse = { data: selectedVehicle };
        
        // Update the vehicle to associate it with this customer
        await axios.put(`${API}/vehicles/${selectedVehicle.id}`, {
          ...selectedVehicle,
          customer_id: customerResponse.data.id,
          status: 'sold',
          date_sold: new Date().toISOString()
        });
      } else {
        // Create new vehicle entry
        vehicleResponse = await axios.post(`${API}/vehicles`, {
          brand: invoiceData.brand,
          model: invoiceData.model,
          chassis_number: invoiceData.chassis_number,
          engine_number: invoiceData.engine_number,
          color: invoiceData.color,
          vehicle_no: invoiceData.vehicle_no,
          key_number: 'N/A',
          inbound_location: 'Showroom',
          customer_id: customerResponse.data.id,
          status: 'sold',
          date_sold: new Date().toISOString()
        });
      }

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
          chassis_number: invoiceData.chassis_number,
          engine_number: invoiceData.engine_number,
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
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice Preview - ${generatedInvoice.invoice_number}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0;
                background-color: #f5f5f5;
              }
              .toolbar {
                background-color: #2563eb;
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .toolbar h2 {
                margin: 0;
                font-size: 18px;
              }
              .toolbar-buttons {
                display: flex;
                gap: 10px;
              }
              .toolbar button {
                background-color: white;
                color: #2563eb;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.2s;
              }
              .toolbar button:hover {
                background-color: #f0f0f0;
                transform: translateY(-1px);
              }
              .toolbar button.print-btn {
                background-color: #10b981;
                color: white;
              }
              .toolbar button.print-btn:hover {
                background-color: #059669;
              }
              .preview-container {
                max-width: 21cm;
                margin: 20px auto;
                background-color: white;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                border-radius: 8px;
              }
              .invoice-container { 
                max-width: 100%;
                margin: 0 auto;
              }
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
              
              @media print { 
                body { 
                  margin: 0; 
                  padding: 0;
                  background-color: white;
                }
                .toolbar { display: none !important; }
                .preview-container {
                  margin: 0;
                  padding: 10px;
                  box-shadow: none;
                  border-radius: 0;
                }
                .section { page-break-inside: avoid; }
                @page { size: A4; margin: 0.5cm; }
              }
            </style>
          </head>
          <body>
            <div class="toolbar">
              <h2>📄 Invoice Preview - ${generatedInvoice.invoice_number}</h2>
              <div class="toolbar-buttons">
                <button onclick="window.print()" class="print-btn">🖨️ Print Invoice</button>
                <button onclick="window.close()">✖ Close</button>
              </div>
            </div>
            <div class="preview-container">
              <div class="invoice-container">
                ${invoiceElement.innerHTML}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
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
      chassis_number: '',
      engine_number: '',
      vehicle_no: '',
      insurance_nominee: '',
      relation: '',
      age: '',
      amount: '',
      payment_method: 'Cash',
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
                        <span className="text-slate-900 font-mono text-xs">{generatedInvoice.vehicle.chassis_number}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700 font-medium">Engine No:</span>
                        <span className="text-slate-900 font-mono text-xs">{generatedInvoice.vehicle.engine_number}</span>
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
                <Select value={invoiceData.brand} onValueChange={(value) => handleInputChange('brand', value)} disabled={selectedVehicle}>
                  <SelectTrigger className={selectedVehicle ? 'bg-green-50 border-green-200' : ''}>
                    <SelectValue placeholder={selectedVehicle ? "Selected from inventory" : "Select brand"} />
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
                  disabled={selectedVehicle}
                  className={selectedVehicle ? 'bg-green-50 border-green-200' : ''}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Enter color"
                  value={invoiceData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  disabled={selectedVehicle}
                  className={selectedVehicle ? 'bg-green-50 border-green-200' : ''}
                />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Label htmlFor="chassis_number">Chassis No</Label>
                  {selectedVehicle && (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ From Inventory
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVehicle(null);
                          setInvoiceData(prev => ({
                            ...prev,
                            brand: '',
                            model: '',
                            color: '',
                            chassis_number: '',
                            engine_number: '',
                            vehicle_no: ''
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                        title="Clear selection and enter manually"
                      >
                        ✗
                      </button>
                    </div>
                  )}
                </div>
                <Input
                  id="chassis_number"
                  placeholder={selectedVehicle ? "Selected from inventory" : "Enter chassis number (min 3 chars for suggestions)"}
                  value={invoiceData.chassis_number}
                  onChange={(e) => handleInputChange('chassis_number', e.target.value)}
                  onFocus={() => {
                    if (invoiceData.chassis_number.length >= 3 && !selectedVehicle) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicking on them
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  disabled={selectedVehicle}
                  className={selectedVehicle ? 'bg-green-50 border-green-200' : ''}
                />
                
                {/* Vehicle Suggestions Dropdown */}
                {showSuggestions && vehicleSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 bg-blue-50 border-b">
                      <span className="text-sm font-medium text-blue-700">
                        {vehicleSuggestions.length} vehicle(s) found - Click to select
                      </span>
                    </div>
                    {vehicleSuggestions.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => selectVehicle(vehicle)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-mono">{vehicle.chassis_number}</span>
                              <span className="mx-2">•</span>
                              <span>{vehicle.color}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Engine: {vehicle.engine_number}
                              {vehicle.vehicle_no && (
                                <span> • Vehicle No: {vehicle.vehicle_no}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="engine_number">Engine No</Label>
                <Input
                  id="engine_number"
                  placeholder="Enter engine number"
                  value={invoiceData.engine_number}
                  onChange={(e) => handleInputChange('engine_number', e.target.value)}
                  disabled={selectedVehicle}
                  className={selectedVehicle ? 'bg-green-50 border-green-200' : ''}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_no">Vehicle No</Label>
                <Input
                  id="vehicle_no"
                  placeholder="Enter vehicle registration number"
                  value={invoiceData.vehicle_no}
                  onChange={(e) => handleInputChange('vehicle_no', e.target.value)}
                  disabled={selectedVehicle}
                  className={selectedVehicle ? 'bg-green-50 border-green-200' : ''}
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
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
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
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating Invoice...
                </>
              ) : 'Generate Invoice'}
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



export default CreateInvoice;
