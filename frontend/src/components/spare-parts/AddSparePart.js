import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const AddSparePart = () => {
  const [partData, setPartData] = useState({
    name: '',
    part_number: '',
    brand: '',
    quantity: '',
    unit: 'Nos',
    unit_price: '',
    hsn_sac: '',
    gst_percentage: '18',
    compatible_models: '',
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
        gst_percentage: parseFloat(partData.gst_percentage),
        low_stock_threshold: parseInt(partData.low_stock_threshold)
      });
      toast.success('Spare part added successfully!');
      setPartData({
        name: '',
        part_number: '',
        brand: '',
        quantity: '',
        unit: 'Nos',
        unit_price: '',
        hsn_sac: '',
        gst_percentage: '18',
        compatible_models: '',
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
              <Label htmlFor="unit">Unit</Label>
              <Select value={partData.unit} onValueChange={(value) => setPartData({...partData, unit: value})}>
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
              <Label htmlFor="hsn_sac">HSN/SAC Code</Label>
              <Input
                id="hsn_sac"
                placeholder="Enter HSN/SAC code"
                value={partData.hsn_sac}
                onChange={(e) => setPartData({...partData, hsn_sac: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="gst_percentage">GST Percentage</Label>
              <Select value={partData.gst_percentage} onValueChange={(value) => setPartData({...partData, gst_percentage: value})}>
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

            <div>
              <Label htmlFor="compatible_models">Compatible Models</Label>
              <Input
                id="compatible_models"
                placeholder="Enter compatible models (e.g., Apache RTR 160, Activa 5G)"
                value={partData.compatible_models}
                onChange={(e) => setPartData({...partData, compatible_models: e.target.value})}
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



export default AddSparePart;
