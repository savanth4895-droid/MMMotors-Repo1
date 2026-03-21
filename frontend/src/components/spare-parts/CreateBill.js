import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading';
import { Plus, Printer, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const CreateBill = () => {
  const [parts, setParts] = useState([]);
  const [customerData, setCustomerData] = useState({
    name: '',
    mobile: '',
    vehicle_name: '',
    vehicle_number: ''
  });
  const [billItems, setBillItems] = useState([]);
  const [loading, setLoading] = useState(false);
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
    fetchParts();
  }, []);



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
    if (!itemForm.description || !itemForm.hsn_sac || !itemForm.quantity || !itemForm.rate) {
      toast.error('Please fill all required fields: Description, HSN/SAC, Quantity, and Rate');
      return;
    }

    const calculations = calculateGST(
      parseFloat(itemForm.rate),
      parseFloat(itemForm.quantity),
      parseFloat(itemForm.discount_percent),
      parseFloat(itemForm.gst_percent)
    );

    const newItem = {
      sl_no: billItems.length + 1,
      part_id: itemForm.part_id || `MANUAL-${Date.now()}`, // Generate ID for manual entries
      description: itemForm.description,
      hsn_sac: itemForm.hsn_sac,
      quantity: parseFloat(itemForm.quantity),
      unit: itemForm.unit,
      rate: parseFloat(itemForm.rate),
      discount_percent: parseFloat(itemForm.discount_percent),
      gst_percent: parseFloat(itemForm.gst_percent),
      ...calculations
    };

    setBillItems([...billItems, newItem]);

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
    const updatedItems = billItems.filter((_, i) => i !== index);
    // Update serial numbers
    const reIndexedItems = updatedItems.map((item, i) => ({
      ...item,
      sl_no: i + 1
    }));
    setBillItems(reIndexedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (billItems.length === 0) {
      toast.error('Please add at least one item to generate bill');
      return;
    }

    if (!customerData.name || !customerData.mobile) {
      toast.error('Please enter customer name and mobile number');
      return;
    }

    setLoading(true);

    const billPayload = {
      customer_data: customerData,
      items: billItems,
      subtotal: totals.subtotal,
      total_discount: totals.totalDiscount,
      total_cgst: totals.totalCGST,
      total_sgst: totals.totalSGST,
      total_tax: totals.totalTax,
      total_amount: totals.totalAmount
    };

    try {
      const response = await axios.post(`${API}/spare-parts/bills`, billPayload);
      toast.success('GST Bill generated successfully!');
      setCustomerData({ name: '', mobile: '', vehicle_name: '', vehicle_number: '' });
      setBillItems([]);
    } catch (error) {
      console.error('Bill generation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = billItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalCGST = billItems.reduce((sum, item) => sum + item.cgstAmount, 0);
    const totalSGST = billItems.reduce((sum, item) => sum + item.sgstAmount, 0);
    const totalTax = billItems.reduce((sum, item) => sum + item.totalTax, 0);
    const totalAmount = billItems.reduce((sum, item) => sum + item.finalAmount, 0);

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer & Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer & Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      placeholder="Enter customer name"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      placeholder="Enter mobile number"
                      value={customerData.mobile}
                      onChange={(e) => setCustomerData({...customerData, mobile: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle_name">Vehicle Name</Label>
                    <Input
                      id="vehicle_name"
                      placeholder="Enter vehicle name (e.g., TVS Apache)"
                      value={customerData.vehicle_name}
                      onChange={(e) => setCustomerData({...customerData, vehicle_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle_number">Vehicle Number</Label>
                    <Input
                      id="vehicle_number"
                      placeholder="Enter vehicle number (e.g., TN01AB1234)"
                      value={customerData.vehicle_number}
                      onChange={(e) => setCustomerData({...customerData, vehicle_number: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Item Entry Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Items to Bill</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="part">Select Part</Label>
                    <Select value={itemForm.part_id} onValueChange={handlePartSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select part" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name} - {part.part_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description of Goods *</Label>
                    <Input
                      id="description"
                      placeholder="Enter description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hsn_sac">HSN/SAC *</Label>
                    <Input
                      id="hsn_sac"
                      placeholder="Enter HSN/SAC code"
                      value={itemForm.hsn_sac}
                      onChange={(e) => setItemForm({...itemForm, hsn_sac: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={itemForm.unit} onValueChange={(value) => setItemForm({...itemForm, unit: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nos">Nos</SelectItem>
                        <SelectItem value="Kg">Kg</SelectItem>
                        <SelectItem value="Ltr">Ltr</SelectItem>
                        <SelectItem value="Mtr">Mtr</SelectItem>
                        <SelectItem value="Set">Set</SelectItem>
                        <SelectItem value="Pair">Pair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rate">Rate (₹) *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="Enter rate"
                      value={itemForm.rate}
                      onChange={(e) => setItemForm({...itemForm, rate: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Disc% </Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      placeholder="Enter discount %"
                      value={itemForm.discount_percent}
                      onChange={(e) => setItemForm({...itemForm, discount_percent: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gst">GST% *</Label>
                    <Select value={itemForm.gst_percent} onValueChange={(value) => setItemForm({...itemForm, gst_percent: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GST%" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button type="button" onClick={addItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bill Items Table */}
            {billItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bill Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border">Sl. No.</th>
                          <th className="text-left p-2 border">Description of Goods</th>
                          <th className="text-left p-2 border">HSN/SAC</th>
                          <th className="text-left p-2 border">Qty.</th>
                          <th className="text-left p-2 border">Unit</th>
                          <th className="text-left p-2 border">Rate</th>
                          <th className="text-left p-2 border">Disc%</th>
                          <th className="text-left p-2 border">GST%</th>
                          <th className="text-left p-2 border">CGST Amount</th>
                          <th className="text-left p-2 border">SGST Amount</th>
                          <th className="text-left p-2 border">Total Tax</th>
                          <th className="text-left p-2 border">Amount</th>
                          <th className="text-left p-2 border">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billItems.map((item, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-2 border text-center">{item.sl_no}</td>
                            <td className="p-2 border">{item.description}</td>
                            <td className="p-2 border">{item.hsn_sac}</td>
                            <td className="p-2 border text-right">{item.quantity}</td>
                            <td className="p-2 border">{item.unit}</td>
                            <td className="p-2 border text-right">₹{item.rate.toFixed(2)}</td>
                            <td className="p-2 border text-right">{item.discount_percent}%</td>
                            <td className="p-2 border text-right">{item.gst_percent}%</td>
                            <td className="p-2 border text-right">₹{item.cgstAmount.toFixed(2)}</td>
                            <td className="p-2 border text-right">₹{item.sgstAmount.toFixed(2)}</td>
                            <td className="p-2 border text-right">₹{item.totalTax.toFixed(2)}</td>
                            <td className="p-2 border text-right font-semibold">₹{item.finalAmount.toFixed(2)}</td>
                            <td className="p-2 border text-center">
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
                    </table>
                  </div>

                  {/* Bill Summary */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Subtotal:</span>
                        <div className="font-semibold">₹{totals.subtotal.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Discount:</span>
                        <div className="font-semibold">₹{totals.totalDiscount.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total CGST:</span>
                        <div className="font-semibold">₹{totals.totalCGST.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total SGST:</span>
                        <div className="font-semibold">₹{totals.totalSGST.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Tax:</span>
                        <span className="text-lg font-bold">₹{totals.totalTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold text-green-600">
                        <span>Final Amount:</span>
                        <span>₹{totals.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {billItems.length > 0 && (
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-8 py-3 text-lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {loading ? 'Generating Bill...' : 'Generate GST Bill'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};



export default CreateBill;
