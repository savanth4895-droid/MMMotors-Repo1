import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Eye, FileText, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import Pagination from './Pagination';
import SortDropdown from './SortDropdown';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ViewCustomerDetailsPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(100);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, sort, order]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/customers`, {
        params: {
          page: currentPage,
          limit: limit,
          sort: sort,
          order: order
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setCustomers(response.data.data);
      setTotal(response.data.meta.total);
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { field: 'name', order: 'asc', label: 'Name (A → Z)' },
    { field: 'name', order: 'desc', label: 'Name (Z → A)' },
    { field: 'created_at', order: 'desc', label: 'Created Date (Newest → Oldest)' },
    { field: 'created_at', order: 'asc', label: 'Created Date (Oldest → Newest)' },
    { field: 'total_purchases', order: 'desc', label: 'Total Purchases (High → Low)' },
    { field: 'total_purchases', order: 'asc', label: 'Total Purchases (Low → High)' }
  ];

  const handleSortChange = (newSort, newOrder) => {
    setSort(newSort);
    setOrder(newOrder);
    setCurrentPage(1);
    // Save to localStorage
    localStorage.setItem('customerSort', JSON.stringify({ sort: newSort, order: newOrder }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedCustomers([]); // Clear selections when changing pages
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomers(customers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/customers`, {
        data: { ids: selectedCustomers },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.deleted > 0) {
        toast.success(`Successfully deleted ${response.data.deleted} customer(s)`);
      }

      if (response.data.failed.length > 0) {
        toast.error(`Failed to delete ${response.data.failed.length} customer(s)`);
      }

      setSelectedCustomers([]);
      setShowDeleteModal(false);
      
      // If current page is now empty, go to previous page
      if (customers.length === selectedCustomers.length && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchCustomers();
      }
    } catch (error) {
      toast.error('Failed to delete customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleViewInvoices = async (customer) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter invoices for this customer
      const customerSales = response.data.filter(sale => sale.customer_id === customer.id);
      setCustomerInvoices(customerSales);
      setSelectedCustomer(customer);
      setShowInvoicesModal(true);
    } catch (error) {
      toast.error('Failed to fetch customer invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (customer) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch customer's invoices
      const response = await axios.get(`${API}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const customerSales = response.data.filter(sale => sale.customer_id === customer.id);
      
      if (customerSales.length === 0) {
        toast.error('No invoices found for this customer');
        return;
      }

      // Import html2pdf dynamically
      const { default: html2pdf } = await import('html2pdf.js');

      // Generate professional invoice HTML
      const invoiceHTML = generateCustomerInvoiceHTML(customer, customerSales);

      // PDF options
      const options = {
        margin: 10,
        filename: `${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}_Invoices.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate and download PDF
      await html2pdf().set(options).from(invoiceHTML).save();
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerInvoiceHTML = (customer, invoices) => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const invoiceRows = invoices.map(invoice => `
      <tr>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${invoice.invoice_number}</td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(invoice.sale_date).toLocaleDateString('en-IN')}</td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">₹${invoice.amount?.toLocaleString('en-IN')}</td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${invoice.payment_method}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 5px;
          }
          .company-details {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          .document-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 20px 0;
            text-transform: uppercase;
          }
          .customer-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .customer-title {
            font-size: 16px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 15px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 5px;
          }
          .customer-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-row {
            display: flex;
            padding: 5px 0;
          }
          .info-label {
            font-weight: bold;
            color: #555;
            min-width: 120px;
          }
          .info-value {
            color: #333;
          }
          .invoices-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .invoices-table th {
            background: #0066cc;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          .invoices-table td {
            padding: 10px;
            border: 1px solid #dee2e6;
          }
          .invoices-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .summary-section {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
          }
          .summary-row.total {
            font-size: 20px;
            font-weight: bold;
            color: #0066cc;
            border-top: 2px solid #0066cc;
            padding-top: 15px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">M M MOTORS</div>
          <div class="company-details">Two Wheeler Sales & Service Center</div>
          <div class="company-details">Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</div>
          <div class="company-details">Phone: +91 7026263123 | Email: mmmotors3123@gmail.com</div>
        </div>

        <div class="document-title">Customer Invoice Statement</div>

        <div class="customer-section">
          <div class="customer-title">Customer Details</div>
          <div class="customer-info">
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${customer.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mobile:</span>
              <span class="info-value">${customer.mobile}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Care Of:</span>
              <span class="info-value">${customer.care_of || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${customer.email || 'N/A'}</span>
            </div>
            <div class="info-row" style="grid-column: 1 / -1;">
              <span class="info-label">Address:</span>
              <span class="info-value">${customer.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        <h3 style="color: #0066cc; margin-bottom: 15px;">Invoice History</h3>
        <table class="invoices-table">
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-row">
            <span>Total Invoices:</span>
            <span>${invoices.length}</span>
          </div>
          <div class="summary-row total">
            <span>Total Amount:</span>
            <span>₹${totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>This is a computer-generated statement and does not require a signature.</p>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
        </div>
      </body>
      </html>
    `;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile?.includes(searchTerm)
  );

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Details</CardTitle>
            <div className="flex items-center gap-2">
              {selectedCustomers.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedCustomers.length})
                </Button>
              )}
              <SortDropdown
                currentSort={sort}
                currentOrder={order}
                onSortChange={handleSortChange}
                options={sortOptions}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Mobile</th>
                  <th className="text-left p-3 font-semibold">Address</th>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleSelectCustomer(customer.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 font-medium">{customer.name}</td>
                    <td className="p-3">{customer.mobile}</td>
                    <td className="p-3">{customer.address || 'N/A'}</td>
                    <td className="p-3">
                      {customer.vehicle_info?.brand || 'N/A'} {customer.vehicle_info?.model || ''}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewCustomer(customer)}
                          title="View Customer Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewInvoices(customer)}
                          title="View Customer Invoices"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadInvoice(customer)}
                          title="Download Invoice Statement"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete {selectedCustomers.length} customer(s)?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. Customers with associated sales records cannot be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Details Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Customer Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile</p>
                    <p className="font-medium">{selectedCustomer.mobile}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Care Of</p>
                    <p className="font-medium">{selectedCustomer.care_of || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedCustomer.email || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{selectedCustomer.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {selectedCustomer.vehicle_info && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Brand</p>
                      <p className="font-medium">{selectedCustomer.vehicle_info.brand || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Model</p>
                      <p className="font-medium">{selectedCustomer.vehicle_info.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Color</p>
                      <p className="font-medium">{selectedCustomer.vehicle_info.color || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vehicle Number</p>
                      <p className="font-medium">{selectedCustomer.vehicle_info.vehicle_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Information */}
              {selectedCustomer.insurance_info && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Insurance Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nominee Name</p>
                      <p className="font-medium">{selectedCustomer.insurance_info.nominee_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Relation</p>
                      <p className="font-medium">{selectedCustomer.insurance_info.relation || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-medium">{selectedCustomer.insurance_info.age || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Information */}
              {selectedCustomer.sales_info && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Sales Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Purchases</p>
                      <p className="font-medium">{selectedCustomer.sales_info.total_purchases || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium">₹{selectedCustomer.sales_info.total_amount?.toLocaleString('en-IN') || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Purchase Date</p>
                      <p className="font-medium">
                        {selectedCustomer.sales_info.last_purchase_date 
                          ? new Date(selectedCustomer.sales_info.last_purchase_date).toLocaleDateString('en-IN')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Invoices Modal */}
      {showInvoicesModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Customer Invoices</h2>
                <p className="text-gray-600">{selectedCustomer.name} - {selectedCustomer.mobile}</p>
              </div>
              <button
                onClick={() => setShowInvoicesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {customerInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No invoices found for this customer
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">Invoice No.</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Amount</th>
                      <th className="text-left p-3 font-semibold">Payment Method</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-blue-600">
                          {invoice.invoice_number}
                        </td>
                        <td className="p-3">
                          {new Date(invoice.sale_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3 font-medium">
                          ₹{invoice.amount?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">{invoice.payment_method}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Invoices:</span>
                    <span>{customerInvoices.length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{customerInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowInvoicesModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCustomerDetailsPage;
