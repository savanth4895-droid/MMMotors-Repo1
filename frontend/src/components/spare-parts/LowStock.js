import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

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



export default LowStock;
