import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import { Search, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const Inventory = () => {
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
        part.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.compatible_models && part.compatible_models.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredParts(filtered);
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setEditFormData({
      name: part.name,
      part_number: part.part_number,
      brand: part.brand,
      quantity: part.quantity,
      unit: part.unit || 'Nos',
      unit_price: part.unit_price,
      hsn_sac: part.hsn_sac || '',
      gst_percentage: part.gst_percentage || 18,
      compatible_models: part.compatible_models || '',
      low_stock_threshold: part.low_stock_threshold || 5,
      supplier: part.supplier || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPart) return;
    
    try {
      setLoading(true);
      await axios.put(`${API}/spare-parts/${editingPart.id}`, editFormData);
      toast.success('Spare part updated successfully!');
      setShowEditModal(false);
      setEditingPart(null);
      setEditFormData({});
      fetchParts(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update spare part');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingPart(null);
    setEditFormData({});
  };

  const handleDeletePart = async (partId, partName) => {
    if (!window.confirm(`Are you sure you want to delete spare part "${partName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/spare-parts/${partId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedParts = parts.filter(part => part.id !== partId);
      setParts(updatedParts);
      
      toast.success('Spare part deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete spare part');
    }
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
              placeholder="Search parts by name, number, brand, or compatible models..."
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
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Sl. No.</th>
                  <th className="text-left p-3 font-semibold">Description of Goods</th>
                  <th className="text-left p-3 font-semibold">Part Number</th>
                  <th className="text-left p-3 font-semibold">HSN/SAC</th>
                  <th className="text-left p-3 font-semibold">Qty.</th>
                  <th className="text-left p-3 font-semibold">Unit</th>
                  <th className="text-left p-3 font-semibold">Rate</th>
                  <th className="text-left p-3 font-semibold">GST%</th>
                  <th className="text-left p-3 font-semibold">Compatible Models</th>
                  <th className="text-left p-3 font-semibold">Total Value</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part, index) => (
                  <tr key={part.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center">{index + 1}</td>
                    <td className="p-3 font-medium">{part.name}</td>
                    <td className="p-3 font-mono text-sm">{part.part_number}</td>
                    <td className="p-3">{part.hsn_sac || 'N/A'}</td>
                    <td className="p-3 text-right">{part.quantity}</td>
                    <td className="p-3">{part.unit || 'Nos'}</td>
                    <td className="p-3 text-right">₹{part.unit_price.toFixed(2)}</td>
                    <td className="p-3 text-right">{part.gst_percentage || 18}%</td>
                    <td className="p-3">{part.compatible_models || 'N/A'}</td>
                    <td className="p-3 text-right font-semibold">₹{(part.quantity * part.unit_price).toFixed(2)}</td>
                    <td className="p-3">
                      {part.quantity <= part.low_stock_threshold ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditPart(part)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePart(part.id, part.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Spare Part Modal */}
      {showEditModal && editingPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Spare Part</h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Part Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter part name"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="part_number">Part Number</Label>
                  <Input
                    id="part_number"
                    placeholder="Enter part number"
                    value={editFormData.part_number || ''}
                    onChange={(e) => setEditFormData({...editFormData, part_number: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="Enter brand"
                    value={editFormData.brand || ''}
                    onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={editFormData.quantity || ''}
                    onChange={(e) => setEditFormData({...editFormData, quantity: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={editFormData.unit} onValueChange={(value) => setEditFormData({...editFormData, unit: value})}>
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
                    value={editFormData.unit_price || ''}
                    onChange={(e) => setEditFormData({...editFormData, unit_price: parseFloat(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="hsn_sac">HSN/SAC Code</Label>
                  <Input
                    id="hsn_sac"
                    placeholder="Enter HSN/SAC code"
                    value={editFormData.hsn_sac || ''}
                    onChange={(e) => setEditFormData({...editFormData, hsn_sac: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="gst_percentage">GST Percentage</Label>
                  <Select value={editFormData.gst_percentage?.toString()} onValueChange={(value) => setEditFormData({...editFormData, gst_percentage: parseFloat(value)})}>
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
                    value={editFormData.compatible_models || ''}
                    onChange={(e) => setEditFormData({...editFormData, compatible_models: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    placeholder="Enter threshold"
                    value={editFormData.low_stock_threshold || ''}
                    onChange={(e) => setEditFormData({...editFormData, low_stock_threshold: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="supplier">Supplier (Optional)</Label>
                  <Input
                    id="supplier"
                    placeholder="Enter supplier name"
                    value={editFormData.supplier || ''}
                    onChange={(e) => setEditFormData({...editFormData, supplier: e.target.value})}
                  />
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



export default Inventory;
