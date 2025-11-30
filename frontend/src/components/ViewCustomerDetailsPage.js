import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Eye, FileText, Trash2 } from 'lucide-react';
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
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="w-4 h-4" />
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
    </div>
  );
};

export default ViewCustomerDetailsPage;
