import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { LoadingSpinner, TableSkeleton, EmptyState } from '../ui/loading';
import Pagination from '../Pagination';
import SortDropdown from '../SortDropdown';
import { Search, Eye, FileText, Users, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage, numberToWords } from '../../utils/helpers';

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
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('sale_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, customers, vehicles, sortBy, sortOrder]);

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
      const response = await axios.get(`${API}/customers`, {
        params: {
          page: 1,
          limit: 10000, // Fetch all customers for lookups
          sort: 'created_at',
          order: 'desc'
        }
      });
      // Extract the data array from paginated response
      setCustomers(response.data.data || response.data);
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
    // Create a copy to avoid mutating original array (important for React state updates)
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(invoice => {
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

    // Apply sorting (on the copy, not original)
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'sale_date':
          aVal = new Date(a.sale_date || 0);
          bVal = new Date(b.sale_date || 0);
          break;
        case 'invoice_number':
          aVal = a.invoice_number || '';
          bVal = b.invoice_number || '';
          break;
        case 'customer_name':
          const customerA = customers.find(c => c.id === a.customer_id);
          const customerB = customers.find(c => c.id === b.customer_id);
          aVal = customerA?.name || '';
          bVal = customerB?.name || '';
          break;
        case 'amount':
          aVal = a.amount || 0;
          bVal = b.amount || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getVehicleModel = (invoice) => {
    // First try to get from invoice/sale record directly (for imported or manually entered data)
    if (invoice.vehicle_brand || invoice.vehicle_model) {
      return `${invoice.vehicle_brand || ''} ${invoice.vehicle_model || ''}`.trim() || 'Unknown Vehicle';
    }
    
    // Fall back to looking up by vehicle_id
    if (invoice.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === invoice.vehicle_id);
      if (vehicle) {
        return `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle';
      }
    }
    
    return 'Unknown Vehicle';
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
      
      // Vehicle Details - prioritize invoice data over vehicle lookup
      vehicle_id: invoice.vehicle_id,
      vehicle_brand: invoice.vehicle_brand || vehicle?.brand || '',
      vehicle_model: invoice.vehicle_model || vehicle?.model || '',
      vehicle_color: invoice.vehicle_color || vehicle?.color || '',
      vehicle_no: invoice.vehicle_registration || vehicle?.vehicle_no || '',
      chassis_number: invoice.vehicle_chassis || vehicle?.chassis_number || '',
      engine_number: invoice.vehicle_engine || vehicle?.engine_number || '',
      
      // Insurance Details - check multiple sources
      insurance_details: {
        nominee: invoice.insurance_nominee || invoice.insurance_details?.nominee || customer?.insurance_info?.nominee_name || '',
        relation: invoice.insurance_relation || invoice.insurance_details?.relation || customer?.insurance_info?.relation || '',
        age: invoice.insurance_age || invoice.insurance_details?.age || customer?.insurance_info?.age || ''
      }
    });
    setShowEditModal(true);
  };

  const handleDeleteInvoice = async (invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice "${invoice.invoice_number}"? This action cannot be undone and will reset the associated vehicle status to available.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/sales/${invoice.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedInvoices = invoices.filter(inv => inv.id !== invoice.id);
      setInvoices(updatedInvoices);
      
      toast.success('Invoice deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete invoice');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;
    
    try {
      setLoading(true);
      
      // Prepare the update payload with all fields
      const updatePayload = {
        customer_id: editFormData.customer_id,
        vehicle_id: editFormData.vehicle_id,
        sale_date: editFormData.sale_date,
        amount: parseFloat(editFormData.amount),
        payment_method: editFormData.payment_method,
        hypothecation: editFormData.hypothecation,
        
        // Vehicle details (for imported sales or direct entry)
        vehicle_brand: editFormData.vehicle_brand,
        vehicle_model: editFormData.vehicle_model,
        vehicle_color: editFormData.vehicle_color,
        vehicle_registration: editFormData.vehicle_no,
        vehicle_chassis: editFormData.chassis_number,
        vehicle_engine: editFormData.engine_number,
        
        // Insurance details - send both nested and flat structure
        insurance_details: editFormData.insurance_details,
        insurance_nominee: editFormData.insurance_details?.nominee,
        insurance_relation: editFormData.insurance_details?.relation,
        insurance_age: editFormData.insurance_details?.age,
        
        source: editingInvoice.source || 'direct'
      };
      
      await axios.put(`${API}/sales/${editingInvoice.id}`, updatePayload);
      
      // Update local state immediately for instant UI feedback
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.id === editingInvoice.id 
            ? {
                ...inv,
                customer_id: updatePayload.customer_id,
                vehicle_id: updatePayload.vehicle_id,
                sale_date: updatePayload.sale_date,
                amount: updatePayload.amount,
                payment_method: updatePayload.payment_method,
                hypothecation: updatePayload.hypothecation,
                vehicle_brand: updatePayload.vehicle_brand,
                vehicle_model: updatePayload.vehicle_model,
                vehicle_color: updatePayload.vehicle_color,
                vehicle_registration: updatePayload.vehicle_registration,
                vehicle_chassis: updatePayload.vehicle_chassis,
                vehicle_engine: updatePayload.vehicle_engine,
                insurance_details: updatePayload.insurance_details,
                source: updatePayload.source
              }
            : inv
        )
      );
      
      toast.success('Invoice updated successfully!');
      setShowEditModal(false);
      setEditingInvoice(null);
      setEditFormData({});
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/sales`, {
        data: { ids: selectedInvoices },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.deleted > 0) {
        toast.success(`Successfully deleted ${response.data.deleted} invoice(s)`);
      }

      if (response.data.failed && response.data.failed.length > 0) {
        toast.error(`Failed to delete ${response.data.failed.length} invoice(s)`);
      }

      setSelectedInvoices([]);
      setShowBulkDeleteModal(false);
      fetchInvoices(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoice) => {
    if (!invoice) return;

    try {
      // Import html2pdf dynamically
      const { default: html2pdf } = await import('html2pdf.js');

      // Generate filename with customer name and mobile number
      const customerName = invoice.customer?.name || 'name';
      const customerMobile = invoice.customer?.mobile || invoice.customer?.phone || 'mobile';
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
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Mobile:</strong> ${invoice.customer?.mobile || invoice.customer?.phone || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Address:</strong> ${invoice.customer?.address || 'N/A'}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; border: 2px solid #ccc; padding: 10px; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Vehicle Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Brand:</strong> ${invoice.customer?.vehicle_info?.brand || invoice.vehicle?.brand || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Model:</strong> ${invoice.customer?.vehicle_info?.model || invoice.vehicle?.model || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Color:</strong> ${invoice.customer?.vehicle_info?.color || invoice.vehicle?.color || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Chassis No:</strong> ${invoice.customer?.vehicle_info?.chassis_number || invoice.vehicle?.chassis_number || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Engine No:</strong> ${invoice.customer?.vehicle_info?.engine_number || invoice.vehicle?.engine_number || 'N/A'}</div>
              <div style="font-size: 10px; margin-bottom: 4px;"><strong>Vehicle No:</strong> ${invoice.customer?.vehicle_info?.vehicle_number || invoice.vehicle?.vehicle_no || 'N/A'}</div>
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
                    <span class="detail-value">${invoice.customer?.vehicle_info?.brand || invoice.vehicle?.brand || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Model:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.model || invoice.vehicle?.model || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Color:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.color || invoice.vehicle?.color || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Vehicle No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.vehicle_number || invoice.vehicle?.vehicle_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Chassis No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.chassis_number || invoice.vehicle?.chassis_number || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Engine No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.engine_number || invoice.vehicle?.engine_number || 'N/A'}</span>
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
                      <div class="insurance-value">${invoice.customer?.insurance_info?.nominee_name || invoice.insurance_details?.nominee || invoice.insurance?.nominee || 'N/A'}</div>
                    </div>
                    <div class="insurance-item">
                      <div class="insurance-label">Relation</div>
                      <div class="insurance-value" style="text-transform: capitalize;">${invoice.customer?.insurance_info?.relation || invoice.insurance_details?.relation || invoice.insurance?.relation || 'N/A'}</div>
                    </div>
                    <div class="insurance-item">
                      <div class="insurance-label">Age</div>
                      <div class="insurance-value">${invoice.customer?.insurance_info?.age || invoice.insurance_details?.age || invoice.insurance?.age || 'N/A'} years</div>
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
                    <span class="detail-value">${invoice.customer?.vehicle_info?.brand || invoice.vehicle?.brand || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Model:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.model || invoice.vehicle?.model || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Color:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.color || invoice.vehicle?.color || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Vehicle No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.vehicle_number || invoice.vehicle?.vehicle_no || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Chassis No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.chassis_number || invoice.vehicle?.chassis_number || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Engine No:</span>
                    <span class="detail-value">${invoice.customer?.vehicle_info?.engine_number || invoice.vehicle?.engine_number || 'N/A'}</span>
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
                    <div style="font-weight: bold;">${invoice.customer?.insurance_info?.nominee_name || invoice.insurance_details?.nominee || invoice.insurance?.nominee || 'N/A'}</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Relation</div>
                    <div style="font-weight: bold; text-transform: capitalize;">${invoice.customer?.insurance_info?.relation || invoice.insurance_details?.relation || invoice.insurance?.relation || 'N/A'}</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #7c3aed; font-weight: 600; margin-bottom: 4px;">Age</div>
                    <div style="font-weight: bold;">${invoice.customer?.insurance_info?.age || invoice.insurance_details?.age || invoice.insurance?.age || 'N/A'} years</div>
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Invoices</h2>
          <p className="text-gray-600">Manage and view all sales invoices</p>
        </div>
        
        {/* Search & Sort */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice no, customer, vehicle, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <SortDropdown
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
            }}
            options={[
              { field: 'sale_date', order: 'desc', label: 'Newest First' },
              { field: 'sale_date', order: 'asc', label: 'Oldest First' },
              { field: 'invoice_number', order: 'asc', label: 'Invoice No (A-Z)' },
              { field: 'invoice_number', order: 'desc', label: 'Invoice No (Z-A)' },
              { field: 'customer_name', order: 'asc', label: 'Customer (A-Z)' },
              { field: 'customer_name', order: 'desc', label: 'Customer (Z-A)' },
              { field: 'amount', order: 'desc', label: 'Amount (High to Low)' },
              { field: 'amount', order: 'asc', label: 'Amount (Low to High)' }
            ]}
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
          <div className="flex items-center justify-between">
            <CardTitle>
              Invoice List ({filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'})
            </CardTitle>
            {selectedInvoices.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedInvoices.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
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
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-0">
                      <TableSkeleton rows={5} columns={8} />
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      <EmptyState 
                        title={searchTerm ? 'No invoices found' : 'No invoices yet'}
                        description={searchTerm ? 'Try adjusting your search terms' : 'Create a new invoice to get started'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredInvoices
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="rounded"
                          />
                        </td>
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
                          {getVehicleModel(invoice)}
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
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
        
        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredInvoices.length / itemsPerPage)}
            total={filteredInvoices.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
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
                              <span className="text-slate-600 font-medium w-12 text-xs">Mobile:</span>
                              <span className="text-slate-900 font-mono font-semibold text-xs">{selectedInvoice.customer?.mobile || selectedInvoice.customer?.phone || 'N/A'}</span>
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
                                <div className="text-slate-900 font-bold text-xs">{selectedInvoice.customer?.vehicle_info?.brand || selectedInvoice.vehicle?.brand || 'N/A'}</div>
                              </div>
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Model</span>
                                <div className="text-slate-900 font-semibold text-xs">{selectedInvoice.customer?.vehicle_info?.model || selectedInvoice.vehicle?.model || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Color</span>
                                <div className="text-slate-900 text-xs">{selectedInvoice.customer?.vehicle_info?.color || selectedInvoice.vehicle?.color || 'N/A'}</div>
                              </div>
                              <div className="border-b border-emerald-200 pb-0.5">
                                <span className="text-emerald-700 font-medium text-xs">Vehicle No</span>
                                <div className="text-slate-900 font-mono font-bold text-xs">{selectedInvoice.customer?.vehicle_info?.vehicle_number || selectedInvoice.vehicle?.vehicle_no || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-700 font-medium">Chassis No:</span>
                                <span className="text-slate-900 font-mono text-xs">{selectedInvoice.customer?.vehicle_info?.chassis_number || selectedInvoice.vehicle?.chassis_number || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-700 font-medium">Engine No:</span>
                                <span className="text-slate-900 font-mono text-xs">{selectedInvoice.customer?.vehicle_info?.engine_number || selectedInvoice.vehicle?.engine_number || 'N/A'}</span>
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
                              <div className="text-slate-900 font-semibold mt-0.5 text-xs">
                                {selectedInvoice.customer?.insurance_info?.nominee_name || selectedInvoice.insurance_details?.nominee || selectedInvoice.insurance?.nominee || 'N/A'}
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Relation</span>
                              <div className="text-slate-900 font-semibold mt-0.5 capitalize text-xs">
                                {selectedInvoice.customer?.insurance_info?.relation || selectedInvoice.insurance_details?.relation || selectedInvoice.insurance?.relation || 'N/A'}
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-purple-700 font-medium text-xs block">Age</span>
                              <div className="text-slate-900 font-semibold mt-0.5 text-xs">
                                {selectedInvoice.customer?.insurance_info?.age || selectedInvoice.insurance_details?.age || selectedInvoice.insurance?.age || 'N/A'} years
                              </div>
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
                              {customer.name} - {customer.mobile || customer.phone}
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
                            chassis_number: selectedVehicle?.chassis_number || '',
                            engine_number: selectedVehicle?.engine_number || ''
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.brand} {vehicle.model} - {vehicle.chassis_number}
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
                        <Label htmlFor="chassis_number">Chassis Number</Label>
                        <Input
                          id="chassis_number"
                          type="text"
                          value={editFormData.chassis_number || ''}
                          onChange={(e) => setEditFormData({...editFormData, chassis_number: e.target.value})}
                          placeholder="Enter chassis number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="engine_number">Engine Number</Label>
                        <Input
                          id="engine_number"
                          type="text"
                          value={editFormData.engine_number || ''}
                          onChange={(e) => setEditFormData({...editFormData, engine_number: e.target.value})}
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete {selectedInvoices.length} invoice(s)?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. Associated vehicles will be marked as available again.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default ViewInvoices;
