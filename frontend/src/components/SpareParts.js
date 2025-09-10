import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingDown,
  FileText,
  Search,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SpareParts = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Overview', path: '/spare-parts', icon: Package },
    { name: 'Add Part', path: '/spare-parts/add', icon: Plus },
    { name: 'Inventory', path: '/spare-parts/inventory', icon: Package },
    { name: 'Create Bill', path: '/spare-parts/create-bill', icon: ShoppingCart },
    { name: 'Bills', path: '/spare-parts/bills', icon: FileText },
    { name: 'Low Stock', path: '/spare-parts/low-stock', icon: TrendingDown }
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
                  <span className="hidden sm:inline">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<SparePartsOverview />} />
        <Route path="/add" element={<AddSparePart />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/create-bill" element={<CreateBill />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/low-stock" element={<LowStock />} />
      </Routes>
    </div>
  );
};

const SparePartsOverview = () => {
  const [stats, setStats] = useState({
    totalParts: 0,
    lowStockParts: 0,
    totalValue: 0,
    monthlyBills: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [partsResponse, lowStockResponse, billsResponse] = await Promise.all([
        axios.get(`${API}/spare-parts`),
        axios.get(`${API}/spare-parts?low_stock=true`),
        axios.get(`${API}/spare-parts/bills`)
      ]);

      const totalValue = partsResponse.data.reduce((sum, part) => sum + (part.quantity * part.unit_price), 0);
      
      setStats({
        totalParts: partsResponse.data.length,
        lowStockParts: lowStockResponse.data.length,
        totalValue: totalValue,
        monthlyBills: billsResponse.data.filter(bill => 
          new Date(bill.bill_date).getMonth() === new Date().getMonth()
        ).length
      });
    } catch (error) {
      toast.error('Failed to fetch spare parts statistics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalParts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockParts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Bills</p>
                <p className="text-2xl font-bold text-purple-600">{stats.monthlyBills}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/spare-parts/add">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add New Part
              </Button>
            </Link>
            <Link to="/spare-parts/create-bill">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create Bill
              </Button>
            </Link>
            <Link to="/spare-parts/low-stock">
              <Button variant="outline" className="w-full justify-start text-red-600">
                <AlertTriangle className="w-4 h-4 mr-2" />
                View Low Stock
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Engine Parts</span>
                <Badge variant="outline">35%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Brake System</span>
                <Badge variant="outline">28%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Electrical</span>
                <Badge variant="outline">22%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Body Parts</span>
                <Badge variant="outline">15%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AddSparePart = () => {
  const [partData, setPartData] = useState({
    name: '',
    part_number: '',
    brand: '',
    quantity: '',
    unit_price: '',
    low_stock_threshold: '5',
    supplier: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/spare-parts`, {
        ...partData,
        quantity: parseInt(partData.quantity),
        unit_price: parseFloat(partData.unit_price),
        low_stock_threshold: parseInt(partData.low_stock_threshold)
      });
      toast.success('Spare part added successfully!');
      setPartData({
        name: '',
        part_number: '',
        brand: '',
        quantity: '',
        unit_price: '',
        low_stock_threshold: '5',
        supplier: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add spare part');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Spare Part</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Part Name</Label>
              <Input
                id="name"
                placeholder="Enter part name"
                value={partData.name}
                onChange={(e) => setPartData({...partData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="part_number">Part Number</Label>
              <Input
                id="part_number"
                placeholder="Enter part number"
                value={partData.part_number}
                onChange={(e) => setPartData({...partData, part_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="Enter brand"
                value={partData.brand}
                onChange={(e) => setPartData({...partData, brand: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={partData.quantity}
                onChange={(e) => setPartData({...partData, quantity: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="unit_price">Unit Price (₹)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                placeholder="Enter unit price"
                value={partData.unit_price}
                onChange={(e) => setPartData({...partData, unit_price: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                placeholder="Enter threshold"
                value={partData.low_stock_threshold}
                onChange={(e) => setPartData({...partData, low_stock_threshold: e.target.value})}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input
                id="supplier"
                placeholder="Enter supplier name"
                value={partData.supplier}
                onChange={(e) => setPartData({...partData, supplier: e.target.value})}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Part...' : 'Add Spare Part'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const Inventory = () => {
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchTerm]);

  const fetchParts = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts`);
      setParts(response.data);
    } catch (error) {
      toast.error('Failed to fetch spare parts');
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredParts(filtered);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search parts by name, number, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parts List */}
      <Card>
        <CardHeader>
          <CardTitle>Spare Parts Inventory ({filteredParts.length} parts)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Part Name</th>
                  <th className="text-left p-2">Part Number</th>
                  <th className="text-left p-2">Brand</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Unit Price</th>
                  <th className="text-left p-2">Total Value</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => (
                  <tr key={part.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{part.name}</td>
                    <td className="p-2">{part.part_number}</td>
                    <td className="p-2">{part.brand}</td>
                    <td className="p-2">{part.quantity}</td>
                    <td className="p-2">₹{part.unit_price}</td>
                    <td className="p-2">₹{(part.quantity * part.unit_price).toFixed(2)}</td>
                    <td className="p-2">
                      {part.quantity <= part.low_stock_threshold ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
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
    </div>
  );
};

const CreateBill = () => {
  const [customers, setCustomers] = useState([]);
  const [parts, setParts] = useState([]);
  const [billData, setBillData] = useState({
    customer_id: '',
    items: []
  });
  const [itemForm, setItemForm] = useState({
    part_id: '',
    description: '',
    hsn_sac: '',
    quantity: '',
    unit: 'Nos',
    rate: '',
    discount_percent: '0',
    gst_percent: '18'
  });

  useEffect(() => {
    fetchCustomers();
    fetchParts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const fetchParts = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts`);
      setParts(response.data);
    } catch (error) {
      toast.error('Failed to fetch spare parts');
    }
  };

  const handlePartSelection = (partId) => {
    const selectedPart = parts.find(p => p.id === partId);
    if (selectedPart) {
      setItemForm({
        ...itemForm,
        part_id: partId,
        description: selectedPart.name,
        hsn_sac: selectedPart.hsn_sac || '',
        unit: selectedPart.unit || 'Nos',
        rate: selectedPart.unit_price.toString(),
        gst_percent: selectedPart.gst_percentage?.toString() || '18'
      });
    }
  };

  const calculateGST = (rate, quantity, discountPercent, gstPercent) => {
    const subtotal = rate * quantity;
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const cgstAmount = (taxableAmount * (gstPercent / 2)) / 100;
    const sgstAmount = (taxableAmount * (gstPercent / 2)) / 100;
    const totalTax = cgstAmount + sgstAmount;
    const finalAmount = taxableAmount + totalTax;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalTax,
      finalAmount
    };
  };

  const addItem = () => {
    if (!itemForm.part_id || !itemForm.quantity || !itemForm.rate) {
      toast.error('Please fill all required fields');
      return;
    }

    const calculations = calculateGST(
      parseFloat(itemForm.rate),
      parseFloat(itemForm.quantity),
      parseFloat(itemForm.discount_percent),
      parseFloat(itemForm.gst_percent)
    );

    const newItem = {
      sl_no: billData.items.length + 1,
      part_id: itemForm.part_id,
      description: itemForm.description,
      hsn_sac: itemForm.hsn_sac,
      quantity: parseFloat(itemForm.quantity),
      unit: itemForm.unit,
      rate: parseFloat(itemForm.rate),
      discount_percent: parseFloat(itemForm.discount_percent),
      gst_percent: parseFloat(itemForm.gst_percent),
      ...calculations
    };

    setBillData({
      ...billData,
      items: [...billData.items, newItem]
    });

    // Reset form
    setItemForm({
      part_id: '',
      description: '',
      hsn_sac: '',
      quantity: '',
      unit: 'Nos',
      rate: '',
      discount_percent: '0',
      gst_percent: '18'
    });
  };

  const removeItem = (index) => {
    const newItems = billData.items.filter((_, i) => i !== index);
    setBillData({ ...billData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (billData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      await axios.post(`${API}/spare-parts/bills`, billData);
      toast.success('Bill created successfully!');
      setBillData({ customer_id: '', items: [] });
    } catch (error) {
      toast.error('Failed to create bill');
    }
  };

  const calculateTotals = () => {
    const subtotal = billData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = billData.items.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalCGST = billData.items.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalSGST = billData.items.reduce((sum, item) => sum + item.sgstAmount, 0);
    const totalTax = billData.items.reduce((sum, item) => sum + item.totalTax, 0);
    const totalAmount = billData.items.reduce((sum, item) => sum + item.finalAmount, 0);

    return { subtotal, totalDiscount, totalCGST, totalSGST, totalTax, totalAmount };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Spare Parts Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={billData.customer_id} onValueChange={(value) => setBillData({...billData, customer_id: value})}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="part">Select Part</Label>
                <Select value={selectedPart} onValueChange={setSelectedPart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select part" />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name} - ₹{part.unit_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <Button type="button" onClick={addItem}>Add Item</Button>
            </div>

            {billData.items.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Bill Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Part</th>
                        <th className="text-left p-2">Qty</th>
                        <th className="text-left p-2">Rate</th>
                        <th className="text-left p-2">Amount</th>
                        <th className="text-left p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billData.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.part_name}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">₹{item.unit_price}</td>
                          <td className="p-2">₹{(item.quantity * item.unit_price).toFixed(2)}</td>
                          <td className="p-2">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              onClick={() => removeItem(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="p-2 font-medium">Total:</td>
                        <td className="p-2 font-bold">₹{totalAmount.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full">Create Bill</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts/bills`);
      setBills(response.data);
    } catch (error) {
      toast.error('Failed to fetch bills');
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
        <CardTitle>Spare Parts Bills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Bill Number</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Items</th>
                <th className="text-left p-2">Total Amount</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{bill.bill_number}</td>
                  <td className="p-2">{new Date(bill.bill_date).toLocaleDateString()}</td>
                  <td className="p-2">{bill.customer_id}</td>
                  <td className="p-2">{bill.items.length} items</td>
                  <td className="p-2">₹{bill.total_amount}</td>
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

const LowStock = () => {
  const [lowStockParts, setLowStockParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockParts();
  }, []);

  const fetchLowStockParts = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts?low_stock=true`);
      setLowStockParts(response.data);
    } catch (error) {
      toast.error('Failed to fetch low stock parts');
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
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Low Stock Alert ({lowStockParts.length} parts)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockParts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Low Stock Items</h3>
            <p className="text-gray-500">All spare parts are adequately stocked!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Part Name</th>
                  <th className="text-left p-2">Part Number</th>
                  <th className="text-left p-2">Brand</th>
                  <th className="text-left p-2">Current Stock</th>
                  <th className="text-left p-2">Threshold</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map((part) => (
                  <tr key={part.id} className="border-b hover:bg-red-50">
                    <td className="p-2 font-medium">{part.name}</td>
                    <td className="p-2">{part.part_number}</td>
                    <td className="p-2">{part.brand}</td>
                    <td className="p-2 text-red-600 font-semibold">{part.quantity}</td>
                    <td className="p-2">{part.low_stock_threshold}</td>
                    <td className="p-2">
                      <Badge variant="destructive">Low Stock</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpareParts;