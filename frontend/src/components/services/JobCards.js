import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import Pagination from '../Pagination';
import SortDropdown from '../SortDropdown';
import { Plus, Search, Eye, Edit, Edit2, Save, FileText, Users, Car, Wrench, ClipboardList, Check, CheckCircle, Clock, AlertCircle, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import { API, getErrorMessage } from '../../utils/helpers';

const JobCards = () => {
  const [jobCards, setJobCards] = useState([]);
  const [filteredJobCards, setFilteredJobCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJobCard, setEditingJobCard] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Inline edit state for service date in view modal
  const [editingServiceDate, setEditingServiceDate] = useState(false);
  const [editServiceDateValue, setEditServiceDateValue] = useState('');
  
  // New Job Card form state
  const [newJobCardData, setNewJobCardData] = useState({
    customer_id: '',
    customer_name: '',
    customer_mobile: '',
    vehicle_number: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    service_type: '',
    complaint: '',
    estimated_amount: '',
    service_number: '',
    kms_driven: '',
    service_date: new Date().toISOString().split('T')[0] // Default to today
  });
  const [savingJobCard, setSavingJobCard] = useState(false);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdatingStatus, setBulkUpdatingStatus] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  
  // Customer search state for Job Card form
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('service_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const vehicleBrands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
  const serviceTypes = [
    { value: 'regular_service', label: 'Regular Service' },
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'engine_repair', label: 'Engine Repair' },
    { value: 'electrical_work', label: 'Electrical Work' },
    { value: 'body_work', label: 'Body Work' },
    { value: 'tire_replacement', label: 'Tire Replacement' },
    { value: 'chain_sprocket', label: 'Chain & Sprocket' },
    { value: 'clutch_service', label: 'Clutch Service' },
    { value: 'suspension_service', label: 'Suspension Service' },
    { value: 'general_checkup', label: 'General Checkup' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterJobCards();
  }, [jobCards, searchTerm, sortBy, sortOrder]);

  const fetchAllData = async () => {
    try {
      const [servicesRes, customersRes] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          }
        })
      ]);

      const services = servicesRes.data;
      const customers = customersRes.data.data || customersRes.data;

      // Combine service and customer data to create job card records
      const combined = services.map(service => {
        const customer = customers.find(c => c.id === service.customer_id);

        return {
          id: service.id,
          job_card_id: service.job_card_number || `JOB-${service.id.slice(-6)}`,
          service_number: service.service_number || null,
          kms_driven: service.kms_driven || null,
          customer_name: customer?.name || 'Unknown',
          phone_number: customer?.mobile || customer?.phone || 'N/A',
          vehicle_brand: service.vehicle_brand || 'N/A',
          vehicle_model: service.vehicle_model || 'N/A',
          vehicle_year: service.vehicle_year || 'N/A',
          vehicle_reg_no: service.vehicle_number || 'N/A',
          complaint: service.description || 'No complaint specified',
          status: service.status || 'pending',
          service_type: service.service_type,
          amount: service.amount,
          service_date: service.service_date,
          completion_date: service.completion_date,
          created_by: service.created_by,
          customer_address: customer?.address || 'N/A',
          customer_id: service.customer_id
        };
      });

      setJobCards(combined);
      setCustomers(customers);
    } catch (error) {
      toast.error('Failed to fetch job cards data');
    } finally {
      setLoading(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    const currentPageItems = filteredJobCards.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    
    if (selectAll) {
      setSelectedIds(prev => prev.filter(id => !currentPageItems.find(item => item.id === id)));
      setSelectAll(false);
    } else {
      const currentPageIds = currentPageItems.map(item => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
      setSelectAll(true);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected for deletion');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} job card(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.delete(`${API}/services/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to delete job card ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} job card(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} job card(s)`);
      }

      setSelectedIds([]);
      setSelectAll(false);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to perform bulk delete');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected for status update');
      return;
    }

    if (!bulkStatus) {
      toast.error('Please select a status');
      return;
    }

    setBulkUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.put(`${API}/services/${id}/status`, 
            { status: bulkStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to update status for job card ${id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated status for ${successCount} job card(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to update status for ${failCount} job card(s)`);
      }

      setSelectedIds([]);
      setSelectAll(false);
      setShowBulkStatusModal(false);
      setBulkStatus('');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to perform bulk status update');
    } finally {
      setBulkUpdatingStatus(false);
    }
  };

  // Update selectAll state when page changes
  useEffect(() => {
    const currentPageItems = filteredJobCards.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    const allSelected = currentPageItems.length > 0 && 
      currentPageItems.every(item => selectedIds.includes(item.id));
    setSelectAll(allSelected);
  }, [currentPage, filteredJobCards, selectedIds, itemsPerPage]);

  const extractVehicleInfo = (description, vehicleNumber) => {
    const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];
    let brand = 'N/A';
    let model = 'N/A';
    let year = 'N/A';
    let complaint = 'General service';

    if (description) {
      // Find brand in description
      const foundBrand = brands.find(b => description.toUpperCase().includes(b));
      if (foundBrand) {
        brand = foundBrand;
        
        // Try to extract model (text after brand, before year or dash)
        const brandIndex = description.toUpperCase().indexOf(foundBrand);
        const afterBrand = description.substring(brandIndex + foundBrand.length).trim();
        const modelMatch = afterBrand.match(/^([A-Za-z0-9\s+\-]+?)(?:\s*\(|\s*-|$)/);
        if (modelMatch) {
          model = modelMatch[1].trim();
        }
        
        // Try to extract year (4 digits in parentheses)
        const yearMatch = description.match(/\((\d{4})\)/);
        if (yearMatch) {
          year = yearMatch[1];
        }
        
        // Extract complaint (text after the dash or after vehicle info)
        const complaintMatch = description.match(/(?:-\s*(.+)|(?:\(\d{4}\)\s*-?\s*(.+)))/);
        if (complaintMatch) {
          complaint = complaintMatch[1] || complaintMatch[2] || complaint;
        }
      } else {
        // If no brand found, treat entire description as complaint
        complaint = description;
      }
    }

    return { brand, model, year, complaint };
  };

  const filterJobCards = () => {
    let filtered = jobCards;

    if (searchTerm) {
      filtered = jobCards.filter(job =>
        job.job_card_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'service_date':
          aVal = new Date(a.service_date || 0);
          bVal = new Date(b.service_date || 0);
          break;
        case 'customer_name':
          aVal = a.customer_name || '';
          bVal = b.customer_name || '';
          break;
        case 'job_card_id':
          aVal = a.job_card_id || '';
          bVal = b.job_card_id || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
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

    setFilteredJobCards(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleViewJobCard = (jobCard) => {
    setSelectedJobCard(jobCard);
    setEditingServiceDate(false);
    setEditServiceDateValue('');
    setShowViewModal(true);
  };

  const handleEditServiceDate = () => {
    if (selectedJobCard) {
      const currentDate = new Date(selectedJobCard.service_date);
      setEditServiceDateValue(currentDate.toISOString().split('T')[0]);
      setEditingServiceDate(true);
    }
  };

  const handleSaveServiceDate = async () => {
    if (!selectedJobCard || !editServiceDateValue) {
      toast.error('Please select a date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Update the service date via API
      await axios.put(`${API}/services/${selectedJobCard.id}`, {
        customer_id: selectedJobCard.customer_id,
        vehicle_number: selectedJobCard.vehicle_reg_no,
        service_type: selectedJobCard.service_type,
        description: selectedJobCard.complaint,
        amount: selectedJobCard.amount,
        service_number: selectedJobCard.service_number,
        kms_driven: selectedJobCard.kms_driven,
        service_date: new Date(editServiceDateValue).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      const newServiceDate = new Date(editServiceDateValue);
      
      setSelectedJobCard(prev => ({
        ...prev,
        service_date: newServiceDate
      }));
      
      // Update the job cards list
      setJobCards(prev => prev.map(jc => 
        jc.id === selectedJobCard.id 
          ? { ...jc, service_date: newServiceDate }
          : jc
      ));
      
      setEditingServiceDate(false);
      setEditServiceDateValue('');
      toast.success('Service date updated successfully');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update service date');
    }
  };

  const handleCancelServiceDateEdit = () => {
    setEditingServiceDate(false);
    setEditServiceDateValue('');
  };

  const handleEditJobCard = (jobCard) => {
    setEditingJobCard(jobCard);
    setEditFormData({
      customer_id: customers.find(c => c.name === jobCard.customer_name)?.id || '',
      vehicle_number: jobCard.vehicle_reg_no,
      vehicle_brand: jobCard.vehicle_brand || '',
      vehicle_model: jobCard.vehicle_model || '',
      vehicle_year: jobCard.vehicle_year || '',
      service_type: jobCard.service_type,
      service_date: jobCard.service_date ? new Date(jobCard.service_date).toISOString().split('T')[0] : '',
      description: jobCard.complaint,
      amount: jobCard.amount,
      service_number: jobCard.service_number || '',
      kms_driven: jobCard.kms_driven || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingJobCard) return;
    
    try {
      setLoading(true);
      const updateData = {
        ...editFormData,
        service_date: editFormData.service_date ? new Date(editFormData.service_date).toISOString() : null,
        kms_driven: editFormData.kms_driven ? parseInt(editFormData.kms_driven) : null
      };
      await axios.put(`${API}/services/${editingJobCard.id}`, updateData);
      toast.success('Job card updated successfully!');
      setShowEditModal(false);
      setEditingJobCard(null);
      setEditFormData({});
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update job card');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingJobCard(null);
    setEditFormData({});
  };

  const handleAddNewJob = () => {
    // Reset form
    setNewJobCardData({
      customer_id: '',
      customer_name: '',
      customer_mobile: '',
      vehicle_number: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      service_type: '',
      complaint: '',
      estimated_amount: '',
      service_number: '',
      kms_driven: '',
      service_date: new Date().toISOString().split('T')[0] // Default to today
    });
    setCustomerSearchTerm('');
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
    setShowAddModal(true);
  };

  const handleCustomerSelect = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setNewJobCardData({
        ...newJobCardData,
        customer_id: customerId,
        customer_name: customer.name,
        customer_mobile: customer.mobile || customer.phone || ''
      });
      setCustomerSearchTerm(customer.name);
      setShowCustomerSuggestions(false);
      
      // Fetch vehicle info from sales for this customer
      await fetchVehicleFromSales(customerId);
    }
  };

  // Search customers by name or mobile
  const searchCustomers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      return;
    }

    setSearchingCustomers(true);
    try {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = customers.filter(c => 
        c.name?.toLowerCase().includes(lowerSearch) ||
        c.mobile?.includes(searchTerm) ||
        c.phone?.includes(searchTerm)
      ).slice(0, 10);
      
      setCustomerSuggestions(filtered);
      setShowCustomerSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Fetch vehicle info from sales records for a customer
  const fetchVehicleFromSales = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const salesResponse = await axios.get(`${API}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sales = salesResponse.data;
      // Find sales for this customer
      const customerSales = sales.filter(sale => sale.customer_id === customerId);
      
      if (customerSales.length > 0) {
        // Get the most recent sale
        const latestSale = customerSales.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0];
        
        // If we have vehicle info in the sale, populate the form
        if (latestSale.vehicle_id) {
          // Fetch vehicle details
          const vehicleResponse = await axios.get(`${API}/vehicles/${latestSale.vehicle_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);
          
          if (vehicleResponse && vehicleResponse.data) {
            const vehicle = vehicleResponse.data;
            setNewJobCardData(prev => ({
              ...prev,
              vehicle_number: vehicle.vehicle_number || vehicle.registration_number || '',
              vehicle_brand: vehicle.brand || '',
              vehicle_model: vehicle.model || '',
              vehicle_year: vehicle.year?.toString() || ''
            }));
            toast.success('Vehicle info loaded from sales record');
            return;
          }
        }
        
        // Try to get vehicle info from sale record itself
        if (latestSale.vehicle_brand || latestSale.vehicle_model || latestSale.chassis_number) {
          setNewJobCardData(prev => ({
            ...prev,
            vehicle_brand: latestSale.vehicle_brand || prev.vehicle_brand,
            vehicle_model: latestSale.vehicle_model || prev.vehicle_model,
            vehicle_number: latestSale.vehicle_number || latestSale.chassis_number || prev.vehicle_number
          }));
          toast.success('Vehicle info loaded from sales record');
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle from sales:', error);
    }
  };

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((term) => searchCustomers(term), 300),
    [customers]
  );

  const handleSaveNewJobCard = async () => {
    // Validation
    if (!newJobCardData.customer_id && !newJobCardData.customer_name) {
      toast.error('Please select a customer or enter customer name');
      return;
    }
    if (!newJobCardData.vehicle_number) {
      toast.error('Please enter vehicle registration number');
      return;
    }
    if (!newJobCardData.service_type) {
      toast.error('Please select a service type');
      return;
    }
    if (!newJobCardData.complaint) {
      toast.error('Please enter the complaint/issue');
      return;
    }

    setSavingJobCard(true);
    try {
      const token = localStorage.getItem('token');
      
      // If no customer selected but name provided, create/find customer
      let customerId = newJobCardData.customer_id;
      if (!customerId && newJobCardData.customer_name) {
        // Try to find existing customer by mobile
        const existingCustomer = customers.find(c => 
          c.mobile === newJobCardData.customer_mobile || 
          c.phone === newJobCardData.customer_mobile
        );
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const customerResponse = await axios.post(`${API}/customers`, {
            name: newJobCardData.customer_name,
            mobile: newJobCardData.customer_mobile,
            address: ''
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          customerId = customerResponse.data.id;
        }
      }

      // Create service/job card
      const jobCardData = {
        customer_id: customerId,
        vehicle_number: newJobCardData.vehicle_number,
        vehicle_brand: newJobCardData.vehicle_brand,
        vehicle_model: newJobCardData.vehicle_model,
        vehicle_year: newJobCardData.vehicle_year,
        service_type: newJobCardData.service_type,
        description: newJobCardData.complaint,
        amount: parseFloat(newJobCardData.estimated_amount) || 0,
        service_number: newJobCardData.service_number,
        kms_driven: newJobCardData.kms_driven ? parseInt(newJobCardData.kms_driven) : null,
        service_date: newJobCardData.service_date ? new Date(newJobCardData.service_date).toISOString() : null
      };

      await axios.post(`${API}/services`, jobCardData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Job card created successfully!');
      setShowAddModal(false);
      fetchAllData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job card');
    } finally {
      setSavingJobCard(false);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await axios.put(`${API}/services/${jobId}/status`, { status: newStatus });
      toast.success('Job card status updated successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update job card status');
    }
  };

  const exportJobCards = () => {
    try {
      const csvContent = [
        ['Job Card ID', 'Service Number', 'Service Date', 'Customer Name', 'Phone Number', 'Vehicle Brand', 'Vehicle Model', 'KMs Driven', 'Vehicle Reg No', 'Complaint', 'Status', 'Amount'].join(','),
        ...filteredJobCards.map(job => [
          job.job_card_id || '',
          job.service_number || '',
          job.service_date ? new Date(job.service_date).toLocaleDateString('en-IN') : '',
          job.customer_name || '',
          job.phone_number || '',
          job.vehicle_brand || '',
          job.vehicle_model || '',
          job.kms_driven || '',
          job.vehicle_reg_no || '',
          job.complaint || '',
          job.status || '',
          job.amount || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_cards_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Job cards exported successfully!');
    } catch (error) {
      toast.error('Failed to export job cards');
    }
  };

  const handleDeleteService = async (serviceId, jobCardNumber) => {
    if (!window.confirm(`Are you sure you want to delete service "${jobCardNumber}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedJobCards = jobCards.filter(job => job.id !== serviceId);
      setJobCards(updatedJobCards);
      
      toast.success('Service deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete service');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  const pendingCount = jobCards.filter(job => job.status === 'pending').length;
  const inProgressCount = jobCards.filter(job => job.status === 'in_progress').length;
  const completedCount = jobCards.filter(job => job.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Cards Management</h2>
          <p className="text-gray-600">Manage and track all service job cards</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <>
              <Button 
                onClick={() => setShowBulkStatusModal(true)} 
                variant="outline" 
                className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <CheckCircle className="w-4 h-4" />
                Update Status ({selectedIds.length})
              </Button>
              <Button 
                onClick={handleBulkDelete} 
                variant="destructive" 
                className="flex items-center gap-2"
                disabled={bulkDeleting}
              >
                <Trash2 className="w-4 h-4" />
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
              </Button>
            </>
          )}
          <Button onClick={handleAddNewJob} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Job
          </Button>
          <Button onClick={exportJobCards} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search Bar & Sort */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by job card ID, customer name, phone, vehicle details, complaint, or status..."
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
            { field: 'service_date', order: 'desc', label: 'Newest First' },
            { field: 'service_date', order: 'asc', label: 'Oldest First' },
            { field: 'customer_name', order: 'asc', label: 'Customer (A-Z)' },
            { field: 'customer_name', order: 'desc', label: 'Customer (Z-A)' },
            { field: 'job_card_id', order: 'asc', label: 'Job Card ID (A-Z)' },
            { field: 'job_card_id', order: 'desc', label: 'Job Card ID (Z-A)' },
            { field: 'status', order: 'asc', label: 'Status (A-Z)' },
            { field: 'status', order: 'desc', label: 'Status (Z-A)' }
          ]}
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Job Cards</p>
                <p className="text-2xl font-bold text-gray-900">{jobCards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Cards Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Job Cards ({filteredJobCards.length} records)
            </CardTitle>
            {selectedIds.length > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedIds.length} item(s) selected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">Job Card ID</th>
                  <th className="text-left p-3 font-semibold">Service No.</th>
                  <th className="text-left p-3 font-semibold">Service Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Phone Number</th>
                  <th className="text-left p-3 font-semibold">Vehicle Brand</th>
                  <th className="text-left p-3 font-semibold">Vehicle Model</th>
                  <th className="text-left p-3 font-semibold">KMs Driven</th>
                  <th className="text-left p-3 font-semibold">Vehicle Reg. No</th>
                  <th className="text-left p-3 font-semibold">Complaint</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="14" className="p-0">
                      <TableSkeleton rows={5} columns={14} />
                    </td>
                  </tr>
                ) : filteredJobCards.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="p-8 text-center text-gray-500">
                      <EmptyState 
                        title={searchTerm ? 'No job cards found' : 'No job cards yet'}
                        description={searchTerm ? 'Try adjusting your search terms' : 'Create a new job card to get started'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredJobCards
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((jobCard) => (
                      <tr key={jobCard.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedIds.includes(jobCard.id) ? 'bg-blue-50' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(jobCard.id)}
                            onChange={() => handleSelectItem(jobCard.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-blue-600">{jobCard.job_card_id}</span>
                        </td>
                        <td className="p-3">
                          <span className={`font-medium ${jobCard.service_number ? 'text-purple-600' : 'text-gray-400'}`}>
                            {jobCard.service_number || '-'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-600">
                            {jobCard.service_date ? new Date(jobCard.service_date).toLocaleDateString('en-IN') : '-'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{jobCard.customer_name}</div>
                        </td>
                        <td className="p-3 text-gray-600">{jobCard.phone_number}</td>
                        <td className="p-3">
                          <span className={`font-medium ${jobCard.vehicle_brand !== 'N/A' ? 'text-blue-600' : 'text-gray-400'}`}>
                            {jobCard.vehicle_brand}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">{jobCard.vehicle_model}</td>
                        <td className="p-3">
                          <span className={`font-medium ${jobCard.kms_driven ? 'text-green-600' : 'text-gray-400'}`}>
                            {jobCard.kms_driven ? `${jobCard.kms_driven.toLocaleString()} km` : '-'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 font-mono">{jobCard.vehicle_reg_no}</td>
                        <td className="p-3 max-w-xs">
                          <div className="truncate" title={jobCard.complaint}>
                            {jobCard.complaint}
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(jobCard.status)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewJobCard(jobCard)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditJobCard(jobCard)}
                              className="flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteService(jobCard.id, jobCard.job_card_number)}
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
        {filteredJobCards.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredJobCards.length / itemsPerPage)}
            total={filteredJobCards.length}
            limit={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* View Job Card Modal */}
      {showViewModal && selectedJobCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Job Card Details</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Job Card Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Job Card Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Job Card ID:</strong> {selectedJobCard.job_card_id}</div>
                    <div><strong>Service Number:</strong> <span className={selectedJobCard.service_number ? 'text-purple-600 font-medium' : 'text-gray-400'}>{selectedJobCard.service_number || 'Not assigned'}</span></div>
                    <div>
                      <strong>Service Date:</strong>{' '}
                      {editingServiceDate ? (
                        <span className="inline-flex items-center gap-2">
                          <Input
                            type="date"
                            value={editServiceDateValue}
                            onChange={(e) => setEditServiceDateValue(e.target.value)}
                            className="w-40 h-8 text-sm inline-block"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleSaveServiceDate}
                            className="text-green-600 hover:bg-green-50 px-2 py-1 h-7"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleCancelServiceDateEdit}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 h-7"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </span>
                      ) : (
                        <span 
                          className="cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 inline-flex items-center gap-1 group"
                          onClick={handleEditServiceDate}
                          title="Click to edit service date"
                        >
                          {new Date(selectedJobCard.service_date).toLocaleDateString('en-IN')}
                          <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                    </div>
                    <div><strong>Service Type:</strong> {selectedJobCard.service_type?.replace('_', ' ')}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedJobCard.status)}</div>
                    {selectedJobCard.completion_date && (
                      <div><strong>Completion Date:</strong> {new Date(selectedJobCard.completion_date).toLocaleDateString('en-IN')}</div>
                    )}
                    <div><strong>Amount:</strong> ₹{selectedJobCard.amount?.toLocaleString() || '0'}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Name:</strong> {selectedJobCard.customer_name}</div>
                    <div><strong>Phone:</strong> {selectedJobCard.phone_number}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {selectedJobCard.customer_address}</div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Brand:</strong> {selectedJobCard.vehicle_brand}</div>
                    <div><strong>Model:</strong> {selectedJobCard.vehicle_model}</div>
                    <div><strong>Year:</strong> {selectedJobCard.vehicle_year}</div>
                    <div><strong>Registration No:</strong> {selectedJobCard.vehicle_reg_no}</div>
                    <div><strong>Kilometers Driven:</strong> <span className={selectedJobCard.kms_driven ? 'text-green-600 font-medium' : 'text-gray-400'}>{selectedJobCard.kms_driven ? `${selectedJobCard.kms_driven.toLocaleString()} km` : 'Not recorded'}</span></div>
                  </div>
                </div>

                {/* Complaint/Service Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Service Details</h3>
                  <div>
                    <strong>Complaint/Description:</strong>
                    <p className="mt-1 text-gray-600">{selectedJobCard.complaint}</p>
                  </div>
                </div>

                {/* Status Update Actions */}
                {selectedJobCard.status !== 'completed' && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-600">Update Status</h3>
                    <div className="flex gap-2">
                      {selectedJobCard.status === 'pending' && (
                        <Button
                          onClick={() => {
                            updateJobStatus(selectedJobCard.id, 'in_progress');
                            setShowViewModal(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Work
                        </Button>
                      )}
                      {selectedJobCard.status === 'in_progress' && (
                        <Button
                          onClick={() => {
                            updateJobStatus(selectedJobCard.id, 'completed');
                            setShowViewModal(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditJobCard(selectedJobCard);
                  }}
                >
                  Edit Job Card
                </Button>
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Open New Job Card</h2>
                  <p className="text-gray-600">Enter the service details to create a new job card</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600 border-b pb-2 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative md:col-span-2">
                      <Label htmlFor="customer_search">Search Existing Customer</Label>
                      <div className="relative">
                        <Input
                          id="customer_search"
                          placeholder="Search by name or mobile number..."
                          value={customerSearchTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomerSearchTerm(value);
                            debouncedCustomerSearch(value);
                            // Clear customer selection if user is typing new value
                            if (newJobCardData.customer_id && value !== newJobCardData.customer_name) {
                              setNewJobCardData(prev => ({
                                ...prev,
                                customer_id: '',
                                customer_name: '',
                                customer_mobile: '',
                                vehicle_number: '',
                                vehicle_brand: '',
                                vehicle_model: '',
                                vehicle_year: ''
                              }));
                            }
                          }}
                          onFocus={() => customerSuggestions.length > 0 && setShowCustomerSuggestions(true)}
                          className={searchingCustomers ? "border-blue-300 pr-10" : "pr-10"}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {searchingCustomers ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-600"></div>
                          ) : (
                            <Search className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Customer Suggestions Dropdown */}
                      {showCustomerSuggestions && customerSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1">
                          <div className="p-2 text-xs text-blue-600 font-medium border-b bg-blue-50">
                            Select a customer to auto-fill vehicle info
                          </div>
                          {customerSuggestions.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleCustomerSelect(customer.id)}
                            >
                              <div className="font-medium text-sm">{customer.name}</div>
                              <div className="text-xs text-gray-500">📱 {customer.mobile || customer.phone || 'No phone'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {newJobCardData.customer_id && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Customer selected - vehicle info will be loaded</span>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 flex items-center text-gray-500 text-sm">
                      <span className="bg-gray-100 px-3 py-2 rounded">OR enter new customer details below</span>
                    </div>
                    <div>
                      <Label htmlFor="customer_name">Customer Name *</Label>
                      <Input
                        id="customer_name"
                        placeholder="Enter customer name"
                        value={newJobCardData.customer_name}
                        onChange={(e) => setNewJobCardData({...newJobCardData, customer_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_mobile">Mobile Number</Label>
                      <Input
                        id="customer_mobile"
                        placeholder="Enter mobile number"
                        value={newJobCardData.customer_mobile}
                        onChange={(e) => setNewJobCardData({...newJobCardData, customer_mobile: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600 border-b pb-2 flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicle_number">Vehicle Registration Number *</Label>
                      <Input
                        id="vehicle_number"
                        placeholder="e.g., KA01AB1234"
                        value={newJobCardData.vehicle_number}
                        onChange={(e) => setNewJobCardData({...newJobCardData, vehicle_number: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                      <Select 
                        value={newJobCardData.vehicle_brand} 
                        onValueChange={(value) => setNewJobCardData({...newJobCardData, vehicle_brand: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand..." />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vehicle_model">Vehicle Model</Label>
                      <Input
                        id="vehicle_model"
                        placeholder="e.g., Apache RTR 160"
                        value={newJobCardData.vehicle_model}
                        onChange={(e) => setNewJobCardData({...newJobCardData, vehicle_model: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_year">Vehicle Year</Label>
                      <Input
                        id="vehicle_year"
                        type="number"
                        placeholder="e.g., 2024"
                        min="1990"
                        max="2030"
                        value={newJobCardData.vehicle_year}
                        onChange={(e) => setNewJobCardData({...newJobCardData, vehicle_year: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="kms_driven">Kilometers Driven</Label>
                      <Input
                        id="kms_driven"
                        type="number"
                        placeholder="e.g., 15000"
                        min="0"
                        value={newJobCardData.kms_driven}
                        onChange={(e) => setNewJobCardData({...newJobCardData, kms_driven: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Service Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-600 border-b pb-2 flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Service Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service_number">Service Number</Label>
                      <Input
                        id="service_number"
                        placeholder="e.g., SRV-001"
                        value={newJobCardData.service_number}
                        onChange={(e) => setNewJobCardData({...newJobCardData, service_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_date">Service Date</Label>
                      <Input
                        id="service_date"
                        type="date"
                        value={newJobCardData.service_date}
                        onChange={(e) => setNewJobCardData({...newJobCardData, service_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_type">Service Type *</Label>
                      <Select 
                        value={newJobCardData.service_type} 
                        onValueChange={(value) => setNewJobCardData({...newJobCardData, service_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="estimated_amount">Estimated Amount (₹)</Label>
                      <Input
                        id="estimated_amount"
                        type="number"
                        step="0.01"
                        placeholder="Enter estimated amount"
                        value={newJobCardData.estimated_amount}
                        onChange={(e) => setNewJobCardData({...newJobCardData, estimated_amount: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="complaint">Complaint / Issue Description *</Label>
                      <Textarea
                        id="complaint"
                        placeholder="Describe the customer's complaint or the service required..."
                        rows={4}
                        value={newJobCardData.complaint}
                        onChange={(e) => setNewJobCardData({...newJobCardData, complaint: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveNewJobCard} 
                  disabled={savingJobCard}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {savingJobCard ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Job Card
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Card Modal */}
      {showEditModal && editingJobCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Job Card</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="space-y-6">
                {/* Customer Information Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Customer Information</h3>
                  <div>
                    <Label htmlFor="customer_id">Customer</Label>
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
                </div>

                {/* Vehicle Information Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicle_number">Registration Number *</Label>
                      <Input
                        id="vehicle_number"
                        placeholder="e.g., KA-01-AB-1234"
                        value={editFormData.vehicle_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_number: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                      <Input
                        id="vehicle_brand"
                        placeholder="e.g., Honda, Yamaha, TVS"
                        value={editFormData.vehicle_brand || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_brand: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_model">Vehicle Model</Label>
                      <Input
                        id="vehicle_model"
                        placeholder="e.g., Activa, FZ, Apache"
                        value={editFormData.vehicle_model || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_model: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_year">Vehicle Year</Label>
                      <Input
                        id="vehicle_year"
                        type="number"
                        placeholder="e.g., 2024"
                        min="1990"
                        max="2030"
                        value={editFormData.vehicle_year || ''}
                        onChange={(e) => setEditFormData({...editFormData, vehicle_year: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="kms_driven">Kilometers Driven</Label>
                      <Input
                        id="kms_driven"
                        type="number"
                        placeholder="e.g., 15000"
                        min="0"
                        value={editFormData.kms_driven || ''}
                        onChange={(e) => setEditFormData({...editFormData, kms_driven: e.target.value ? parseInt(e.target.value) : null})}
                      />
                    </div>
                  </div>
                </div>

                {/* Service Details Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Service Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service_number">Service Number</Label>
                      <Input
                        id="service_number"
                        placeholder="e.g., SRV-001"
                        value={editFormData.service_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, service_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_date">Service Date</Label>
                      <Input
                        id="service_date"
                        type="date"
                        value={editFormData.service_date || ''}
                        onChange={(e) => setEditFormData({...editFormData, service_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_type">Service Type *</Label>
                      <Select 
                        value={editFormData.service_type} 
                        onValueChange={(value) => setEditFormData({...editFormData, service_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular_service">Regular Service</SelectItem>
                          <SelectItem value="periodic_service">Periodic Service</SelectItem>
                          <SelectItem value="oil_change">Oil Change</SelectItem>
                          <SelectItem value="brake_service">Brake Service</SelectItem>
                          <SelectItem value="engine_repair">Engine Repair</SelectItem>
                          <SelectItem value="electrical_work">Electrical Work</SelectItem>
                          <SelectItem value="body_work">Body Work</SelectItem>
                          <SelectItem value="tire_replacement">Tire Replacement</SelectItem>
                          <SelectItem value="chain_sprocket">Chain & Sprocket</SelectItem>
                          <SelectItem value="clutch_service">Clutch Service</SelectItem>
                          <SelectItem value="suspension_service">Suspension Service</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="Enter service amount"
                        value={editFormData.amount || ''}
                        onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="description">Complaint/Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter complaint or service description"
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      rows={4}
                    />
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

      {/* Bulk Status Update Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Update Status for {selectedIds.length} Job Card(s)</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowBulkStatusModal(false);
                    setBulkStatus('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk_status">Select New Status</Label>
                  <Select 
                    value={bulkStatus} 
                    onValueChange={setBulkStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          In Progress
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-red-600" />
                          Cancelled
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    This will update the status of <strong>{selectedIds.length}</strong> selected job card(s) to the chosen status.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBulkStatusModal(false);
                    setBulkStatus('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkStatusUpdate} 
                  disabled={bulkUpdatingStatus || !bulkStatus}
                >
                  {bulkUpdatingStatus ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default JobCards;
