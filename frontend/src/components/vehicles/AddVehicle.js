import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const AddVehicle = () => {
  const [vehicleData, setVehicleData] = useState({
    brand: '',
    model: '',
    chassis_number: '',
    engine_number: '',
    color: '',
    vehicle_number: '',
    key_number: '',
    inbound_location: '',
    page_number: '',
    date_received: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert date_received to ISO format for API
      const submitData = {
        ...vehicleData,
        date_received: vehicleData.date_received ? new Date(vehicleData.date_received).toISOString() : null
      };
      await axios.post(`${API}/vehicles`, submitData);
      toast.success('Vehicle added successfully!');
      setVehicleData({
        brand: '',
        model: '',
        chassis_number: '',
        engine_number: '',
        color: '',
        vehicle_number: '',
        key_number: '',
        inbound_location: '',
        page_number: '',
        date_received: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={vehicleData.brand} onValueChange={(value) => setVehicleData({...vehicleData, brand: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
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
                value={vehicleData.model}
                onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="chassis_number">Chassis Number</Label>
              <Input
                id="chassis_number"
                placeholder="Enter chassis number"
                value={vehicleData.chassis_number}
                onChange={(e) => setVehicleData({...vehicleData, chassis_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="engine_number">Engine Number</Label>
              <Input
                id="engine_number"
                placeholder="Enter engine number"
                value={vehicleData.engine_number}
                onChange={(e) => setVehicleData({...vehicleData, engine_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Enter color"
                value={vehicleData.color}
                onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="vehicle_number">Vehicle Number (Registration)</Label>
              <Input
                id="vehicle_number"
                placeholder="Enter vehicle registration number"
                value={vehicleData.vehicle_number}
                onChange={(e) => setVehicleData({...vehicleData, vehicle_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="key_number">Key Number</Label>
              <Input
                id="key_number"
                placeholder="Enter key number"
                value={vehicleData.key_number}
                onChange={(e) => setVehicleData({...vehicleData, key_number: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="inbound_location">Inbound Location</Label>
              <Input
                id="inbound_location"
                placeholder="Enter inbound location"
                value={vehicleData.inbound_location}
                onChange={(e) => setVehicleData({...vehicleData, inbound_location: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="page_number">Page Number (Optional)</Label>
              <Input
                id="page_number"
                placeholder="Enter page number"
                value={vehicleData.page_number}
                onChange={(e) => setVehicleData({...vehicleData, page_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="date_received">Date Received</Label>
              <Input
                id="date_received"
                type="date"
                value={vehicleData.date_received}
                onChange={(e) => setVehicleData({...vehicleData, date_received: e.target.value})}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};



export default AddVehicle;
